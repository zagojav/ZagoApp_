import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { ImageAnnotatorClient } from '@google-cloud/vision';

// Região precisa bater com a usada no client (services/ocr.ts).
setGlobalOptions({ region: 'southamerica-east1', maxInstances: 5 });

// O client autentica sozinho pela service account do próprio Cloud Function.
// Nenhuma API key entra no app — é justamente por isso que o OCR roda aqui e
// não direto no celular.
const visionClient = new ImageAnnotatorClient();

/**
 * ~1MB de base64 ≈ 750KB de imagem. A foto sai da câmera já reduzida
 * (ver ScanPreco: quality 0.6 + resize), então isso é folga; o limite existe
 * pra uma imagem grande não estourar memória nem cota da Vision à toa.
 */
const MAX_BASE64_LENGTH = 4_000_000;

interface ScanPriceLabelRequest {
  imageBase64?: unknown;
}

interface ScanPriceLabelResponse {
  rawText: string;
  /** Blocos de texto separados, do maior pro menor — o preço costuma ser o maior. */
  blocks: string[];
}

export const scanPriceLabel = onCall<ScanPriceLabelRequest, Promise<ScanPriceLabelResponse>>(
  async (request) => {
    // Mesma regra do Firestore: só sessão autenticada (anônima) da família.
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Faça login no app antes de escanear.');
    }

    const { imageBase64 } = request.data ?? {};

    if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
      throw new HttpsError('invalid-argument', 'imageBase64 é obrigatório.');
    }

    if (imageBase64.length > MAX_BASE64_LENGTH) {
      throw new HttpsError('invalid-argument', 'Imagem muito grande. Tente uma foto mais próxima da etiqueta.');
    }

    // Aceita tanto base64 puro quanto data URL ("data:image/jpeg;base64,....").
    const content = imageBase64.includes(',') ? imageBase64.slice(imageBase64.indexOf(',') + 1) : imageBase64;

    try {
      const [result] = await visionClient.textDetection({
        image: { content },
        imageContext: { languageHints: ['pt'] },
      });

      if (result.error?.message) {
        throw new HttpsError('internal', `Vision API: ${result.error.message}`);
      }

      const annotations = result.textAnnotations ?? [];
      // annotations[0] é o texto inteiro da imagem; do [1] em diante são as
      // palavras individuais com bounding box.
      const rawText = annotations[0]?.description ?? '';

      return { rawText, blocks: extractBlocks(result) };
    } catch (error) {
      if (error instanceof HttpsError) throw error;

      const message = error instanceof Error ? error.message : String(error);
      console.error('scanPriceLabel falhou:', message);
      throw new HttpsError('internal', 'Não consegui ler a etiqueta. Tente de novo.');
    }
  }
);

/**
 * Blocos de texto ordenados por altura do texto na imagem (maior primeiro).
 *
 * Numa etiqueta de mercado o preço é impresso bem maior que o resto, então
 * o tamanho do bounding box é um sinal que o texto plano perde — o parser no
 * app usa isso pra desempatar quando há vários números na foto.
 */
function extractBlocks(result: {
  fullTextAnnotation?: {
    pages?: {
      blocks?: {
        boundingBox?: { vertices?: { x?: number | null; y?: number | null }[] | null } | null;
        paragraphs?: {
          words?: { symbols?: { text?: string | null }[] | null }[] | null;
        }[] | null;
      }[] | null;
    }[] | null;
  } | null;
}): string[] {
  const blocks = result.fullTextAnnotation?.pages?.[0]?.blocks ?? [];

  return blocks
    .map((block) => {
      const text = (block.paragraphs ?? [])
        .map((paragraph) =>
          (paragraph.words ?? [])
            .map((word) => (word.symbols ?? []).map((symbol) => symbol.text ?? '').join(''))
            .join(' ')
        )
        .join(' ')
        .trim();

      const vertices = block.boundingBox?.vertices ?? [];
      const ys = vertices.map((v) => v.y ?? 0);
      const height = ys.length > 0 ? Math.max(...ys) - Math.min(...ys) : 0;

      return { text, height };
    })
    .filter((block) => block.text.length > 0)
    .sort((a, b) => b.height - a.height)
    .map((block) => block.text);
}
