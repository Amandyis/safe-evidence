# Safe Evidence — Front-end

Portal web do **Safe Evidence**, sistema desenvolvido como Trabalho de Conclusão de Curso de Sistemas de Informação (UNIP) para apoiar vítimas de violência doméstica na guarda de evidências digitais.

Um dispositivo de captura (ESP32-CAM) grava vídeos quando é acionado. As gravações são enviadas ao back-end, que as guarda com garantia de integridade (hash SHA-256 e carimbo de tempo RFC 3161) e as encaminha para um serviço de Inteligência Artificial que identifica sinais de agressividade. Este front-end é o portal em que a vítima acessa e gerencia essas evidências.

## Funcionalidades

- **Acesso seguro:** cadastro com consentimento (LGPD), login com código de verificação por e-mail (MFA), recuperação de senha e encerramento da sessão por inatividade, com aviso antes de expirar.
- **Galeria de evidências:** lista paginada das gravações, com pesquisa, filtros por período e por status da análise e atualização do status em tempo real (SSE).
- **Detalhe da evidência:**
  - reprodução do vídeo por link temporário;
  - resultado da análise da IA e linha do tempo de agressividade;
  - metadados do arquivo, verificação de integridade (SHA-256) e carimbo de tempo;
  - downloads: vídeo, laudo em PDF com código de verificação, relatório em JSON e carimbo de tempo (`.tsr`);
  - exclusão da evidência, bloqueada quando há vínculo com processo judicial.
- **Perfil:** consulta e edição dos dados pessoais e do endereço, troca de senha, vínculo do dispositivo de captura e exclusão da conta. Alterações sensíveis pedem confirmação por código enviado por e-mail.
- **Manual de uso** dentro do próprio portal.
- **Layout responsivo**, do celular ao desktop.

## Tecnologias

- [Angular 21](https://angular.dev) com componentes standalone e signals
- [PrimeNG 21](https://primeng.org) e PrimeIcons
- [Tailwind CSS 4](https://tailwindcss.com)
- [Vitest](https://vitest.dev) para os testes unitários
- ESLint e Prettier para padronização do código

## Pré-requisitos

- **Node.js** 20.19 ou superior (recomendado: 22 LTS) e **npm**
- **Back-end do Safe Evidence** (`tcc-backend`) rodando em `http://localhost:8080`. O front não funciona sozinho: todas as telas dependem da API.
- Para rodar o back-end localmente: **Docker** (banco PostgreSQL) e, opcionalmente, o serviço de IA de teste (`npm run ia-mock`). Os detalhes estão no README do `tcc-backend`.

## Como rodar

### 1. Suba o back-end

Na pasta `tcc-backend`, com o `.env` configurado:

```bash
docker compose up -d    # banco PostgreSQL
npm run ia-mock         # serviço de IA de teste (em outro terminal)
npm start               # API em http://localhost:8080
```

No `.env` do back-end, `FRONT_URL` precisa conter `http://localhost:4200`; caso contrário o navegador bloqueia as requisições (CORS).

### 2. Instale as dependências do front

Na pasta deste projeto:

```bash
npm install
```

### 3. Inicie o servidor de desenvolvimento

```bash
npm start
```

Abra `http://localhost:4200`. A aplicação recarrega sozinha a cada alteração nos arquivos.

### 4. Primeiro acesso

1. Na tela de login, clique em **Primeiro acesso?** e crie uma conta.
2. Faça login com o e-mail e a senha cadastrados.
3. Informe o código de 6 dígitos enviado por e-mail. Se o back-end estiver sem SMTP configurado, o código aparece no terminal em que ele está rodando.
4. Em **Meu Perfil**, vincule o dispositivo de captura para que as gravações apareçam na galeria.

## Configuração

O endereço da API fica em `src/app/shared/constants/api.constants.ts`:

```ts
export const URL_BASE_API = 'http://localhost:8080/api'
```

Altere esse valor se o back-end rodar em outra porta ou em outra máquina.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm start` | Servidor de desenvolvimento em `http://localhost:4200` |
| `npm run build` | Build de produção em `dist/` |
| `npm run watch` | Build de desenvolvimento, refeito a cada alteração |
| `npm test` | Testes unitários com Vitest |
| `npm run lint` | Análise estática com ESLint |
| `npm run format` | Formata o código com Prettier |

## Testes

Os testes unitários cobrem os casos de teste definidos no TCC, como o bloqueio de login (CT07), a atualização de status em tempo real (CT08), a proteção das rotas e o encerramento de sessão (CT09), o cadastro (CT10) e a restrição de exclusão com processo judicial (CT11).

```bash
npm test
```

## Estrutura de pastas

```
src/
├── app/
│   ├── guards/          # proteção das rotas (área logada e visitante)
│   ├── interceptors/    # envio do token e tratamento de sessão expirada
│   ├── layouts/         # layout da área logada (menu lateral e cabeçalho)
│   ├── pages/           # telas: login, cadastro, início, detalhe, perfil e manual
│   ├── services/        # comunicação com a API e controle da sessão
│   └── shared/
│       ├── components/  # componentes reutilizáveis
│       ├── constants/   # endereço da API e listas fixas
│       ├── models/      # tipos dos dados da API e da aplicação
│       ├── utils/       # formatação, downloads e tratamento de erros
│       └── validators/  # validações de formulário (CPF, senha forte)
└── testing/             # apoio aos testes unitários
```

## Rotas

| Rota | Tela | Acesso |
| --- | --- | --- |
| `/login` | Login, MFA e recuperação de senha | Visitante |
| `/cadastro` | Cadastro | Visitante |
| `/inicio` | Galeria de evidências | Logado |
| `/evidencias/:idGravacao` | Detalhe da evidência | Logado |
| `/perfil` | Meu perfil | Logado |
| `/manual` | Manual de uso | Logado |
