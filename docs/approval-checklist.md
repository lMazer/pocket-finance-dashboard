# Checklist de aprovacao (PR / entrega)

Use este checklist antes de aprovar merge em features do MVP.

## Escopo

- [ ] O PR resolve claramente uma issue/objetivo
- [ ] O escopo esta coeso (sem mudancas paralelas desnecessarias)
- [ ] A descricao explica problema, solucao e impacto

## Qualidade tecnica

- [ ] Build/testes locais relevantes foram executados
- [ ] CI esta verde
- [ ] Sem regressao obvia em fluxos existentes
- [ ] Tratamento de erro/loading foi considerado (quando aplicavel)
- [ ] Nomes/estrutura de codigo estao consistentes com o projeto

## UX / produto

- [ ] Estados vazios e erros estao tratados
- [ ] Responsividade basica revisada (mobile/desktop)
- [ ] Acessibilidade basica (label/focus/aria) foi considerada

## Operacao / docs

- [ ] README/docs foram atualizados se houve impacto de uso
- [ ] Variaveis/portas/endpoints novos foram documentados
- [ ] Script de smoke/validacao foi atualizado (se necessario)

## Git / release

- [ ] Commits seguem Conventional Commits
- [ ] PR referencia issue (`Closes #...`) quando concluir
- [ ] Impacto em versionamento/release foi considerado

