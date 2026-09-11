import type { ParsedPriceLabel } from '@/utils/priceParser';

// O Tesseract.js depende de Web Worker, canvas e WebAssembly do navegador —
// nada disso existe no runtime do React Native. Metro resolve `.native.ts`
// antes de `.ts` no iOS/Android, então este arquivo mantém o bundle nativo
// livre do tesseract.js em vez de quebrar no import.
//
// O uso real do scanner é pela versão web (PWA na tela de início do iPhone).

export interface OcrResult extends ParsedPriceLabel {
  rawText: string;
}

export class OcrError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'OcrError';
  }
}

export type OcrImageSource = string;

export interface ScanOptions {
  onProgress?: (ratio: number) => void;
}

/** Mesma assinatura da versão web, pra o tipo bater nas duas plataformas. */
export async function scanPriceLabel(
  _source: OcrImageSource,
  _options: ScanOptions = {}
): Promise<OcrResult> {
  throw new OcrError(
    'A leitura de etiqueta funciona na versão web do app. Abra pelo navegador (ou pelo atalho na tela de início) pra escanear.'
  );
}

export function warmUpOcr(): void {
  // Não há worker pra pré-aquecer no nativo.
}

export async function releaseOcr(): Promise<void> {
  // Não há worker pra liberar no nativo.
}
