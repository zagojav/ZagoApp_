// Contraparte nativa de pickPhoto.web.ts. No iOS/Android a captura é feita
// pela CameraView do expo-camera direto na tela de escanear, então aqui só
// existe pra o import resolver e o tipo bater nas duas plataformas.

export async function pickPhoto(): Promise<File | null> {
  throw new Error('pickPhoto só existe na versão web; no nativo use a CameraView.');
}
