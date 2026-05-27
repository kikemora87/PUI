import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description:
      'Nombre de usuario único para iniciar sesión. Solo letras, números y guion bajo.',
    example: 'operador_norte',
    maxLength: 50,
  })
  @IsString()
  @Length(1, 50)
  usuario: string;

  @ApiProperty({
    description:
      'Contraseña. Mínimo 8 caracteres, al menos una mayúscula, un número y un carácter especial.',
    example: 'MiClave@Segura1',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @Length(8, 72)
  clave: string;
}
