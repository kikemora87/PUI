import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema17430900000001774630187265 implements MigrationInterface {
  name = 'InitialSchema17430900000001774630187265';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`coincidencias\` DROP FOREIGN KEY \`FK_coincidencias_reporte\``,
    );
    await queryRunner.query(`DROP INDEX \`IX_reportes_curp\` ON \`reportes\``);
    await queryRunner.query(
      `DROP INDEX \`IX_reportes_estado_fase\` ON \`reportes\``,
    );
    await queryRunner.query(`DROP INDEX \`IX_audit_curp\` ON \`audit_logs\``);
    await queryRunner.query(
      `DROP INDEX \`IX_audit_reporte_id\` ON \`audit_logs\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IX_audit_direccion_created\` ON \`audit_logs\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IX_coincidencias_reporte_fase\` ON \`coincidencias\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IX_coincidencias_enviado_pui\` ON \`coincidencias\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`reportes\` CHANGE \`busqueda_historica_completada\` \`busqueda_historica_completada\` tinyint NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reportes\` CHANGE \`created_at\` \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reportes\` CHANGE \`updated_at\` \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(`ALTER TABLE \`audit_logs\` DROP PRIMARY KEY`);
    await queryRunner.query(`ALTER TABLE \`audit_logs\` DROP COLUMN \`id\``);
    await queryRunner.query(
      `ALTER TABLE \`audit_logs\` ADD \`id\` varchar(36) NOT NULL PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`audit_logs\` CHANGE \`created_at\` \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(`ALTER TABLE \`coincidencias\` DROP PRIMARY KEY`);
    await queryRunner.query(`ALTER TABLE \`coincidencias\` DROP COLUMN \`id\``);
    await queryRunner.query(
      `ALTER TABLE \`coincidencias\` ADD \`id\` varchar(36) NOT NULL PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`coincidencias\` CHANGE \`enviado_pui\` \`enviado_pui\` tinyint NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`coincidencias\` CHANGE \`created_at\` \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`coincidencias\` ADD CONSTRAINT \`FK_a0b55806855244f7c093aaa0130\` FOREIGN KEY (\`reporte_id\`) REFERENCES \`reportes\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`coincidencias\` DROP FOREIGN KEY \`FK_a0b55806855244f7c093aaa0130\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`coincidencias\` CHANGE \`created_at\` \`created_at\` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE \`coincidencias\` CHANGE \`enviado_pui\` \`enviado_pui\` tinyint(1) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(`ALTER TABLE \`coincidencias\` DROP COLUMN \`id\``);
    await queryRunner.query(
      `ALTER TABLE \`coincidencias\` ADD \`id\` char(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`coincidencias\` ADD PRIMARY KEY (\`id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`audit_logs\` CHANGE \`created_at\` \`created_at\` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE \`audit_logs\` DROP COLUMN \`id\``);
    await queryRunner.query(
      `ALTER TABLE \`audit_logs\` ADD \`id\` char(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`audit_logs\` ADD PRIMARY KEY (\`id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reportes\` CHANGE \`updated_at\` \`updated_at\` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reportes\` CHANGE \`created_at\` \`created_at\` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reportes\` CHANGE \`busqueda_historica_completada\` \`busqueda_historica_completada\` tinyint(1) NOT NULL COMMENT 'boolean' DEFAULT '0'`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IX_coincidencias_enviado_pui\` ON \`coincidencias\` (\`enviado_pui\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IX_coincidencias_reporte_fase\` ON \`coincidencias\` (\`reporte_id\`, \`fase\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IX_audit_direccion_created\` ON \`audit_logs\` (\`direccion\`, \`created_at\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IX_audit_reporte_id\` ON \`audit_logs\` (\`reporte_id\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IX_audit_curp\` ON \`audit_logs\` (\`curp\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IX_reportes_estado_fase\` ON \`reportes\` (\`estado\`, \`fase_actual\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IX_reportes_curp\` ON \`reportes\` (\`curp\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`coincidencias\` ADD CONSTRAINT \`FK_coincidencias_reporte\` FOREIGN KEY (\`reporte_id\`) REFERENCES \`reportes\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT`,
    );
  }
}
