# Checklist de release MVP

Use este checklist antes de publicar uma release do MVP (ou uma release incremental importante).

## 1. Escopo e backlog

- [ ] Issues planejadas para a release estão fechadas ou explicitamente adiadas
- [ ] PRs abertas foram revisadas (sem mudanças pendentes críticas)
- [ ] Milestone da release está atualizada

## 2. Qualidade técnica

- [ ] CI da `main` está verde
- [ ] `backend` compila e testes passam (`mvn test`)
- [ ] `frontend` build/testes passam (`npm run spec:check`, `npm run test:ci`, `npm run build`)
- [ ] Sem erros críticos conhecidos em issues abertas

## 3. Validação funcional (MVP)

- [ ] Login/logout JWT
- [ ] `/auth/refresh` (renovação de sessão)
- [ ] Categorias CRUD
- [ ] Transações CRUD + filtros + paginação
- [ ] Dashboard com dados reais
- [ ] Budgets (listar/criar/atualizar)
- [ ] Importação CSV
- [ ] Exportação CSV
- [ ] Swagger (`/swagger-ui/index.html`)
- [ ] Health (`/actuator/health`)

## 4. Ambiente e documentação

- [ ] `README.md` atualizado (setup, endpoints, variáveis, comandos)
- [ ] Prints/evidências atualizados (se houve mudança visual relevante)
- [ ] Scripts de suporte (`smoke-dev.ps1`, `dev-status.ps1`, `dev-logs.ps1`) consistentes
- [ ] `CHANGELOG`/release notes revisados (quando aplicável)

## 5. Release automática (Release Please)

- [ ] PR automática `chore: release main` foi gerada/atualizada
- [ ] Versões propostas (backend/frontend) foram revisadas
- [ ] Changelog gerado está coerente
- [ ] PR de release foi mergeada
- [ ] Tags/releases publicadas no GitHub foram confirmadas

## 6. Pós-release

- [ ] Smoke da stack Docker dev executado
- [ ] Projeto/board/milestone atualizados
- [ ] Próximo ciclo (issues prioritárias) definido

