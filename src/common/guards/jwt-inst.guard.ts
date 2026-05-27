import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtInstGuard extends AuthGuard('jwt-inst') {}
