# Release Readiness (MVP)

## Ultima execucao

- Data (UTC): 2026-02-27
- Branch base: `main`
- Release finalizada: `pocket-finance-frontend-v1.5.0`

## Resultado do checklist

- [x] CI da `main` verde
- [x] Build frontend validado em Docker dev
- [x] Fluxos principais acessiveis (`/dashboard`, `/transactions`, `/categories`, `/budgets`, `/reports`)
- [x] OpenAPI e health do backend respondendo
- [x] Documentacao de uso e scripts atualizada
- [x] Release Please mergeado e tag publicada

## Evidencias tecnicas

- Comando: `docker compose -f compose.dev.yml exec -T frontend npm run build`
- Comando: `powershell -ExecutionPolicy Bypass -File .\scripts\visual-smoke.ps1`
- Capturas: `docs/prints/smoke/desktop` e `docs/prints/smoke/mobile`

## Pendencias nao bloqueantes

- Reavaliar budgets CSS por componente quando houver proximo refactor de estilos.
