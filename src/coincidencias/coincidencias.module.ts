import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoincidenciasService } from './coincidencias.service';
import { Coincidencia } from './entities/coincidencia.entity';
import { PuiModule } from '../pui/pui.module';

@Module({
  imports: [TypeOrmModule.forFeature([Coincidencia]), PuiModule],
  providers: [CoincidenciasService],
  exports: [CoincidenciasService],
})
export class CoincidenciasModule {}
