import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './config/winston.config';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });

  // Seguridad — headers HTTP obligatorios (PUI sección 10)
  app.use(
    helmet({
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      frameguard: { action: 'deny' },
      noSniff: true,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
        },
      },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );

  // CORS — solo dominios autorizados (exactos + wildcards de subdominio)
  const rawOrigins = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // Separar exactos de wildcards (*.dominio.com → RegExp)
  const exactOrigins = rawOrigins.filter((o) => !o.startsWith('*'));
  const wildcardPatterns = rawOrigins
    .filter((o) => o.startsWith('*.'))
    .map((o) => {
      // *.fincrece.mx → /^https?:\/\/([a-z0-9-]+\.)?fincrece\.mx$/i
      const escaped = o.slice(2).replace(/\./g, '\\.');
      return new RegExp(`^https?:\\/\\/([a-z0-9-]+\\.)?${escaped}$`, 'i');
    });

  const isOriginAllowed = (origin: string): boolean => {
    if (exactOrigins.includes(origin)) return true;
    return wildcardPatterns.some((re) => re.test(origin));
  };

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origin (Postman, cURL, server-to-server)
      if (!origin) return callback(null, true);
      if (isOriginAllowed(origin)) return callback(null, true);
      callback(new Error(`Origen CORS no permitido: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Sin stacktraces expuestos al cliente
  app.useGlobalFilters(new AllExceptionsFilter());

  // ── Swagger (solo en desarrollo / staging) ────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');

    const swaggerConfig = new DocumentBuilder()
      .setTitle('API Institución PUI')
      .setDescription(
        `**API REST** de integración con la **Plataforma Única de Identidad (PUI)** — ` +
        `Manual Técnico v1.0 | DOF 23/01/2026.\n\n` +

        `---\n\n` +

        `## Autenticación\n` +
        `Todos los endpoints marcados con 🔒 requieren un **Bearer token JWT**.\n\n` +
        `1. Llama a \`POST /login\` con tu \`usuario\` y \`clave\`.\n` +
        `2. Copia el \`token\` recibido.\n` +
        `3. Haz clic en **Authorize 🔓** (arriba a la derecha) y pégalo.\n\n` +

        `---\n\n` +

        `## Endpoints expuestos por la Institución (§8 del Manual)\n` +
        `La PUI llama a estos endpoints de forma automática:\n\n` +
        `| Método | Ruta | Descripción | §Manual |\n` +
        `|---|---|---|---|\n` +
        `| POST | \`/login\` | Autenticación — devuelve JWT | §8.1 |\n` +
        `| POST | \`/activar-reporte\` | 🔒 Nuevo caso de búsqueda — dispara las 3 fases | §8.2 |\n` +
        `| POST | \`/activar-reporte-prueba\` | 🔒 Sandbox de conectividad (sin persistencia) | §8.3 |\n` +
        `| POST | \`/desactivar-reporte\` | 🔒 Cierra un caso y detiene la búsqueda continua | §8.4 |\n\n` +

        `---\n\n` +

        `## Flujo interno de búsqueda en 3 fases (§6 del Manual)\n` +
        `Al recibir \`/activar-reporte\`, el sistema ejecuta en **segundo plano**:\n\n` +
        `| Fase | Nombre | Acción | Notificación a PUI |\n` +
        `|---|---|---|---|\n` +
        `| 1 | Datos básicos | Consulta \`Acreditados\` por CURP — datos más recientes | \`POST /notificar-coincidencia\` con \`fase_busqueda:"1"\` |\n` +
        `| 2 | Histórica (≤ 12 años) | Busca registros desde \`fecha_desaparicion\` | \`POST /notificar-coincidencia\` con \`fase_busqueda:"2"\` + \`POST /busqueda-finalizada\` |\n` +
        `| 3 | Continua (cron horario) | Detecta cambios en \`Acreditados\` por fingerprint | \`POST /notificar-coincidencia\` con \`fase_busqueda:"3"\` |\n\n` +

        `> La Fase 3 se detiene automáticamente al recibir \`/desactivar-reporte\`.\n\n` +

        `---\n\n` +

        `## Endpoints auxiliares\n\n` +
        `| Método | Ruta | Descripción |\n` +
        `|---|---|---|\n` +
        `| POST | \`/auth/register\` | Crear usuario interno |\n` +
        `| GET | \`/auth/me\` | 🔒 Datos del usuario autenticado |`,
      )
      .setVersion('1.0.0')
      .setContact('Equipo de integración', '', 'soporte@institucion.gob.mx')
      .setLicense('Privado', '')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Token JWT obtenido en POST /login. ' +
            'Vigencia: 1 hora. Incluir como: Authorization: Bearer <token>',
        },
        'jwt',
      )
      .addTag(
        'Autenticación',
        'Login y gestión de credenciales. ' +
        'La PUI se autentica con usuario="PUI" (§8.1 Manual PUI).',
      )
      .addTag(
        'Reportes',
        'Endpoints que recibe la institución desde la PUI para gestionar casos de búsqueda ' +
        'de personas desaparecidas (§8.2 – §8.4 Manual PUI). ' +
        'Cada activación dispara el flujo interno de 3 fases sobre la tabla Acreditados.',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
        docExpansion: 'list',
        filter: true,
        showRequestDuration: true,
      },
      customSiteTitle: 'PUI API Docs',
      customCss: `
        .swagger-ui .topbar { background-color: #1a3a5c; }
        .swagger-ui .topbar-wrapper .link span { display: none; }
        .swagger-ui .topbar-wrapper .link::after {
          content: 'Institución · PUI API';
          color: #ffffff;
          font-size: 1.1em;
          font-weight: bold;
        }
      `,
    });

    console.log(
      `📖 Swagger disponible en http://localhost:${process.env.APP_PORT ?? 3000}/api/docs`,
    );
  }

  const port = process.env.APP_PORT ?? 3000;
  await app.listen(port);
  console.log(`PUI API corriendo en puerto ${port}`);
}
bootstrap();
