import { IsString, IsOptional, Length, Matches, IsIn } from 'class-validator';

export class DomicilioDto {
  @IsOptional() @IsString() @Length(0, 500) direccion?: string;
  @IsOptional() @IsString() @Length(0, 50) calle?: string;
  @IsOptional() @IsString() @Length(0, 20) numero?: string;
  @IsOptional() @IsString() @Length(0, 50) colonia?: string;
  @IsOptional() @IsString() @Length(0, 5) codigo_postal?: string;
  @IsOptional() @IsString() @Length(0, 100) municipio_o_alcaldia?: string;
  @IsOptional() @IsString() @Length(0, 40) entidad_federativa?: string;
}

export class NombreCompletoDto {
  @IsOptional() @IsString() @Length(1, 50) nombre?: string;
  @IsOptional() @IsString() @Length(1, 50) primer_apellido?: string;
  @IsOptional() @IsString() @Length(1, 50) segundo_apellido?: string;
}

export class NotificarCoincidenciaDto {
  @IsString()
  @Length(18, 18)
  @Matches(/^[A-Z0-9]{18}$/)
  curp: string;

  @IsString()
  @Length(36, 75)
  id: string;

  @IsString()
  @Length(0, 20)
  lugar_nacimiento: string;

  @IsString()
  institucion_id: string;

  @IsString()
  @IsIn(['1', '2', '3'])
  fase_busqueda: string;

  @IsOptional()
  nombre_completo?: NombreCompletoDto;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fecha_nacimiento?: string;

  @IsOptional()
  @IsIn(['H', 'M', 'X'])
  sexo_asignado?: string;

  @IsOptional()
  @Matches(/^\+?\d{0,15}$/)
  telefono?: string;

  @IsOptional()
  @Matches(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,50}$/)
  correo?: string;

  @IsOptional()
  domicilio?: DomicilioDto;

  @IsOptional()
  fotos?: string[];

  @IsOptional()
  formato_fotos?: string;

  @IsOptional()
  huellas?: Record<string, string>;

  @IsOptional()
  formato_huellas?: string;

  // Obligatorios en fase 2 y 3, omitir en fase 1
  @IsOptional()
  @IsString()
  @Length(0, 500)
  tipo_evento?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fecha_evento?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  descripcion_lugar_evento?: string;

  @IsOptional()
  direccion_evento?: DomicilioDto;
}
