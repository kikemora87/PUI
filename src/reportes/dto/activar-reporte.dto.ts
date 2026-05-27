import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  Length,
  IsOptional,
  IsDateString,
  IsIn,
} from 'class-validator';

export class ActivarReporteDto {
  @ApiProperty({
    description:
      'Identificador único del reporte asignado por la PUI. ' +
      'Formato: <FUB>-<UUID4>. Longitud mínima 36, máxima 75 caracteres (§8.2 Manual PUI)',
    example: 'e7b5a4c2-9f4e-4a99-91a2-6d4a8a1eaf3d-550e8400-e29b-41d4-a716-446655440000',
    minLength: 36,
    maxLength: 75,
  })
  @IsString()
  @Length(36, 75)
  id: string;

  @ApiProperty({
    description: 'CURP de la persona desaparecida. 18 caracteres alfanuméricos',
    example: 'GOPM800101HDFRRS09',
    minLength: 18,
    maxLength: 18,
  })
  @IsString()
  @Length(18, 18)
  curp: string;

  @ApiProperty({
    description: 'Clave de entidad federativa de nacimiento (catálogo RENAPO)',
    example: 'DF',
    maxLength: 20,
  })
  @IsString()
  @Length(0, 20)
  lugar_nacimiento: string;

  @ApiPropertyOptional({
    description: 'Nombre(s) de la persona',
    example: 'Juan Carlos',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  nombre?: string;

  @ApiPropertyOptional({
    description: 'Primer apellido',
    example: 'González',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  primer_apellido?: string;

  @ApiPropertyOptional({
    description: 'Segundo apellido',
    example: 'Pérez',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  segundo_apellido?: string;

  @ApiPropertyOptional({
    description: 'Fecha de nacimiento en formato ISO 8601 (YYYY-MM-DD)',
    example: '1980-01-01',
  })
  @IsOptional()
  @IsDateString()
  fecha_nacimiento?: string;

  @ApiPropertyOptional({
    description: 'Fecha de desaparición en formato ISO 8601 (YYYY-MM-DD)',
    example: '2024-03-15',
  })
  @IsOptional()
  @IsDateString()
  fecha_desaparicion?: string;

  @ApiPropertyOptional({
    description:
      'Sexo asignado al nacer. H=Hombre, M=Mujer, X=No binario/No especificado',
    example: 'H',
    enum: ['H', 'M', 'X'],
  })
  @IsOptional()
  @IsIn(['H', 'M', 'X'])
  sexo_asignado?: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono de contacto',
    example: '5551234567',
    maxLength: 15,
  })
  @IsOptional()
  @IsString()
  @Length(0, 15)
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico de contacto',
    example: 'familiar@correo.com',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  correo?: string;

  @ApiPropertyOptional({
    description: 'Dirección completa en texto libre',
    example: 'Calle Reforma 123, Col. Centro, CDMX',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  direccion?: string;

  @ApiPropertyOptional({
    description: 'Nombre de la calle',
    example: 'Av. Insurgentes',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  calle?: string;

  @ApiPropertyOptional({
    description: 'Número exterior o interior',
    example: '123-B',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @Length(0, 20)
  numero?: string;

  @ApiPropertyOptional({
    description: 'Colonia o barrio',
    example: 'Centro Histórico',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  colonia?: string;

  @ApiPropertyOptional({
    description: 'Código postal de 5 dígitos',
    example: '06600',
    maxLength: 5,
  })
  @IsOptional()
  @IsString()
  @Length(0, 5)
  codigo_postal?: string;

  @ApiPropertyOptional({
    description: 'Municipio o alcaldía',
    example: 'Cuauhtémoc',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  municipio_o_alcaldia?: string;

  @ApiPropertyOptional({
    description: 'Entidad federativa (estado)',
    example: 'Ciudad de México',
    maxLength: 40,
  })
  @IsOptional()
  @IsString()
  @Length(0, 40)
  entidad_federativa?: string;
}
