import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Usuario, RolUsuario } from './entities/usuario.entity';
import { RegisterDto } from './dto/register.dto';
import { AuditService } from '../audit/audit.service';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  // ── Registro ─────────────────────────────────────────────────────

  /**
   * Crea un nuevo usuario. El password se almacena como hash bcrypt.
   * Lanza ConflictException si el usuario o email ya existen.
   */
  async register(
    dto: RegisterDto,
  ): Promise<{ id: string; usuario: string; rol: RolUsuario }> {
    const existe = await this.usuarioRepo.findOne({
      where: { usuario: dto.usuario },
    });
    if (existe) {
      throw new ConflictException(
        `El usuario "${dto.usuario}" ya está registrado`,
      );
    }

    const passwordHash = await bcrypt.hash(dto.clave, SALT_ROUNDS);

    const nuevo = this.usuarioRepo.create({
      usuario: dto.usuario,
      password: passwordHash,
      nombre: null,
      email: null,
      rol: RolUsuario.OPERADOR,
      activo: true,
    });

    const guardado = await this.usuarioRepo.save(nuevo);
    return { id: guardado.id, usuario: guardado.usuario, rol: guardado.rol };
  }

  // ── Login (usuarios en BD) ────────────────────────────────────────

  /**
   * Autentica a un usuario registrado en la BD.
   * Devuelve JWT con payload { sub, usuario, rol }.
   */
  async login(usuario: string, password: string): Promise<{ token: string }> {
    const inicio = Date.now();

    try {
      // addSelect para recuperar el campo password que tiene select:false
      const user = await this.usuarioRepo
        .createQueryBuilder('u')
        .addSelect('u.password')
        .where('u.usuario = :usuario', { usuario })
        .getOne();

      if (!user) {
        await this.auditService.registrar({
          metodo: 'POST',
          endpoint: '/login',
          direccion: 'entrante',
          payloadResumen: { usuario },
          statusCode: 401,
          error: 'Credenciales inválidas',
          duracionMs: Date.now() - inicio,
        });
        throw new UnauthorizedException('Credenciales inválidas');
      }

      if (!user.activo) {
        await this.auditService.registrar({
          metodo: 'POST',
          endpoint: '/login',
          direccion: 'entrante',
          payloadResumen: { usuario },
          statusCode: 401,
          error: 'Usuario desactivado',
          duracionMs: Date.now() - inicio,
        });
        throw new UnauthorizedException(
          'Usuario desactivado — contacta al administrador',
        );
      }

      const passwordOk = await bcrypt.compare(password, user.password);
      if (!passwordOk) {
        await this.auditService.registrar({
          metodo: 'POST',
          endpoint: '/login',
          direccion: 'entrante',
          payloadResumen: { usuario },
          statusCode: 401,
          error: 'Credenciales inválidas',
          duracionMs: Date.now() - inicio,
        });
        throw new UnauthorizedException('Credenciales inválidas');
      }

      const payload = { sub: user.id, usuario: user.usuario, rol: user.rol };
      const token = this.jwtService.sign(payload);

      await this.auditService.registrar({
        metodo: 'POST',
        endpoint: '/login',
        direccion: 'entrante',
        payloadResumen: { usuario },
        statusCode: 200,
        duracionMs: Date.now() - inicio,
      });

      return { token };
    } catch (err) {
      // Re-lanzar sin doble auditoría (los UnauthorizedException ya se auditaron arriba)
      throw err;
    }
  }

  // ── Login PUI (credenciales fijas — retrocompatibilidad) ──────────

  /**
   * Login especial para el webhook de la PUI.
   * Las credenciales se mantienen en variables de entorno.
   * @deprecated Usar /login con usuario registrado en BD cuando sea posible.
   */
  async loginDesdePUI(
    usuario: string,
    clave: string,
  ): Promise<{ token: string }> {
    // Buscar usuario PUI en BD primero
    const user = await this.usuarioRepo
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.usuario = :usuario AND u.rol = :rol', {
        usuario,
        rol: RolUsuario.PUI,
      })
      .getOne();

    if (user) {
      if (!user.activo) {
        throw new UnauthorizedException('Usuario PUI desactivado');
      }
      const ok = await bcrypt.compare(clave, user.password);
      if (!ok) throw new UnauthorizedException('Credenciales inválidas');
      const payload = { sub: user.id, usuario: user.usuario, rol: user.rol };
      return { token: this.jwtService.sign(payload) };
    }

    throw new UnauthorizedException('Credenciales inválidas');
  }

  // ── Verificación de token ─────────────────────────────────────────

  verificarToken(token: string): Record<string, unknown> {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  // ── Utilitario: buscar usuario por id ────────────────────────────

  async findById(id: string): Promise<Usuario | null> {
    return this.usuarioRepo.findOne({ where: { id, activo: true } });
  }

  async findByUsuario(usuario: string): Promise<Usuario | null> {
    return this.usuarioRepo.findOne({ where: { usuario } });
  }
}
