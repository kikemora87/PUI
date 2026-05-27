import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();

    const inicio = Date.now();
    const { method, url, body } = req;

    // Solo auditar rutas de los flujos principales para evitar spam de docs o health checks
    const auditableEndpoints = [
      '/activar-reporte',
      '/desactivar-reporte',
      '/activar-reporte-prueba',
    ];
    const shoudAudit = auditableEndpoints.some((ep) => url.includes(ep));

    return next.handle().pipe(
      tap(() => {
        if (shoudAudit) {
          const payloadResumen = { ...body };
          this.auditService
            .registrar({
              metodo: method,
              endpoint: url,
              direccion: 'entrante',
              statusCode: res.statusCode,
              payloadResumen,
              duracionMs: Date.now() - inicio,
            })
            .catch(console.error); // logs the promise internally without breaking
        }
      }),
      catchError((error) => {
        if (shoudAudit) {
          const payloadResumen = { ...body };
          this.auditService
            .registrar({
              metodo: method,
              endpoint: url,
              direccion: 'entrante',
              statusCode: error?.status ?? 500,
              error: error?.message ?? 'Internal server error',
              payloadResumen,
              duracionMs: Date.now() - inicio,
            })
            .catch(console.error);
        }
        throw error;
      }),
    );
  }
}
