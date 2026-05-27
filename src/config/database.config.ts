import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

/**
 * Configuración de TypeORM para NestJS (runtime).
 * Para el CLI de migraciones ver: data-source.ts (raíz del proyecto).
 *
 * Reglas del skill:
 *  - synchronize: false  → NUNCA en producción, usar migraciones
 *  - migrationsRun: true → aplica migraciones pendientes al arrancar
 *  - logging: solo en development
 */
export const getDatabaseConfig = (
  config: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: config.get<string>('HOST') ?? '127.0.0.1',
  port: parseInt(config.get<string>('PORT') ?? '3306', 10),
  username: config.get<string>('USER_NAME') ?? 'root',
  password: config.get<string>('PASSWORD') ?? '',
  database: config.get<string>('BD') ?? 'pui_db',

  charset: 'utf8mb4',
  timezone: 'Z',

  // Carga entidades del patrón glob (compatible con ts y js)
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],

  // Ruta de migraciones compiladas (dist/) para el runtime
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],

  // ✅ Aplica automáticamente las migraciones pendientes al iniciar
  migrationsRun: true,

  // ⚠️ NUNCA true — las migraciones son la fuente de verdad del esquema
  synchronize: false,

  extra: { connectionLimit: 10 },

  // Solo loguea SQL en desarrollo
  logging:
    config.get<string>('NODE_ENV') === 'development'
      ? ['query', 'error']
      : ['error'],
});
