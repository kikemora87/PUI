/**
 * data-source.ts — Solo para el CLI de TypeORM (migraciones).
 * NO se usa en el runtime de NestJS; ese usa database.config.ts.
 *
 * Uso (compila primero con nest build):
 *   npm run migration:run      → aplica migraciones pendientes
 *   npm run migration:revert   → revierte la última migración
 *   npm run migration:show     → lista el estado de cada migración
 *   npm run migration:generate -- src/database/migrations/NombreCambio
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env['HOST'] ?? '127.0.0.1',
  port: parseInt(process.env['PORT'] ?? '3306', 10),
  username: process.env['USER_NAME'] ?? 'root',
  password: process.env['PASSWORD'] ?? '',
  database: process.env['BD'] ?? 'pui_db',

  charset: 'utf8mb4',
  timezone: 'Z',

  // El CLI corre sobre el JS compilado en dist/
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],


  synchronize: false,

  logging: true,
});
