import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type EstadoReporte = 'activo' | 'desactivado';

@Entity('reportes')
export class Reporte {
  @PrimaryColumn({ type: 'varchar', length: 75 })
  id: string;

  @Column({ type: 'varchar', length: 18 })
  curp: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nombre: string | null;

  @Column({
    name: 'primer_apellido',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  primerApellido: string | null;

  @Column({
    name: 'segundo_apellido',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  segundoApellido: string | null;

  @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
  fechaNacimiento: Date | null;

  @Column({ name: 'fecha_desaparicion', type: 'date', nullable: true })
  fechaDesaparicion: Date | null;

  @Column({ name: 'lugar_nacimiento', type: 'varchar', length: 20 })
  lugarNacimiento: string;

  @Column({ name: 'sexo_asignado', type: 'varchar', length: 1, nullable: true })
  sexoAsignado: string | null;

  @Column({ type: 'varchar', length: 15, nullable: true })
  telefono: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  correo: string | null;

  @Column({ type: 'text', nullable: true })
  direccion: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  calle: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  numero: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  colonia: string | null;

  @Column({ name: 'codigo_postal', type: 'varchar', length: 5, nullable: true })
  codigoPostal: string | null;

  @Column({
    name: 'municipio_o_alcaldia',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  municipioOAlcaldia: string | null;

  @Column({
    name: 'entidad_federativa',
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  entidadFederativa: string | null;

  @Column({ type: 'enum', enum: ['activo', 'desactivado'], default: 'activo' })
  estado: EstadoReporte;

  @Column({ name: 'fase_actual', type: 'tinyint', default: 1 })
  faseActual: number;

  @Column({
    name: 'busqueda_historica_completada',
    type: 'boolean',
    default: false,
  })
  busquedaHistoricaCompletada: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
