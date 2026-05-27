import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export type EtiquetaHuella =
  | 'rone' // Pulgar derecho
  | 'rtwo' // Índice derecho
  | 'rthree' // Medio derecho
  | 'rfour' // Anular derecho
  | 'rfive' // Meñique derecho
  | 'lone' // Pulgar izquierdo
  | 'ltwo' // Índice izquierdo
  | 'lthree' // Medio izquierdo
  | 'lfour' // Anular izquierdo
  | 'lfive' // Meñique izquierdo
  | 'rpalm' // Palma derecha
  | 'lpalm'; // Palma izquierda

@Injectable()
export class BiometricoService {
  private readonly logger = new Logger(BiometricoService.name);
  private readonly algoritmo = 'aes-256-gcm';
  private readonly IV_BYTES = 12;
  private readonly TAG_BYTES = 16;

  constructor(private readonly config: ConfigService) {}

  /**
   * Cifra un buffer con AES-256-GCM.
   * Devuelve: base64( IV (12b) + authTag (16b) + ciphertext )
   */
  cifrar(datos: Buffer): string {
    const clave = this.obtenerClave();
    const iv = randomBytes(this.IV_BYTES);

    const cipher = createCipheriv(this.algoritmo, clave, iv);
    const cifrado = Buffer.concat([cipher.update(datos), cipher.final()]);
    const tag = cipher.getAuthTag();

    return Buffer.concat([iv, tag, cifrado]).toString('base64');
  }

  /**
   * Descifra un string producido por `cifrar()`.
   */
  descifrar(datosBase64: string): Buffer {
    const clave = this.obtenerClave();
    const buffer = Buffer.from(datosBase64, 'base64');

    const iv = buffer.subarray(0, this.IV_BYTES);
    const tag = buffer.subarray(this.IV_BYTES, this.IV_BYTES + this.TAG_BYTES);
    const cifrado = buffer.subarray(this.IV_BYTES + this.TAG_BYTES);

    const decipher = createDecipheriv(this.algoritmo, clave, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(cifrado), decipher.final()]);
  }

  cifrarFoto(imagenBuffer: Buffer): string {
    return this.cifrar(imagenBuffer);
  }

  cifrarHuella(huellaBuffer: Buffer): string {
    return this.cifrar(huellaBuffer);
  }

  prepararHuellas(
    mapa: Partial<Record<EtiquetaHuella, Buffer>>,
  ): Record<string, string> {
    const resultado: Record<string, string> = {};
    for (const [etiqueta, buffer] of Object.entries(mapa)) {
      if (buffer) {
        resultado[etiqueta] = this.cifrarHuella(buffer);
      }
    }
    return resultado;
  }

  private obtenerClave(): Buffer {
    const claveStr = this.config.get<string>('PUI_BIOMETRICO_KEY');

    if (!claveStr) {
      throw new Error('PUI_BIOMETRICO_KEY no está configurada');
    }

    const claveBuffer = Buffer.from(claveStr, 'utf-8');

    if (claveBuffer.length !== 32) {
      throw new Error(
        `PUI_BIOMETRICO_KEY debe tener exactamente 32 bytes (actual: ${claveBuffer.length})`,
      );
    }

    return claveBuffer;
  }
}
