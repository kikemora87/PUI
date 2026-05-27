import { Controller, Post, Body, HttpCode, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiOkResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtInstGuard } from '../common/guards/jwt-inst.guard';
import { ReportesService } from './reportes.service';
import { ActivarReporteDto } from './dto/activar-reporte.dto';
import { DesactivarReporteDto } from './dto/desactivar-reporte.dto';

const OK_SCHEMA = (message: string) => ({
  schema: { example: { message } },
});

@ApiTags('Reportes')
@ApiBearerAuth('jwt')
@Controller()
@UseGuards(ThrottlerGuard, JwtInstGuard)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) { }

  /**
   * POST /activar-reporte
   * La PUI envía un nuevo caso de persona desaparecida.
   * Responde 200 inmediatamente; las 3 fases se ejecutan en background.
   */
  @Post('activar-reporte')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Registrar nuevo reporte de búsqueda',
    description:
      'La PUI notifica un nuevo caso de persona desaparecida. ' +
      'El endpoint responde `200` de forma **inmediata** y ejecuta las 3 fases de búsqueda en segundo plano:\n\n' +
      '- **Fase 1** — Consulta histórica en base de datos propios\n' +
      '- **Fase 2** — Envío de coincidencias a la PUI\n' +
      '- **Fase 3** — Búsqueda continua programada (cron)',
  })
  @ApiBody({ type: ActivarReporteDto })
  @ApiOkResponse({
    description: 'Reporte recibido y procesamiento iniciado en background',
    ...OK_SCHEMA(
      'La solicitud de activación del reporte de búsqueda se recibió correctamente.',
    ),
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido, expirado o ausente',
  })
  @ApiResponse({
    status: 400,
    description:
      'Body inválido — campos faltantes o CURP con formato incorrecto',
  })
  @ApiResponse({ status: 429, description: 'Rate limit superado' })
  async activarReporte(@Body() dto: ActivarReporteDto) {
    await this.reportesService.activar(dto);
    return {
      message:
        'La solicitud de activación del reporte de búsqueda se recibió correctamente.',
    };
  }

  /**
   * POST /activar-reporte-prueba
   * Sandbox: valida conectividad y autenticación sin persistir datos.
   */
  @Post('activar-reporte-prueba')
  @HttpCode(200)
  @ApiOperation({
    summary: '[Sandbox] Verificar conectividad y autenticación',
    description:
      'Endpoint de prueba **que no persiste datos**. ' +
      'Permite a la PUI verificar que la conectividad y el token JWT funcionan correctamente ' +
      'antes de operar con el endpoint real `/activar-reporte`.',
  })
  @ApiBody({ type: ActivarReporteDto })
  @ApiOkResponse({
    description: 'Conectividad y autenticación verificadas correctamente',
    ...OK_SCHEMA(
      'Prueba recibida correctamente. Conectividad y autenticación verificadas.',
    ),
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido, expirado o ausente',
  })
  async activarReportePrueba(@Body() _dto: ActivarReporteDto) {
    return {
      message:
        'Prueba recibida correctamente. Conectividad y autenticación verificadas.',
    };
  }

  /**
   * POST /desactivar-reporte
   * La PUI notifica que el caso fue cerrado. Detiene el cron de fase 3.
   */
  @Post('desactivar-reporte')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Cerrar un reporte de búsqueda activo',
    description:
      'La PUI notifica que el caso fue resuelto o cerrado. ' +
      'Detiene la búsqueda continua (cron de **Fase 3**) y marca el reporte como `desactivado` en la base de datos.',
  })
  @ApiBody({ type: DesactivarReporteDto })
  @ApiOkResponse({
    description: 'Reporte desactivado y búsqueda continua detenida',
    ...OK_SCHEMA('Reporte desactivado correctamente.'),
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido, expirado o ausente',
  })
  @ApiResponse({
    status: 400,
    description: 'ID del reporte con formato inválido',
  })
  @ApiResponse({
    status: 404,
    description: 'Reporte no encontrado o ya desactivado',
  })
  async desactivarReporte(@Body() dto: DesactivarReporteDto) {
    await this.reportesService.desactivar(dto.id);
    return { message: 'Reporte desactivado correctamente.' };
  }
}
