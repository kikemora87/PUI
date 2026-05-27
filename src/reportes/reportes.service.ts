import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reporte } from './entities/reporte.entity';
import { ActivarReporteDto } from './dto/activar-reporte.dto';
import { BusquedaService } from '../busqueda/busqueda.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ReportesService {
  private readonly logger = new Logger(ReportesService.name);

  constructor(
    @InjectRepository(Reporte)
    private readonly repo: Repository<Reporte>,
    private readonly busquedaService: BusquedaService,
    private readonly auditService: AuditService,
  ) {}

  async activar(dto: ActivarReporteDto): Promise<void> {
    const reporte = this.repo.create({
      id: dto.id,
      curp: dto.curp,
      nombre: dto.nombre ?? null,
      primerApellido: dto.primer_apellido ?? null,
      segundoApellido: dto.segundo_apellido ?? null,
      fechaNacimiento: dto.fecha_nacimiento
        ? new Date(dto.fecha_nacimiento)
        : null,
      fechaDesaparicion: dto.fecha_desaparicion
        ? new Date(dto.fecha_desaparicion)
        : null,
      lugarNacimiento: dto.lugar_nacimiento,
      sexoAsignado: dto.sexo_asignado ?? null,
      telefono: dto.telefono ?? null,
      correo: dto.correo ?? null,
      direccion: dto.direccion ?? null,
      calle: dto.calle ?? null,
      numero: dto.numero ?? null,
      colonia: dto.colonia ?? null,
      codigoPostal: dto.codigo_postal ?? null,
      municipioOAlcaldia: dto.municipio_o_alcaldia ?? null,
      entidadFederativa: dto.entidad_federativa ?? null,
      estado: 'activo',
      faseActual: 1,
    });

    await this.repo.save(reporte);
    this.logger.log(`Reporte activado: ${dto.id} CURP: ${dto.curp}`);

    await this.auditService.registrar({
      metodo: 'POST',
      endpoint: '/activar-reporte',
      direccion: 'entrante',
      reporteId: dto.id,
      curp: dto.curp,
      payloadResumen: {
        id: dto.id,
        curp: dto.curp,
        lugar_nacimiento: dto.lugar_nacimiento,
      },
      statusCode: 200,
    });

    // Iniciar búsquedas en background (no bloqueamos la respuesta HTTP)
    setImmediate(() => {
      this.busquedaService
        .ejecutarFases(reporte)
        .catch((err) =>
          this.logger.error(`Error en fases de búsqueda para ${dto.id}`, err),
        );
    });
  }

  async desactivar(id: string): Promise<void> {
    await this.repo.update({ id }, { estado: 'desactivado' });
    this.logger.log(`Reporte desactivado: ${id}`);

    await this.busquedaService.detenerBusquedaContinua(id);

    await this.auditService.registrar({
      metodo: 'POST',
      endpoint: '/desactivar-reporte',
      direccion: 'entrante',
      reporteId: id,
      payloadResumen: { id },
      statusCode: 200,
    });
  }
}
