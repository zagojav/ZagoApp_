// Captura de foto no navegador via <input type="file" capture="environment">.
//
// Escolhido em vez de getUserMedia porque o alvo é o app rodando como PWA na
// tela de início do iPhone: nesse modo standalone o acesso à câmera ao vivo
// só passou a funcionar no iOS 16.4, e ainda hoje falha em alguns cenários.
// O input de arquivo abre a câmera traseira nativa em qualquer iOS e devolve
// uma foto em resolução cheia.

/**
 * Abre a câmera (ou a galeria, se a pessoa preferir) e resolve com o arquivo.
 * Resolve `null` se ela cancelar.
 *
 * Precisa ser chamada de dentro de um gesto do usuário — num onPress, por
 * exemplo. Fora disso o Safari ignora o clique no input.
 */
export function pickPhoto(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    // `capture` é uma dica: abre a câmera traseira direto no celular e é
    // ignorado no desktop, que cai no seletor de arquivos normal.
    input.setAttribute('capture', 'environment');

    // Fora da tela em vez de display:none — Safari antigo não dispara o clique
    // num input que não está renderizado.
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    input.style.opacity = '0';

    let settled = false;

    const finish = (file: File | null) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('focus', onWindowFocus);
      input.remove();
      resolve(file);
    };

    // Cancelar o seletor não dispara `change` em lugar nenhum, e `cancel` só
    // existe em navegador recente. Sem este fallback a promise ficaria pendente
    // pra sempre e a tela travaria no estado "lendo". O atraso dá tempo do
    // `change` chegar primeiro quando a pessoa realmente escolheu uma foto.
    const onWindowFocus = () => {
      setTimeout(() => finish(input.files?.[0] ?? null), 500);
    };

    input.onchange = () => finish(input.files?.[0] ?? null);
    input.oncancel = () => finish(null);

    document.body.appendChild(input);
    window.addEventListener('focus', onWindowFocus);
    input.click();
  });
}
