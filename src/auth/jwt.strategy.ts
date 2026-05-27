import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RolUsuario } from './entities/usuario.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt-inst') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'default_secret',
    });
  }

  async validate(payload: JwtPayload) {
    const rolesPermitidos: string[] = [
      RolUsuario.PUI,
      RolUsuario.ADMIN,
      RolUsuario.OPERADOR,
    ];
    if (!rolesPermitidos.includes(payload.rol)) {
      throw new UnauthorizedException('Rol no autorizado');
    }
    return { userId: payload.sub, usuario: payload.usuario, rol: payload.rol };
  }
}
