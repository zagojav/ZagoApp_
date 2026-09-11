# QA — 11/09/2026

Build: `npx expo export --platform web` (OK) · `tsc --noEmit` (limpo) ·
`expo lint` (limpo).
Testado servindo o `dist/` em `localhost:4173`, numa coluna de 440px
(proporção de celular), contra o Firestore de produção.

---

## 🔴 O que estava apagando dados (corrigido)

### 1. "Minhas Tarefas" nunca foi salvo em lugar nenhum

A lista vivia num `useState` dentro da tela de perfil. Sem Firestore, sem
AsyncStorage, sem nada. Fechar o app, recarregar a página ou desmontar o
componente apagava tudo.

Não era intermitente: **perdia 100% das vezes, toda vez.** É quase certo que
foi isso que sumiu.

→ Agora em `personal_tasks` no Firestore (`hooks/usePersonalTasks.ts`).
→ **Verificado:** criei uma tarefa no perfil do Guilherme, recarreguei a
página, ela continuou lá. Depois apaguei.

### 2. Nos Lembretes, o "✓" era um apagar disfarçado

`useReminders` consultava `where('completed', '==', false)`. A caixinha ao
lado do lembrete chamava `completeReminder`, que marcava `completed: true` —
e o item **sumia da tela na hora**, sem confirmação, sem desfazer e sem
nenhum lugar onde reencontrá-lo. Pior: a caixinha já vinha desenhada com um
"✓" dentro, então parecia que o item estava concluído, não um botão.

O dado nunca foi apagado do Firestore. Ele ficou invisível.

→ A query não filtra mais. A tela tem uma seção **"Concluídos (N)"**, com
opção de reabrir, e apagar agora pede confirmação.
→ **Verificado:** no perfil do Guilherme apareceram **2 lembretes reais** que
tinham sumido — *"Cortar Cabelo"* (02/09) e *"Entrevista Go Further – Vila
Olímpia"* (03/09 às 09). Estão de volta e dá para reabrir os dois.

### 3. O calendário se apagava sozinho (corrida)

A tela tinha estes dois efeitos:

```js
useEffect(() => { carregar(chave).then(setEvents) }, []);   // carrega
useEffect(() => { salvar(chave, events) }, [events]);       // salva
```

Na montagem, `events` é `[]` — então o **segundo** efeito disparava na hora e
gravava `[]` por cima do que estava salvo, **antes** de o `carregar` ter
respondido. Normalmente o load chegava logo depois e restaurava. Se não
chegasse (rede lenta, app fechado nessa janela, erro na leitura), os eventos
iam embora de vez.

Somado a isso: os eventos só existiam **naquele aparelho**. AsyncStorage no
navegador é `localStorage` — não sincroniza entre celular e computador, não
tem backup, e some se limpar os dados do site.

→ Agora em `calendar_events` no Firestore (`hooks/useCalendarEvents.ts`), sem
o efeito de salvar. Migra o que estiver no aparelho na primeira abertura.

### 4. Listas de compras: duas pessoas juntas se sobrescreviam

`useShoppingList` guardava a lista inteira num array dentro de **um**
documento e reescrevia o array todo a cada mudança. Duas pessoas marcando
itens ao mesmo tempo no mercado: a última escrita ganhava, o trabalho da
outra sumia.

→ Agora é **um documento por item** em `shopping_lists/{lista}/items/`
(`hooks/useShoppingItems.ts`). Cada escrita toca só o próprio item.

---

## ✅ Migrações — como se comportam

As três são **idempotentes** (o id do documento novo vem do id antigo, então
dois aparelhos migrando juntos escrevem a mesma coisa) e **não apagam a
origem** — o dado antigo fica como backup.

| Origem | Destino | Backup |
|---|---|---|
| `shopping_lists/{lista}.items[]` | subcollection `items/` | array antigo fica no documento pai |
| `AsyncStorage calendario_{pessoa}` | `calendar_events` | AsyncStorage fica intacto |

> ⚠️ **A migração do calendário roda no aparelho que tem os dados.** Se a
> Amanda tem eventos no celular dela, precisa abrir o calendário **naquele
> celular** pelo menos uma vez. Abrir só no computador não traz nada — não
> há como o computador ver o `localStorage` do celular dela.

**Testado aqui:** nenhum erro no console, `migratedAt` gravado, listener
conectado. A lista do mercado no Firestore já estava vazia, então não houve
conversão real de itens para observar — vale conferir depois de abrir no
aparelho de vocês.

---

## ✅ Testado nesta rodada

| Tela | Resultado |
|---|---|
| Perfis (6) | Carregam, estatísticas corretas, estados de carregando/vazio |
| Tarefas pessoais | Criar → recarregar → persiste → apagar com confirmação ✓ |
| Lembretes | Pendentes e concluídos separados, reabrir funciona ✓ |
| Calendários (6) | Grade alinhada, paleta de cada perfil, estado vazio ✓ |
| Mercado | Estado vazio, filtros, validação de formulário ✓ |
| Rota inexistente | Tela 404 própria, com "Voltar para o início" ✓ |
| `robots.txt` + `noindex` | Presentes no `dist/` ✓ |
| `manifest.json` | Ícones 180/192/512 conferidos, todos no tamanho certo ✓ |

---

## 🟡 Aberto — precisa de você

### 1. As regras novas do Firestore NÃO foram publicadas

Reescrevi `firestore.rules`, mas **não rodei o deploy**. Publicar muda o
projeto de produção de vocês, e uma regra errada faz o app parar de salvar —
não é coisa para eu disparar sozinho de madrugada.

```bash
firebase emulators:start --only firestore   # testar antes
firebase deploy --only firestore:rules      # publicar
```

Depois de publicar, abra cada tela e **salve alguma coisa em cada uma**
(tarefa, lembrete, evento, item de mercado, anotação de pet, PIN em
Configurações). Se alguma escrita for recusada, o console do navegador mostra
`permission-denied` e é só me falar qual.

### 2. App Check continua desligado

O código do cliente está pronto e inerte até existir a chave. Passo a passo
em `docs/seguranca.md`. É o maior ganho de segurança por hora de trabalho.

### 3. Anotações de pet ainda usam array

`usePets.saveNotes` reescreve o array de anotações inteiro — mesmo problema
que a lista de compras tinha. O risco é bem menor (anotação de pet muda
raramente), mas existe. Apagar já pede confirmação; a migração para um
documento por anotação ficou de fora desta rodada.

### 4. Links de busca dos mercados não foram validados

`constants/markets.ts` tem os templates de busca de Assaí, Atacadão,
Carrefour, Pão de Açúcar e Tenda. Segui o padrão do VTEX, mas **não deu para
confirmar**: os sites respondem 403 a requisição automatizada.

Isso **não afeta o app** — lá o link é aberto pelo navegador da própria
pessoa, que não é bloqueada. Mas vale tocar uma vez em cada e, se algum abrir
na home em vez da busca, corrigir o `searchUrl` no arquivo (fazer a busca no
site, copiar a URL, trocar o termo por `{q}`).

### 5. Privacidade entre perfis é organizacional, não real

O app usa **uma sessão anônima compartilhada**. `request.auth.uid` é o
aparelho, não a pessoa — por isso a regra `uid == userId` do checklist não
pode ser escrita (o `userId` é `'amanda'`, o uid é um hash aleatório; nunca
bateriam, e o efeito seria trancar todo mundo para fora). Detalhes e caminho
de solução em `docs/seguranca.md`.

---

## ⚪ Itens do checklist que não se aplicam

| Tarefa | Situação |
|---|---|
| 1 — "regras estão como `allow read, write: if true`" | **Não estavam.** Estavam como `if request.auth != null`. A preocupação era válida por outro motivo (login anônimo aberto) — ver `docs/seguranca.md`. |
| 4 e 5 — Cloud Functions (`scanPriceLabel`, `searchItemPrices`), rate limiting | **Não existe pasta `functions/`.** O projeto não tem nenhuma Cloud Function. `scanPriceLabel` nunca existiu; `searchItemPrices` foi só proposta. |
| 8 e 16 — telas de Ranking e Apostas | **Não existem.** Há tipos em `types/database.ts`, mas nenhuma tela. |
| 16 — "scanner de preço (fluxo completo)" | Não existe scanner no app. |
| 15 — "3 warnings no `mercado.tsx`" | Havia 1, corrigido na rodada anterior. Lint está limpo. |
