# pocket-finance-dashboard
Sistema de controle financeiro pessoal com dashboard analítico, gráficos e metas por categoria.

## Docker (desenvolvimento com auto-reload)

Este projeto possui um ambiente de desenvolvimento com Docker Compose para subir:

- `db`: PostgreSQL
- `backend`: Spring Boot (Maven) com auto-reload via `spring-boot-devtools`
- `frontend`: Angular com live reload (`ng serve`) e polling para funcionar bem no Docker/Windows

### Pré-requisitos

- Docker Desktop instalado
- Docker Desktop configurado para iniciar com o Windows (para auto-start dos containers)

### Subir o ambiente

```bash
docker compose -f compose.dev.yml up -d --build
```

Se alguma porta já estiver em uso, sobrescreva antes de subir (PowerShell):

```powershell
$env:BACKEND_PORT="18080"
$env:FRONTEND_PORT="14200"
$env:POSTGRES_PORT="15432"
docker compose -f compose.dev.yml up -d --build
```

### Acessos

- Frontend: `http://localhost:34200`
- Backend API: `http://localhost:38080`
- Swagger UI: `http://localhost:38080/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:38080/v3/api-docs`
- Health (Actuator): `http://localhost:38080/actuator/health`
- PostgreSQL: `localhost:35432`

As portas acima refletem o `.env` versionado no projeto. Se você sobrescrever variáveis (`BACKEND_PORT`, `FRONTEND_PORT`, `POSTGRES_PORT`), os endpoints mudam de acordo.

### Auto-reload

- Alterações em `frontend/` recarregam no `ng serve`
- Alterações em `backend/` reiniciam automaticamente a aplicação (DevTools)

### Importação/Exportação CSV (frontend)

Na tela `Transacoes` (`/transactions`) você pode:

- `Modelo CSV`: baixa um arquivo exemplo com cabeçalho e linhas modelo
- `Importar CSV`: envia um arquivo `.csv` para `/import/csv`
- `Exportar CSV`: baixa um CSV gerado por `/export/csv` com filtros atuais (mês/categoria)

Formato esperado (cabeçalho):

```csv
date,description,amount,type,category
```

Exemplo de linha:

```csv
2026-02-26,Supermercado,123.45,expense,Alimentacao
```

Observações:

- `type`: `expense` ou `income`
- `amount`: decimal com ponto
- A ordem das colunas pode variar, desde que os nomes do cabeçalho existam

### Parar / reiniciar

```bash
docker compose -f compose.dev.yml stop
docker compose -f compose.dev.yml start
docker compose -f compose.dev.yml down
```

Para remover também o volume do banco:

```bash
docker compose -f compose.dev.yml down -v
```

### Smoke test rapido (PowerShell)

Depois de subir a stack, rode um smoke test local para validar frontend + backend + OpenAPI:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke-dev.ps1
```

Se estiver usando portas sobrescritas, informe as URLs:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke-dev.ps1 `
  -FrontendUrl "http://localhost:14200" `
  -BackendUrl "http://localhost:18080"
```

### Inicializar automaticamente com o Docker

Os serviços no `compose.dev.yml` usam `restart: unless-stopped`. Isso significa:

- se o Docker Desktop reiniciar, os containers voltam automaticamente
- se você parar manualmente um container, ele não sobe de novo até você iniciar

No Windows, ative no Docker Desktop a opção de iniciar automaticamente com o sistema.

## Versionamento automático (releases)

O repositório está configurado para versionamento automático de release com **Release Please** (GitHub Actions).

### Como funciona

- Você continua trabalhando com branches + PRs normalmente
- Após merge na `main`, a action `Release Please` analisa os commits
- Ela abre/atualiza uma **PR de release** com:
  - bump de versão
  - changelog
  - tags/releases no GitHub (quando a PR de release for mergeada)

### Primeiro ciclo já validado

- Workflow `Release Please` configurado e validado
- PR de release automática criada (`chore: release main`)
- Merge da PR de release gerou release/tag automática do frontend

### Convenção de commits (importante)

Use mensagens no padrão **Conventional Commits**:

- `feat: ...` -> nova funcionalidade (incremento `minor` em versões `<1.0.0`)
- `fix: ...` -> correção (incremento `patch`)
- `feat!: ...` ou `BREAKING CHANGE:` -> mudança incompatível (`major`)

Exemplos:

- `feat: add transaction filters`
- `fix: handle refresh token expiration`
- `feat!: change auth response contract`

### Escopo do versionamento neste projeto

- `backend/` -> release Java (atualiza `backend/pom.xml`)
- `frontend/` -> release Node/Angular (atualiza `frontend/package.json`)

As tags serão separadas por componente (ex.: `backend-v...` e `frontend-v...`).

### Observação sobre permissões do GitHub Actions

Para a action criar PRs/releases automaticamente, o repositório precisa permitir escrita do `GITHUB_TOKEN`:

- `Settings > Actions > General > Workflow permissions`
- `Read and write permissions`
- `Allow GitHub Actions to create and approve pull requests`

## Qualidade (builds e warnings)

- A CI valida:
  - `backend`: `mvn test`
  - `frontend`: `npm run build`
- O Angular usa budgets de bundle/estilo para sinalizar crescimento excessivo.
- Os limites de `anyComponentStyle` foram ajustados para um patamar mais realista do layout atual, mantendo alerta sem gerar ruído excessivo no dia a dia.

### Comandos uteis no frontend

Dentro de `frontend/`:

- `npm run build:ci` -> build de producao (mesmo alvo usado na CI)
- `npm run spec:check` -> valida tipagem/compilacao dos testes (`*.spec.ts`) sem precisar de Chrome
