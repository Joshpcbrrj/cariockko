# Cariockko

**🌍 Aprenda inglês conversando.** O Cariockko é uma aplicação de código aberto para praticar conversação, compreensão oral e pronúncia em inglês, com apoio em português brasileiro.

[English version](README.en.md)

![Tela inicial do Cariockko](docs/screenshots/01-home-level-selection.png)

## Índice

- [O que é o Cariockko](#o-que-é-o-cariockko)
- [Principais recursos](#principais-recursos)
- [Capturas de tela](#capturas-de-tela)
- [Requisitos](#requisitos)
- [Instalação rápida](#instalação-rápida)
- [Provedores de IA: nuvem e local](#provedores-de-ia-nuvem-e-local)
- [Instalador do Windows](#instalador-do-windows)
- [Como funciona](#como-funciona)
- [Arquitetura](#arquitetura)
- [API](#api)
- [Testes e integração contínua](#testes-e-integração-contínua)
- [Desenvolvimento](#desenvolvimento)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Solução de problemas](#solução-de-problemas)
- [Créditos e origem](#créditos-e-origem)
- [Diferenças em relação ao original](#diferenças-em-relação-ao-original)

## O que é o Cariockko

O Cariockko ajuda estudantes brasileiros a praticar inglês em um ambiente acolhedor, sem necessidade de conta. A pessoa cria lições por tema e nível, participa de diálogos interativos, ouve as falas, consulta traduções e recebe feedback sobre sua produção oral em português.

As lições são criadas sob demanda por um assistente de IA. Elas não são geradas automaticamente na primeira inicialização. O app oferece três níveis:

- **Iniciante:** vocabulário essencial e diálogos simples.
- **Intermediário:** situações do cotidiano e frases mais longas.
- **Avançado:** discussões complexas e expressão mais natural.

Use a opção **Tema** na navegação para alternar entre modo claro e escuro. A escolha fica salva neste navegador; na primeira visita, o app acompanha a preferência de aparência do sistema.

## Principais recursos

- 🧠 Criação guiada ou rápida de planos de lições com um assistente de IA.
- 📝 Revisão do plano antes de iniciar a geração.
- 💬 Geração de diálogos com falas em inglês e tradução em português.
- 📈 Acompanhamento do progresso em tempo real e possibilidade de retomar uma geração.
- 🔄 Nova tentativa apenas para as lições que falharam; as concluídas são preservadas.
- 🎧 Player de diálogo com tradução, áudio de referência e gravação da fala do estudante.
- 🎙️ Avaliação da fala com transcrição e feedback em português.
- ☁️ Escolha global entre OpenAI na nuvem e IA local com Ollama e serviços locais de áudio.
- 📄 Exportação de uma lição completa em PDF compatível com o **Projeto Palavras**.
- 📱 Interface responsiva, sem conta obrigatória.
- 🌙 Modo claro e escuro, com preferência salva no navegador.

## Capturas de tela

### Início e seleção de nível

Visão geral da biblioteca e acesso à criação de lições.

![Página inicial com seleção de níveis](docs/screenshots/01-home-level-selection.png)

### Biblioteca de lições

As lições criadas ficam organizadas por nível.

![Biblioteca de lições para o nível iniciante](docs/screenshots/02-lessons-list.png)

### Player da lição e exportação em PDF

O player apresenta a fala atual e os controles de prática. O botão fixo permite exportar o diálogo e sua tradução para o Projeto Palavras.

![Player de lição com botão para exportar PDF](docs/screenshots/03-lesson-player.png)

### Criação de lições

Comece com um plano sugerido ou personalize a criação com o assistente.

![Tela de criação de lições](docs/screenshots/04-create-lessons.png)

### Seleção do provedor de IA

Confira a disponibilidade dos serviços locais e escolha o provedor para esta instalação.

![Configurações de provedor de IA](docs/screenshots/05-ai-settings.png)

### Modo escuro

Alterne o tema pela opção **Tema** na navegação. A preferência fica salva no navegador.

![Player de lição no modo escuro](docs/screenshots/06-dark-mode.png)

> As capturas são imagens da interface com conteúdo de demonstração e dados simulados; elas não representam a disponibilidade de serviços de IA.

## Requisitos

- Windows, macOS ou Linux.
- Docker Desktop ou Docker Engine com Docker Compose v2.
- Para o modo OpenAI: uma chave de API válida e acesso à internet.
- Para o modo local: Ollama com o modelo configurado, além de serviços locais compatíveis de transcrição de áudio (STT) e síntese de voz (TTS).
- Para desenvolver/testar: Node.js 22 ou versão compatível com os projetos.

## Instalação rápida

Com o Docker instalado e aberto, um único comando baixa a última versão publicada, cria a configuração e abre o app no navegador.

**Windows** (no PowerShell):

```powershell
irm https://github.com/Joshpcbrrj/cariockko/releases/latest/download/install.ps1 | iex
```

**macOS e Linux** (no Terminal):

```bash
curl -fsSL https://github.com/Joshpcbrrj/cariockko/releases/latest/download/install.sh | bash
```

O instalador:

1. confere se o Docker está instalado e em execução;
2. baixa a [última versão publicada](https://github.com/Joshpcbrrj/cariockko/releases/latest) do Cariockko;
3. cria o `.env` com senhas aleatórias para o banco e o armazenamento;
4. pede a chave da OpenAI sem exibi-la na tela. Se você pressionar Enter sem digitar nada, ele verifica se a [IA local](#ia-local-com-ollama) está pronta e usa esse modo;
5. inicia os serviços e abre [http://localhost:3000](http://localhost:3000).

| Sistema | Pasta de instalação |
|---|---|
| Windows | `%LOCALAPPDATA%\Programs\Cariockko` |
| macOS e Linux | `~/cariockko` |

**Atualizar:** execute o mesmo comando novamente. O código é substituído pela versão mais recente; o `.env` e os dados (lições, áudios e progresso) são mantidos.

**Desinstalar:** o instalador pergunta se os dados também devem ser apagados.

```powershell
# Windows
& ([scriptblock]::Create((irm https://github.com/Joshpcbrrj/cariockko/releases/latest/download/install.ps1))) -Uninstall
```

```bash
# macOS e Linux
curl -fsSL https://github.com/Joshpcbrrj/cariockko/releases/latest/download/install.sh | bash -s -- --uninstall
```

<details>
<summary>Opções avançadas do instalador</summary>

Defina estas variáveis de ambiente antes de executar o comando:

| Variável | Efeito |
|---|---|
| `CARIOCKKO_DIR` | Instala em outra pasta |
| `CARIOCKKO_VERSION` | Instala uma versão específica, por exemplo `v0.2.0` |
| `OPENAI_API_KEY` | Usa esta chave sem perguntar |
| `CARIOCKKO_AI_PROVIDER=ollama` | Escolhe a IA local sem perguntar |
| `CARIOCKKO_DELETE_DATA=1` | Na desinstalação, apaga os dados sem perguntar (`0` mantém) |
| `CARIOCKKO_NO_BROWSER=1` | Não abre o navegador ao final |

Exemplo no macOS e Linux: `curl -fsSL .../install.sh | CARIOCKKO_DIR=~/apps/cariockko bash`. No Windows: `$env:CARIOCKKO_DIR = "D:\Apps\Cariockko"` antes do comando.

</details>

Prefere ler o script antes de executá-lo? Ele está em [scripts/install.sh](scripts/install.sh) e [scripts/install.ps1](scripts/install.ps1). Também é possível baixá-lo primeiro e executar depois:

```bash
curl -fsSLO https://github.com/Joshpcbrrj/cariockko/releases/latest/download/install.sh
less install.sh
bash install.sh
```

O instalador não inclui o Docker, o Ollama nem modelos de IA.

### Instalação manual

Para desenvolver ou instalar sem o script:

1. Clone o repositório e entre na pasta:

   ```bash
   git clone https://github.com/Joshpcbrrj/cariockko.git
   cd cariockko
   ```

2. Crie o arquivo de configuração:

   ```bash
   cp .env.example .env
   ```

   No Windows PowerShell, use:

   ```powershell
   Copy-Item .env.example .env
   ```

   Se o app ficar acessível a outras pessoas, troque `POSTGRES_PASSWORD` (e a senha dentro de `DATABASE_URL`) e `MINIO_ROOT_PASSWORD` antes de iniciar pela primeira vez.

3. Configure o provedor desejado conforme a seção [Provedores de IA](#provedores-de-ia-nuvem-e-local).
4. Inicie os serviços:

   ```bash
   docker compose up -d --build
   ```

   Se o comando `make` estiver instalado, também é possível executar `make start`.

5. Abra [http://localhost:3000](http://localhost:3000).

O banco começa sem lições. Abra **Criar** para gerar as primeiras lições. A primeira geração com OpenAI ou Ollama necessita que o provedor esteja configurado e acessível.

### Parar e verificar

```bash
docker compose ps
docker compose logs -f
docker compose down
```

Verificações de saúde da API:

```text
http://localhost:3001/health       saúde básica
http://localhost:3001/health/live  processo ativo
http://localhost:3001/health/ready banco acessível
```

`docker compose down` preserva os volumes de dados. **`docker compose down -v` remove volumes e apaga os dados locais.**

## Provedores de IA: nuvem e local

O provedor é selecionado na tela **Ajustes** e vale para toda a instalação do Cariockko.

### OpenAI na nuvem

Defina uma chave real no `.env`:

```dotenv
AI_PROVIDER=openai
OPENAI_API_KEY=sua-chave
OPENAI_MODEL_CHAT=gpt-4o-mini
```

Reinicie ou recrie a API após alterar variáveis:

```bash
docker compose up -d --build api
```

O provedor OpenAI requer internet e uma chave válida. A chave é usada no backend e não deve ser colocada no código do navegador nem compartilhada.

### IA local com Ollama

O uso local para texto e áudio requer **os três serviços** abaixo:

1. **Ollama** para conversa, planejamento e geração de lições.
2. Um endpoint local compatível com a API de transcrição OpenAI para STT.
3. Um endpoint local compatível com a API de síntese de fala OpenAI para TTS.

Exemplo de configuração no `.env`:

```dotenv
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=llama3.1
LOCAL_STT_BASE_URL=http://host.docker.internal:8000/v1
LOCAL_STT_MODEL=Systran/faster-whisper-small
LOCAL_TTS_BASE_URL=http://host.docker.internal:8880/v1
LOCAL_TTS_MODEL=kokoro
LOCAL_TTS_VOICE=af_heart
```

Baixe o modelo configurado no Ollama antes de usar, por exemplo:

```bash
ollama pull llama3.1
```

No Linux, o Ollama aceita por padrão apenas conexões da própria máquina, e o contêiner da API não consegue alcançá-lo. Defina `OLLAMA_HOST=0.0.0.0` no serviço do Ollama (por exemplo, com `sudo systemctl edit ollama`) e reinicie-o.

Os endereços de exemplo pressupõem que os serviços de áudio aceitam as rotas compatíveis `/v1/models`, `/v1/audio/transcriptions` e `/v1/audio/speech`. Esses servidores e modelos locais **não estão incluídos** no Cariockko nem no instalador.

Em **Ajustes**, o app verifica o modelo Ollama, o STT e o TTS e só habilita a seleção local quando todos responderem. É possível rodar as funções de IA sem enviar conteúdo à OpenAI nesse modo, mas é necessário instalar os modelos e serviços antes. O download inicial dos modelos depende de internet; depois disso, o processamento pode ocorrer localmente, desde que os serviços estejam ligados. Docker, banco de dados e MinIO também precisam estar em execução.

## Instalador do Windows

Além da [instalação rápida](#instalação-rápida), há um instalador `.exe` tradicional.

O script [scripts/install-windows.ps1](scripts/install-windows.ps1) verifica o Docker Desktop, cria o `.env` com senhas aleatórias, solicita a chave OpenAI de forma protegida quando aplicável, executa `docker compose up -d --build` e abre o app no navegador. Ele é usado tanto pelo instalador `.exe` quanto pelo [scripts/install.ps1](scripts/install.ps1), que baixa a última versão publicada e o executa.

O arquivo [installer/Cariockko.iss](installer/Cariockko.iss) é a receita do instalador `.exe` com atalhos para o Menu Iniciar e, opcionalmente, para a área de trabalho. Compile-a com o Inno Setup a partir da raiz do repositório. O executável compilado não é versionado; o instalador não inclui Docker Desktop, Ollama ou modelos de IA.

## Como funciona

### Criar lições

1. Na página **Criar**, escolha **Gerar lições sugeridas** ou **Criar com minhas preferências**.
2. Converse com o assistente para informar tema, nível e quantidade.
3. Revise ou ajuste o plano proposto.
4. Confirme a geração e acompanhe o progresso em tempo real.
5. Se alguma lição falhar, tente gerá-la novamente sem repetir as que concluíram.
6. Encontre o material na biblioteca do nível correspondente.

O assistente redireciona solicitações fora do objetivo de criação de lições. A sessão de conversa e o progresso da geração são persistidos para permitir retomada.

### Praticar uma lição

O estudante acompanha um diálogo com dois personagens, ouve a fala de referência, consulta a tradução e grava sua resposta. O tutor de fala transcreve e avalia a resposta, com feedback em português.

O navegador exige um contexto seguro para usar o microfone: `localhost` funciona localmente; para acessar pelo celular em HTTP na rede local, use HTTPS. O comando `make tunnel` disponibiliza um túnel HTTPS via localhost.run para desenvolvimento; não o trate como configuração de produção.

### Exportar para o Projeto Palavras

Na página da lição, use **Exportar lição em PDF para projeto palavras**. O PDF inclui o diálogo em inglês, as falas identificadas como Aimee e Todd e a tradução em português. Também incorpora o pacote `aprendendo-palavras:v3` nos metadados PDF, para que o importador do Projeto Palavras reconheça o material como tipo `texto`.

## Arquitetura

```text
Navegador
   │
   ▼
Next.js (web :3000) ── proxy same-origin ──► Express (api :3001)
                                                ├── PostgreSQL (:5432)
                                                ├── MinIO/S3 (:9000)
                                                └── Provedor de IA
                                                     ├── OpenAI
                                                     └── Ollama + STT/TTS local
```

| Serviço | Tecnologia | Uso |
|---|---|---|
| `web` | Next.js 15, React 19, Tailwind CSS 4 | Interface e proxy same-origin para API/áudio |
| `api` | Express, TypeScript, LangChain e SDK OpenAI | Rotas, agentes, geração e avaliação de fala |
| `db` | PostgreSQL 15 | Lições, diálogos, progresso, configurações e trabalhos |
| `minio` | Armazenamento compatível com S3 | Arquivos de áudio |

O produtor de conteúdo envia eventos de progresso por Server-Sent Events (SSE). O trabalho de geração é controlado pela API e seu estado é persistido para recuperação. O identificador de sessão é mantido pelo navegador; não há contas de usuário.

## API

A aplicação web usa a API Express. Principais rotas:

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health`, `/health/live`, `/health/ready` | Saúde, liveness e disponibilidade do banco |
| `GET` | `/api/lessons` | Lista lições; aceita `?level=beginner`, `intermediate` ou `advanced` |
| `GET` | `/api/lessons/:id` | Detalha uma lição e suas falas |
| `POST` | `/api/content-producer/chat` | Envia mensagem para o assistente |
| `GET` / `DELETE` | `/api/content-producer/session/:sessionId` | Lê ou limpa a sessão |
| `POST` | `/api/content-producer/generate` | Inicia um trabalho de geração |
| `GET` | `/api/content-producer/jobs/recent` | Recupera o último trabalho de uma sessão |
| `GET` | `/api/content-producer/jobs/:jobId` | Consulta o estado do trabalho |
| `GET` | `/api/content-producer/jobs/:jobId/events` | Recebe eventos SSE de progresso |
| `POST` | `/api/content-producer/jobs/:jobId/retry` | Tenta novamente uma lição com falha |
| `POST` | `/api/content-producer/jobs/:jobId/cancel` | Cancela o trabalho |
| `POST` | `/api/speaking-tutor` | Envia áudio para transcrição e avaliação |
| `GET` / `POST` | `/api/progress/:sessionId`, `/api/progress` | Consulta ou registra progresso |
| `GET` / `PUT` | `/api/settings/ai` | Consulta ou altera o provedor de IA |

Consulte [docs/API.md](docs/API.md) para detalhes de payloads e respostas.

## Configuração

As configurações de desenvolvimento estão documentadas em [.env.example](.env.example). Variáveis principais:

| Variável | Padrão / exemplo | Descrição |
|---|---|---|
| `AI_PROVIDER` | `openai` | Provedor inicial: `openai` ou `ollama` |
| `OPENAI_API_KEY` | — | Chave OpenAI; necessária para o modo nuvem |
| `OPENAI_MODEL_CHAT` | `gpt-4o-mini` | Modelo de chat OpenAI |
| `OLLAMA_BASE_URL` | `http://host.docker.internal:11434` | Endereço do Ollama |
| `OLLAMA_MODEL` | `llama3.1` | Modelo local instalado |
| `LOCAL_STT_BASE_URL` | `http://host.docker.internal:8000/v1` | Endpoint local de transcrição |
| `LOCAL_STT_MODEL` | `Systran/faster-whisper-small` | Modelo local de STT |
| `LOCAL_TTS_BASE_URL` | `http://host.docker.internal:8880/v1` | Endpoint local de voz |
| `LOCAL_TTS_MODEL` | `kokoro` | Modelo local de TTS |
| `LOCAL_TTS_VOICE` | `af_heart` | Voz local |
| `POSTGRES_DB` / `POSTGRES_PASSWORD` | `postgres` / `local-dev-password` | Banco da aplicação (o instalador gera uma senha aleatória) |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | `minioadmin` | Credenciais do MinIO (o instalador gera uma senha aleatória) |
| `MINIO_BUCKET` | `audio` | Bucket usado para áudio |
| `GEN_CONCURRENCY` | `3` | Concorrência de geração |

Não publique o `.env` nem credenciais reais. Os valores do `.env.example` são apenas para desenvolvimento local.

## Testes e integração contínua

Os testes ficam próximos ao código. As suítes incluem testes unitários, testes de integração da API com Supertest e testes de interface com Vitest/Testing Library. Os testes E2E com Playwright usam uma API simulada e não precisam de Docker, banco ou credenciais de IA.

Instale as dependências em cada pacote:

```bash
cd api
npm ci
cd ../web
npm ci
```

Na raiz do repositório:

```bash
npm test              # testes unitários, de componentes e integração
npm run typecheck     # checagem de tipos na API e web
npm run build:api     # compila a API
npm run test:e2e      # E2E no Chromium
npm run test:ci       # executa a sequência completa
```

Na primeira execução E2E local, instale o navegador:

```bash
cd web
npx playwright install chromium
```

O workflow [.github/workflows/ci.yml](.github/workflows/ci.yml) executa verificações em pull requests e em pushes para `main`/`master`. Relatórios do Playwright são anexados quando houver falhas. O mesmo workflow também testa o instalador de macOS e Linux de ponta a ponta: instala com Docker, verifica o app, atualiza e desinstala.

### Publicar uma nova versão

O comando de instalação sempre baixa a **última versão publicada**, não o código mais recente do `main`. Para publicar uma versão:

1. Atualize `AppVersion` em [installer/Cariockko.iss](installer/Cariockko.iss) e `version` no [package.json](package.json) da raiz.
2. Faça o commit e envie para o `main`.
3. Crie e envie a tag da versão:

   ```bash
   git tag v0.3.0
   git push origin v0.3.0
   ```

O workflow [.github/workflows/release.yml](.github/workflows/release.yml) roda todas as verificações e, se passarem, publica a release com notas geradas automaticamente e os instaladores anexados. Se alguma verificação falhar, nada é publicado e quem instala continua recebendo a versão anterior.

As capturas de tela do README podem ser atualizadas com o teste de documentação:

```powershell
cd web
$env:UPDATE_DOC_SCREENSHOTS = "1"
npm run test:e2e -- --grep "capture documentation screenshots"
Remove-Item Env:UPDATE_DOC_SCREENSHOTS
```

## Desenvolvimento

Para executar os testes, são necessárias dependências instaladas nos diretórios `api` e `web`. Para iniciar os serviços sem Docker, use Docker para banco/MinIO e rode API e web em terminais separados:

```bash
# Terminal 1: banco e armazenamento
docker compose up -d db minio minio-init

# Terminal 2: API
cd api
npm ci
npm run dev

# Terminal 3: web
cd web
npm ci
npm run dev
```

Os scripts de desenvolvimento usam por padrão `localhost` para os serviços; ajuste `DATABASE_URL`, endpoints do MinIO e variáveis de proxy conforme o ambiente.

| Comando | Ação |
|---|---|
| `make start` | Inicia a stack Docker em segundo plano e compila imagens |
| `make stop` | Para serviços e preserva volumes |
| `make restart` | Reinicia os serviços |
| `make status` | Mostra estado dos contêineres |
| `make logs` | Acompanha logs |
| `make tunnel` | Cria túnel HTTPS de desenvolvimento para acesso móvel |
| `make destroy` | Remove serviços, volumes e imagens; **apaga os dados** |

Geração manual de conteúdo para demonstração continua disponível:

```bash
docker compose run --rm api npm run seed-lessons
```

## Estrutura do repositório

```text
.
├── .github/workflows/           # CI e publicação de releases no GitHub Actions
├── api/
│   ├── src/agents/              # Produtor, gerador e tutor de fala
│   ├── src/lib/                 # Banco, IA, armazenamento, SSE e fila
│   ├── src/routes/              # Endpoints Express
│   ├── src/app.ts               # Montagem testável da aplicação Express
│   └── src/*.spec.ts            # Testes unitários e de integração
├── db/                          # Inicialização PostgreSQL
├── docs/screenshots/            # Capturas usadas nesta documentação
├── installer/                   # Receita do Inno Setup
├── scripts/                     # Instaladores (Windows, macOS e Linux)
├── web/
│   ├── src/app/                 # Páginas Next.js
│   ├── src/components/          # Componentes de interface
│   ├── src/lib/                 # Cliente API e exportação PDF
│   └── e2e/                     # Testes Playwright e API simulada
├── docker-compose.yml
├── README.md                    # Documentação em português
└── README.en.md                 # English documentation
```

## Solução de problemas

- **A aplicação não abre:** execute `docker compose ps` e `docker compose logs -f`; confirme se as portas `3000`, `3001`, `5432` e `9000` estão livres.
- **Erro de banco ou serviço indisponível:** consulte `http://localhost:3001/health/ready` e aguarde os health checks dos contêineres.
- **OpenAI não funciona:** confira se `OPENAI_API_KEY` contém uma chave válida e recrie o serviço API após atualizar o `.env`.
- **Ollama não aparece como disponível:** confirme modelo baixado, endereço acessível de dentro do Docker e respostas dos endpoints STT e TTS.
- **Microfone bloqueado no celular:** use HTTPS; HTTP com IP local normalmente não é um contexto seguro para captura de áudio.
- **E2E falha por navegador ausente:** execute `cd web && npx playwright install chromium`.
- **É necessário recomeçar o banco:** `docker compose down -v` remove os volumes locais e todos os dados persistidos.

## Documentação adicional

- [Referência da API](docs/API.md)
- [Guia do Content Producer](docs/GUIDES/content-producer.md)
- [English README](README.en.md)

## Créditos e origem

Este projeto é um fork do [Cariockko original](https://github.com/araujgom/cariockko), criado por [araujgom](https://github.com/araujgom). Agradecemos ao autor por disponibilizar o projeto original como código aberto, que serviu de base para este trabalho.

## Diferenças em relação ao original

Este fork acrescenta ao projeto original o uso de IA local com Ollama, uma página de ajustes, o modo escuro, um novo visual, a exportação de lições em PDF, a instalação com um comando no Windows, macOS e Linux, releases versionadas, testes E2E com CI e documentação em inglês.

Veja o detalhamento completo em [DIFERENCAS.md](DIFERENCAS.md).
