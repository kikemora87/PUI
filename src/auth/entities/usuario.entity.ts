import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

export enum RolUsuario {
  ADMIN = 'admin',
  OPERADOR = 'operador',
  PUI = 'pui',
}

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  usuario: string;

  @Column({
    type: 'varchar',
    length: 255,
    select: false,
    comment: 'Bcrypt hash — nunca almacenar texto plano',
  })
  password: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nombre: string | null;

  @Column({ type: 'varchar', length: 150, unique: true, nullable: true })
  email: string | null;

  @Column({ type: 'enum', enum: RolUsuario, default: RolUsuario.OPERADOR })
  rol: RolUsuario;

  @Column({ name: 'activo', type: 'tinyint', width: 1, default: 1 })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
