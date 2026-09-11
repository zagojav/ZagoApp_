# Segurança do ZagoApp — estado atual e o que falta

Última revisão: 11/09/2026

---

## Antes de mais nada: uma correção de premissa

O checklist dizia que as regras do Firestore estavam como
`allow read, write: if true`. **Não estavam.** O que havia no
`firestore.rules` era:

```
match /{document=**} {
  allow read, write: if request.auth != null;
}
```

Ou seja, já exigia autenticação. A frase "qualquer pessoa na internet, sem
login, pode ler e escrever" não estava correta ao pé da letra.

**Mas a preocupação por trás dela estava certa**, e por um motivo mais sutil:
o app entra com **login anônimo compartilhado** (`signInAnonymously`). Login
anônimo normalmente está aberto para qualquer um que tenha a config do
Firebase — e ela está no bundle web, como em todo app client-side. Então, na
prática, quem pegasse a config conseguia criar uma sessão anônima e cair
naquele `allow read, write` genérico. O resultado final era parecido com o
que o checklist descrevia; só o caminho era outro.

Isso foi corrigido. Ver abaixo.

---

## O que as regras novas fazem

| | |
|---|---|
| **Negam por padrão** | Não existe mais `match /{document=**}`. Collection sem regra = acesso negado. |
| **Liberam operação por operação** | Cada collection declara `read` / `create` / `update` / `delete` separadamente. |
| **Validam toda escrita** | Tipo, campos obrigatórios e tamanho máximo de string. Documento malformado não entra. |
| **Bloqueiam escalação** | `update` em `users` só aceita `pinHash`, `pinSet`, `photoUrl`, `updatedAt`. Ninguém vira admin escrevendo no próprio documento, nem troca de família. |
| **Protegem o que é semente** | `families`, `users` e `pets` não podem ser apagados pelo cliente. |
| **Tratam preço como fato** | `price_history` aceita criar e apagar, nunca editar — registro de preço datado não se reescreve. |

Deploy:

```bash
firebase deploy --only firestore:rules
```

> Recomendo rodar antes com o emulador (`firebase emulators:start --only firestore`)
> e abrir o app apontando para ele. Uma regra errada não corrompe dado, mas
> faz o app parar de salvar — e isso é exatamente o tipo de coisa que ninguém
> percebe na hora.

---

## O que as regras NÃO conseguem fazer (e por quê)

### 1. Separar um perfil do outro

O checklist pedia `request.auth.uid == resource.data.userId`. **Isso não pode
ser escrito neste app**, e escrever quebraria tudo.

Motivo: `request.auth.uid` é o id da sessão anônima **do aparelho**.
`userId` é um slug (`'amanda'`, `'lucas'`). Os dois nunca vão ser iguais.
Amanda e Guilherme no mesmo celular compartilham o mesmo `uid`; a Amanda no
celular dela e no tablet da sala tem `uid` diferente em cada um.

Consequência honesta: **a privacidade entre perfis hoje é organizacional, não
criptográfica.** O app só consulta os dados do perfil ativo, mas nada no
servidor impede um cliente modificado de ler os lembretes de outra pessoa.

**Como resolver de verdade:** conta Firebase por pessoa — e-mail/senha, ou
custom token emitido por uma Cloud Function depois de validar o PIN. Aí
`request.auth.uid` passa a ser a pessoa, e a regra do checklist vira
escrevível. É um projeto à parte, não um ajuste de arquivo.

### 2. Esconder o PIN

O checklist pedia para nunca permitir leitura do PIN por query, só validação
via Cloud Function.

Situação real: o app **lê `pinHash` no cliente** e compara
(`app/(auth)/pin-entry.tsx`). Bloquear a leitura desse campo quebra o login
de todo mundo, hoje.

E vale dizer o que o hash realmente protege: `pinHash` é sha256 de 4 dígitos.
São **10.000 combinações** — quem tiver o documento em mãos descobre o PIN
instantaneamente numa planilha. O hash não é uma defesa significativa; o que
protege o PIN é ninguém conseguir ler o documento.

**Como resolver de verdade:** mover a validação para uma Cloud Function que
recebe o PIN, compara no servidor e devolve um custom token. Aí `pinHash`
pode virar ilegível para o cliente. Depende do item 1.

---

## App Check (Tarefa 2) — meio caminho pronto

App Check é o que impede um script qualquer de falar com o projeto, mesmo
com a API key em mãos. É a proteção certa para o problema que o checklist
descreveu.

**Não consigo ativar daqui**: exige registrar o app no Console do Firebase e
obter uma chave reCAPTCHA. O que ficou pronto foi o lado do cliente, em
`services/firebase.web.ts`, **inerte até existir a chave**:

```ts
const recaptchaSiteKey = process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY;
if (recaptchaSiteKey) { /* inicializa App Check */ }
```

Isso é de propósito: App Check pela metade — código no cliente sem registro
no Console, ou enforcement ligado no Console sem chave no cliente — derruba
**todas** as chamadas ao Firestore de uma vez.

### Passo a passo para ligar

1. Console do Firebase → **App Check** → aba **Apps** → registrar o app web.
2. Escolher **reCAPTCHA v3** e copiar a *site key*.
3. Pôr em `.env.local` e nas variáveis de ambiente da Vercel:
   ```
   EXPO_PUBLIC_RECAPTCHA_SITE_KEY=<a site key>
   ```
4. Publicar (`npm run build:web` + deploy) e conferir no Console → App Check →
   **Métricas** se as requisições estão chegando como verificadas.
5. **Só depois que as métricas mostrarem tráfego verificado**, ligar o
   *enforcement* em Firestore. Ligar antes derruba o app.

Para build nativa (iOS/Android), o provider é outro — App Attest (iOS) e
Play Integrity (Android). Fica para quando houver build nas lojas.

---

## Outras medidas já aplicadas

- **`public/robots.txt`** — `Disallow: /` para tudo.
- **`<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">`**
  em `app/+html.tsx`, para quem chega por link direto.

---

## Tarefas do checklist que não se aplicam a este repositório

| Tarefa | Situação |
|---|---|
| 4 — "revisar Cloud Functions (`scanPriceLabel`, `searchItemPrices`)" | **Não existe pasta `functions/`.** O projeto não tem nenhuma Cloud Function. `scanPriceLabel` nunca existiu; `searchItemPrices` foi só uma proposta num plano anterior e não foi implementada. |
| 5 — rate limiting nas Functions | Mesma coisa: não há o que limitar. |
| 8 / 16 — telas de Ranking e Apostas | **Não existem.** Há tipos `Aposta` e `RankingEntry` em `types/database.ts`, mas nenhuma tela os usa. |
| 16 — "scanner de preço (fluxo completo)" | Não existe scanner no app. |

Quando essas partes existirem, a exigência de `context.auth != null` e o rate
limiting valem — e aí este documento deve ser atualizado.

---

## Prioridade do que falta, em ordem

1. **Ligar o App Check** (passo a passo acima). É o maior ganho por hora de
   trabalho, e o código do cliente já está pronto.
2. **Conta Firebase por pessoa.** Destrava privacidade real entre perfis e a
   validação de PIN no servidor. É o item estrutural.
3. **Regra de leitura por dono**, que só faz sentido depois do item 2.
