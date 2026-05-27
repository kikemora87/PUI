import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CronJob } from 'cron';
import { Reporte } from '../reportes/entities/reporte.entity';
import { BusquedaContinuaService } from './busqueda-continua.service';

@Injectable()
export class BusquedaContinuaScheduler {
  private readonly logger = new Logger(BusquedaContinuaScheduler.name);

  constructor(
    @InjectRepository(Reporte)
    private readonly reporteRepo: Repository<Reporte>,
    private readonly scheduler: SchedulerRegistry,
    private readonly busquedaContinuaService: BusquedaContinuaService,
  ) {}

  /**
   * Registra un reporte para búsqueda continua.
   * Crea un CronJob individual por reporte para poder cancelarlo
   * de forma independiente cuando llegue /desactivar-reporte.
   *
   * Frecuencia: cada hora (ajustable por institución según el manual)
   */
  async registrarReporte(reporteId: string): Promise<void> {
    const jobName = `busqueda-continua-${reporteId}`;

    // Evitar duplicados
    if (this.scheduler.doesExist('cron', jobName)) {
      this.logger.warn(`Job ya existe para reporte ${reporteId}`);
      return;
    }

    const job = new CronJob(
      CronExpression.EVERY_HOUR, // Cada hora — ajustar según necesidad
      async () => {
        const activo = await this.busquedaContinuaService.ejecutarBusquedaContinua(reporteId);
        // Si la búsqueda devuelve falso, el reporte fue desactivado y debe eliminarse
        if (!activo) {
          await this.eliminarReporte(reporteId);
        }
      },
    );

    this.scheduler.addCronJob(jobName, job);
    job.start();
    this.logger.log(`[Fase 3] Cron registrado para reporte ${reporteId}`);
  }

  /**
   * Elimina el cron job de un reporte al desactivarse.
   */
  async eliminarReporte(reporteId: string): Promise<void> {
    const jobName = `busqueda-continua-${reporteId}`;

    try {
      if (this.scheduler.doesExist('cron', jobName)) {
        this.scheduler.deleteCronJob(jobName);
        this.logger.log(`[Fase 3] Cron eliminado para reporte ${reporteId}`);
      }
    } catch {
      this.logger.warn(`No se encontró o no se pudo eliminar el job para reporte ${reporteId}`);
    }

    // Limpiar el fingerprint en memoria para liberar recursos
    this.busquedaContinuaService.limpiarFingerprint(reporteId);
  }

  /**
   * Al reiniciar el servidor, restaurar los cron jobs de reportes activos.
   * Este cron se ejecuta 30 segundos después de arrancar.
   */
  @Cron('30 * * * * *', { name: 'restaurar-jobs' }) // cada minuto, offset 30s
  async restaurarJobsActivos(): Promise<void> {
    // Solo ejecutar una vez al arrancar
    try {
      if (this.scheduler.doesExist('cron', 'restaurar-jobs')) {
        this.scheduler.deleteCronJob('restaurar-jobs');
      }
    } catch (e) {
      // Ignorar si no existe
    }

    const reportesActivos = await this.reporteRepo.find({
      where: { estado: 'activo', busquedaHistoricaCompletada: true },
    });

    this.logger.log(
      `[Fase 3] Restaurando ${reportesActivos.length} jobs al arrancar`,
    );

    for (const reporte of reportesActivos) {
      await this.registrarReporte(reporte.id);
    }
  }
}
