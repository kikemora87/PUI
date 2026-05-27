import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Reporte } from '../../reportes/entities/reporte.entity';

@Entity('coincidencias')
export class Coincidencia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reporte_id', type: 'varchar', length: 75 })
  reporteId: string;

  @ManyToOne(() => Reporte)
  @JoinColumn({ name: 'reporte_id' })
  reporte: Reporte;

  @Column({ type: 'tinyint' })
  fase: number; // 1, 2 o 3

  @Column({ name: 'tipo_evento', type: 'varchar', length: 500, nullable: true })
  tipoEvento: string | null;

  @Column({ name: 'fecha_evento', type: 'date', nullable: true })
  fechaEvento: Date | null;

  @Column({
    name: 'descripcion_lugar',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  descripcionLugar: string | null;

  // Dirección del evento como JSON
  @Column({ name: 'direccion_evento', type: 'json', nullable: true })
  direccionEvento: Record<string, string> | null;

  @Column({ name: 'enviado_pui', type: 'boolean', default: false })
  enviadoPui: boolean;

  @Column({ name: 'respuesta_pui', type: 'int', nullable: true })
  respuestaPui: number | null; // código HTTP de respuesta

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
