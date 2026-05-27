import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusquedaService } from './busqueda.service';
import { BusquedaContinuaService } from './busqueda-continua.service';
import { BusquedaContinuaScheduler } from './busqueda-continua.scheduler';
import { Reporte } from '../reportes/entities/reporte.entity';
import { PuiModule } from '../pui/pui.module';
import { CoincidenciasModule } from '../coincidencias/coincidencias.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reporte]),
    PuiModule,
    CoincidenciasModule,
  ],
  providers: [
    BusquedaService,
    BusquedaContinuaService,
    BusquedaContinuaScheduler,
  ],
  exports: [
    BusquedaService,
    BusquedaContinuaService,
    BusquedaContinuaScheduler,
  ],
})
export class BusquedaModule {}
