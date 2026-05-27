import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type DireccionLog = 'entrante' | 'saliente';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10 })
  metodo: string;

  @Column({ type: 'varchar', length: 500 })
  endpoint: string;

  @Column({ type: 'enum', enum: ['entrante', 'saliente'] })
  direccion: DireccionLog;

  @Column({ name: 'reporte_id', type: 'varchar', length: 75, nullable: true })
  reporteId: string | null;

  @Column({ type: 'varchar', length: 18, nullable: true })
  curp: string | null;

  @Column({ name: 'payload_resumen', type: 'json', nullable: true })
  payloadResumen: Record<string, unknown> | null;

  @Column({ name: 'status_code', type: 'int', nullable: true })
  statusCode: number | null;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @Column({ name: 'duracion_ms', type: 'int', nullable: true })
  duracionMs: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
