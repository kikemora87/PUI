import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Reporte } from '../reportes/entities/reporte.entity';
import { CoincidenciasService } from '../coincidencias/coincidencias.service';
import { ConfigService } from '@nestjs/config';
import { NotificarCoincidenciaDto } from '../pui/dto/notificar-coincidencia.dto';
import { BusquedaContinuaScheduler } from './busqueda-continua.scheduler';
import { PuiService } from '../pui/pui.service';
import { DatosBasicosPersona } from './interfaces/datos-basicos.interface';
import { EventoBusqueda } from './interfaces/evento-busqueda.interface';

/** Fila cruda devuelta por MySQL para la tabla Acreditados */
interface AcreditadoRow {
  nombres: string | null;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  fecha_nacimiento: Date | string | null;
  sexo: string | null;
  lugar_nacimiento: string | null;
  telefono: number | null;
  codigo_postal: number | null;
  ciudad1: string | null;
  poblacion: number | null;
  curp: string | null;
  rfc: string | null;
}

@Injectable()
export class BusquedaService {
  private readonly logger = new Logger(BusquedaService.name);

  constructor(
    @InjectRepository(Reporte)
    private readonly reporteRepo: Repository<Reporte>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly pui: PuiService,
    private readonly coincidenciasService: CoincidenciasService,
    private readonly continuaScheduler: BusquedaContinuaScheduler,
    private readonly config: ConfigService,
  ) {}

  /**
   * Ejecuta fase 1 y 2 en secuencia, luego registra el reporte en fase 3.
   */
  async ejecutarFases(reporte: Reporte): Promise<void> {
    try {
      await this.ejecutarFase1(reporte);
      await this.ejecutarFase2(reporte);
      await this.continuaScheduler.registrarReporte(reporte.id);
    } catch (err) {
      this.logger.error(`Error en fases para ${reporte.id}`, err);
    }
  }

  // ─── Fase 1: datos básicos ───────────────────────────────────────────────────

  private async ejecutarFase1(reporte: Reporte): Promise<void> {
    this.logger.log(`[Fase 1] Iniciando para CURP ${reporte.curp}`);

    const datosEncontrados = await this.buscarDatosBasicosEnSistemaInterno(
      reporte.curp,
    );

    if (!datosEncontrados) {
      this.logger.log(
        `[Fase 1] Sin datos para ${reporte.curp} — omitiendo notificación`,
      );
      await this.reporteRepo.update(reporte.id, { faseActual: 2 });
      return;
    }

    // Fase 1 NO incluye tipo_evento, fecha_evento, descripcion_lugar_evento
    const payload: NotificarCoincidenciaDto = {
      curp: reporte.curp,
      id: reporte.id,
      lugar_nacimiento: reporte.lugarNacimiento,
      institucion_id: this.config.get<string>('PUI_INSTITUCION_ID') ?? '',
      fase_busqueda: '1',
      nombre_completo: datosEncontrados.nombre
        ? {
            nombre: datosEncontrados.nombre,
            primer_apellido: datosEncontrados.primerApellido,
            segundo_apellido: datosEncontrados.segundoApellido,
          }
        : undefined,
      fecha_nacimiento: datosEncontrados.fechaNacimiento,
      sexo_asignado: datosEncontrados.sexo,
      telefono: datosEncontrados.telefono,
      correo: datosEncontrados.correo,
      
      domicilio:
        datosEncontrados.codigoPostal || datosEncontrados.municipio
          ? {
              codigo_postal: datosEncontrados.codigoPostal,
              municipio_o_alcaldia: datosEncontrados.municipio,
            }
          : undefined,
    };

    await this.coincidenciasService.enviarNotificacion(payload, reporte.id);
    await this.reporteRepo.update(reporte.id, { faseActual: 2 });
    this.logger.log(`[Fase 1] Completada para ${reporte.curp}`);
  }

  // ─── Fase 2: búsqueda histórica (máx 12 años) ───────────────────────────────

  private async ejecutarFase2(reporte: Reporte): Promise<void> {
    this.logger.log(`[Fase 2] Iniciando para CURP ${reporte.curp}`);

    if (!reporte.fechaDesaparicion) {
      this.logger.log(`[Fase 2] Sin fecha de desaparición — omitiendo`);
      await this.finalizarFase2(reporte);
      return;
    }

    const hoy = new Date();
    const limiteMax = new Date(hoy);
    limiteMax.setFullYear(hoy.getFullYear() - 12);

    const desde =
      reporte.fechaDesaparicion < limiteMax
        ? limiteMax
        : reporte.fechaDesaparicion;

    const eventosHistoricos = await this.buscarHistoricoEnSistemaInterno(
      reporte.curp,
      desde,
      hoy,
    );

    for (const evento of eventosHistoricos) {
      const payload: NotificarCoincidenciaDto = {
        curp: reporte.curp,
        id: reporte.id,
        lugar_nacimiento: reporte.lugarNacimiento,
        institucion_id: this.config.get<string>('PUI_INSTITUCION_ID') ?? '',
        fase_busqueda: '2',
        tipo_evento: evento.tipo,
        fecha_evento: evento.fecha,
        descripcion_lugar_evento: evento.descripcionLugar,
        direccion_evento: evento.direccion,
      };

      await this.coincidenciasService.enviarNotificacion(payload, reporte.id);
    }

    await this.finalizarFase2(reporte);
  }

  private async finalizarFase2(reporte: Reporte): Promise<void> {
    try {
      await this.pui.busquedaFinalizada(reporte.id);
    } catch (err) {
      this.logger.warn(
        `[Fase 2] No se pudo notificar busqueda-finalizada a la PUI para ${reporte.id} — continuando`,
        err,
      );
    }
    await this.reporteRepo.update(reporte.id, {
      faseActual: 3,
      busquedaHistoricaCompletada: true,
    });
    this.logger.log(`[Fase 2] Finalizada para ${reporte.curp}`);
  }

  async detenerBusquedaContinua(reporteId: string): Promise<void> {
    await this.continuaScheduler.eliminarReporte(reporteId);
  }

  // ─── Integración con tabla Acreditados ───────────────────────────────────────

  /**
   * Fase 1 — Consulta la tabla Acreditados por CURP y retorna los datos más
   * recientes disponibles para completar la ficha de la persona desaparecida.
   */
  private async buscarDatosBasicosEnSistemaInterno(
    curp: string,
  ): Promise<DatosBasicosPersona | null> {
    const rows = await this.dataSource.query<AcreditadoRow[]>(
      `SELECT nombres, apellido_paterno, apellido_materno,
              fecha_nacimiento, sexo, telefono,
              codigo_postal, ciudad1
       FROM Acreditados
       WHERE curp = ?
       LIMIT 1`,
      [curp],
    );

    if (!rows.length) return null;

    const row = rows[0];

    // Al menos un campo debe tener valor para que valga la pena notificar
    const tieneDatos =
      row.nombres ||
      row.apellido_paterno ||
      row.apellido_materno ||
      row.fecha_nacimiento ||
      row.sexo ||
      row.telefono;

    if (!tieneDatos) return null;

    return {
      nombre: row.nombres?.trim() || undefined,
      primerApellido: row.apellido_paterno?.trim() || undefined,
      segundoApellido: row.apellido_materno?.trim() || undefined,
      fechaNacimiento: this.formatearFecha(row.fecha_nacimiento),
      sexo: this.normalizarSexo(row.sexo),
      telefono: row.telefono ? String(row.telefono) : undefined,
      codigoPostal: row.codigo_postal ? String(row.codigo_postal) : undefined,
      municipio: row.ciudad1?.trim() || undefined,
    };
  }

  /**
   * Fase 2 — Búsqueda histórica en Acreditados.
   *
   * La tabla Acreditados no registra fechas de eventos; por ello, si la CURP
   * existe en el padrón, se genera un único evento de tipo "Registro en padrón
   * de acreditados" que representa la presencia histórica de la persona en el
   * sistema. El campo fecha_evento se omite por no estar disponible.
   */
  private async buscarHistoricoEnSistemaInterno(
    curp: string,
    _desde: Date,
    _hasta: Date,
  ): Promise<EventoBusqueda[]> {
    const rows = await this.dataSource.query<AcreditadoRow[]>(
      `SELECT nombres, apellido_paterno, apellido_materno,
              lugar_nacimiento, telefono, codigo_postal, ciudad1
       FROM Acreditados
       WHERE curp = ?
       LIMIT 1`,
      [curp],
    );

    if (!rows.length) return [];

    const row = rows[0];

    return [
      {
        tipo: 'Registro en padrón de acreditados',
        // fecha_evento omitida: la tabla no registra cuándo se dio de alta el acreditado
        descripcionLugar: row.ciudad1?.trim() || row.lugar_nacimiento?.trim() || undefined,
        direccion:
          row.codigo_postal || row.ciudad1
            ? {
                codigo_postal: row.codigo_postal
                  ? String(row.codigo_postal)
                  : undefined,
                municipio_o_alcaldia: row.ciudad1?.trim() || undefined,
              }
            : undefined,
      },
    ];
  }

  // ─── Utilidades ──────────────────────────────────────────────────────────────

  /**
   * Convierte un valor Date/string de MySQL al formato ISO YYYY-MM-DD.
   * Retorna undefined si el valor es nulo o inválido.
   */
  private formatearFecha(valor: Date | string | null): string | undefined {
    if (!valor) return undefined;
    const d = valor instanceof Date ? valor : new Date(valor);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString().substring(0, 10);
  }

  /**
   * Normaliza el campo `sexo` de Acreditados (varchar libre) al formato PUI.
   * H = Hombre, M = Mujer, X = otros.
   */
  private normalizarSexo(
    sexo: string | null,
  ): 'H' | 'M' | 'X' | undefined {
    if (!sexo) return undefined;
    const s = sexo.toUpperCase().trim();
    if (['H', 'HOMBRE', 'MASCULINO'].includes(s)) return 'H';
    if (['M', 'MUJER', 'FEMENINO', 'F'].includes(s)) return 'M';
    return 'X';
  }
}
