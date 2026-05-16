---
title: Project Facts
summary: Convoca project facts covering draw configs, event settings, rankings, financial management, invites, admin/member separation, RSVP, voting, match actions, user search, event lifecycle, and SQL/validation patterns.
tags: []
related: [architecture/context.md, security/context.md, architecture/context.md, architecture/billing/context.md, architecture/database/context.md, security/operations/context.md]
keywords: []
createdAt: '2026-05-16T15:52:49.980Z'
updatedAt: '2026-05-16T15:53:59.485Z'
---
## Reason
Document durable product and codebase facts from the Convoca context

## Raw Concept
**Task:**
Capture durable product and implementation facts from the Convoca technical context

**Changes:**
- Identified Stripe billing and API migration as key project knowledge areas
- Identified PostgreSQL as a documented infrastructure fact
- Identified authentication and backup credential exposure as documented topics
- Captured the documented application stack.
- Recorded the knowledge organization approach.
- Recorded discovered database and backup-related scripts.
- Documented draw config, event settings, rankings, finances, invites, RSVP, voting, actions, search, lifecycle, SQL, and validation patterns
- Captured the current API surface and storage tables described in the context
- Preserved operational rules such as waitlist promotion, voting constraints, and error handling behavior

**Files:**
- src/db/client.ts
- docs/02-architecture/PROJECT_SUMMARY.md
- docs/06-features/RANKING_LOGIC.md
- docs/06-features/PAYMENTS_GUIDE.md
- docs/06-features/ADMIN_MEMBER_SEPARATION.md

**Flow:**
draw configuration -> event settings -> RSVP/check-in -> team draw -> match actions -> voting/rankings -> charges

**Timestamp:** 2026-05-16

**Author:** ByteRover context engineer

## Narrative
### Structure
The context describes Convoca as a sports-event system with modules for draw configuration, event defaults, rankings, finance, invites, member roles, RSVP, voting, actions, search, and lifecycle management.

### Dependencies
Ranking calculations depend on event_actions and finished event membership; draw logic depends on confirmed check-ins and goalkeeper separation; financial features depend on wallets, charges, and transactions.

### Highlights
The technical surface includes REST APIs for draw configs, event settings, rankings, charges, invites, RSVPs, check-ins, votes, actions, and user search.

### Examples
Examples include /api/groups/[groupId]/draw-config, /api/events/[eventId]/teams/swap, /api/groups/[groupId]/my-stats, and /api/users/search?q=email_or_name.

## Facts
- **project_name**: The project is named Convoca. [project]
- **group_draw_configs**: Group draw configurations are stored in group_draw_configs. [project]
- **draw_config_fields**: Draw config fields include min_teams default 2, max_teams default 4, balance_method random or skill-based with random as the default, and seed_value for reproducibility. [project]
- **draw_config_api**: Draw config APIs are GET and PATCH on /api/groups/[groupId]/draw-config. [project]
- **draw_algorithm**: The draw algorithm filters confirmed check-ins, separates goalkeepers, distributes goalkeepers first, distributes line players randomly, balances teams numerically, and supports seed reproducibility. [project]
- **draw_swap_api**: Draw swaps are handled by POST /api/events/[eventId]/teams/swap and require both players to exist on different teams. [project]
- **group_event_settings**: Group event settings are stored in group_event_settings. [project]
- **event_setting_fields**: Event setting fields include default_max_players 14, default_max_goalkeepers 2, default_venue_id nullable, and start_time default 15:00. [project]
- **event_settings_api**: Event settings APIs are GET and PATCH on /api/groups/[groupId]/event-settings. [project]
- **rankings_apis**: Group rankings are exposed at GET /api/groups/[groupId]/rankings and personal stats at GET /api/groups/[groupId]/my-stats. [project]
- **ranking_metrics**: Ranking metrics include games played, goals, assists, wins, losses, draws, win rate, rating, MVPs, and tags such as MVP, Craque, Defensor, Artilheiro, and Garçom. [project]
- **ranking_score_formula**: Ranking score calculation uses 2 points per presence, 3 per goal, 2 per assist, 1 per win, and MVP votes weighted by group config. [project]
- **mv_event_scoreboard**: The materialized view mv_event_scoreboard pre-calculates goals and assists per team and is refreshed automatically by event_actions triggers. [project]
- **financial_mvp**: The financial MVP uses wallets, charges, and transactions. [project]
- **wallet_schema**: Wallets can belong to either a user or a group, and the balance currency defaults to BRL. [project]
- **charge_schema**: Charges include status pending, paid, or cancelled and payment methods cash, pix, or card. [project]
- **charge_apis**: Charge APIs are GET, POST, PATCH, and DELETE under /api/groups/[groupId]/charges. [project]
- **invite_schema**: Invites are code-based and stored in invites with UUID ids, unique 6-8 character invite codes, optional max uses, usage counters, and optional expiration. [project]
- **invite_apis**: Invite APIs are GET, POST, and DELETE under /api/groups/[groupId]/invites, with POST /api/groups/join used to join by code. [project]
- **group_member_roles**: Group member roles are admin or member, and the schema also stores is_goalkeeper and base_rating. [project]
- **admin_capabilities**: Admin capabilities include event management, RSVP management, team draw, match actions, charges, members, invite codes, draw config, and event settings. [project]
- **member_capabilities**: Member capabilities include RSVP, viewing results and stats, voting on teammates, and viewing rankings. [project]
- **rsvp_statuses**: RSVP statuses are yes, no, and waitlist, with order_of_arrival used for FIFO promotion from waitlist when spots open. [project]
- **rsvp_apis**: RSVP and check-in APIs include POST /api/events/[eventId]/rsvp, POST /api/events/[eventId]/admin-rsvp, and POST /api/events/[eventId]/check-in. [project]
- **check_in_rule**: Only players with status yes can be checked in, and check-in starts team-draw eligibility. [project]
- **voting_schema**: Voting replaces traditional ratings with player_ratings, mvp_tiebreakers, and mvp_tiebreaker_votes tables. [project]
- **voting_rules**: Voting rules prohibit self-voting, allow voting for multiple teammates, and only allow voting after the event is finished. [project]
- **voting_tags**: Voting tags available are MVP, Craque, Defensor, Artilheiro, and Garçom. [project]
- **event_actions**: Match actions are stored in event_actions with action types goal, assist, defense, dribble, yellow_card, and red_card. [project]
- **event_actions_api**: Match action APIs are GET, POST, and DELETE under /api/events/[eventId]/actions. [project]
- **user_search_api**: The user search endpoint is GET /api/users/search?q=email_or_name. [project]
- **event_lifecycle**: Event lifecycle statuses are scheduled, live, finished, and canceled. [project]
- **sql_pattern**: The codebase uses raw SQL with a postgres client imported from @/db/client and parameterized template queries. [project]
- **error_handling_pattern**: The error handling pattern returns 401 for the exact message Não autenticado and 500 for generic errors. [project]
- **validation_pattern**: Validation uses zod schemas and parse throws ZodError on invalid input. [project]
