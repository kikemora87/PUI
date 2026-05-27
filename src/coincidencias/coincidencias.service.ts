import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coincidencia } from './entities/coincidencia.entity';
import { PuiService } from '../pui/pui.service';
import { NotificarCoincidenciaDto } from '../pui/dto/notificar-coincidencia.dto';

@Injectable()
export class CoincidenciasService {
  private readonly logger = new Logger(CoincidenciasService.name);

  constructor(
    @InjectRepository(Coincidencia)
    private readonly coincidenciasRepo: Repository<Coincidencia>,
    private readonly puiService: PuiService,
  ) {}

  /**
   * Construye y envía la notificación a la PUI, luego la guarda en base de datos.
   */
  async enviarNotificacion(
    dto: NotificarCoincidenciaDto,
    reporteId: string,
  ): Promise<Coincidencia> {
    try {
      // Enviar a la PUI
      this.logger.log(`Enviando coincidencia a PUI para reporte ${reporteId}`);
      await this.puiService.notificarCoincidencia(dto);

      // Guardar en base de datos como enviada exitosamente
      const coincidencia = this.coincidenciasRepo.create({
        reporteId: reporteId,
        fase: parseInt(dto.fase_busqueda, 10),
        tipoEvento: dto.tipo_evento ?? null,
        fechaEvento: dto.fecha_evento ? new Date(dto.fecha_evento) : null,
        descripcionLugar: dto.descripcion_lugar_evento ?? null,
        direccionEvento:
          (dto.direccion_evento as unknown as Record<string, string>) ?? null,
        enviadoPui: true,
        respuestaPui: 200, // asumiendo éxito si no lanzó excepción
      });

      return await this.coincidenciasRepo.save(coincidencia);
    } catch (error) {
      this.logger.error(
        `Error enviando coincidencia a PUI para reporte ${reporteId}`,
        error,
      );

      // Guardar en base de datos como no enviada
      const coincidenciaObj = this.coincidenciasRepo.create({
        reporteId: reporteId,
        fase: parseInt(dto.fase_busqueda, 10),
        tipoEvento: dto.tipo_evento ?? null,
        fechaEvento: dto.fecha_evento ? new Date(dto.fecha_evento) : null,
        descripcionLugar: dto.descripcion_lugar_evento ?? null,
        direccionEvento:
          (dto.direccion_evento as unknown as Record<string, string>) ?? null,
        enviadoPui: false,
      });

      await this.coincidenciasRepo.save(coincidenciaObj);

      throw error;
    }
  }
}
