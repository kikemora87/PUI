import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema174309000000017746301872651774632488475 implements MigrationInterface {
  name = 'InitialSchema174309000000017746301872651774632488475';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`UQ_0790a401b9d234fa921e9aa1777\` ON \`usuarios\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IX_usuarios_rol_activo\` ON \`usuarios\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` ADD \`nombre\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` ADD \`email\` varchar(150) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` ADD UNIQUE INDEX \`IDX_446adfc18b35418aac32ae0b7b\` (\`email\`)`,
    );
    await queryRunner.query(`ALTER TABLE \`usuarios\` DROP PRIMARY KEY`);
    await queryRunner.query(`ALTER TABLE \`usuarios\` DROP COLUMN \`id\``);
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` ADD \`id\` varchar(36) NOT NULL PRIMARY KEY`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` ADD UNIQUE INDEX \`IDX_0790a401b9d234fa921e9aa177\` (\`usuario\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` CHANGE \`created_at\` \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` CHANGE \`updated_at\` \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` CHANGE \`updated_at\` \`updated_at\` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` CHANGE \`created_at\` \`created_at\` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` DROP INDEX \`IDX_0790a401b9d234fa921e9aa177\``,
    );
    await queryRunner.query(`ALTER TABLE \`usuarios\` DROP COLUMN \`id\``);
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` ADD \`id\` char(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` ADD PRIMARY KEY (\`id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuarios\` DROP INDEX \`IDX_446adfc18b35418aac32ae0b7b\``,
    );
    await queryRunner.query(`ALTER TABLE \`usuarios\` DROP COLUMN \`email\``);
    await queryRunner.query(`ALTER TABLE \`usuarios\` DROP COLUMN \`nombre\``);
    await queryRunner.query(
      `CREATE INDEX \`IX_usuarios_rol_activo\` ON \`usuarios\` (\`rol\`, \`activo\`)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`UQ_0790a401b9d234fa921e9aa1777\` ON \`usuarios\` (\`usuario\`)`,
    );
  }
}
