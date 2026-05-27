import { Injectable, Logger, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PuiAuthService } from './pui-auth.service';
import { AuditService } from '../audit/audit.service';
import { NotificarCoincidenciaDto } from './dto/notificar-coincidencia.dto';
import { BusquedaFinalizadaDto } from './dto/busqueda-finalizada.dto';
import { ReportePui } from './interfaces/reporte-pui.interface';

export type { ReportePui };

@Injectable()
export class PuiService {
  private readonly logger = new Logger(PuiService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly authService: PuiAuthService,
    private readonly auditService: AuditService,
  ) {}

  private get baseUrl(): string {
    return this.config.get<string>('PUI_BASE_URL') ?? '';
  }

  private get institucionId(): string {
    return this.config.get<string>('PUI_INSTITUCION_ID') ?? '';
  }

  // ─── POST /notificar-coincidencia ────────────────────────────────────────────

  async notificarCoincidencia(dto: NotificarCoincidenciaDto): Promise<void> {
    const token = await this.authService.getToken();
    const inicio = Date.now();

    try {
      const { status } = await firstValueFrom(
        this.http.post(`${this.baseUrl}/notificar-coincidencia`, dto, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json; charset=utf-8',
          },
        }),
      );

      this.logger.log(
        `Coincidencia notificada OK [${status}] id=${dto.id} fase=${dto.fase_busqueda}`,
      );

      await this.auditService.registrar({
        metodo: 'POST',
        endpoint: '/notificar-coincidencia',
        direccion: 'saliente',
        reporteId: dto.id,
        curp: dto.curp,
        payloadResumen: {
          id: dto.id,
          curp: dto.curp,
          fase_busqueda: dto.fase_busqueda,
        },
        statusCode: status,
        duracionMs: Date.now() - inicio,
      });
    } catch (error) {
      const status = error?.response?.status ?? 500;
      const mensaje = error?.response?.data ?? error.message;

      this.logger.error(
        `Error al notificar coincidencia id=${dto.id}`,
        mensaje,
      );

      await this.auditService.registrar({
        metodo: 'POST',
        endpoint: '/notificar-coincidencia',
        direccion: 'saliente',
        reporteId: dto.id,
        curp: dto.curp,
        statusCode: status,
        error: JSON.stringify(mensaje),
        duracionMs: Date.now() - inicio,
      });

      throw new HttpException(mensaje, status);
    }
  }

  // ─── POST /busqueda-finalizada ───────────────────────────────────────────────

  async busquedaFinalizada(reporteId: string): Promise<void> {
    const token = await this.authService.getToken();
    const inicio = Date.now();

    const body: BusquedaFinalizadaDto = {
      id: reporteId,
      institucion_id: this.institucionId,
    };

    try {
      const { status } = await firstValueFrom(
        this.http.post(`${this.baseUrl}/busqueda-finalizada`, body, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );

      this.logger.log(
        `Búsqueda finalizada notificada OK [${status}] id=${reporteId}`,
      );

      await this.auditService.registrar({
        metodo: 'POST',
        endpoint: '/busqueda-finalizada',
        direccion: 'saliente',
        reporteId,
        statusCode: status,
        duracionMs: Date.now() - inicio,
      });
    } catch (error) {
      this.logger.error(
        `Error en /busqueda-finalizada id=${reporteId}`,
        error?.response?.data,
      );

      await this.auditService.registrar({
        metodo: 'POST',
        endpoint: '/busqueda-finalizada',
        direccion: 'saliente',
        reporteId,
        statusCode: error?.response?.status ?? 500,
        error: JSON.stringify(error?.response?.data),
        duracionMs: Date.now() - inicio,
      });
    }
  }

  // ─── GET /reportes ───────────────────────────────────────────────────────────

  async listarReportes(): Promise<ReportePui[]> {
    const token = await this.authService.getToken();

    const { data } = await firstValueFrom(
      this.http.get<ReportePui[]>(`${this.baseUrl}/reportes`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );

    return data;
  }
}
