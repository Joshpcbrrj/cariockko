# Diferenças em relação ao Cariockko original

Este repositório é um fork do [Cariockko original](https://github.com/araujgom/cariockko), criado por [araujgom](https://github.com/araujgom). Este documento lista o que mudou aqui em relação ao projeto original.

A comparação parte do commit `950e60d` do original (merge do PR #16, *interactive Content Producer*), que é a base deste fork.

[Voltar para o README](README.md)

## Resumo

| Área | Original | Este fork |
|---|---|---|
| Provedor de IA | Apenas OpenAI | OpenAI **ou** IA local (Ollama + serviços locais de transcrição e voz), escolhido pela interface |
| Configurações | Somente pelo `.env` | Nova página **Ajustes** para escolher o provedor de IA e ver o status dos serviços locais |
| Tema | Apenas claro | Modo claro e **modo escuro**, com preferência salva no navegador |
| Visual | Minimalista em preto e branco com detalhes em vermelho | Novo visual com cartões arredondados, tons de índigo e página inicial redesenhada |
| Exportação | Não havia | Exportação da lição em **PDF** compatível com o Projeto Palavras |
| Instalação | Manual: clonar, criar o `.env` e subir o Docker | **Um comando** no Windows, macOS e Linux, com `.env` e senhas gerados automaticamente; também há instalador `.exe` |
| Versões | Sem versões publicadas | **Releases** no GitHub, publicadas automaticamente após todos os testes passarem |
| Testes | Testes unitários da API e do web | Também testes de integração da API, testes E2E com Playwright e **CI no GitHub Actions** |
| Documentação | README em português | README reescrito, versão em **inglês**, referência da API atualizada e novas capturas de tela |

## 1. IA local com Ollama

No original, todas as funções de IA dependiam da OpenAI. Neste fork, a instalação pode usar:

- **OpenAI na nuvem**, como antes, com `OPENAI_API_KEY` no `.env`;
- **IA local**, com o [Ollama](https://ollama.com) para gerar texto e serviços locais compatíveis com a API da OpenAI para transcrição (STT) e voz (TTS).

O provedor escolhido vale para toda a instalação e fica salvo no banco, em uma nova tabela `ai_settings`. A troca de provedor afeta a criação de lições pelo Content Producer, a geração dos áudios e a avaliação da fala no Speaking Tutor. Uma geração que já está em andamento continua usando o provedor com que começou.

Novas variáveis de ambiente (todas com valores padrão no `docker-compose.yml`):

| Variável | Padrão |
|---|---|
| `AI_PROVIDER` | `openai` |
| `OLLAMA_BASE_URL` | `http://host.docker.internal:11434` |
| `OLLAMA_MODEL` | `llama3.1` |
| `LOCAL_STT_BASE_URL` | `http://host.docker.internal:8000/v1` |
| `LOCAL_STT_MODEL` | `Systran/faster-whisper-small` |
| `LOCAL_TTS_BASE_URL` | `http://host.docker.internal:8880/v1` |
| `LOCAL_TTS_MODEL` | `kokoro` |
| `LOCAL_TTS_VOICE` | `af_heart` |

O contêiner da API também passou a acessar serviços rodando na máquina host (`host.docker.internal`).

## 2. Página de Ajustes

Foi adicionada a página **Ajustes** (`/settings`), acessível pela barra lateral. Nela é possível:

- ver qual provedor de IA está ativo;
- conferir se a chave da OpenAI está configurada (a chave nunca é exibida nem enviada pela API);
- ver se o Ollama (com o modelo instalado), a transcrição e a voz locais estão respondendo;
- trocar de provedor. A troca é bloqueada se o provedor escolhido não estiver pronto.

Para isso, a API ganhou dois endpoints, documentados em [docs/API.md](docs/API.md):

- `GET /api/settings/ai`: provedor atual e status dos serviços;
- `PUT /api/settings/ai`: troca o provedor (`openai` ou `ollama`).

## 3. Modo escuro

O original tinha apenas tema claro. Agora há um botão **Modo escuro / Modo claro** na barra lateral (e **Tema** na navegação do celular). A escolha fica salva no navegador. Na primeira visita, o app segue a preferência de aparência do sistema, e o tema é aplicado antes de a página aparecer, sem piscar.

![Player de lição no modo escuro](docs/screenshots/06-dark-mode.png)

## 4. Novo visual

A interface foi redesenhada mantendo as mesmas funções:

- **Página inicial:** saudação, banner de destaque com atalhos para criar lições e abrir a biblioteca, cartões de resumo (lições na biblioteca, níveis, prática) e cartões de nível com descrição.
- **Biblioteca de lições:** cartões arredondados com numeração (`Lição 01`) e contador de lições.
- **Player da lição:** título e nível no cabeçalho, layout mais largo e responsivo.
- **Content Producer e barra lateral:** atualizados para o mesmo estilo.

A paleta passou do preto e branco com vermelho (`#DC2626`) para tons de índigo, com cores definidas em variáveis CSS para funcionar nos dois temas.

## 5. Exportação em PDF para o Projeto Palavras

O player da lição ganhou o botão **Exportar lição em PDF para projeto palavras**. O PDF gerado contém:

- o diálogo em inglês, com as falas identificadas por personagem;
- a tradução em português;
- rodapé com numeração de páginas.

Além do conteúdo visível, o PDF leva nos metadados um pacote de estudo no formato do app **Aprendendo Palavras** (versão 3), com título, nível, texto, tradução e a primeira data de revisão. Assim, o arquivo pode ser importado diretamente por esse app. O PDF é gerado no próprio navegador, com a biblioteca `jspdf`.

## 6. Instalação com um comando e releases

No original, era preciso clonar o repositório, criar o `.env` à mão e subir o Docker. Aqui, com o Docker aberto, basta um comando:

```powershell
# Windows
irm https://github.com/Joshpcbrrj/cariockko/releases/latest/download/install.ps1 | iex
```

```bash
# macOS e Linux
curl -fsSL https://github.com/Joshpcbrrj/cariockko/releases/latest/download/install.sh | bash
```

O instalador:

- confere se o Docker está instalado e rodando;
- baixa a última versão publicada;
- cria o `.env` com **senhas aleatórias** para o banco e o MinIO, em vez das senhas fixas do exemplo;
- pede a chave da OpenAI sem mostrá-la na tela ou, se ela não for informada, verifica se a IA local está pronta;
- sobe os contêineres e abre o app no navegador.

Rodar o mesmo comando de novo **atualiza** o app, mantendo o `.env` e os dados. Com `--uninstall` (ou `-Uninstall` no Windows), ele **desinstala**, perguntando se os dados também devem ser apagados.

Os arquivos envolvidos:

- **`scripts/install.sh`:** instalador de macOS e Linux.
- **`scripts/install.ps1`:** instalador do Windows; baixa a versão e chama o script abaixo.
- **`scripts/install-windows.ps1`:** configura e inicia o app no Windows. Também é usado pelo instalador `.exe`.
- **`installer/Cariockko.iss`:** script do Inno Setup que gera um instalador `.exe` com atalhos no menu Iniciar e na área de trabalho.

O comando de instalação baixa sempre a **última release publicada**, não o código mais recente do `main`. Uma release é criada ao enviar uma tag de versão (por exemplo `v0.2.0`): o workflow `.github/workflows/release.yml` roda todos os testes e só publica se eles passarem.

### Ajustes no Docker Compose

- **Imagens do MinIO:** a MinIO deixou de publicar as imagens `minio/minio` e `minio/mc`, então o `docker compose up` do original falha em máquinas que ainda não têm essas imagens. Este fork usa `pgsty/minio` e `pgsty/mc`, compiladas a partir do mesmo código aberto, com versões fixas.
- **Porta do banco:** o PostgreSQL agora fica acessível só por `localhost` (antes ficava exposto para a rede local), e a porta é configurável por `POSTGRES_HOST_PORT`. O instalador escolhe outra porta se a 5432 já estiver ocupada, por exemplo por um PostgreSQL instalado na máquina.
- **Valores padrão** para as variáveis que não são senhas, para que um `.env` incompleto não quebre a inicialização.

## 7. Testes e integração contínua

- **API:** o app Express foi extraído para `createApp()` (`api/src/app.ts`), o que permitiu testes de integração das rotas com `supertest`, além de testes para a rota de configurações.
- **Web:** testes para o botão de tema e para a geração do pacote de estudo do PDF.
- **E2E:** testes com Playwright usando uma API simulada (`web/e2e/mock-api.mjs`). Eles cobrem a persistência do modo escuro entre páginas e a exportação do PDF. Há também um teste que gera as capturas de tela do README.
- **CI:** workflow do GitHub Actions (`.github/workflows/ci.yml`) que roda testes, checagem de tipos, build da API e testes E2E a cada push e pull request. Ele também instala, atualiza e desinstala o app com o `install.sh` num Linux com Docker.
- **Scripts na raiz:** `npm test`, `npm run typecheck`, `npm run test:e2e` e `npm run test:ci`.

## 8. Documentação

- README reescrito, com índice, capturas de tela atualizadas e seções sobre IA local, instalador, testes e solução de problemas.
- Nova versão em inglês: [README.en.md](README.en.md).
- [docs/API.md](docs/API.md) com os novos endpoints de configuração.
- `.env.example` com as novas variáveis.

## O que continua igual

- Fluxo de criação de lições com o Content Producer (plano, revisão, geração e nova tentativa das lições que falharam).
- Estrutura das lições, diálogos e progresso do estudante.
- Lógica de avaliação da fala do Speaking Tutor (agora usando o provedor escolhido).
- Stack com Docker Compose: PostgreSQL, MinIO, API em Express e web em Next.js.
- Uso sem conta.

## Como trazer novidades do original

Para incorporar atualizações futuras do projeto original:

```bash
git remote add upstream https://github.com/araujgom/cariockko.git   # apenas na primeira vez
git fetch upstream
git merge upstream/main
```
