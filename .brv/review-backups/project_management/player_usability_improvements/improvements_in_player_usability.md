---
title: Improvements in Player Usability
summary: Enhancements made to EventRsvpForm, AdminPlayerManager, and game editing processes.
tags: []
related: []
keywords: []
createdAt: '2026-09-18T10:21:38.675Z'
updatedAt: '2026-09-18T10:21:38.675Z'
---
## Reason
Documenting usability improvements implemented in player and game management

## Raw Concept
**Task:**
Implement usability improvements in player and game management

## Narrative
### Structure
Documented usability improvements and their implementation details.

## Facts
- **EventRsvpForm e AdminPlayerManager**: A 2ª posição tornou-se verdadeiramente opcional e expansível via botão '+ Adicionar 2ª posição (opcional)'
- **Coluna Nota (0-10 opcional)**: Reutilizado o campo group_members.base_rating, adicionado à query de members em settings/page.tsx
- **Edição de jogos finalizados**: Adicionado botão e modal 'Reabrir Jogo para Edição' em MatchControls
- **Jogos finalizados**: Liberado acesso ao TeamEditor e AdminPlayerManager em jogos finalizados
- **Correção de jogadores e escalações**: Removido bloqueio de finalizado na rota /api/events/[eventId]/admin-rsvp
