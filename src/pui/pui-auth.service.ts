import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PuiAuthService {
  private readonly logger = new Logger(PuiAuthService.name);
  private token: string | null = null;
  private expiresAt: number = 0;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Retorna un token válido, renovando al 80% del TTL (≈ 48 min de 1 h).
   */
  async getToken(): Promise<string> {
    const umbralRenovacion = 0.8 * 3600 * 1000;
    const ahora = Date.now();

    if (this.token && this.expiresAt - ahora > 3600000 - umbralRenovacion) {
      return this.token;
    }

    return this.renovarToken();
  }

  private async renovarToken(): Promise<string> {
    const baseUrl = this.config.get<string>('PUI_BASE_URL');
    const institucionId = this.config.get<string>('PUI_INSTITUCION_ID');
    const clave = this.config.get<string>('PUI_CLAVE');

    const { data } = await firstValueFrom(
      this.http.post<{ token: string }>(`${baseUrl}/login`, {
        institucion_id: institucionId,
        clave,
      }),
    );

    this.token = data.token;
    this.expiresAt = Date.now() + 3600 * 1000;
    this.logger.log('JWT renovado ante la PUI');
    return this.token;
  }
}
