#!/usr/bin/env bash
# Cariockko installer for Linux and macOS.
#
# Install or update (downloads the latest published release):
#   curl -fsSL https://github.com/Joshpcbrrj/cariockko/releases/latest/download/install.sh | bash
#
# Uninstall:
#   curl -fsSL https://github.com/Joshpcbrrj/cariockko/releases/latest/download/install.sh | bash -s -- --uninstall
#
# Optional environment variables:
#   CARIOCKKO_DIR          Installation folder (default: ~/cariockko)
#   CARIOCKKO_VERSION      Release tag to install, e.g. v0.2.0 (default: latest release)
#   OPENAI_API_KEY         Use this key without asking for it
#   CARIOCKKO_AI_PROVIDER  Set to "ollama" to choose local AI without asking
#   CARIOCKKO_DELETE_DATA  Set to 1 to delete lessons and audio when uninstalling
#   CARIOCKKO_NO_BROWSER   Set to 1 to skip opening the browser
#   CARIOCKKO_SOURCE_DIR   Install from a local copy of the repository (used by CI)

set -euo pipefail

REPO="Joshpcbrrj/cariockko"
INSTALL_DIR="${CARIOCKKO_DIR:-$HOME/cariockko}"
MARKER=".cariockko-version"
APP_URL="http://localhost:3000"
DEFAULT_OLLAMA_URL="http://localhost:11434"
DEFAULT_STT_URL="http://localhost:8000/v1"
DEFAULT_TTS_URL="http://localhost:8880/v1"

if [ -t 1 ]; then
  BOLD=$'\033[1m'; GREEN=$'\033[32m'; RED=$'\033[31m'; YELLOW=$'\033[33m'; RESET=$'\033[0m'
else
  BOLD=""; GREEN=""; RED=""; YELLOW=""; RESET=""
fi

info() { printf '%s\n' "$*"; }
ok() { printf '%s✔%s %s\n' "$GREEN" "$RESET" "$*"; }
warn() { printf '%s!%s %s\n' "$YELLOW" "$RESET" "$*" >&2; }
fail() { printf '%s✖ %s%s\n' "$RED" "$*" "$RESET" >&2; exit 1; }

# The script usually arrives through a pipe, so questions must read from the terminal.
has_tty() { [ -r /dev/tty ] && { : < /dev/tty; } 2>/dev/null; }

ask() {
  local prompt="$1" answer=""
  if has_tty; then
    printf '%s' "$prompt" > /dev/tty
    IFS= read -r answer < /dev/tty || true
  fi
  printf '%s' "$answer"
}

ask_secret() {
  local prompt="$1" answer=""
  if has_tty; then
    printf '%s' "$prompt" > /dev/tty
    stty -echo < /dev/tty
    IFS= read -r answer < /dev/tty || true
    stty echo < /dev/tty
    printf '\n' > /dev/tty
  fi
  printf '%s' "$answer"
}

random_secret() {
  od -An -N16 -tx1 /dev/urandom | tr -d ' \n'
}

project_name() {
  basename "$INSTALL_DIR" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9_-'
}

env_get() {
  awk -F= -v key="$1" '$1 == key { sub(/^[^=]*=/, ""); print; exit }' "$INSTALL_DIR/.env"
}

env_set() {
  local key="$1" value="$2" file="$INSTALL_DIR/.env" tmp
  tmp="$(mktemp)"
  awk -v key="$key" -v value="$value" '
    BEGIN { done = 0 }
    $0 ~ "^" key "=" { print key "=" value; done = 1; next }
    { print }
    END { if (!done) print key "=" value }
  ' "$file" > "$tmp"
  cat "$tmp" > "$file"
  rm -f "$tmp"
}

check_requirements() {
  command -v curl > /dev/null || fail "O comando curl não foi encontrado. Instale-o e tente novamente."
  command -v tar > /dev/null || fail "O comando tar não foi encontrado. Instale-o e tente novamente."

  if ! command -v docker > /dev/null; then
    if [ "$(uname -s)" = "Darwin" ]; then
      fail "Docker não encontrado. Instale o Docker Desktop (https://www.docker.com/products/docker-desktop/) e execute este comando novamente."
    fi
    fail "Docker não encontrado. Instale o Docker Engine (https://docs.docker.com/engine/install/) e execute este comando novamente."
  fi

  if ! docker info > /dev/null 2>&1; then
    if [ "$(uname -s)" = "Darwin" ]; then
      fail "O Docker está instalado, mas não está em execução. Abra o Docker Desktop e tente novamente."
    fi
    fail "Não foi possível acessar o Docker. Verifique se o serviço está ativo (sudo systemctl start docker) e se seu usuário está no grupo docker (sudo usermod -aG docker \$USER; depois saia e entre na sessão)."
  fi

  docker compose version > /dev/null 2>&1 \
    || fail "Docker Compose v2 não está disponível. Atualize o Docker e tente novamente."
  ok "Docker encontrado e em execução"
}

resolve_version() {
  if [ -n "${CARIOCKKO_VERSION:-}" ]; then
    printf '%s' "$CARIOCKKO_VERSION"
    return
  fi
  local url
  url="$(curl -fsSLI -o /dev/null -w '%{url_effective}' "https://github.com/$REPO/releases/latest")" \
    || fail "Não foi possível consultar a última versão do Cariockko no GitHub."
  case "$url" in
    */releases/tag/*) printf '%s' "${url##*/}" ;;
    *) fail "Nenhuma versão publicada do Cariockko foi encontrada no GitHub." ;;
  esac
}

ensure_install_dir_is_ours() {
  if [ -d "$INSTALL_DIR" ] && [ -n "$(ls -A "$INSTALL_DIR")" ] && [ ! -f "$INSTALL_DIR/$MARKER" ]; then
    fail "A pasta $INSTALL_DIR já existe e não foi criada por este instalador. Escolha outra pasta com CARIOCKKO_DIR=/outra/pasta."
  fi
}

download_release() {
  local version="$1" staging="$2"
  if [ -n "${CARIOCKKO_SOURCE_DIR:-}" ]; then
    tar -C "$CARIOCKKO_SOURCE_DIR" \
      --exclude=.git --exclude=node_modules --exclude=.next --exclude=dist --exclude=.env \
      --exclude=test-results --exclude=playwright-report \
      -cf - . | tar -C "$staging" -xf -
    return
  fi
  curl -fsSL "https://github.com/$REPO/archive/refs/tags/$version.tar.gz" \
    | tar -xz -C "$staging" --strip-components=1 \
    || fail "Não foi possível baixar o Cariockko $version."
}

STAGING_DIR=""
cleanup() { if [ -n "$STAGING_DIR" ]; then rm -rf "$STAGING_DIR"; fi; }
trap cleanup EXIT

install_files() {
  local version="$1"
  STAGING_DIR="$(mktemp -d)"

  info "Baixando o Cariockko $version para $INSTALL_DIR..."
  download_release "$version" "$STAGING_DIR"
  [ -f "$STAGING_DIR/docker-compose.yml" ] || fail "O pacote baixado não contém o Cariockko."

  mkdir -p "$INSTALL_DIR"
  # Replace the application code but keep the local configuration.
  find "$INSTALL_DIR" -mindepth 1 -maxdepth 1 ! -name .env -exec rm -rf {} +
  cp -R "$STAGING_DIR/." "$INSTALL_DIR/"
  printf '%s\n' "$version" > "$INSTALL_DIR/$MARKER"
  ok "Cariockko $version baixado"
}

create_env() {
  local env_file="$INSTALL_DIR/.env"
  if [ -f "$env_file" ]; then
    ok "Configuração existente mantida ($env_file)"
    return
  fi

  cp "$INSTALL_DIR/.env.example" "$env_file"
  chmod 600 "$env_file"

  # Data from an earlier installation was created with the example passwords.
  if docker volume inspect "$(project_name)_pgdata" > /dev/null 2>&1; then
    warn "Dados de uma instalação anterior foram encontrados; as senhas padrão foram mantidas para preservá-los."
    return
  fi

  local db_password
  db_password="$(random_secret)"
  env_set POSTGRES_PASSWORD "$db_password"
  env_set DATABASE_URL "postgresql://postgres:$db_password@db:5432/postgres"
  env_set MINIO_ROOT_PASSWORD "$(random_secret)"
  ok "Arquivo .env criado (senhas do banco e do armazenamento geradas)"
}

check_local_ai() {
  local ollama stt tts model missing=()
  ollama="$(env_get OLLAMA_BASE_URL)"; ollama="${ollama:-$DEFAULT_OLLAMA_URL}"
  stt="$(env_get LOCAL_STT_BASE_URL)"; stt="${stt:-$DEFAULT_STT_URL}"
  tts="$(env_get LOCAL_TTS_BASE_URL)"; tts="${tts:-$DEFAULT_TTS_URL}"
  model="$(env_get OLLAMA_MODEL)"; model="${model:-llama3.1}"
  # The containers reach the host through host.docker.internal; this script runs on the host.
  ollama="${ollama/host.docker.internal/localhost}"; ollama="${ollama%/}"
  stt="${stt/host.docker.internal/localhost}"; stt="${stt%/}"
  tts="${tts/host.docker.internal/localhost}"; tts="${tts%/}"

  if ! curl -fsS --max-time 3 "$ollama/api/tags" 2>/dev/null \
      | grep -Eq "\"(name|model)\":\"$model(:[^\"]*)?\""; then
    missing+=("Ollama com o modelo $model")
  fi
  curl -fsS --max-time 3 -o /dev/null "$stt/models" 2>/dev/null || missing+=("transcrição local ($stt)")
  curl -fsS --max-time 3 -o /dev/null "$tts/models" 2>/dev/null || missing+=("voz local ($tts)")

  if [ "${#missing[@]}" -gt 0 ]; then
    local list
    list="$(printf '%s, ' "${missing[@]}")"
    fail "Para usar sem chave OpenAI, inicie os serviços locais necessários: ${list%, }. Configure seus endereços em $INSTALL_DIR/.env e execute novamente."
  fi

  if [ "$(uname -s)" = "Linux" ]; then
    warn "No Linux, o Ollama precisa aceitar conexões do Docker: defina OLLAMA_HOST=0.0.0.0 no serviço do Ollama."
  fi
}

choose_provider() {
  local current
  current="$(env_get OPENAI_API_KEY)"
  # A real key or an earlier choice of local AI means there is nothing to ask.
  if grep -q '^OPENAI_API_KEY=' "$INSTALL_DIR/.env" && [ "$current" != "sk-your-openai-api-key" ]; then
    return
  fi

  local key="${OPENAI_API_KEY:-}"
  if [ -z "$key" ] && [ "${CARIOCKKO_AI_PROVIDER:-}" != "ollama" ]; then
    info "A chave é armazenada apenas no arquivo .env desta instalação."
    key="$(ask_secret "Chave da OpenAI (Enter para usar apenas IA local): ")"
  fi

  if [ -n "$key" ]; then
    env_set OPENAI_API_KEY "$key"
    env_set AI_PROVIDER openai
    ok "Provedor de IA: OpenAI"
  else
    check_local_ai
    env_set OPENAI_API_KEY ""
    env_set AI_PROVIDER ollama
    ok "Provedor de IA: IA local (Ollama)"
  fi
}

start_app() {
  info "Construindo e iniciando os serviços (pode levar alguns minutos)..."
  (cd "$INSTALL_DIR" && docker compose up -d --build) \
    || fail "O Docker Compose falhou ao iniciar. Revise as mensagens acima."

  local _
  for _ in $(seq 1 90); do
    if curl -fsS --max-time 3 -o /dev/null "$APP_URL"; then
      ok "Cariockko está pronto em $APP_URL"
      open_browser
      return
    fi
    sleep 2
  done
  fail "Os serviços iniciaram, mas a interface não respondeu em $APP_URL. Verifique com: cd $INSTALL_DIR && docker compose logs"
}

open_browser() {
  [ "${CARIOCKKO_NO_BROWSER:-}" = "1" ] && return
  if [ "$(uname -s)" = "Darwin" ]; then
    open "$APP_URL" > /dev/null 2>&1 || true
  elif command -v xdg-open > /dev/null && { [ -n "${DISPLAY:-}" ] || [ -n "${WAYLAND_DISPLAY:-}" ]; }; then
    xdg-open "$APP_URL" > /dev/null 2>&1 || true
  fi
}

install() {
  info "${BOLD}Cariockko - instalador${RESET}"
  check_requirements
  ensure_install_dir_is_ours
  local version
  version="$(resolve_version)"
  install_files "$version"
  create_env
  choose_provider
  start_app
  info ""
  info "Para atualizar, execute o mesmo comando de instalação novamente."
}

uninstall() {
  info "${BOLD}Cariockko - desinstalação${RESET}"
  [ -d "$INSTALL_DIR" ] || fail "Nenhuma instalação encontrada em $INSTALL_DIR."
  [ -f "$INSTALL_DIR/$MARKER" ] || fail "A pasta $INSTALL_DIR não foi criada por este instalador."

  local delete_data="${CARIOCKKO_DELETE_DATA:-}"
  if [ -z "$delete_data" ]; then
    case "$(ask "Apagar também as lições, áudios e progresso salvos? [s/N] ")" in
      s|S|sim|Sim|SIM) delete_data=1 ;;
      *) delete_data=0 ;;
    esac
  fi

  if command -v docker > /dev/null && docker info > /dev/null 2>&1; then
    if [ "$delete_data" = "1" ]; then
      (cd "$INSTALL_DIR" && docker compose down -v --remove-orphans) || true
    else
      (cd "$INSTALL_DIR" && docker compose down --remove-orphans) || true
    fi
  else
    warn "Docker indisponível; os contêineres não foram parados."
  fi

  if [ "$delete_data" = "1" ]; then
    rm -rf "$INSTALL_DIR"
    ok "Cariockko removido, incluindo os dados."
  else
    # The data volumes only work with the passwords in .env, so keep it for a reinstall.
    find "$INSTALL_DIR" -mindepth 1 -maxdepth 1 ! -name .env ! -name "$MARKER" -exec rm -rf {} +
    ok "Cariockko removido. Os dados e o arquivo $INSTALL_DIR/.env foram mantidos para uma futura reinstalação."
  fi
}

main() {
  case "${1:-}" in
    "") install ;;
    --uninstall) uninstall ;;
    -h|--help) sed -n '2,17p' "$0" 2>/dev/null || info "Consulte https://github.com/$REPO" ;;
    *) fail "Opção desconhecida: $1 (use --uninstall ou --help)" ;;
  esac
}

main "$@"
