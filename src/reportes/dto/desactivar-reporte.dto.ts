import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class DesactivarReporteDto {
  @ApiProperty({
    description:
      'Identificador único del reporte a desactivar. Debe coincidir con el `id` usado en /activar-reporte',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    minLength: 36,
    maxLength: 75,
  })
  @IsString()
  @Length(36, 75)
  id: string;
}
