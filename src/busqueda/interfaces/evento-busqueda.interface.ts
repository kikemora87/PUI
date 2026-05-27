import { DomicilioDto } from '../../pui/dto/notificar-coincidencia.dto';

/**
 * Evento encontrado en búsqueda histórica (Fase 2) o continua (Fase 3).
 * Reemplaza el tipo `any[]` en buscarHistoricoEnSistemaInterno() y buscarNuevosRegistros().
 */
export interface EventoBusqueda {
  tipo: string;
  fecha?: string;
  descripcionLugar?: string;
  direccion?: DomicilioDto;
}
