import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

/**
 * Migración inicial del sistema PUI.
 * Crea las tablas: reportes, coincidencias, audit_logs
 *
 * Ejecutar: npm run migration:run
 * Revertir: npm run migration:revert
 */
export class InitialSchema1743090000000 implements MigrationInterface {
  name = 'InitialSchema1743090000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Tabla reportes ──────────────────────────────────────────────────
    const reportesExists = await queryRunner.hasTable('reportes');
    if (!reportesExists) {
      await queryRunner.createTable(
        new Table({
          name: 'reportes',
          columns: [
            { name: 'id', type: 'varchar', length: '75', isPrimary: true },
            { name: 'curp', type: 'varchar', length: '18' },
            { name: 'nombre', type: 'varchar', length: '50', isNullable: true },
            {
              name: 'primer_apellido',
              type: 'varchar',
              length: '50',
              isNullable: true,
            },
            {
              name: 'segundo_apellido',
              type: 'varchar',
              length: '50',
              isNullable: true,
            },
            { name: 'fecha_nacimiento', type: 'date', isNullable: true },
            { name: 'fecha_desaparicion', type: 'date', isNullable: true },
            { name: 'lugar_nacimiento', type: 'varchar', length: '20' },
            {
              name: 'sexo_asignado',
              type: 'varchar',
              length: '1',
              isNullable: true,
            },
            {
              name: 'telefono',
              type: 'varchar',
              length: '15',
              isNullable: true,
            },
            { name: 'correo', type: 'varchar', length: '50', isNullable: true },
            { name: 'direccion', type: 'text', isNullable: true },
            { name: 'calle', type: 'varchar', length: '50', isNullable: true },
            { name: 'numero', type: 'varchar', length: '20', isNullable: true },
            {
              name: 'colonia',
              type: 'varchar',
              length: '50',
              isNullable: true,
            },
            {
              name: 'codigo_postal',
              type: 'varchar',
              length: '5',
              isNullable: true,
            },
            {
              name: 'municipio_o_alcaldia',
              type: 'varchar',
              length: '100',
              isNullable: true,
            },
            {
              name: 'entidad_federativa',
              type: 'varchar',
              length: '40',
              isNullable: true,
            },
            {
              name: 'estado',
              type: 'enum',
              enum: ['activo', 'desactivado'],
              default: "'activo'",
            },
            { name: 'fase_actual', type: 'tinyint', default: '1' },
            {
              name: 'busqueda_historica_completada',
              type: 'tinyint',
              width: 1,
              default: '0',
              comment: 'boolean',
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
        true, // ifNotExists = true
      );

      await queryRunner.createIndex(
        'reportes',
        new TableIndex({ name: 'IX_reportes_curp', columnNames: ['curp'] }),
      );
      await queryRunner.createIndex(
        'reportes',
        new TableIndex({
          name: 'IX_reportes_estado_fase',
          columnNames: ['estado', 'fase_actual'],
        }),
      );
    }

    // ── 2. Tabla coincidencias ─────────────────────────────────────────────
    const coincidenciasExists = await queryRunner.hasTable('coincidencias');
    if (!coincidenciasExists) {
      await queryRunner.createTable(
        new Table({
          name: 'coincidencias',
          columns: [
            { name: 'id', type: 'char', length: '36', isPrimary: true },
            { name: 'reporte_id', type: 'varchar', length: '75' },
            { name: 'fase', type: 'tinyint' },
            {
              name: 'tipo_evento',
              type: 'varchar',
              length: '500',
              isNullable: true,
            },
            { name: 'fecha_evento', type: 'date', isNullable: true },
            {
              name: 'descripcion_lugar',
              type: 'varchar',
              length: '500',
              isNullable: true,
            },
            { name: 'direccion_evento', type: 'json', isNullable: true },
            { name: 'enviado_pui', type: 'tinyint', width: 1, default: '0' },
            { name: 'respuesta_pui', type: 'int', isNullable: true },
            {
              name: 'created_at',
              type: 'datetime',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
        true,
      );

      await queryRunner.createIndex(
        'coincidencias',
        new TableIndex({
          name: 'IX_coincidencias_reporte_fase',
          columnNames: ['reporte_id', 'fase'],
        }),
      );
      await queryRunner.createIndex(
        'coincidencias',
        new TableIndex({
          name: 'IX_coincidencias_enviado_pui',
          columnNames: ['enviado_pui'],
        }),
      );

      await queryRunner.createForeignKey(
        'coincidencias',
        new TableForeignKey({
          name: 'FK_coincidencias_reporte',
          columnNames: ['reporte_id'],
          referencedTableName: 'reportes',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
    }

    // ── 3. Tabla audit_logs ────────────────────────────────────────────────
    const auditExists = await queryRunner.hasTable('audit_logs');
    if (!auditExists) {
      await queryRunner.createTable(
        new Table({
          name: 'audit_logs',
          columns: [
            { name: 'id', type: 'char', length: '36', isPrimary: true },
            { name: 'metodo', type: 'varchar', length: '10' },
            { name: 'endpoint', type: 'varchar', length: '500' },
            { name: 'direccion', type: 'enum', enum: ['entrante', 'saliente'] },
            {
              name: 'reporte_id',
              type: 'varchar',
              length: '75',
              isNullable: true,
            },
            { name: 'curp', type: 'varchar', length: '18', isNullable: true },
            { name: 'payload_resumen', type: 'json', isNullable: true },
            { name: 'status_code', type: 'int', isNullable: true },
            { name: 'error', type: 'text', isNullable: true },
            { name: 'duracion_ms', type: 'int', isNullable: true },
            {
              name: 'created_at',
              type: 'datetime',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
        true,
      );

      await queryRunner.createIndex(
        'audit_logs',
        new TableIndex({ name: 'IX_audit_curp', columnNames: ['curp'] }),
      );
      await queryRunner.createIndex(
        'audit_logs',
        new TableIndex({
          name: 'IX_audit_reporte_id',
          columnNames: ['reporte_id'],
        }),
      );
      await queryRunner.createIndex(
        'audit_logs',
        new TableIndex({
          name: 'IX_audit_direccion_created',
          columnNames: ['direccion', 'created_at'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Orden inverso para respetar FK
    await queryRunner.dropTable('audit_logs', true);
    await queryRunner.dropTable('coincidencias', true);
    await queryRunner.dropTable('reportes', true);
  }
}
