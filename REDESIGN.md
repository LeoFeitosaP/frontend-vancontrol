# VanControl — Atelier Monochrome

## O que mudou
- Entrada: nova landing page editorial responsiva com preview visual da rota.
- Acesso: tela de login reconstruída, com autenticação pela API original.
- Painel Estudante: confirmação visual de presença, ETA com estado indisponível (sem simular GPS), timeline ilustrativa, pagamentos e links.
- Painel Administrador: estatísticas da API, visão operacional, atividades recentes e módulos de gestão.
- Painel Motorista: overview de viagens, frota e timeline preparatória.
- Navegação: sidebar em desktop (largura >= 950px) e tabbar neutra mobile.
- Perfil: redesenho completo com detalhes da conta e encerramento de sessão.
- Viagens e Pagamentos: telas adicionadas com listagem real por serviço existente, estados vazios e tratamento de erro.
- Demais telas de CRUD/listas existentes: remoção da paleta azul, superfícies neutralizadas e componentes mantidos para preservar as ações existentes.

## Limitações declaradas
- Confirmação de presença no dashboard é estado local à tela: API não possui endpoint para salvar/consultar presença.
- GPS/telemetria ao vivo, ETA, rota geográfica e lotação/avatares não são fornecidos pelos endpoints do ZIP e, portanto, não são falsificados.
- Gráficos com dados históricos reais dependem de dados temporais da API (o painel administrativo usa contagens, sem inventar séries históricas).
- As áreas legadas de gestão preservam o CRUD original com nova paleta; não foram reescritas integralmente.
- Biblioteca de ícones permanece @expo/vector-icons, existente no projeto; Lucide e Three.js/Recharts não foram adicionados. Em Expo React Native, utilizar bibliotecas web diretamente exigiria adaptação por plataforma.

## Como rodar
```bash
npm install
npx expo start --web
```
Para dispositivos físicos, ajuste `BASE_URL` em `services/api.ts` para o IP/hostname do backend acessível pela rede (a configuração herdada `localhost:8080` só funciona quando cliente e backend estão na mesma máquina).

## Verificações
- `tsc --noEmit` passou.
- `expo export --platform web` passou antes da última atualização de perfil (esta passou no TypeScript).
