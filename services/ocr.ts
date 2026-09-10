import { createWorker, type Worker, type Block } from 'tesseract.js';
import { parsePriceLabel, type ParsedPriceLabel } from '@/utils/priceParser';

// OCR roda dentro do navegador, via WebAssembly. A foto não sai do aparelho:
// não há servidor, chave de API, cota nem módulo nativo — o que permite usar
// o app como PWA na tela de início do iPhone.

export interface OcrResult extends ParsedPriceLabel {
  /** Texto cru lido da etiqueta — a confirmação mostra como "o que eu li". */
  rawText: string;
}

export class OcrError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'OcrError';
  }
}

/** Fonte de imagem aceita: File/Blob da câmera, data URL ou canvas já pronto. */
export type OcrImageSource = File | Blob | string | HTMLCanvasElement;

/**
 * Maior dimensão da imagem entregue ao Tesseract.
 *
 * O Tesseract é bem mais lento que um OCR nativo e o custo cresce com a área
 * da imagem — uma foto de 12MP levaria dezenas de segundos no Safari. 1600px
 * mantém a fonte miúda da etiqueta legível e derruba o tempo pra poucos
 * segundos.
 */
const MAX_IMAGE_SIDE = 1600;

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

let workerPromise: Promise<Worker> | null = null;

// O logger é fixado no worker no momento da criação, mas o worker é único e
// vive entre várias fotos (e o warm-up cria ele sem nenhum callback). Guardar
// o handler aqui fora deixa cada leitura publicar o próprio progresso.
let progressHandler: ((ratio: number) => void) | null = null;

/**
 * Um worker só, reaproveitado entre fotos.
 *
 * Criar o worker baixa o WASM e o dado de idioma (~10MB no primeiro uso) e
 * leva vários segundos. Como o fluxo é escanear vários itens em sequência,
 * recriar a cada foto tornaria o loop inviável. Depois do primeiro download o
 * navegador guarda em cache e o IndexedDB guarda o traineddata, então as
 * próximas aberturas do app já sobem rápido.
 */
function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker('por', undefined, {
      logger: (message) => {
        if (message.status === 'recognizing text' && typeof message.progress === 'number') {
          progressHandler?.(message.progress);
        }
      },
    }).catch((error) => {
      // Sem isso uma falha de rede no primeiro uso ficaria memorizada e todas
      // as tentativas seguintes reutilizariam a promise rejeitada.
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
}

/**
 * Começa a subir o worker sem ler nada.
 *
 * A tela de escanear chama isso ao abrir: o download do modelo acontece
 * enquanto a pessoa ainda está enquadrando a etiqueta, em vez de só depois de
 * ela tirar a foto. Falha aqui é ignorada de propósito — se a rede cair, o
 * erro de verdade aparece na hora de ler, com mensagem apropriada.
 */
export function warmUpOcr(): void {
  if (typeof document === 'undefined') return;
  void getWorker().catch(() => {});
}

/** Libera o worker (e os ~10MB que ele segura) ao sair da área de escanear. */
export async function releaseOcr(): Promise<void> {
  if (!workerPromise) return;
  const pending = workerPromise;
  workerPromise = null;
  try {
    const worker = await pending;
    await worker.terminate();
  } catch {
    // Worker que nunca chegou a subir não tem o que terminar.
  }
}

// ---------------------------------------------------------------------------
// Pré-processamento
// ---------------------------------------------------------------------------

function loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = typeof source === 'string' ? null : URL.createObjectURL(source);

    image.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new OcrError('Não consegui abrir a foto.'));
    };
    image.src = objectUrl ?? (source as string);
  });
}

/**
 * Reduz a imagem e joga pra tons de cinza com contraste esticado.
 *
 * O Tesseract é bem mais sensível a qualidade de entrada que um OCR nativo:
 * etiqueta fotografada torta, com reflexo de plástico e iluminação de
 * supermercado sai muito melhor depois de normalizar o contraste do que na
 * foto colorida crua.
 */
async function prepareImage(source: OcrImageSource): Promise<HTMLCanvasElement> {
  if (typeof HTMLCanvasElement !== 'undefined' && source instanceof HTMLCanvasElement) {
    return source;
  }

  const image = await loadImage(source as File | Blob | string);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new OcrError('Não consegui preparar a imagem pra leitura.');

  context.drawImage(image, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  // Luminância perceptual, e de quebra descobre o intervalo real de brilho.
  let min = 255;
  let max = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const grey = (pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114) | 0;
    pixels[i] = grey;
    if (grey < min) min = grey;
    if (grey > max) max = grey;
  }

  // Estica o contraste pro intervalo cheio. A guarda evita amplificar ruído
  // numa foto quase toda de um tom só (borrada, ou tirada contra a luz).
  const range = max - min;
  if (range > 32) {
    for (let i = 0; i < pixels.length; i += 4) {
      const stretched = ((pixels[i] - min) * 255) / range;
      pixels[i] = stretched;
      pixels[i + 1] = stretched;
      pixels[i + 2] = stretched;
    }
  } else {
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i + 1] = pixels[i];
      pixels[i + 2] = pixels[i];
    }
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
}

// ---------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------

/**
 * Blocos ordenados do texto visualmente maior pro menor.
 *
 * Numa etiqueta o preço é impresso muito maior que o resto, e é essa a única
 * pista que separa o preço de venda de um "R$ X,XX por kg" logo abaixo. O
 * texto plano perde isso, então reordenamos pela altura da bounding box antes
 * de entregar pro parser, que pontua por posição.
 */
function blocksByVisualSize(blocks: Block[] | null): string[] {
  if (!blocks) return [];

  return blocks
    .map((block) => ({
      text: (block.text ?? '').trim(),
      height: block.bbox ? block.bbox.y1 - block.bbox.y0 : 0,
    }))
    .filter((block) => block.text.length > 0)
    .sort((a, b) => b.height - a.height)
    .map((block) => block.text);
}

export interface ScanOptions {
  /** 0..1 durante o reconhecimento, pra tela mostrar progresso. */
  onProgress?: (ratio: number) => void;
}

/** Lê a etiqueta e já devolve o palpite de nome + preço. */
export async function scanPriceLabel(
  source: OcrImageSource,
  options: ScanOptions = {}
): Promise<OcrResult> {
  if (!source) {
    throw new OcrError('Não consegui capturar a foto. Tente de novo.');
  }

  if (typeof document === 'undefined') {
    throw new OcrError('A leitura de etiqueta só funciona no navegador.');
  }

  let rawText: string;
  let blocks: string[];

  try {
    const canvas = await prepareImage(source);
    const worker = await getWorker();
    progressHandler = options.onProgress ?? null;

    // `blocks: true` não vem por padrão no v7, e é dele que sai a ordenação
    // por tamanho de texto.
    try {
      const { data } = await worker.recognize(canvas, {}, { text: true, blocks: true });
      rawText = data.text ?? '';
      blocks = blocksByVisualSize(data.blocks);
    } finally {
      progressHandler = null;
    }
  } catch (error) {
    if (error instanceof OcrError) throw error;

    const message = (error as { message?: string })?.message ?? '';

    if (/network|fetch|load|failed to/i.test(message)) {
      throw new OcrError(
        'Não consegui baixar o leitor de etiquetas. Na primeira vez ele precisa de internet; depois funciona offline.',
        error
      );
    }

    throw new OcrError('Não consegui ler a etiqueta. Tente de novo.', error);
  }

  if (!rawText.trim()) {
    throw new OcrError('Não achei texto nenhum na foto. Tente enquadrar só a etiqueta, mais de perto.');
  }

  const parsed = parsePriceLabel(blocks.length > 0 ? `${blocks.join('\n')}\n${rawText}` : rawText);

  return { ...parsed, rawText };
}
