import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Reporte } from '../reportes/entities/reporte.entity';
import { CoincidenciasService } from '../coincidencias/coincidencias.service';
import { ConfigService } from '@nestjs/config';
import { EventoBusqueda } from './interfaces/evento-busqueda.interface';

/** Fila cruda de la tabla Acreditados */
interface AcreditadoRow {
  nombres: string | null;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  fecha_nacimiento: Date | string | null;
  sexo: string | null;
  telefono: number | null;
  codigo_postal: number | null;
  ciudad1: string | null;
  curp: string | null;
}

@Injectable()
export class BusquedaContinuaService {
  private readonly logger = new Logger(BusquedaContinuaService.name);

  /**
   * Mapa en memoria: reporteId → fingerprint del último registro notificado.
   * Permite detectar cambios en Acreditados sin necesidad de timestamps en la tabla.
   */
  private readonly ultimoFingerprint = new Map<string, string>();

  constructor(
    @InjectRepository(Reporte)
    private readonly reporteRepo: Repository<Reporte>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly coincidenciasService: CoincidenciasService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Lógica ejecutada en cada iteración del cron.
   * Busca registros NUEVOS o MODIFICADOS en Acreditados desde la última ejecución.
   * @returns true si el reporte sigue activo, false si debe eliminarse del scheduler.
   */
  async ejecutarBusquedaContinua(reporteId: string): Promise<boolean> {
    const reporte = await this.reporteRepo.findOne({
      where: { id: reporteId },
    });

    if (!reporte || reporte.estado === 'desactivado') {
      this.ultimoFingerprint.delete(reporteId);
      return false;
    }

    this.logger.log(
      `[Fase 3] Ejecutando búsqueda continua para CURP ${reporte.curp}`,
    );

    const nuevasCoincidencias = await this.buscarNuevosRegistros(
      reporte.curp,
      reporteId,
    );

    for (const coincidencia of nuevasCoincidencias) {
      await this.coincidenciasService.enviarNotificacion(
        {
          curp: reporte.curp,
          id: reporte.id,
          lugar_nacimiento: reporte.lugarNacimiento,
          institucion_id: this.config.get<string>('PUI_INSTITUCION_ID') ?? '',
          fase_busqueda: '3',
          tipo_evento: coincidencia.tipo,
          fecha_evento: coincidencia.fecha,
          descripcion_lugar_evento: coincidencia.descripcionLugar,
          direccion_evento: coincidencia.direccion,
        },
        reporte.id,
      );
    }

    return true;
  }

  /** Limpia el fingerprint cuando un reporte se desactiva. */
  limpiarFingerprint(reporteId: string): void {
    this.ultimoFingerprint.delete(reporteId);
  }

  // ─── Integración con tabla Acreditados ───────────────────────────────────────

  /**
   * Fase 3 — Consulta Acreditados y compara con el último estado conocido.
   *
   * Estrategia para tabla sin timestamps:
   *  - Se calcula un fingerprint concatenando los campos clave del registro.
   *  - Si el fingerprint es distinto al de la ejecución anterior (o no existe),
   *    se genera un evento "Actualización en padrón de acreditados" y se notifica.
   *  - Si no hay cambio, la ejecución termina silenciosamente.
   */
  private async buscarNuevosRegistros(
    curp: string,
    reporteId: string,
  ): Promise<EventoBusqueda[]> {
    const rows = await this.dataSource.query<AcreditadoRow[]>(
      `SELECT nombres, apellido_paterno, apellido_materno,
              fecha_nacimiento, sexo, telefono,
              codigo_postal, ciudad1
       FROM Acreditados
       WHERE curp = ?
       LIMIT 1`,
      [curp],
    );

    if (!rows.length) {
      // El registro no existe (aún). Se mantiene el monitoreo por si aparece.
      return [];
    }

    const row = rows[0];
    const fingerprint = this.calcularFingerprint(row);
    const fpAnterior = this.ultimoFingerprint.get(reporteId);

    if (fpAnterior === fingerprint) {
      // Sin cambios desde la última ejecución
      return [];
    }

    // Hay un registro nuevo o modificado — actualizar fingerprint y notificar
    this.ultimoFingerprint.set(reporteId, fingerprint);

    const tipoEvento =
      fpAnterior === undefined
        ? 'Nuevo registro detectado en padrón de acreditados'
        : 'Actualización detectada en padrón de acreditados';

    return [
      {
        tipo: tipoEvento,
        // La tabla no tiene fecha de evento; se omite el campo (es opcional en PUI)
        descripcionLugar: row.ciudad1?.trim() || undefined,
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
   * Genera una cadena fingerprint de los campos relevantes de un acreditado.
   * Se usa para detectar cambios entre ejecuciones del cron.
   */
  private calcularFingerprint(row: AcreditadoRow): string {
    return [
      row.nombres ?? '',
      row.apellido_paterno ?? '',
      row.apellido_materno ?? '',
      row.fecha_nacimiento
        ? new Date(row.fecha_nacimiento).toISOString().substring(0, 10)
        : '',
      row.sexo ?? '',
      row.telefono ?? '',
      row.codigo_postal ?? '',
      row.ciudad1 ?? '',
    ].join('|');
  }
}
