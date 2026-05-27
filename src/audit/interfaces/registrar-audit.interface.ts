import { DireccionLog } from '../entities/audit-log.entity';

export interface RegistrarAuditDto {
  metodo: string;
  endpoint: string;
  direccion: DireccionLog;
  reporteId?: string;
  curp?: string;
  payloadResumen?: Record<string, unknown>;
  statusCode?: number;
  error?: string;
  duracionMs?: number;
}
