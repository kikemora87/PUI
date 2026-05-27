import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

/** DTO genérico de login para usuarios registrados en BD */
export class LoginDto {
  @ApiProperty({
    description: 'Nombre de usuario registrado',
    example: 'operador_norte',
    maxLength: 50,
  })
  @IsString()
  @Length(1, 50)
  usuario: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'MiClave@Segura1',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @Length(8, 72)
  clave: string;
}

// ── Mantener compatibilidad con la PUI (usuario+clave) ────────────

export class LoginInstitucionDto {
  @ApiProperty({
    description:
      'Usuario de la PUI. Valor siempre "PUI" (3 caracteres exactos)',
    example: 'PUI',
    minLength: 3,
    maxLength: 3,
  })
  @IsString()
  @Length(3, 3, { message: 'usuario debe ser exactamente "PUI"' })
  usuario: string;

  @ApiProperty({
    description:
      'Clave de autenticación. Debe contener al menos una mayúscula, un número y un carácter especial',
    example: 'M1Clave@Segura99!',
    minLength: 16,
    maxLength: 20,
  })
  @IsString()
  @Length(16, 20)
  clave: string;
}

export class LoginPuiDto {
  @ApiProperty({
    description: 'ID de la institución asignado por la PUI',
    example: 'ABC123456789',
    minLength: 4,
    maxLength: 13,
  })
  @IsString()
  @Length(4, 13)
  institucion_id: string;

  @ApiProperty({
    description: 'Clave de acceso a la PUI',
    example: 'claveProporcionadaPorPUI',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @Length(1, 50)
  clave: string;
}
