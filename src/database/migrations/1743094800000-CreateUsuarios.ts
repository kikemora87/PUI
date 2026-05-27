import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Crea la tabla `usuarios` para autenticación basada en BD.
 * Ejecutar: npm run migration:run
 */
export class CreateUsuarios1743094800000 implements MigrationInterface {
  name = 'CreateUsuarios1743094800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existe = await queryRunner.hasTable('usuarios');
    if (existe) return;

    await queryRunner.createTable(
      new Table({
        name: 'usuarios',
        columns: [
          {
            name: 'id',
            type: 'char',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'usuario',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255',
            comment: 'Bcrypt hash — nunca almacenar texto plano',
          },
          {
            name: 'nombre',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '150',
            isUnique: true,
            isNullable: true,
          },
          {
            name: 'rol',
            type: 'enum',
            enum: ['admin', 'operador', 'pui'],
            default: "'operador'",
          },
          {
            name: 'activo',
            type: 'tinyint',
            width: 1,
            default: '1',
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'usuarios',
      new TableIndex({
        name: 'IX_usuarios_rol_activo',
        columnNames: ['rol', 'activo'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('usuarios', true);
  }
}
