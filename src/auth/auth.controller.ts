import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtInstGuard } from '../common/guards/jwt-inst.guard';

@ApiTags('Autenticación')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── POST /login ───────────────────────────────────────────────────

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Autentica a un usuario registrado en la base de datos.\n\n' +
      'Devuelve un **Bearer token JWT** para usar en endpoints protegidos.\n\n' +
      '> Límite: **10 intentos por minuto** por IP.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Login exitoso — token generado',
    schema: { example: { token: '' } },
  })
  @ApiResponse({
    status: 400,
    description: 'Body inválido — campos faltantes o con formato incorrecto',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales incorrectas o usuario desactivado',
    schema: { example: { message: 'Credenciales inválidas', statusCode: 401 } },
  })
  @ApiResponse({ status: 429, description: 'Límite de intentos superado' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.usuario, dto.clave);
  }

  // ── POST /auth/register ───────────────────────────────────────────

  @Post('auth/register')
  @HttpCode(201)
  @UseGuards(JwtInstGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Registrar un nuevo usuario',
    description:
      'Crea un nuevo usuario en la base de datos con su contraseña cifrada (bcrypt).\n\n' +
      '> 🔒 Requiere un **Bearer token JWT** válido.\n\n' +
      '**Roles disponibles:**\n' +
      '- `admin` — acceso total\n' +
      '- `operador` — acceso a operaciones de búsqueda (default)\n' +
      '- `pui` — credenciales para el webhook de la Plataforma PUI\n\n' +
      '> El campo `password` nunca se devuelve en ninguna respuesta.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    description: 'Usuario creado correctamente',
    schema: {
      example: {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        usuario: 'operador_norte',
        rol: 'operador',
      },
    },
  })
  @ApiConflictResponse({
    description: 'El nombre de usuario ya existe',
    schema: {
      example: {
        message: 'El usuario "operador_norte" ya está registrado',
        statusCode: 409,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Body inválido — validación fallida',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT ausente, inválido o expirado',
  })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ── GET /auth/me ──────────────────────────────────────────────────

  @Get('auth/me')
  @UseGuards(JwtInstGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener información del usuario autenticado',
    description:
      'Devuelve los datos del usuario a partir del **Bearer token JWT**.\n\n' +
      'No consulta la base de datos — extrae los datos directamente del payload del token.',
  })
  @ApiOkResponse({
    description: 'Datos del usuario autenticado',
    schema: {
      example: {
        id: '15cc078e-3801-4a8e-96d2-4803b8b3c1fd',
        usuario: 'operador',
        rol: 'operador',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token ausente, inválido o expirado' })
  me(@Req() req: Request & { user: { userId: string; usuario: string; rol: string } }) {
    const { userId, usuario, rol } = req.user;
    return { id: userId, usuario, rol };
  }
}
