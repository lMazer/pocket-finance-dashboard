# Contribuindo

## Fluxo recomendado

1. Crie uma branch a partir da `main`
   - `feat/...`, `fix/...`, `chore/...`, `docs/...`, `test/...`
2. Faça mudanças pequenas e coesas
3. Valide localmente (quando aplicavel)
   - `docker compose -f compose.dev.yml exec -T frontend npm run build`
   - `docker compose -f compose.dev.yml exec -T backend mvn test`
4. Commit com **Conventional Commits**
   - `feat: ...`, `fix: ...`, `docs: ...`, `chore: ...`
5. Abra PR com resumo + validacao executada + issue vinculada
6. Aguarde CI verde
7. Faça merge na `main`

## Padrão de PR

- Descrever o problema e a solução
- Listar validações executadas
- Referenciar issue com `Closes #<numero>` quando concluir

## Versionamento / release

- O projeto usa **Release Please**
- Merges na `main` podem gerar/atualizar PRs de release automaticamente
- O merge da PR de release publica tag/release e atualiza changelog

## Convenção de commits

- `feat:` nova funcionalidade
- `fix:` correção
- `docs:` documentação
- `test:` testes
- `chore:` manutenção

Use `!` ou `BREAKING CHANGE:` apenas quando houver quebra de compatibilidade.
