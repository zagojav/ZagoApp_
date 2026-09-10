# Cloud Functions — ZagoApp

Hoje tem uma função só: `scanPriceLabel`, o OCR das etiquetas de preço do
mercado.

A Vision API é chamada daqui, e não do celular, porque a credencial que
autoriza a leitura fica na service account do próprio Cloud Function. Se o app
chamasse a Vision direto, a chave iria junto no bundle — e bundle de app (e
principalmente o build web) é lido por qualquer um.

## O que precisa estar ligado antes do primeiro deploy

1. **Plano Blaze** no projeto `zagoapp`.
   Cloud Functions não roda no plano Spark (gratuito). Blaze é pay-as-you-go e
   mantém as cotas gratuitas — pra uso de uma família o custo tende a ficar em
   zero, mas exige cartão cadastrado.
   → https://console.firebase.google.com/project/zagoapp/usage/details

2. **Cloud Vision API habilitada**:
   ```bash
   gcloud services enable vision.googleapis.com --project=zagoapp
   ```
   Ou pelo console: https://console.cloud.google.com/apis/library/vision.googleapis.com?project=zagoapp

3. **Firebase CLI** (não está instalado na máquina ainda):
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

4. **Alerta de billing** — a cota gratuita de Text Detection é de 1.000
   imagens/mês. Uso familiar não chega perto, mas o alerta evita surpresa:
   → https://console.cloud.google.com/billing/budgets?project=zagoapp

## Deploy

Da raiz do projeto:

```bash
firebase deploy --only functions
```

O `predeploy` do `firebase.json` roda `npm run build` sozinho, então não
precisa compilar antes.

## Região

A função está em **southamerica-east1** (São Paulo) — menos latência pra quem
está usando no Brasil, dentro do mercado, no 4G.

Essa região é declarada em dois lugares e os dois precisam bater:

- `functions/src/ocrPrice.ts` → `setGlobalOptions({ region: ... })`
- `services/ocr.ts` → `FUNCTIONS_REGION`

Se divergirem, a chamada falha com `not-found` sem dizer que o motivo foi a
região. O app traduz esse erro pra "a função de OCR ainda não foi publicada",
que é a causa mais provável na prática.

## Testar sem publicar

```bash
cd functions
npm run serve
```

O emulador sobe em `localhost:5001`. Pra o app apontar pra ele, adicione em
`services/ocr.ts` (só em desenvolvimento):

```ts
import { connectFunctionsEmulator } from 'firebase/functions';
connectFunctionsEmulator(functions, 'localhost', 5001);
```

Atenção: o emulador ainda chama a Vision API de verdade e consome cota — ele
não simula o OCR.

## Logs

```bash
firebase functions:log --only scanPriceLabel
```
