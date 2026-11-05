# VanControl — painel do estudante

## Executar

A stack foi preservada: Expo SDK 54, React Native, Expo Router, TypeScript,
StyleSheet, Ionicons e expo-linear-gradient. Nenhuma dependência foi adicionada.

```bash
npm install
# Copie .env.example para .env.local e configure sua API.
npm run web
```

No PowerShell: `Copy-Item .env.example .env.local`.
Para usar a API do Render já referenciada no projeto, configure
`EXPO_PUBLIC_API_URL=https://projeto-integrador-3-yazx.onrender.com`.
No deploy, defina essa variável antes do build. Em um celular físico,
localhost aponta para o próprio celular: use o endereço acessível da API.

## Arquivos alterados e adicionados

- `components/DashboardPassageiro.tsx`: painel responsivo, seleção explícita de
  viagem de hoje, acesso rápido, pagamentos existentes e instituição do aluno.
- `components/transport/JourneyPanel.tsx`: presença, localização, ocupação e
  linha do tempo com estados percorrido/próxima parada/aguardando.
- `components/transport/primitives.tsx`: cards com bordas em gradiente,
  glassmorphism web, botões com movimento sutil de ponteiro, hover e toque,
  foco por teclado, entrada suave e radar com respeito a movimento reduzido.
- `hooks/useTransport.ts`: presença por usuário/viagem/data local,
  salvamento otimista com rollback, atualização a cada 15 segundos,
  cancelamento ao desmontar e proteção contra respostas anteriores à escolha.
- `services/transport.ts`: contrato opcional, timeout, validação de sinal e lotação.
- `services/api.ts`: URL configurável e timeout de 15 segundos nas chamadas existentes.
- `app/(main)/_layout.tsx`: barra escura, destinos por perfil e remoção do registro
  de `viagens`, que não tem página neste ZIP. As demais rotas foram preservadas.
- `app.json`: favicon usa o logo existente; o favicon anterior não veio no ZIP.
- `.env.example`, `scripts/test-transport.cjs`, scripts de validação em `package.json`.

A nova interface se concentra no painel do estudante e na barra compartilhada.
As telas existentes de administração, motorista, cadastro e login mantêm seus
componentes e fluxos. Os atalhos de pagamentos/viagens sem páginas no ZIP foram
substituídos no painel do aluno por informações e controles na própria tela.

## O que funciona agora

O perfil, os pagamentos e a lista de viagens continuam usando os serviços
existentes. A seleção de viagem é manual: a interface não presume que a primeira
viagem da lista pertence ao aluno. Viagens canceladas, concluídas ou de outro dia
não aparecem na seleção de hoje. A lista espera os campos existentes `codigo`,
`dataViagem` e `status`; `rota.destino`/`destino` são opcionais.

Sem a integração abaixo, “Eu vou hoje”/“Não vou hoje” salva a preferência no
AsyncStorage, separada por aluno, viagem e data. O texto informa explicitamente
que ela NÃO foi enviada ao motorista. Isso não reserva assento nem altera lotação.
A mudança de dia remove a seleção antiga. Nenhuma viagem, localização, parada,
lotação ou pagamento fictício foi adicionado ao fluxo de produção.

## Integração de acompanhamento — backend ainda necessário

O ZIP não contém o backend nem endpoints de presença, GPS, ocupação ou paradas.
O contrato abaixo é novo e proposto; não é uma API confirmada no servidor atual.
Somente depois de implementá-lo, configure `EXPO_PUBLIC_TRANSPORT_API_URL`.
O servidor deve autorizar o aluno para a viagem e obter sua identidade do JWT,
nunca confiar em um CPF enviado pelo cliente. Ambas as chamadas levam
`Authorization: Bearer <token>`.

### GET /viagens/:codigo/acompanhamento?data=YYYY-MM-DD

Retorna 200 com este formato (valores apenas ilustrativos do contrato):

```json
{
  "presenca": "VOU",
  "ocupacao": { "embarcados": 12, "capacidade": 15 },
  "localizacao": {
    "latitude": -23.5,
    "longitude": -47.4,
    "atualizadoEm": "2026-11-04T21:30:00-03:00"
  },
  "paradas": [
    { "id": "1", "nome": "Terminal", "horario": "18:00", "estado": "CONCLUIDA" },
    { "id": "2", "nome": "Ponto de embarque", "horario": "18:10", "estado": "PROXIMA" },
    { "id": "3", "nome": "Universidade", "horario": "19:00", "estado": "PENDENTE" }
  ]
}
```

`presenca`: `VOU`, `NAO_VOU` ou `null`. `ocupacao` e `localizacao` podem ser `null`.
`paradas`: array na ordem do trajeto; use `[]` se desconhecido. Horário é opcional.
Timestamp deve conter fuso horário. Sinal com mais de 90 segundos deixa de pulsar;
um erro de consulta também desativa o radar. A ocupação conta pessoas embarcadas,
não confirmações. Consulta a cada 15 segundos não equivale a WebSocket/GPS contínuo.
O backend precisa fornecer/receber a telemetria real do motorista.

### PUT /viagens/:codigo/presenca

Corpo: `{ "data": "2026-11-04", "presenca": "VOU" }`.
Retorne 204 (ou 200 com JSON) somente depois de persistir. A operação deve ser
idempotente por passageiro autenticado/viagem/data. Falhas HTTP desfazem a escolha
visual e exibem uma mensagem de nova tentativa. GET deve refletir a gravação.

## CORS e deploy

A alteração de frontend NÃO resolve o erro de CORS do backend mostrado na conversa.
Configure a origem exata da Vercel, resposta ao preflight OPTIONS e os métodos e
cabeçalhos necessários, incluindo Authorization e Content-Type. Não use `no-cors`.
Nunca coloque segredos em variáveis EXPO_PUBLIC_: são incluídas no bundle público.

## Validação

```bash
npm run typecheck
npm run test:transport
npx expo export --platform web
```

Os testes verificam sinal recente/expirado/inválido, ocupação ausente/zero/lotada,
data local, token/corpo da presença, resposta 204, falhas e cancelamento.
TypeScript e ESLint dos arquivos de implementação alterados foram verificados.
A exportação web foi gerada. Não houve validação visual em navegador ou dispositivo
neste ambiente, nem teste ponta a ponta contra o backend autenticado.

Antes de publicar, validar em 360px, 768px e 1440px: selecionar viagem, alternar
presença, recarregar (persistência), mudar de usuário, navegar por teclado e usar
movimento reduzido. Com a integração ativa: simular HTTP 500 ao salvar, GPS antigo,
lotação completa e perda de conexão. Verificar que a escolha anterior retorna em
caso de erro e que o radar não indica sinal ativo quando os dados estão antigos.

O ZIP original também referencia ícones Android e splash/icon ausentes. Esses
assets nativos não foram recriados; providencie-os antes de um build Android/iOS.
