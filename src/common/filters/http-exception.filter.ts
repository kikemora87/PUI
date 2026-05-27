import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error(
      `${request.method} ${request.url} → ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    // Para errores de validación (BadRequest) devolvemos los detalles
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      response
        .status(status)
        .json(
          typeof exceptionResponse === 'object'
            ? exceptionResponse
            : { statusCode: status, message: exceptionResponse },
        );
      return;
    }

    response.status(status).json({
      statusCode: status,
      error: 'Error interno del servidor',
    });
  }
}
