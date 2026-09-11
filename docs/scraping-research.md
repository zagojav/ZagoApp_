# Fase 0 — De onde tirar preço de produto

Status: **pesquisa concluída, decisão pendente**
Data: 11/09/2026

---

## Resumo em uma linha

O plano original (raspar Rappi / Uber Eats / Cornershop) não vai ser
implementado. Existe uma fonte melhor para o objetivo real — preço de
verdade de supermercado, perto de casa — e existem duas peças que já dão
para construir hoje sem depender de fonte nenhuma.

---

## 1. O que NÃO vai ser construído, e por quê

A Fase 0 original pedia para detectar proteção anti-bot (Cloudflare,
captcha) em cada plataforma e então escolher a técnica com base no que
passa por ela — navegador headless justamente quando a requisição direta
é bloqueada. Isso é contornar controle de acesso.

Além disso:

- Rappi e Uber Eats proíbem coleta automatizada nos termos de uso. Não é
  zona cinzenta; está escrito.
- Endpoints internos de JSON não são contrato público. Eles mudam sem
  aviso, e um app de família quebrado toda semana não serve para nada.
- A Fase 5 (carrinho automatizado com sessão logada) é a mesma coisa com
  a senha de vocês no meio.

**Detalhe prático que pesa mais que o jurídico:** preço de Rappi/Uber Eats
não é o preço do mercado. É o preço com markup de delivery, que varia por
plataforma e por horário. Se a pergunta é "onde está mais barato", essa
fonte responde errado.

---

## 2. O que existe de fonte legítima

### 2.1 Menor Preço Brasil (SEFAZ / ENCAT) — a fonte certa

Serviço oficial do CONFAZ, desenvolvido pela Procergs/Sefaz-RS em parceria
com o ENCAT. Compara o preço do mesmo produto em estabelecimentos
próximos, alimentado em tempo real pelas **NFC-e e NF-e realmente
emitidas**. Desde 2021 é o aplicativo oficial único para consulta de
preço, cobrindo **14 estados**.

Por que é a fonte certa para este caso:

- É preço de gôndola real, do que outras pessoas de fato pagaram no caixa
  — não preço de vitrine nem preço de delivery.
- É geolocalizado: mostra o estabelecimento perto de você.
- Cobre Assaí, Atacadão, Carrefour e qualquer outro que emita NFC-e, que
  é exatamente a lista que interessa.
- É um serviço público, criado com esse propósito.

**Problema:** não achei documentação pública de API para desenvolvedor.
Existe o portal e existe o app, mas nenhum endpoint documentado e aberto.

**Como resolver:** pedir acesso. O caminho é a SEFAZ do estado de vocês
(ou o ENCAT, que coordena o programa nacional). Vários estados publicam
dados de NFC-e em portal de dados abertos com licença explícita — vale
checar o portal de dados abertos do estado antes de abrir chamado.

O que **não** vamos fazer: raspar o portal do Menor Preço por trás. Trocar
o alvo do scraping não muda a natureza da coisa.

> ⚠️ **Isso depende do estado.** O Menor Preço Brasil cobre 14 dos 27
> estados. Se o estado de vocês não estiver na lista, essa rota morre e
> sobram as opções 2.3 e 2.4.

### 2.2 Open Food Facts — identificação de produto

Base aberta de produtos, consultada por código de barras.

- `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`
- Gratuita, sem limite para uso razoável
- Licença ODbL — exige **atribuição** e é *share-alike*
- Exige **User-Agent próprio** identificando o app (é basicamente toda a
  política de rate limit deles)

Dá: nome, marca, tamanho/peso da embalagem, imagem. **Não dá preço.**

Serve para: você escanear o código de barras e o app já preencher "Arroz
Tio João 5kg" sem digitar, e — mais importante — guardar o **GTIN**, que é
a chave para casar o item com qualquer fonte de preço depois.

Sobre o share-alike: ele só morde se vocês **publicarem** uma base
derivada. App de família para uso próprio não dispara isso. Atribuição
continua valendo.

### 2.3 Histórico de preço da própria família — funciona hoje

Vocês compram toda semana. Cada compra é um dado de preço real.

O app registra: produto, mercado, preço, data. Depois de um mês de uso,
ele já sabe que arroz no Assaí saiu R$ 24,90 em agosto e R$ 26,10 em
setembro, e que no Atacadão estava R$ 25,50 — e consegue dizer "esse item
costuma sair mais barato no Assaí" sem consultar ninguém.

- Zero dependência externa, zero risco, zero manutenção
- É o dado mais preciso possível: é o que **vocês** pagam, na **sua** loja
- Melhora sozinho com o uso
- Combina bem com o leitor de código de barras (2.2): escaneia, digita o
  preço, pronto

Limitação honesta: não descobre preço de item que vocês nunca compraram.

### 2.4 Deep link de busca — funciona hoje, e mata a Fase 2

**Esta é a descoberta mais útil da Fase 0.**

A Fase 4 (handoff) foi escrita como se dependesse da Fase 2 (scraping),
porque ela usava `itemPrices.productUrl` — o link direto do produto, que
só existia se alguém raspasse a plataforma.

Mas o handoff não precisa do link do produto. Precisa do link da **busca**:

```
https://www.rappi.com.br/search?term=arroz+tio+joao
```

O usuário toca no item no ZagoApp → abre o app do Rappi já com a busca
feita → toca em adicionar. São dois toques em vez de um, e não precisa
digitar nada.

Ou seja: **a Fase 4 inteira dá para construir sem uma linha de scraping**,
e entrega quase todo o valor prático que o plano original queria.

### 2.5 APIs de parceiro Rappi / Uber Eats

Existem, mas são voltadas para **lojistas** (quem vende na plataforma),
não para consumidor consultando preço. Exigem contrato comercial. Não é
caminho viável para um app de família.

---

## 3. Recomendação

Construir em três camadas, da mais sólida para a mais incerta:

| # | O quê | Depende de | Quando |
|---|---|---|---|
| 1 | Item com unidade, categoria e **GTIN**, leitor de código de barras, Open Food Facts preenchendo o nome | nada | agora |
| 2 | Histórico de preço por mercado + "onde costuma sair mais barato" | nada | agora |
| 3 | Agrupar por mercado + handoff por deep link de busca | nada | agora |
| 4 | Preço automático via Menor Preço Brasil | acesso concedido pela SEFAZ | depois da resposta |

As camadas 1–3 entregam o fluxo que vocês descreveram — cadastra, compara,
agrupa por mercado, abre o app do mercado item por item. A diferença é que
a comparação começa vindo do histórico de vocês em vez de vir de fora, e
vai ficando boa sozinha.

A camada 4 encaixa por cima sem refazer nada, desde que o GTIN esteja
sendo guardado desde o começo — por isso ele entra já na camada 1.

---

## 4. Nota de arquitetura (independente da decisão acima)

O plano propõe uma collection nova `shoppingItems`. Cuidado: já existem
**duas** formas do mesmo conceito no projeto —

- `types/database.ts` define `ShoppingListItem`
  (`product`, `quantity`, `category`, `checked`, `checkedBy`…)
- `app/listas/mercado.tsx` usa uma interface local `Item`
  (`name`, `quantity`, `category`, `collected`) e grava via
  `useShoppingList`, que salva um array inteiro dentro de **um único
  documento** em `shopping_lists/mercado`

Criar `shoppingItems` faria uma **terceira** forma. Recomendo estender a
lista do Mercado que já existe, não paralelizar.

Um detalhe que vai doer se ficar como está: `useShoppingList` reescreve o
array inteiro a cada mudança. Com 40 itens e várias pessoas mexendo ao
mesmo tempo no mercado, duas pessoas marcando itens juntas sobrescrevem
uma à outra. Se a lista vai crescer para esse tamanho, vale migrar para
uma subcollection com um documento por item.

---

## Fontes

- [CONFAZ — lançamento do Menor Preço Brasil](https://www.confaz.fazenda.gov.br/noticias-do-confaz/confaz-lanca-aplicativo-menor-preco-brasil-destinado-a-ajudar-o-cidadao-a-encontrar-os-melhores-valores-no-comercio)
- [SEFAZ-ES — Menor Preço Brasil como aplicativo oficial único](https://sefaz.es.gov.br/menor-preco-brasil-passa-ser-unico-aplicativo)
- [Menor Preço — Nota Paraná](https://menorpreco.notaparana.pr.gov.br/)
- [Menor Preço — Nota Fiscal Gaúcha (SEFAZ-RS)](https://nfg.sefaz.rs.gov.br/site/MenorPreco.aspx)
- [SEFAZ-SC — Menor Preço Brasil](https://www.sef.sc.gov.br/servicos/instalar-o-aplicativo-menor-preco-brasil)
- [Open Food Facts — Data, API and SDKs](https://world.openfoodfacts.org/data)
- [Open Food Facts — documentação da API](https://openfoodfacts.github.io/openfoodfacts-server/api/)
- [Open Food Facts — condições de uso da API](https://forum.openfoodfacts.org/t/conditions-to-use-the-open-food-facts-api/443)
