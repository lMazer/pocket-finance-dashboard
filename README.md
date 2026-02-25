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

- Frontend: `http://localhost:4200`
- Backend API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Health (Actuator): `http://localhost:8080/actuator/health`
- PostgreSQL: `localhost:5432`

### Auto-reload

- Alterações em `frontend/` recarregam no `ng serve`
- Alterações em `backend/` reiniciam automaticamente a aplicação (DevTools)

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

### Inicializar automaticamente com o Docker

Os serviços no `compose.dev.yml` usam `restart: unless-stopped`. Isso significa:

- se o Docker Desktop reiniciar, os containers voltam automaticamente
- se você parar manualmente um container, ele não sobe de novo até você iniciar

No Windows, ative no Docker Desktop a opção de iniciar automaticamente com o sistema.
