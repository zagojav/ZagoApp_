import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import { app } from '@/services/firebase';
import { parsePriceLabel, type ParsedPriceLabel } from '@/utils/priceParser';

// Precisa bater com o setGlobalOptions em functions/src/ocrPrice.ts. Se
// divergir, a chamada falha com "not-found" e nada no erro diz que o motivo
// foi a região.
export const FUNCTIONS_REGION = 'southamerica-east1';

const functions: Functions = getFunctions(app, FUNCTIONS_REGION);

interface ScanPriceLabelResult {
  rawText: string;
  blocks: string[];
}

const callScanPriceLabel = httpsCallable<{ imageBase64: string }, ScanPriceLabelResult>(
  functions,
  'scanPriceLabel'
);

export interface OcrResult extends ParsedPriceLabel {
  /** Texto cru da Vision — mostrado na tela de confirmação como "o que eu li". */
  rawText: string;
}

export class OcrError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'OcrError';
  }
}

/**
 * Manda a foto pra Cloud Function, recebe o texto e já devolve o palpite de
 * nome + preço. O parsing roda no app (não na function) porque é onde é
 * barato iterar: mudar heurística não exige redeploy.
 */
export async function scanPriceLabel(imageBase64: string): Promise<OcrResult> {
  try {
    const { data } = await callScanPriceLabel({ imageBase64 });
    const rawText = data?.rawText ?? '';

    if (!rawText.trim()) {
      throw new OcrError('Não achei texto nenhum na foto. Tente enquadrar só a etiqueta, mais de perto.');
    }

    // `blocks` vem ordenado por tamanho do texto na imagem: o primeiro é o
    // maior, que numa etiqueta é quase sempre o preço. Colocá-lo na frente
    // faz o parser (que pontua por posição) favorecer o preço em destaque
    // em vez de um preço secundário tipo "por kg".
    const blocks = Array.isArray(data?.blocks) ? data.blocks : [];
    const parsed = parsePriceLabel(blocks.length > 0 ? `${blocks.join('\n')}\n${rawText}` : rawText);

    return { ...parsed, rawText };
  } catch (error) {
    if (error instanceof OcrError) throw error;

    const code = (error as { code?: string })?.code ?? '';
    const message = (error as { message?: string })?.message ?? '';

    if (code.includes('unauthenticated')) {
      throw new OcrError('Sessão expirou. Feche e abra o app.', error);
    }
    if (code.includes('not-found')) {
      throw new OcrError(
        'A função de OCR ainda não foi publicada. Rode `firebase deploy --only functions`.',
        error
      );
    }
    if (code.includes('unavailable') || code.includes('deadline-exceeded')) {
      throw new OcrError('Sem conexão com o servidor. Confira a internet e tente de novo.', error);
    }
    if (code.includes('resource-exhausted')) {
      throw new OcrError('Cota de leitura da Vision estourou por hoje.', error);
    }

    throw new OcrError(message || 'Não consegui ler a etiqueta. Tente de novo.', error);
  }
}
