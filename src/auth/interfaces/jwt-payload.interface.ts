import { RolUsuario } from '../entities/usuario.entity';

export interface JwtPayload {
  sub: string;
  usuario: string;
  rol: RolUsuario;
  iat?: number;
  exp?: number;
}
