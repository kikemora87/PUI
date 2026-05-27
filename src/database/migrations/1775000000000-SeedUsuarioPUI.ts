import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcryptjs';

/**
 * Migración Seed — Crea el usuario PUI en la tabla `usuarios`.
 *
 * Este usuario es el que utiliza la Plataforma Única de Identidad (PUI) para
 * autenticarse ante la institución según la Sección 8.1 del Manual Técnico.
 *
 * Requisitos del Manual (§8.1):
 *  - usuario: "PUI" (exactamente 3 chars, fijo)
 *  - clave:   16-20 chars, mínimo 1 mayúscula, 1 número y 1 carácter especial
 *  - rol:     "pui"
 *
 * ⚠️  IMPORTANTE: La clave por defecto debe cambiarse antes de producción.
 *     Hazlo actualizando la constante PUI_DEFAULT_CLAVE o ejecutando:
 *
 *       UPDATE usuarios
 *          SET password = '<bcrypt_hash_de_tu_clave>'
 *        WHERE usuario = 'PUI';
 *
 *     También puedes definir la variable de entorno PUI_WEBHOOK_CLAVE con la
 *     clave real y regenerar esta migración con `npm run migration:generate`.
 */
export class SeedUsuarioPUI1775000000000 implements MigrationInterface {
  name = 'SeedUsuarioPUI1775000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Clave por defecto — cámbiala antes de pasar a producción
    const PUI_DEFAULT_CLAVE = 'PUI@Institucio2026!';   // 19 chars ✓

    const existente = await queryRunner.query(
      `SELECT id FROM usuarios WHERE usuario = 'PUI' LIMIT 1`,
    );

    if (existente.length > 0) {
      // El usuario ya existe; no se sobreescribe para no romper credenciales en producción
      return;
    }

    const passwordHash = await bcrypt.hash(PUI_DEFAULT_CLAVE, 12);

    await queryRunner.query(
      `INSERT INTO usuarios (id, usuario, password, nombre, email, rol, activo, createdAt, updatedAt)
       VALUES (UUID(), 'PUI', ?, 'Plataforma Única de Identidad', NULL, 'pui', 1, NOW(), NOW())`,
      [passwordHash],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM usuarios WHERE usuario = 'PUI'`);
  }
}
