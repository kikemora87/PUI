import { IsString, Length } from 'class-validator';

export class BusquedaFinalizadaDto {
  @IsString()
  @Length(36, 75)
  id: string;

  @IsString()
  @Length(4, 13)
  institucion_id: string;
}
