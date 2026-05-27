/**
 * Resultado de la búsqueda de datos básicos en el sistema interno (Fase 1).
 * Reemplaza el tipo `any` en buscarDatosBasicosEnSistemaInterno().
 */
export interface DatosBasicosPersona {
  nombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  fechaNacimiento?: string;
  sexo?: 'H' | 'M' | 'X';
  telefono?: string;
  correo?: string;
  codigoPostal?: string;
  municipio?: string;
}
