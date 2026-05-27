import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { RegistrarAuditDto } from './interfaces/registrar-audit.interface';

export type { RegistrarAuditDto };

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async registrar(dto: RegistrarAuditDto): Promise<void> {
    const log = this.repo.create({
      metodo: dto.metodo,
      endpoint: dto.endpoint,
      direccion: dto.direccion,
      reporteId: dto.reporteId ?? null,
      curp: dto.curp ?? null,
      payloadResumen: this.sanitizarPayload(dto.payloadResumen),
      statusCode: dto.statusCode ?? null,
      error: dto.error ?? null,
      duracionMs: dto.duracionMs ?? null,
    });

    await this.repo.save(log);
  }

  private sanitizarPayload(
    payload?: Record<string, unknown>,
  ): Record<string, unknown> | null {
    if (!payload) return null;

    const camposSensibles = ['fotos', 'huellas', 'clave', 'token', 'password'];
    const resultado = { ...payload };

    for (const campo of camposSensibles) {
      if (campo in resultado) {
        resultado[campo] = '[REDACTADO]';
      }
    }

    return resultado;
  }
}
