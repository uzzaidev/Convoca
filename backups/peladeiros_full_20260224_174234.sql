--
-- PostgreSQL database dump
--

\restrict avP2TNhDMfl0TJmYAgtKbJiKurhKdTWvHzwdpaAlO9RQpmlLsT4W7jdVc0guvbk

-- Dumped from database version 17.8 (6108b59)
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: refresh_event_scoreboard(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_event_scoreboard() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_event_scoreboard;
  RETURN NULL;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION update_updated_at_column(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Função trigger para atualizar automaticamente a coluna updated_at';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: group_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    group_id uuid NOT NULL,
    role character varying(20) DEFAULT 'member'::character varying,
    is_goalkeeper boolean DEFAULT false,
    base_rating integer DEFAULT 5,
    joined_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone,
    CONSTRAINT group_members_base_rating_check CHECK (((base_rating >= 0) AND (base_rating <= 10))),
    CONSTRAINT group_members_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'member'::character varying])::text[])))
);


--
-- Name: COLUMN group_members.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.group_members.deleted_at IS 'Timestamp when member was removed from group. NULL means active.';


--
-- Name: active_group_members; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.active_group_members AS
 SELECT id,
    user_id,
    group_id,
    role,
    is_goalkeeper,
    base_rating,
    joined_at,
    deleted_at
   FROM public.group_members
  WHERE (deleted_at IS NULL);


--
-- Name: VIEW active_group_members; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.active_group_members IS 'Returns only active (non-deleted) group members';


--
-- Name: groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    privacy character varying(20) DEFAULT 'private'::character varying,
    photo_url text,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone,
    CONSTRAINT groups_privacy_check CHECK (((privacy)::text = ANY ((ARRAY['private'::character varying, 'public'::character varying])::text[])))
);


--
-- Name: COLUMN groups.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.groups.deleted_at IS 'Timestamp when group was soft deleted. NULL means active.';


--
-- Name: active_groups; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.active_groups AS
 SELECT id,
    name,
    description,
    privacy,
    photo_url,
    created_by,
    created_at,
    updated_at,
    deleted_at
   FROM public.groups
  WHERE (deleted_at IS NULL);


--
-- Name: VIEW active_groups; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.active_groups IS 'Returns only active (non-deleted) groups';


--
-- Name: charges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.charges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid NOT NULL,
    user_id uuid NOT NULL,
    type character varying(20),
    amount_cents integer NOT NULL,
    due_date date,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    event_id uuid,
    deleted_at timestamp without time zone,
    CONSTRAINT charges_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'canceled'::character varying])::text[]))),
    CONSTRAINT charges_type_check CHECK (((type)::text = ANY ((ARRAY['monthly'::character varying, 'daily'::character varying, 'fine'::character varying, 'other'::character varying])::text[])))
);


--
-- Name: COLUMN charges.event_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.charges.event_id IS 'Optional reference to the event this charge was created from';


--
-- Name: COLUMN charges.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.charges.deleted_at IS 'Timestamp when charge was deleted. NULL means active.';


--
-- Name: draw_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.draw_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid NOT NULL,
    players_per_team integer DEFAULT 7,
    reserves_per_team integer DEFAULT 2,
    gk_count integer DEFAULT 1,
    defender_count integer DEFAULT 2,
    midfielder_count integer DEFAULT 2,
    forward_count integer DEFAULT 2,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT draw_configs_defender_count_check CHECK (((defender_count >= 0) AND (defender_count <= 11))),
    CONSTRAINT draw_configs_forward_count_check CHECK (((forward_count >= 0) AND (forward_count <= 11))),
    CONSTRAINT draw_configs_gk_count_check CHECK (((gk_count >= 0) AND (gk_count <= 5))),
    CONSTRAINT draw_configs_midfielder_count_check CHECK (((midfielder_count >= 0) AND (midfielder_count <= 11))),
    CONSTRAINT draw_configs_players_per_team_check CHECK (((players_per_team >= 1) AND (players_per_team <= 22))),
    CONSTRAINT draw_configs_reserves_per_team_check CHECK (((reserves_per_team >= 0) AND (reserves_per_team <= 11)))
);


--
-- Name: TABLE draw_configs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.draw_configs IS 'Configurações de sorteio de times por grupo';


--
-- Name: COLUMN draw_configs.players_per_team; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.draw_configs.players_per_team IS 'Número de jogadores titulares por time';


--
-- Name: COLUMN draw_configs.reserves_per_team; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.draw_configs.reserves_per_team IS 'Número de reservas por time';


--
-- Name: COLUMN draw_configs.gk_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.draw_configs.gk_count IS 'Número de goleiros necessários por time';


--
-- Name: COLUMN draw_configs.defender_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.draw_configs.defender_count IS 'Número de zagueiros necessários por time';


--
-- Name: COLUMN draw_configs.midfielder_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.draw_configs.midfielder_count IS 'Número de meio-campistas necessários por time';


--
-- Name: COLUMN draw_configs.forward_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.draw_configs.forward_count IS 'Número de atacantes necessários por time';


--
-- Name: event_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_actions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    actor_user_id uuid NOT NULL,
    action_type character varying(30) NOT NULL,
    subject_user_id uuid,
    team_id uuid,
    minute integer,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT event_actions_action_type_check CHECK (((action_type)::text = ANY ((ARRAY['goal'::character varying, 'assist'::character varying, 'save'::character varying, 'tackle'::character varying, 'error'::character varying, 'yellow_card'::character varying, 'red_card'::character varying, 'period_start'::character varying, 'period_end'::character varying])::text[])))
);


--
-- Name: event_attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role character varying(20) DEFAULT 'line'::character varying,
    status character varying(20) DEFAULT 'no'::character varying,
    checked_in_at timestamp without time zone,
    order_of_arrival integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    preferred_position character varying(20),
    secondary_position character varying(20),
    removed_by_self_at timestamp without time zone,
    CONSTRAINT event_attendance_preferred_position_check CHECK (((preferred_position)::text = ANY ((ARRAY['gk'::character varying, 'defender'::character varying, 'midfielder'::character varying, 'forward'::character varying])::text[]))),
    CONSTRAINT event_attendance_role_check CHECK (((role)::text = ANY ((ARRAY['gk'::character varying, 'line'::character varying])::text[]))),
    CONSTRAINT event_attendance_secondary_position_check CHECK (((secondary_position)::text = ANY ((ARRAY['gk'::character varying, 'defender'::character varying, 'midfielder'::character varying, 'forward'::character varying])::text[]))),
    CONSTRAINT event_attendance_status_check CHECK (((status)::text = ANY ((ARRAY['yes'::character varying, 'no'::character varying, 'waitlist'::character varying])::text[])))
);


--
-- Name: COLUMN event_attendance.preferred_position; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_attendance.preferred_position IS 'Primeira posição preferida do jogador (goleiro, zagueiro, meio-campo, atacante)';


--
-- Name: COLUMN event_attendance.secondary_position; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_attendance.secondary_position IS 'Segunda posição preferida do jogador como alternativa';


--
-- Name: COLUMN event_attendance.removed_by_self_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_attendance.removed_by_self_at IS 'Timestamp quando usuário mudou status de yes para no (auto-remoção)';


--
-- Name: event_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_settings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    group_id uuid NOT NULL,
    min_players integer DEFAULT 4,
    max_players integer DEFAULT 22,
    max_waitlist integer DEFAULT 10,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT event_settings_max_players_check CHECK (((max_players >= 1) AND (max_players <= 50))),
    CONSTRAINT event_settings_max_waitlist_check CHECK (((max_waitlist >= 0) AND (max_waitlist <= 50))),
    CONSTRAINT event_settings_min_players_check CHECK (((min_players >= 1) AND (min_players <= 22)))
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid NOT NULL,
    starts_at timestamp without time zone NOT NULL,
    venue_id uuid,
    max_players integer DEFAULT 22,
    max_goalkeepers integer DEFAULT 2,
    status character varying(20) DEFAULT 'scheduled'::character varying,
    waitlist_enabled boolean DEFAULT true,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT events_status_check CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'live'::character varying, 'finished'::character varying, 'canceled'::character varying])::text[])))
);


--
-- Name: invites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid NOT NULL,
    code character varying(20) NOT NULL,
    created_by uuid,
    expires_at timestamp without time zone,
    max_uses integer,
    used_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


--
-- Name: COLUMN invites.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.invites.deleted_at IS 'Timestamp when invite was deleted. NULL means active.';


--
-- Name: teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    name character varying(50) NOT NULL,
    seed integer DEFAULT 0,
    is_winner boolean,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: mv_event_scoreboard; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.mv_event_scoreboard AS
 SELECT ea.event_id,
    ea.team_id,
    t.name AS team_name,
    count(
        CASE
            WHEN ((ea.action_type)::text = 'goal'::text) THEN 1
            ELSE NULL::integer
        END) AS goals,
    count(
        CASE
            WHEN ((ea.action_type)::text = 'assist'::text) THEN 1
            ELSE NULL::integer
        END) AS assists
   FROM (public.event_actions ea
     LEFT JOIN public.teams t ON ((ea.team_id = t.id)))
  WHERE ((ea.action_type)::text = ANY ((ARRAY['goal'::character varying, 'assist'::character varying])::text[]))
  GROUP BY ea.event_id, ea.team_id, t.name
  WITH NO DATA;


--
-- Name: mvp_tiebreaker_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mvp_tiebreaker_votes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tiebreaker_id uuid NOT NULL,
    voter_user_id uuid NOT NULL,
    voted_user_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE mvp_tiebreaker_votes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.mvp_tiebreaker_votes IS 'Votes cast during MVP tiebreaker rounds';


--
-- Name: COLUMN mvp_tiebreaker_votes.tiebreaker_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.mvp_tiebreaker_votes.tiebreaker_id IS 'Reference to the tiebreaker round';


--
-- Name: COLUMN mvp_tiebreaker_votes.voter_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.mvp_tiebreaker_votes.voter_user_id IS 'User casting the vote';


--
-- Name: COLUMN mvp_tiebreaker_votes.voted_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.mvp_tiebreaker_votes.voted_user_id IS 'User receiving the vote (must be in tied_user_ids)';


--
-- Name: mvp_tiebreakers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mvp_tiebreakers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    event_id uuid NOT NULL,
    round integer DEFAULT 1 NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    tied_user_ids uuid[] NOT NULL,
    winner_user_id uuid,
    decided_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    CONSTRAINT mvp_tiebreakers_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'voting'::character varying, 'completed'::character varying, 'admin_decided'::character varying])::text[])))
);


--
-- Name: TABLE mvp_tiebreakers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.mvp_tiebreakers IS 'Manages MVP voting tiebreakers for events';


--
-- Name: COLUMN mvp_tiebreakers.round; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.mvp_tiebreakers.round IS 'Tiebreaker round number (starts at 1)';


--
-- Name: COLUMN mvp_tiebreakers.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.mvp_tiebreakers.status IS 'pending: detected but not started | voting: active voting | completed: resolved via votes | admin_decided: admin chose winner';


--
-- Name: COLUMN mvp_tiebreakers.tied_user_ids; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.mvp_tiebreakers.tied_user_ids IS 'Array of user IDs that are tied';


--
-- Name: COLUMN mvp_tiebreakers.winner_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.mvp_tiebreakers.winner_user_id IS 'Final MVP winner after tiebreaker';


--
-- Name: COLUMN mvp_tiebreakers.decided_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.mvp_tiebreakers.decided_by IS 'User ID of admin who decided (if admin_decided)';


--
-- Name: player_ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.player_ratings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    rater_user_id uuid NOT NULL,
    rated_user_id uuid NOT NULL,
    score integer,
    tags text[],
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT player_ratings_score_check CHECK (((score >= 0) AND (score <= 10)))
);


--
-- Name: scoring_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scoring_configs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    group_id uuid NOT NULL,
    points_win integer DEFAULT 3,
    points_draw integer DEFAULT 1,
    points_loss integer DEFAULT 0,
    points_goal integer DEFAULT 0,
    points_assist integer DEFAULT 0,
    points_mvp integer DEFAULT 0,
    points_presence integer DEFAULT 0,
    ranking_mode character varying(20) DEFAULT 'standard'::character varying,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT scoring_configs_points_assist_check CHECK (((points_assist >= 0) AND (points_assist <= 10))),
    CONSTRAINT scoring_configs_points_draw_check CHECK (((points_draw >= 0) AND (points_draw <= 10))),
    CONSTRAINT scoring_configs_points_goal_check CHECK (((points_goal >= 0) AND (points_goal <= 10))),
    CONSTRAINT scoring_configs_points_loss_check CHECK (((points_loss >= 0) AND (points_loss <= 10))),
    CONSTRAINT scoring_configs_points_mvp_check CHECK (((points_mvp >= 0) AND (points_mvp <= 10))),
    CONSTRAINT scoring_configs_points_presence_check CHECK (((points_presence >= 0) AND (points_presence <= 10))),
    CONSTRAINT scoring_configs_points_win_check CHECK (((points_win >= 0) AND (points_win <= 10))),
    CONSTRAINT scoring_configs_ranking_mode_check CHECK (((ranking_mode)::text = ANY ((ARRAY['standard'::character varying, 'complete'::character varying])::text[])))
);


--
-- Name: team_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    user_id uuid NOT NULL,
    "position" character varying(20) DEFAULT 'line'::character varying,
    starter boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT team_members_position_check CHECK ((("position")::text = ANY ((ARRAY['gk'::character varying, 'defender'::character varying, 'midfielder'::character varying, 'forward'::character varying, 'line'::character varying])::text[])))
);


--
-- Name: COLUMN team_members."position"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.team_members."position" IS 'Posição do jogador no time (goleiro, zagueiro, meio-campo, atacante, ou linha genérica)';


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    wallet_id uuid NOT NULL,
    charge_id uuid,
    type character varying(10),
    amount_cents integer NOT NULL,
    method character varying(20),
    notes text,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT transactions_method_check CHECK (((method)::text = ANY ((ARRAY['cash'::character varying, 'pix'::character varying, 'card'::character varying, 'transfer'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT transactions_type_check CHECK (((type)::text = ANY ((ARRAY['credit'::character varying, 'debit'::character varying])::text[])))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    email_verified timestamp without time zone,
    password_hash text,
    image text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    reset_token text,
    reset_token_expiry timestamp without time zone
);


--
-- Name: COLUMN users.reset_token; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.reset_token IS 'Token for password reset (valid for 1 hour)';


--
-- Name: COLUMN users.reset_token_expiry; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.reset_token_expiry IS 'Expiry timestamp for reset token';


--
-- Name: venues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.venues (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid,
    name character varying(255) NOT NULL,
    address text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_type character varying(10),
    owner_id uuid NOT NULL,
    balance_cents integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT wallets_owner_type_check CHECK (((owner_type)::text = ANY ((ARRAY['group'::character varying, 'user'::character varying])::text[])))
);


--
-- Data for Name: charges; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.charges (id, group_id, user_id, type, amount_cents, due_date, status, created_at, updated_at, event_id, deleted_at) FROM stdin;
7fafa59e-9df3-432f-adfd-9431c99c81cc	aaaabbbb-cccc-dddd-eeee-111111111111	11111111-1111-1111-1111-111111111111	daily	2000	2025-11-26	pending	2025-11-17 23:08:24.791318	2025-11-17 23:08:24.791318	\N	\N
bd51ef32-cde6-4e65-a003-2e93aab164b7	aaaabbbb-cccc-dddd-eeee-111111111111	55555555-5555-5555-5555-555555555555	daily	2000	2025-11-26	pending	2025-11-17 23:08:24.827482	2025-11-17 23:08:24.827482	\N	\N
e4753444-e49d-4805-ab21-16b8616dfde7	aaaabbbb-cccc-dddd-eeee-111111111111	22222222-2222-2222-2222-222222222222	daily	2000	2025-11-26	pending	2025-11-17 23:08:25.407909	2025-11-17 23:08:25.407909	\N	\N
758b71c7-dc8d-46f5-b95d-197f65f73401	aaaabbbb-cccc-dddd-eeee-111111111111	99999999-9999-9999-9999-999999999999	daily	2000	2025-11-26	pending	2025-11-17 23:08:25.411182	2025-11-17 23:08:25.411182	\N	\N
875b415f-a2af-41dc-a9db-f00fadee1979	aaaabbbb-cccc-dddd-eeee-111111111111	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	daily	2000	2025-11-26	pending	2025-11-17 23:08:25.41796	2025-11-17 23:08:25.41796	\N	\N
b2a90923-0889-47d9-8ded-199c58e93084	aaaabbbb-cccc-dddd-eeee-111111111111	66666666-6666-6666-6666-666666666666	daily	2000	2025-11-26	pending	2025-11-17 23:08:25.421283	2025-11-17 23:08:25.421283	\N	\N
eb1fc7e3-ff3e-455d-9458-a6d1b472cfcf	aaaabbbb-cccc-dddd-eeee-111111111111	44444444-4444-4444-4444-444444444444	daily	2000	2025-11-26	pending	2025-11-17 23:08:25.432608	2025-11-17 23:08:25.432608	\N	\N
d4e9aa97-2efc-4675-b946-d1100339c1c3	aaaabbbb-cccc-dddd-eeee-111111111111	33333333-3333-3333-3333-333333333333	daily	2000	2025-11-26	pending	2025-11-17 23:08:25.450987	2025-11-17 23:08:25.450987	\N	\N
95949f05-0e6f-43de-9eed-97b95d10aa62	aaaabbbb-cccc-dddd-eeee-111111111111	77777777-7777-7777-7777-777777777777	daily	2000	2025-11-26	pending	2025-11-17 23:08:25.452194	2025-11-17 23:08:25.452194	\N	\N
e040b30b-e5f2-4bde-815f-95b198d305c0	aaaabbbb-cccc-dddd-eeee-111111111111	88888888-8888-8888-8888-888888888888	daily	2000	2025-11-26	pending	2025-11-17 23:08:25.479076	2025-11-17 23:08:25.479076	\N	\N
684ba65f-e79e-4e8d-b2a7-ab1ab456f4ed	aaaabbbb-cccc-dddd-eeee-111111111111	33333333-3333-3333-3333-333333333333	daily	1000	2025-11-19	pending	2025-11-17 23:23:29.233806	2025-11-17 23:23:29.233806	\N	\N
a112a5b5-28c9-4687-81ea-dbe0bdb6e2ea	aaaabbbb-cccc-dddd-eeee-111111111111	44444444-4444-4444-4444-444444444444	daily	1000	2025-11-19	pending	2025-11-17 23:23:29.333018	2025-11-17 23:23:29.333018	\N	\N
1d4b9724-dab4-4fb4-97fc-9815d6b373fa	aaaabbbb-cccc-dddd-eeee-111111111111	88888888-8888-8888-8888-888888888888	daily	1000	2025-11-19	pending	2025-11-17 23:23:29.449565	2025-11-17 23:23:29.449565	\N	\N
71aec8ff-03aa-4d74-a445-f9073b55b652	aaaabbbb-cccc-dddd-eeee-111111111111	55555555-5555-5555-5555-555555555555	daily	1000	2025-11-19	pending	2025-11-17 23:23:29.559018	2025-11-17 23:23:29.559018	\N	\N
9d726228-a4b7-4d6a-96a1-aab639e3378b	aaaabbbb-cccc-dddd-eeee-111111111111	cccccccc-cccc-cccc-cccc-cccccccccccc	daily	1000	2025-11-19	pending	2025-11-17 23:23:30.244667	2025-11-17 23:23:30.244667	\N	\N
eb92ed6b-5d82-401a-94a0-240ac47e520c	aaaabbbb-cccc-dddd-eeee-111111111111	99999999-9999-9999-9999-999999999999	daily	1000	2025-11-19	pending	2025-11-17 23:23:30.247608	2025-11-17 23:23:30.247608	\N	\N
36cecd39-184f-4590-946c-7b973581a654	aaaabbbb-cccc-dddd-eeee-111111111111	11111111-1111-1111-1111-111111111111	daily	1000	2025-11-19	pending	2025-11-17 23:23:30.321743	2025-11-17 23:23:30.321743	\N	\N
c2d2a5bb-8cf4-4948-ac5c-2fb4fa6f24c1	aaaabbbb-cccc-dddd-eeee-111111111111	22222222-2222-2222-2222-222222222222	daily	1000	2025-11-19	pending	2025-11-17 23:23:30.331539	2025-11-17 23:23:30.331539	\N	\N
c24ff2dc-f8eb-4c71-84c7-c4e37708c9e6	aaaabbbb-cccc-dddd-eeee-111111111111	77777777-7777-7777-7777-777777777777	daily	1000	2025-11-19	pending	2025-11-17 23:23:30.333939	2025-11-17 23:23:30.333939	\N	\N
27b06844-b908-4a0f-a50f-ddc013edf790	aaaabbbb-cccc-dddd-eeee-111111111111	66666666-6666-6666-6666-666666666666	daily	1000	2025-11-19	pending	2025-11-17 23:23:30.3418	2025-11-17 23:23:30.3418	\N	\N
480e55ef-ebaf-4a84-a21e-dfe298ad8638	aaaabbbb-cccc-dddd-eeee-111111111111	77777777-7777-7777-7777-777777777777	monthly	7143	\N	pending	2025-11-18 01:14:26.926988	2025-11-18 01:14:26.926988	1e525f5a-d834-4273-98d5-a98884260c62	\N
29c84758-b79d-44bc-b60a-da3d056a176a	aaaabbbb-cccc-dddd-eeee-111111111111	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	monthly	7143	\N	pending	2025-11-18 01:14:26.957082	2025-11-18 01:14:26.957082	1e525f5a-d834-4273-98d5-a98884260c62	\N
bd3995ec-9112-492a-a517-6c18dd612a7b	aaaabbbb-cccc-dddd-eeee-111111111111	cccccccc-cccc-cccc-cccc-cccccccccccc	monthly	7143	\N	pending	2025-11-18 01:14:27.061111	2025-11-18 01:14:27.061111	1e525f5a-d834-4273-98d5-a98884260c62	\N
81b6f55e-075e-448b-87b6-82a5c5690617	aaaabbbb-cccc-dddd-eeee-111111111111	33333333-3333-3333-3333-333333333333	monthly	7143	\N	pending	2025-11-18 01:14:27.132868	2025-11-18 01:14:27.132868	1e525f5a-d834-4273-98d5-a98884260c62	\N
3584a088-985c-4c15-82c8-8eb491549f50	aaaabbbb-cccc-dddd-eeee-111111111111	99999999-9999-9999-9999-999999999999	monthly	7143	\N	pending	2025-11-18 01:14:27.871728	2025-11-18 01:14:27.871728	1e525f5a-d834-4273-98d5-a98884260c62	\N
145eef16-6f19-4304-9819-169ee2bd5a3d	aaaabbbb-cccc-dddd-eeee-111111111111	d913c0fa-fec7-49a1-ba7b-21602fdf43ee	monthly	7143	\N	pending	2025-11-18 01:14:27.906421	2025-11-18 01:14:27.906421	1e525f5a-d834-4273-98d5-a98884260c62	\N
4d87cafa-9805-43e1-a6af-d4fcf992e7bb	aaaabbbb-cccc-dddd-eeee-111111111111	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	monthly	7143	\N	pending	2025-11-18 01:14:27.934876	2025-11-18 01:14:27.934876	1e525f5a-d834-4273-98d5-a98884260c62	\N
917e260f-c908-40fc-896a-69552a998545	aaaabbbb-cccc-dddd-eeee-111111111111	88888888-8888-8888-8888-888888888888	monthly	7143	\N	pending	2025-11-18 01:14:27.966535	2025-11-18 01:14:27.966535	1e525f5a-d834-4273-98d5-a98884260c62	\N
fc9e78d3-f2a7-4917-ad0a-3ee89bb6eb89	aaaabbbb-cccc-dddd-eeee-111111111111	11111111-1111-1111-1111-111111111111	monthly	7143	\N	pending	2025-11-18 01:14:27.98754	2025-11-18 01:14:27.98754	1e525f5a-d834-4273-98d5-a98884260c62	\N
a48b2b65-c0bd-4bd8-af52-18da9cdd7cc0	aaaabbbb-cccc-dddd-eeee-111111111111	22222222-2222-2222-2222-222222222222	monthly	7143	\N	pending	2025-11-18 01:14:27.988916	2025-11-18 01:14:27.988916	1e525f5a-d834-4273-98d5-a98884260c62	\N
1bc5b8a5-45f4-46b6-84c6-283b7bb55388	aaaabbbb-cccc-dddd-eeee-111111111111	4fe52ffd-10eb-4fd8-b3ca-382b242a64ea	monthly	7143	\N	pending	2025-11-18 01:14:28.005872	2025-11-18 01:14:28.005872	1e525f5a-d834-4273-98d5-a98884260c62	\N
7c99523d-9b7d-4632-9515-254f86fd4427	aaaabbbb-cccc-dddd-eeee-111111111111	66666666-6666-6666-6666-666666666666	monthly	7143	\N	pending	2025-11-18 01:14:28.031089	2025-11-18 01:14:28.031089	1e525f5a-d834-4273-98d5-a98884260c62	\N
aff642a1-4a03-4e7f-8489-d4bcee55e16f	aaaabbbb-cccc-dddd-eeee-111111111111	55555555-5555-5555-5555-555555555555	monthly	7143	\N	pending	2025-11-18 01:14:28.034088	2025-11-18 01:14:28.034088	1e525f5a-d834-4273-98d5-a98884260c62	\N
a17a64b9-890d-40fd-a6c7-b84728052058	aaaabbbb-cccc-dddd-eeee-111111111111	44444444-4444-4444-4444-444444444444	monthly	7143	\N	pending	2025-11-18 01:14:28.040422	2025-11-18 01:14:28.040422	1e525f5a-d834-4273-98d5-a98884260c62	\N
4b0daeb5-65a0-497a-968f-68c0ce872182	aaaabbbb-cccc-dddd-eeee-111111111111	11111111-1111-1111-1111-111111111111	daily	5000	2025-11-28	pending	2025-11-28 20:27:12.116484	2025-11-28 20:27:12.116484	4cab49e5-b655-461e-860b-f75cc86b8999	\N
4def1f08-7a52-45a0-b811-292eb62a7fc5	aaaabbbb-cccc-dddd-eeee-111111111111	33333333-3333-3333-3333-333333333333	daily	5000	2025-11-28	paid	2025-11-28 20:27:12.841931	2025-11-28 20:27:35.35374	4cab49e5-b655-461e-860b-f75cc86b8999	\N
0d8a90f4-01dc-40db-8852-66f6f2815995	0106aace-cb71-4389-bd4c-49003a20b717	33333333-3333-3333-3333-333333333333	monthly	5000	2026-01-10	pending	2025-12-08 18:10:28.230487	2025-12-08 18:10:28.230487	\N	\N
1f481988-bb78-42a6-8b58-95cf920424cb	aaaabbbb-cccc-dddd-eeee-222222222222	55555555-5555-5555-5555-555555555555	monthly	6000	2026-01-13	paid	2026-01-12 18:23:03.693929	2026-01-12 18:23:07.823276	\N	\N
7d5ff3d3-ce88-4761-95fa-a48781d010ea	aaaabbbb-cccc-dddd-eeee-222222222222	99999999-9999-9999-9999-999999999999	daily	6000	2026-01-13	paid	2026-01-12 18:22:28.856116	2026-01-12 18:23:16.933822	\N	\N
ef5390ff-c0f9-4bdd-a8d0-8c94c9b78353	aaaabbbb-cccc-dddd-eeee-111111111111	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	daily	5000	2025-11-28	paid	2025-11-28 20:27:12.831762	2026-02-07 13:37:20.148576	4cab49e5-b655-461e-860b-f75cc86b8999	\N
db493c2b-a099-4c5b-8283-d706a2679861	aaaabbbb-cccc-dddd-eeee-111111111111	3f7043e5-3379-4f94-8ece-bebc99db71c2	daily	5000	2025-11-28	paid	2025-11-28 20:27:12.728648	2026-02-07 13:38:22.25377	4cab49e5-b655-461e-860b-f75cc86b8999	\N
7b260af5-9f3a-4bde-bbf6-0965536849a2	673a26b1-7390-4fd3-824b-3e2ea8fddacc	e133eacc-09e1-4d95-8c9e-e5d555ae11d2	monthly	6000	2026-02-11	pending	2026-02-11 13:32:23.829857	2026-02-11 13:32:23.829857	\N	\N
b0ded917-378f-4c1a-8f9e-20c2a39651a0	673a26b1-7390-4fd3-824b-3e2ea8fddacc	868aab20-5bcb-49ad-9419-ac5fa5aebd30	monthly	2500	2026-02-21	pending	2026-02-11 13:33:42.287741	2026-02-11 13:33:42.287741	\N	\N
2a4f1a6d-5db4-4cb6-9f41-8175d9b646d9	673a26b1-7390-4fd3-824b-3e2ea8fddacc	3d3b3929-2627-4712-88db-cb5a8490d2e7	monthly	6000	2026-02-11	paid	2026-02-11 13:31:51.455038	2026-02-11 13:51:48.746967	\N	\N
c97c1d8a-9c75-44c9-b42b-5930db673030	673a26b1-7390-4fd3-824b-3e2ea8fddacc	fb647db8-10fa-4d7c-a19e-440b084768b4	monthly	6000	2026-02-11	paid	2026-02-11 13:36:08.153462	2026-02-11 15:39:59.406073	\N	\N
fbaa9ed4-b56c-401a-817b-9a096247666c	673a26b1-7390-4fd3-824b-3e2ea8fddacc	05bd251d-85f8-40c0-834e-fe627e3a63ad	monthly	6000	2026-02-11	paid	2026-02-11 13:35:57.431547	2026-02-11 15:40:07.801964	\N	\N
cc46f074-9c59-498f-99e9-26dd8e2fdaf9	673a26b1-7390-4fd3-824b-3e2ea8fddacc	cbe1706f-2284-4dc2-9f5f-37038b72c11a	monthly	6000	2026-02-11	canceled	2026-02-11 13:37:17.580261	2026-02-11 15:40:17.673295	\N	\N
31a5f2e2-8313-42ad-9477-1298626ea83e	673a26b1-7390-4fd3-824b-3e2ea8fddacc	d8c54b42-d79d-4d82-aa02-5e60240cab42	monthly	6000	2026-02-11	canceled	2026-02-11 13:36:42.327796	2026-02-11 15:40:24.597138	\N	\N
cb348346-1a03-4749-9c9e-8e78a3240831	673a26b1-7390-4fd3-824b-3e2ea8fddacc	8bec2716-c2bc-4e7a-bdf1-e727e210aa8a	monthly	6000	2026-02-11	paid	2026-02-11 13:34:15.208186	2026-02-11 15:40:45.044525	\N	\N
04ef1f5f-dc22-4720-aa99-183aafead4aa	673a26b1-7390-4fd3-824b-3e2ea8fddacc	40ea3527-4c0c-4652-868f-f1a24e534a4b	monthly	6000	2026-02-11	paid	2026-02-11 13:34:03.685268	2026-02-11 15:40:54.938673	\N	\N
4acad610-8271-456f-882c-b9c4305065c4	673a26b1-7390-4fd3-824b-3e2ea8fddacc	f71f03cb-b7a0-4d75-820c-d7a46369697e	monthly	6000	2026-02-11	paid	2026-02-11 13:32:34.110113	2026-02-11 15:41:07.012215	\N	\N
31e0b6a9-8106-4aea-8db8-f49767c6d6cd	673a26b1-7390-4fd3-824b-3e2ea8fddacc	0ce3e02e-5ba1-4117-9169-664cb1b86649	monthly	6000	2026-02-11	paid	2026-02-11 13:36:22.993897	2026-02-17 20:30:41.653487	\N	\N
43da02d5-5da9-43b1-9fed-61ce6b194ab4	673a26b1-7390-4fd3-824b-3e2ea8fddacc	f5cf48d3-54d9-4d94-8fb9-132952633900	monthly	6000	2026-02-11	paid	2026-02-11 13:35:44.881412	2026-02-17 20:31:23.941239	\N	\N
afea2b59-f93a-4582-ab15-6c9c999c9f8b	673a26b1-7390-4fd3-824b-3e2ea8fddacc	47bde709-ca3b-402c-b47b-f608a445eced	monthly	6000	2026-02-11	paid	2026-02-11 13:33:53.774846	2026-02-17 20:31:43.429293	\N	\N
860e0c1a-a6db-41b9-bcc0-97263b64ea5f	673a26b1-7390-4fd3-824b-3e2ea8fddacc	7c6a1e59-ee48-4570-a005-cbb09ccc7bb5	monthly	6000	2026-02-11	paid	2026-02-11 13:35:07.128113	2026-02-17 20:32:26.207383	\N	\N
f631c821-1d82-438c-a40d-bf7e7e481441	673a26b1-7390-4fd3-824b-3e2ea8fddacc	908b7128-79d7-4f8d-a4a8-4753ffb31ddd	monthly	6000	2026-02-11	paid	2026-02-11 13:32:04.507438	2026-02-17 20:32:56.090041	\N	\N
fe401b29-67c7-4cac-b60d-80cd39363f34	673a26b1-7390-4fd3-824b-3e2ea8fddacc	79efc563-10ae-4693-80b4-ee485c76afb0	monthly	6000	2026-02-11	paid	2026-02-11 13:31:04.074428	2026-02-17 20:33:26.540472	\N	\N
cb5f7e55-b688-4783-b460-8570ce384fe3	673a26b1-7390-4fd3-824b-3e2ea8fddacc	6e9d11ce-69eb-4841-997a-9202de0e1a1f	monthly	6000	2026-02-11	paid	2026-02-11 13:35:33.14657	2026-02-17 20:50:25.745973	\N	\N
cd8993a5-24b4-45a7-93c5-f001ccfc1977	673a26b1-7390-4fd3-824b-3e2ea8fddacc	60a7aa8f-b320-4fc1-8dbb-2f22e770e985	monthly	6000	2026-02-11	paid	2026-02-11 13:34:56.418558	2026-02-17 20:50:32.805129	\N	\N
50883db7-024c-4a91-886c-6b799a4cfc03	673a26b1-7390-4fd3-824b-3e2ea8fddacc	16fd5577-dfa1-4875-9dc3-9570fa41d6a1	monthly	6000	2026-02-11	paid	2026-02-11 13:34:42.834453	2026-02-17 20:50:45.41014	\N	\N
66fb299e-aa1c-4ea7-9664-e800f04b544d	673a26b1-7390-4fd3-824b-3e2ea8fddacc	9ac9f410-f53b-412a-9263-e26fc68a08ab	monthly	6000	2026-02-11	paid	2026-02-11 13:34:31.102455	2026-02-17 20:50:52.906376	\N	\N
87fe8f0c-ba13-46b9-acce-5867ccbe18d3	673a26b1-7390-4fd3-824b-3e2ea8fddacc	34421d84-5293-4bc2-aef6-62fd61eeb0d2	monthly	6000	2026-02-11	paid	2026-02-11 13:35:18.569729	2026-02-18 12:45:42.234319	\N	\N
404b10b8-95a6-42e1-8667-6535034b2428	673a26b1-7390-4fd3-824b-3e2ea8fddacc	05c0aeff-3b21-4fe8-a652-72cfbacafbe7	monthly	6000	2026-02-11	paid	2026-02-11 13:31:19.47787	2026-02-18 12:46:18.187379	\N	\N
074c7b8c-4e15-4797-baee-8b0b222e0434	673a26b1-7390-4fd3-824b-3e2ea8fddacc	a2ead9b4-c4a6-4483-8fa5-3d374a4f3d41	monthly	2500	2026-02-14	paid	2026-02-11 15:41:57.981943	2026-02-17 20:30:24.697107	\N	\N
\.


--
-- Data for Name: draw_configs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.draw_configs (id, group_id, players_per_team, reserves_per_team, gk_count, defender_count, midfielder_count, forward_count, created_by, created_at, updated_at) FROM stdin;
731c719d-0934-411a-b0fe-5ad4c2e75152	aaaabbbb-cccc-dddd-eeee-111111111111	7	2	1	2	2	2	33333333-3333-3333-3333-333333333333	2025-11-01 21:18:16.739302+00	2025-11-01 21:18:16.739302+00
\.


--
-- Data for Name: event_actions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.event_actions (id, event_id, actor_user_id, action_type, subject_user_id, team_id, minute, metadata, created_at) FROM stdin;
b45a56f1-fde9-4f1e-a58f-d9d6c53ec98f	e1111111-1111-1111-1111-111111111111	44444444-4444-4444-4444-444444444444	goal	\N	aaaa1111-1111-1111-1111-111111111111	5	\N	2025-10-28 13:47:43.317599
1f3be0bb-67ef-46d5-a696-92553409fddb	e1111111-1111-1111-1111-111111111111	11111111-1111-1111-1111-111111111111	assist	44444444-4444-4444-4444-444444444444	aaaa1111-1111-1111-1111-111111111111	5	\N	2025-10-28 13:47:43.317599
d3469db2-6c2b-4e4e-8cc5-2ea9838a5d99	e1111111-1111-1111-1111-111111111111	55555555-5555-5555-5555-555555555555	goal	\N	aaaa1111-1111-1111-1111-111111111111	12	\N	2025-10-28 13:47:43.317599
e1a3899f-a374-4ff4-9ae7-800aa9b3347d	e1111111-1111-1111-1111-111111111111	77777777-7777-7777-7777-777777777777	goal	\N	aaaa1111-1111-1111-1111-111111111111	23	\N	2025-10-28 13:47:43.317599
fc7aa961-e1fc-4c23-8915-74078e9eb41b	e1111111-1111-1111-1111-111111111111	44444444-4444-4444-4444-444444444444	assist	77777777-7777-7777-7777-777777777777	aaaa1111-1111-1111-1111-111111111111	23	\N	2025-10-28 13:47:43.317599
31d4fc72-292f-48ce-92d3-b4a6e6088b9f	e1111111-1111-1111-1111-111111111111	44444444-4444-4444-4444-444444444444	goal	\N	aaaa1111-1111-1111-1111-111111111111	38	\N	2025-10-28 13:47:43.317599
446eef08-3645-48c0-b5c7-52d5d407de90	e1111111-1111-1111-1111-111111111111	99999999-9999-9999-9999-999999999999	goal	\N	bbbb1111-1111-1111-1111-111111111111	18	\N	2025-10-28 13:47:43.317599
7f4f7bb4-0a85-4183-9dcf-bffdef85074d	e1111111-1111-1111-1111-111111111111	88888888-8888-8888-8888-888888888888	assist	99999999-9999-9999-9999-999999999999	bbbb1111-1111-1111-1111-111111111111	18	\N	2025-10-28 13:47:43.317599
f5a7f4dc-38d1-4b50-bbe2-4b40229cb4b4	e1111111-1111-1111-1111-111111111111	88888888-8888-8888-8888-888888888888	goal	\N	bbbb1111-1111-1111-1111-111111111111	35	\N	2025-10-28 13:47:43.317599
16188805-1491-432d-bb52-2e5679a0c30f	e1111111-1111-1111-1111-111111111111	22222222-2222-2222-2222-222222222222	save	\N	aaaa1111-1111-1111-1111-111111111111	15	\N	2025-10-28 13:47:43.317599
2e217134-5fb4-43d6-b1fa-d45f7f02ac60	e1111111-1111-1111-1111-111111111111	22222222-2222-2222-2222-222222222222	save	\N	aaaa1111-1111-1111-1111-111111111111	28	\N	2025-10-28 13:47:43.317599
d21c8652-7587-4eb6-ba37-11130ae87048	eeeeee11-1111-1111-1111-111111111111	33333333-3333-3333-3333-333333333333	goal	33333333-3333-3333-3333-333333333333	90e14ca4-85c5-4e90-befd-82055a7dfc99	\N	\N	2025-11-02 15:23:45.709204
8100c156-5afa-45d8-b5ea-3f72baca7646	eeeeee11-1111-1111-1111-111111111111	33333333-3333-3333-3333-333333333333	assist	33333333-3333-3333-3333-333333333333	90e14ca4-85c5-4e90-befd-82055a7dfc99	\N	\N	2025-11-02 15:23:53.857179
9212240f-bdf0-4882-8133-95d41d0c6a7c	eeeeee11-1111-1111-1111-111111111111	33333333-3333-3333-3333-333333333333	red_card	66666666-6666-6666-6666-666666666666	90e14ca4-85c5-4e90-befd-82055a7dfc99	\N	\N	2025-11-02 15:23:56.728896
6cf0dbb5-b549-4f34-af1d-c97b35071143	eeeeee11-1111-1111-1111-111111111111	33333333-3333-3333-3333-333333333333	goal	99999999-9999-9999-9999-999999999999	90e14ca4-85c5-4e90-befd-82055a7dfc99	\N	\N	2025-11-02 15:24:02.01305
94d2c4e2-eff6-4eca-9bb0-763ee5eb00e3	eeeeee11-1111-1111-1111-111111111111	33333333-3333-3333-3333-333333333333	goal	77777777-7777-7777-7777-777777777777	a288a90c-a7d1-47a9-8183-9abf56ff4745	\N	\N	2025-11-02 15:24:06.251715
c4c81ce9-de5c-4cde-9fd1-0e99734589e7	eeeeee11-1111-1111-1111-111111111111	33333333-3333-3333-3333-333333333333	goal	44444444-4444-4444-4444-444444444444	a288a90c-a7d1-47a9-8183-9abf56ff4745	\N	\N	2025-11-02 15:24:08.926493
5a6c3ca1-85c5-4b1c-b113-fd5b91cb497d	eeeeee11-1111-1111-1111-111111111111	33333333-3333-3333-3333-333333333333	goal	44444444-4444-4444-4444-444444444444	a288a90c-a7d1-47a9-8183-9abf56ff4745	\N	\N	2025-11-02 15:24:10.681198
7acd6dbd-e22a-45f6-b4f1-03d0a384a4eb	eeeeee11-1111-1111-1111-111111111111	33333333-3333-3333-3333-333333333333	goal	33333333-3333-3333-3333-333333333333	90e14ca4-85c5-4e90-befd-82055a7dfc99	\N	\N	2025-11-02 15:31:38.565415
718e95c3-18f9-4366-8628-80d62d92dc41	eeeeee11-1111-1111-1111-111111111111	33333333-3333-3333-3333-333333333333	goal	33333333-3333-3333-3333-333333333333	90e14ca4-85c5-4e90-befd-82055a7dfc99	\N	\N	2025-11-02 15:32:09.721415
45bbb2ab-33dc-4196-82c4-4370ce84d831	eeeeee11-1111-1111-1111-111111111111	33333333-3333-3333-3333-333333333333	goal	33333333-3333-3333-3333-333333333333	90e14ca4-85c5-4e90-befd-82055a7dfc99	\N	\N	2025-11-02 15:32:11.86121
b9fadf71-f7db-4375-a5b2-b18dd5958e86	eeeeee11-1111-1111-1111-111111111111	33333333-3333-3333-3333-333333333333	goal	33333333-3333-3333-3333-333333333333	90e14ca4-85c5-4e90-befd-82055a7dfc99	\N	\N	2025-11-02 15:32:13.244402
dfe1aa8e-21dd-4779-b5e7-fcd41619e96c	eeeeee11-1111-1111-1111-111111111111	33333333-3333-3333-3333-333333333333	goal	33333333-3333-3333-3333-333333333333	90e14ca4-85c5-4e90-befd-82055a7dfc99	\N	\N	2025-11-02 15:32:14.579255
a41eef24-494c-453b-91d8-97ac8c7c34ec	eeeeee11-1111-1111-1111-111111111111	33333333-3333-3333-3333-333333333333	goal	33333333-3333-3333-3333-333333333333	90e14ca4-85c5-4e90-befd-82055a7dfc99	\N	\N	2025-11-02 15:36:13.732021
71f9eb43-0347-4b97-ab86-2af0d49d9980	4cab49e5-b655-461e-860b-f75cc86b8999	33333333-3333-3333-3333-333333333333	goal	11111111-1111-1111-1111-111111111111	c8aaf117-b254-4e7c-b1bb-e3d0c9c9a6f8	\N	\N	2025-11-28 20:24:06.693058
74b6a9ed-5dcb-40da-9902-96bc675aa9c5	4cab49e5-b655-461e-860b-f75cc86b8999	33333333-3333-3333-3333-333333333333	yellow_card	11111111-1111-1111-1111-111111111111	c8aaf117-b254-4e7c-b1bb-e3d0c9c9a6f8	\N	\N	2025-11-28 20:24:13.178989
44d4acb7-9299-4e3c-b481-a3047cb3b95b	4cab49e5-b655-461e-860b-f75cc86b8999	33333333-3333-3333-3333-333333333333	goal	3f7043e5-3379-4f94-8ece-bebc99db71c2	49103a86-164e-49b5-83a8-d14ac144fc9c	\N	\N	2025-11-28 20:24:22.251815
7f45e897-3a84-4df0-b015-3b25ef442cbb	0eb13abf-ad96-43d8-b08c-49a11d14ebe6	33333333-3333-3333-3333-333333333333	red_card	55555555-5555-5555-5555-555555555555	4bcd785f-caa7-4cce-b911-bf2ae2df8d42	\N	\N	2025-12-02 00:39:58.102931
d31807bd-0da6-43d9-8074-a5114aca43b6	cfa8bd48-764c-4c0c-afd6-64a4b2675bd0	4fe52ffd-10eb-4fd8-b3ca-382b242a64ea	red_card	4fe52ffd-10eb-4fd8-b3ca-382b242a64ea	df308ea8-24bf-49ba-8fff-90ff365667c9	\N	\N	2025-12-08 18:16:33.085155
046a7c8e-3b8d-406f-a6ed-0de9cda549ec	732cb4e5-7936-4ccf-95a8-083ac8d3dba3	33333333-3333-3333-3333-333333333333	goal	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	1d1e80a8-b0c9-4cdb-a269-edceae2c9713	\N	\N	2025-12-09 14:45:09.746178
a23623f1-ae5b-4e83-b46d-6f9a2b0d5eec	732cb4e5-7936-4ccf-95a8-083ac8d3dba3	33333333-3333-3333-3333-333333333333	goal	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	eec05055-7a1e-4d7b-957d-3da0482f2ec8	\N	\N	2025-12-09 14:45:15.991533
040b0030-4a03-4290-b5a4-908aebe13525	cda8d404-ee00-4736-ab8f-e251c4c1ca17	79efc563-10ae-4693-80b4-ee485c76afb0	goal	a2ead9b4-c4a6-4483-8fa5-3d374a4f3d41	56332735-94e1-43e5-93ce-f63ca760f6b0	\N	\N	2026-01-29 13:00:34.727268
67e0fe3d-a149-41d7-9a53-c33a34a01af9	cda8d404-ee00-4736-ab8f-e251c4c1ca17	79efc563-10ae-4693-80b4-ee485c76afb0	goal	a2ead9b4-c4a6-4483-8fa5-3d374a4f3d41	56332735-94e1-43e5-93ce-f63ca760f6b0	\N	\N	2026-01-29 13:00:38.854602
fdfe5761-fd02-4926-8bbf-5ac1681f7c46	cda8d404-ee00-4736-ab8f-e251c4c1ca17	79efc563-10ae-4693-80b4-ee485c76afb0	goal	3d3b3929-2627-4712-88db-cb5a8490d2e7	56332735-94e1-43e5-93ce-f63ca760f6b0	\N	\N	2026-01-29 13:00:42.603193
62cd9333-e04e-402f-bf35-c3b5920bb3dd	cda8d404-ee00-4736-ab8f-e251c4c1ca17	79efc563-10ae-4693-80b4-ee485c76afb0	goal	908b7128-79d7-4f8d-a4a8-4753ffb31ddd	56332735-94e1-43e5-93ce-f63ca760f6b0	\N	\N	2026-01-29 13:00:46.520141
47ef54f2-70dd-4aef-ae7d-052c9638de13	cda8d404-ee00-4736-ab8f-e251c4c1ca17	79efc563-10ae-4693-80b4-ee485c76afb0	goal	16fd5577-dfa1-4875-9dc3-9570fa41d6a1	56332735-94e1-43e5-93ce-f63ca760f6b0	\N	\N	2026-01-29 13:00:51.326581
b9bc975a-586e-477e-b849-2b57c8d9f8ce	cda8d404-ee00-4736-ab8f-e251c4c1ca17	79efc563-10ae-4693-80b4-ee485c76afb0	goal	fb647db8-10fa-4d7c-a19e-440b084768b4	56332735-94e1-43e5-93ce-f63ca760f6b0	\N	\N	2026-01-29 13:00:57.595208
1c1a72fc-b16a-41c2-bb4f-0e86d318dd62	cda8d404-ee00-4736-ab8f-e251c4c1ca17	79efc563-10ae-4693-80b4-ee485c76afb0	goal	cbe1706f-2284-4dc2-9f5f-37038b72c11a	56332735-94e1-43e5-93ce-f63ca760f6b0	\N	\N	2026-01-29 13:01:03.129392
19a3312d-912b-422a-82e6-2a76292b1875	cda8d404-ee00-4736-ab8f-e251c4c1ca17	79efc563-10ae-4693-80b4-ee485c76afb0	goal	9ac9f410-f53b-412a-9263-e26fc68a08ab	21cd101f-e41b-47b8-a948-5cc172f132af	\N	\N	2026-01-29 13:01:09.402334
ce84a245-9df8-41ab-8ba4-84036839448c	cda8d404-ee00-4736-ab8f-e251c4c1ca17	79efc563-10ae-4693-80b4-ee485c76afb0	goal	60a7aa8f-b320-4fc1-8dbb-2f22e770e985	21cd101f-e41b-47b8-a948-5cc172f132af	\N	\N	2026-01-29 13:01:15.375668
000aa069-6ad9-4505-b292-8464d7b5dc53	cda8d404-ee00-4736-ab8f-e251c4c1ca17	79efc563-10ae-4693-80b4-ee485c76afb0	goal	f71f03cb-b7a0-4d75-820c-d7a46369697e	21cd101f-e41b-47b8-a948-5cc172f132af	\N	\N	2026-01-29 13:01:18.518862
c7fa66d1-59fa-4fb1-9c3d-cb8804bd2a7c	cda8d404-ee00-4736-ab8f-e251c4c1ca17	79efc563-10ae-4693-80b4-ee485c76afb0	goal	7c6a1e59-ee48-4570-a005-cbb09ccc7bb5	21cd101f-e41b-47b8-a948-5cc172f132af	\N	\N	2026-01-29 13:01:24.704528
5e785b53-9c0b-4c24-bfda-880ad9d782d8	cda8d404-ee00-4736-ab8f-e251c4c1ca17	79efc563-10ae-4693-80b4-ee485c76afb0	goal	40ea3527-4c0c-4652-868f-f1a24e534a4b	21cd101f-e41b-47b8-a948-5cc172f132af	\N	\N	2026-01-29 13:01:29.00393
2cb5191a-0896-46aa-aa76-a031a27e41c5	cda8d404-ee00-4736-ab8f-e251c4c1ca17	79efc563-10ae-4693-80b4-ee485c76afb0	goal	40ea3527-4c0c-4652-868f-f1a24e534a4b	21cd101f-e41b-47b8-a948-5cc172f132af	\N	\N	2026-01-29 13:01:33.981985
743db010-7507-416c-ae22-fc1b88a5ef16	c0357338-dac9-4700-85dc-f0a24777e59f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	9ac9f410-f53b-412a-9263-e26fc68a08ab	6fc47ef4-8a3e-4f44-b658-b54e2824fae2	\N	\N	2026-01-29 21:29:46.799541
cf1ef238-fcf8-48a1-a5ce-91b0750c290d	c0357338-dac9-4700-85dc-f0a24777e59f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	f71f03cb-b7a0-4d75-820c-d7a46369697e	6fc47ef4-8a3e-4f44-b658-b54e2824fae2	\N	\N	2026-01-29 21:29:49.236501
bfe10604-fd44-41b0-acb1-8bb7c031c2a7	c0357338-dac9-4700-85dc-f0a24777e59f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	79efc563-10ae-4693-80b4-ee485c76afb0	6fc47ef4-8a3e-4f44-b658-b54e2824fae2	\N	\N	2026-01-29 21:29:52.785316
5d16a6da-2c62-4c6c-9b8c-1069e908790b	c0357338-dac9-4700-85dc-f0a24777e59f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	79efc563-10ae-4693-80b4-ee485c76afb0	6fc47ef4-8a3e-4f44-b658-b54e2824fae2	\N	\N	2026-01-29 21:30:23.384294
b618d1ad-7d8c-49bb-87cc-65357e5cbcc1	c0357338-dac9-4700-85dc-f0a24777e59f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	79efc563-10ae-4693-80b4-ee485c76afb0	6fc47ef4-8a3e-4f44-b658-b54e2824fae2	\N	\N	2026-01-29 21:30:25.792582
68af22c6-6cf1-4121-ad5d-e141135351f1	c0357338-dac9-4700-85dc-f0a24777e59f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	16fd5577-dfa1-4875-9dc3-9570fa41d6a1	6fc47ef4-8a3e-4f44-b658-b54e2824fae2	\N	\N	2026-01-29 21:30:32.582124
3415cae9-5ce5-48b4-9ab6-29703f709cad	c0357338-dac9-4700-85dc-f0a24777e59f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	16fd5577-dfa1-4875-9dc3-9570fa41d6a1	6fc47ef4-8a3e-4f44-b658-b54e2824fae2	\N	\N	2026-01-29 21:30:35.390764
cbdf9f28-b262-4806-9334-2284cf8ac01d	c0357338-dac9-4700-85dc-f0a24777e59f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	3d3b3929-2627-4712-88db-cb5a8490d2e7	6fc47ef4-8a3e-4f44-b658-b54e2824fae2	\N	\N	2026-01-29 21:30:41.638995
696248e2-41a2-4602-8f93-b8954446904b	c0357338-dac9-4700-85dc-f0a24777e59f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	3d3b3929-2627-4712-88db-cb5a8490d2e7	6fc47ef4-8a3e-4f44-b658-b54e2824fae2	\N	\N	2026-01-29 21:30:44.588906
fa12dba8-133e-4376-a1ff-1c49ed76162b	c0357338-dac9-4700-85dc-f0a24777e59f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	cbe1706f-2284-4dc2-9f5f-37038b72c11a	50669443-9432-45b4-a39d-a454ccdc2d67	\N	\N	2026-01-29 21:30:55.128971
d8399cd2-79bf-428c-ac57-0a67ba0b9b14	c0357338-dac9-4700-85dc-f0a24777e59f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	7c6a1e59-ee48-4570-a005-cbb09ccc7bb5	50669443-9432-45b4-a39d-a454ccdc2d67	\N	\N	2026-01-29 21:31:02.201314
d6dcc2c6-58a7-48d4-b555-a23c8e398e7d	c0357338-dac9-4700-85dc-f0a24777e59f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	40ea3527-4c0c-4652-868f-f1a24e534a4b	50669443-9432-45b4-a39d-a454ccdc2d67	\N	\N	2026-01-29 21:31:04.979402
16335ff8-402f-4c6e-a353-9842616f3b3d	c0357338-dac9-4700-85dc-f0a24777e59f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	40ea3527-4c0c-4652-868f-f1a24e534a4b	50669443-9432-45b4-a39d-a454ccdc2d67	\N	\N	2026-01-29 21:31:07.4533
922e2681-d368-4f33-8acb-cf7e638cbdae	c0357338-dac9-4700-85dc-f0a24777e59f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	40ea3527-4c0c-4652-868f-f1a24e534a4b	50669443-9432-45b4-a39d-a454ccdc2d67	\N	\N	2026-01-29 21:31:10.747453
4319b716-12a5-45b8-a529-fde16e444e3a	c0357338-dac9-4700-85dc-f0a24777e59f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	05c0aeff-3b21-4fe8-a652-72cfbacafbe7	50669443-9432-45b4-a39d-a454ccdc2d67	\N	\N	2026-01-29 21:31:16.911948
a2810cde-8e73-498b-84e4-6955652986f4	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	79efc563-10ae-4693-80b4-ee485c76afb0	goal	0ce3e02e-5ba1-4117-9169-664cb1b86649	835b6d00-2288-4f5c-9290-630bb4c00155	\N	\N	2026-01-29 21:39:33.843703
a48719f7-d098-4670-ac81-6734509ea09b	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	79efc563-10ae-4693-80b4-ee485c76afb0	goal	0ce3e02e-5ba1-4117-9169-664cb1b86649	835b6d00-2288-4f5c-9290-630bb4c00155	\N	\N	2026-01-29 21:39:36.452425
fdedf0d2-7542-4ad4-abed-bc5a770586ef	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	79efc563-10ae-4693-80b4-ee485c76afb0	goal	3d3b3929-2627-4712-88db-cb5a8490d2e7	835b6d00-2288-4f5c-9290-630bb4c00155	\N	\N	2026-01-29 21:40:02.177082
6bd50899-659d-46d1-9a24-043bbc695016	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	79efc563-10ae-4693-80b4-ee485c76afb0	goal	fb647db8-10fa-4d7c-a19e-440b084768b4	835b6d00-2288-4f5c-9290-630bb4c00155	\N	\N	2026-01-29 21:40:05.128192
64b35081-2957-4183-8422-2fb42e16e892	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	79efc563-10ae-4693-80b4-ee485c76afb0	goal	fb647db8-10fa-4d7c-a19e-440b084768b4	835b6d00-2288-4f5c-9290-630bb4c00155	\N	\N	2026-01-29 21:40:58.488482
b40eeb50-e6d6-4e2b-9e04-2af6d7403f2a	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	79efc563-10ae-4693-80b4-ee485c76afb0	goal	79efc563-10ae-4693-80b4-ee485c76afb0	abacee3d-b2dd-4e1e-a884-308a37ff2169	\N	\N	2026-01-29 21:41:06.665428
a0b7b0de-6e55-45c4-8b95-bbb7bae30336	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	79efc563-10ae-4693-80b4-ee485c76afb0	goal	f71f03cb-b7a0-4d75-820c-d7a46369697e	abacee3d-b2dd-4e1e-a884-308a37ff2169	\N	\N	2026-01-29 21:41:12.88594
bf9d89f1-f686-43aa-9de4-fb481e35a87a	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	79efc563-10ae-4693-80b4-ee485c76afb0	goal	e133eacc-09e1-4d95-8c9e-e5d555ae11d2	abacee3d-b2dd-4e1e-a884-308a37ff2169	\N	\N	2026-01-29 21:41:15.337618
ed35d83c-b004-46e6-953c-4da2395a1410	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	79efc563-10ae-4693-80b4-ee485c76afb0	goal	908b7128-79d7-4f8d-a4a8-4753ffb31ddd	abacee3d-b2dd-4e1e-a884-308a37ff2169	\N	\N	2026-01-29 21:41:22.821347
3a7e4730-6b17-4495-a167-099ddddd8876	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	79efc563-10ae-4693-80b4-ee485c76afb0	goal	40ea3527-4c0c-4652-868f-f1a24e534a4b	abacee3d-b2dd-4e1e-a884-308a37ff2169	\N	\N	2026-01-29 21:41:26.397955
da38174d-de94-437b-8146-543539f3e665	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	79efc563-10ae-4693-80b4-ee485c76afb0	goal	40ea3527-4c0c-4652-868f-f1a24e534a4b	abacee3d-b2dd-4e1e-a884-308a37ff2169	\N	\N	2026-01-29 21:41:44.000125
bb1ec2e9-e263-45da-8cba-ef1354f97146	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	79efc563-10ae-4693-80b4-ee485c76afb0	goal	40ea3527-4c0c-4652-868f-f1a24e534a4b	abacee3d-b2dd-4e1e-a884-308a37ff2169	\N	\N	2026-01-29 21:41:49.856509
70efa507-f3b1-4a71-8f6e-6ca31c554d43	707352ef-8960-4fed-aca0-c8d0e22ba213	79efc563-10ae-4693-80b4-ee485c76afb0	goal	fb647db8-10fa-4d7c-a19e-440b084768b4	6aec5159-50a8-4868-9d7f-5eabb6f4aae1	\N	\N	2026-02-05 18:43:16.003723
09b80f21-f619-43b4-b195-e18c0fd4ad71	707352ef-8960-4fed-aca0-c8d0e22ba213	79efc563-10ae-4693-80b4-ee485c76afb0	goal	f71f03cb-b7a0-4d75-820c-d7a46369697e	6aec5159-50a8-4868-9d7f-5eabb6f4aae1	\N	\N	2026-02-05 18:43:21.20654
3a35c933-4dae-4f80-918e-2c322893c7d9	707352ef-8960-4fed-aca0-c8d0e22ba213	79efc563-10ae-4693-80b4-ee485c76afb0	goal	908b7128-79d7-4f8d-a4a8-4753ffb31ddd	6aec5159-50a8-4868-9d7f-5eabb6f4aae1	\N	\N	2026-02-05 18:43:24.793307
4593971d-f87f-4490-9367-182d59535ec4	707352ef-8960-4fed-aca0-c8d0e22ba213	79efc563-10ae-4693-80b4-ee485c76afb0	goal	fb647db8-10fa-4d7c-a19e-440b084768b4	6aec5159-50a8-4868-9d7f-5eabb6f4aae1	\N	\N	2026-02-05 18:43:58.878633
9501cfb6-3ec9-46ab-b419-168e55128d3f	707352ef-8960-4fed-aca0-c8d0e22ba213	79efc563-10ae-4693-80b4-ee485c76afb0	goal	79efc563-10ae-4693-80b4-ee485c76afb0	54d2e9a7-a02e-4679-b58e-a9e501c9a28d	\N	\N	2026-02-05 18:44:06.698207
ef53750e-ca1e-4438-9b83-75a5b9fd8376	707352ef-8960-4fed-aca0-c8d0e22ba213	79efc563-10ae-4693-80b4-ee485c76afb0	goal	79efc563-10ae-4693-80b4-ee485c76afb0	54d2e9a7-a02e-4679-b58e-a9e501c9a28d	\N	\N	2026-02-05 18:44:09.384739
2a20b711-2843-4f38-8819-1b5e8ff8443a	707352ef-8960-4fed-aca0-c8d0e22ba213	79efc563-10ae-4693-80b4-ee485c76afb0	goal	9ac9f410-f53b-412a-9263-e26fc68a08ab	54d2e9a7-a02e-4679-b58e-a9e501c9a28d	\N	\N	2026-02-05 18:44:16.850153
41365a92-f07c-4e93-9c87-296a27f53bb9	707352ef-8960-4fed-aca0-c8d0e22ba213	79efc563-10ae-4693-80b4-ee485c76afb0	goal	9ac9f410-f53b-412a-9263-e26fc68a08ab	54d2e9a7-a02e-4679-b58e-a9e501c9a28d	\N	\N	2026-02-05 18:44:19.364885
b4baf165-aad0-44c1-8e6c-2514501ae05e	707352ef-8960-4fed-aca0-c8d0e22ba213	79efc563-10ae-4693-80b4-ee485c76afb0	goal	f5cf48d3-54d9-4d94-8fb9-132952633900	54d2e9a7-a02e-4679-b58e-a9e501c9a28d	\N	\N	2026-02-05 18:44:24.145117
7ca03ce8-4f0e-4388-8ce8-d694513a8706	707352ef-8960-4fed-aca0-c8d0e22ba213	79efc563-10ae-4693-80b4-ee485c76afb0	goal	3d3b3929-2627-4712-88db-cb5a8490d2e7	54d2e9a7-a02e-4679-b58e-a9e501c9a28d	\N	\N	2026-02-05 18:44:32.426912
358a7900-fe1c-408b-ab25-0aa23513b6ca	bb610f7e-f23c-4105-bf33-137155422532	33333333-3333-3333-3333-333333333333	goal	33333333-3333-3333-3333-333333333333	5656a237-8251-48a1-b0de-6d2c9335cd9c	\N	\N	2026-02-07 13:33:06.238273
e6bb3b7f-37f0-4216-bb07-8c4fe73ba603	bb610f7e-f23c-4105-bf33-137155422532	33333333-3333-3333-3333-333333333333	goal	22222222-2222-2222-2222-222222222222	5656a237-8251-48a1-b0de-6d2c9335cd9c	\N	\N	2026-02-07 13:33:12.401666
fe8c719f-0f0e-49d2-a206-9be02578167e	bb610f7e-f23c-4105-bf33-137155422532	33333333-3333-3333-3333-333333333333	assist	77777777-7777-7777-7777-777777777777	5656a237-8251-48a1-b0de-6d2c9335cd9c	\N	\N	2026-02-07 13:33:15.578995
d8a8eb87-7d64-4ecc-a4fd-6da1af6d0cdd	bb610f7e-f23c-4105-bf33-137155422532	33333333-3333-3333-3333-333333333333	goal	eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee	5656a237-8251-48a1-b0de-6d2c9335cd9c	\N	\N	2026-02-07 13:33:20.127155
6415830d-9c93-468f-b771-99446e90f569	bb610f7e-f23c-4105-bf33-137155422532	33333333-3333-3333-3333-333333333333	goal	dddddddd-dddd-dddd-dddd-dddddddddddd	a68ea565-f44b-49f4-a77e-b5f0297fe1c1	\N	\N	2026-02-07 13:33:24.67601
f786e3b5-8894-4fc1-817e-2fb64003a4c9	bb610f7e-f23c-4105-bf33-137155422532	33333333-3333-3333-3333-333333333333	assist	11111111-1111-1111-1111-111111111111	a68ea565-f44b-49f4-a77e-b5f0297fe1c1	\N	\N	2026-02-07 13:33:29.38997
b2eb5ef3-859e-4ede-bfc9-5cf918f4ba3d	d430a65b-1474-40ad-b3e8-b91086eb029f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	fb647db8-10fa-4d7c-a19e-440b084768b4	9d176205-6e89-43af-8b4e-61652326f065	\N	\N	2026-02-12 16:28:22.30374
3b5c4bb7-b0f4-423b-9f59-be09d64c01a2	d430a65b-1474-40ad-b3e8-b91086eb029f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	fb647db8-10fa-4d7c-a19e-440b084768b4	9d176205-6e89-43af-8b4e-61652326f065	\N	\N	2026-02-12 16:28:28.399416
feab91f2-a900-492a-9d24-a77ad54d86a3	d430a65b-1474-40ad-b3e8-b91086eb029f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	fb647db8-10fa-4d7c-a19e-440b084768b4	9d176205-6e89-43af-8b4e-61652326f065	\N	\N	2026-02-12 16:28:31.475068
aa37fb56-6eba-40aa-963d-eaffc090b8e3	d430a65b-1474-40ad-b3e8-b91086eb029f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	3d3b3929-2627-4712-88db-cb5a8490d2e7	9d176205-6e89-43af-8b4e-61652326f065	\N	\N	2026-02-12 16:28:34.67477
ae7cb81b-648e-487e-a3d3-38e8cc56102e	d430a65b-1474-40ad-b3e8-b91086eb029f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	7c6a1e59-ee48-4570-a005-cbb09ccc7bb5	9d176205-6e89-43af-8b4e-61652326f065	\N	\N	2026-02-12 16:28:39.020041
ceb268f3-d3a1-4e71-afc8-9e9b92355b0c	d430a65b-1474-40ad-b3e8-b91086eb029f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	059e3d4a-7bec-4c01-80c7-ea770f402e64	9d176205-6e89-43af-8b4e-61652326f065	\N	\N	2026-02-12 16:28:41.977495
7690259f-ba72-4a37-9777-5616cec2963a	d430a65b-1474-40ad-b3e8-b91086eb029f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	f71f03cb-b7a0-4d75-820c-d7a46369697e	9d176205-6e89-43af-8b4e-61652326f065	\N	\N	2026-02-12 16:28:45.247806
45ae2b58-14cc-49dc-8db7-f9cf8a9ccde7	d430a65b-1474-40ad-b3e8-b91086eb029f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	9ac9f410-f53b-412a-9263-e26fc68a08ab	030945d1-e60d-4c79-9e77-c63428e2809f	\N	\N	2026-02-12 16:28:51.397193
2c90b9e5-7b50-4658-9990-a34e76c65095	d430a65b-1474-40ad-b3e8-b91086eb029f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	908b7128-79d7-4f8d-a4a8-4753ffb31ddd	030945d1-e60d-4c79-9e77-c63428e2809f	\N	\N	2026-02-12 16:28:54.38881
0e90b525-1d78-4404-912b-d69b3a6ac936	d430a65b-1474-40ad-b3e8-b91086eb029f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	8bec2716-c2bc-4e7a-bdf1-e727e210aa8a	030945d1-e60d-4c79-9e77-c63428e2809f	\N	\N	2026-02-12 16:28:57.474144
582d3bd8-7e75-48b2-892e-e4cd73896af4	d430a65b-1474-40ad-b3e8-b91086eb029f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	79efc563-10ae-4693-80b4-ee485c76afb0	030945d1-e60d-4c79-9e77-c63428e2809f	\N	\N	2026-02-12 16:29:00.248741
281d87ba-b1ad-41ff-ae6b-642ade40c70f	d430a65b-1474-40ad-b3e8-b91086eb029f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	79efc563-10ae-4693-80b4-ee485c76afb0	030945d1-e60d-4c79-9e77-c63428e2809f	\N	\N	2026-02-12 16:29:02.941161
95b16d6d-6922-4bc2-9237-1a348b463703	d430a65b-1474-40ad-b3e8-b91086eb029f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	79efc563-10ae-4693-80b4-ee485c76afb0	030945d1-e60d-4c79-9e77-c63428e2809f	\N	\N	2026-02-12 16:29:05.602479
f41c2d43-cb4c-48a4-9378-98a07c9ee91d	d430a65b-1474-40ad-b3e8-b91086eb029f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	79efc563-10ae-4693-80b4-ee485c76afb0	030945d1-e60d-4c79-9e77-c63428e2809f	\N	\N	2026-02-12 16:29:08.432509
6dafe14b-7550-488a-a319-0683bd105525	d430a65b-1474-40ad-b3e8-b91086eb029f	79efc563-10ae-4693-80b4-ee485c76afb0	goal	79efc563-10ae-4693-80b4-ee485c76afb0	030945d1-e60d-4c79-9e77-c63428e2809f	\N	\N	2026-02-12 16:29:11.346281
286beb4d-bcfb-402e-b894-3d97c4963215	e476f21a-9e20-45cc-8896-fb92472c692e	79efc563-10ae-4693-80b4-ee485c76afb0	goal	40ea3527-4c0c-4652-868f-f1a24e534a4b	c62a6bce-28d0-446f-8893-4af996d7cd2c	\N	\N	2026-02-19 10:36:31.784239
2069aae1-e206-4489-8f04-1275eb56031e	e476f21a-9e20-45cc-8896-fb92472c692e	79efc563-10ae-4693-80b4-ee485c76afb0	goal	40ea3527-4c0c-4652-868f-f1a24e534a4b	c62a6bce-28d0-446f-8893-4af996d7cd2c	\N	\N	2026-02-19 10:36:34.591046
51b829bc-8a3f-4fdb-81cf-29962c65181b	e476f21a-9e20-45cc-8896-fb92472c692e	79efc563-10ae-4693-80b4-ee485c76afb0	goal	16fd5577-dfa1-4875-9dc3-9570fa41d6a1	c62a6bce-28d0-446f-8893-4af996d7cd2c	\N	\N	2026-02-19 10:36:38.358919
4f31a0b3-6c17-4a6b-b5f8-312dd66a98fb	e476f21a-9e20-45cc-8896-fb92472c692e	79efc563-10ae-4693-80b4-ee485c76afb0	goal	16fd5577-dfa1-4875-9dc3-9570fa41d6a1	c62a6bce-28d0-446f-8893-4af996d7cd2c	\N	\N	2026-02-19 10:36:41.792411
3e081ae0-2e03-4cb3-8646-0fd6cc19dba0	e476f21a-9e20-45cc-8896-fb92472c692e	79efc563-10ae-4693-80b4-ee485c76afb0	goal	8bec2716-c2bc-4e7a-bdf1-e727e210aa8a	c62a6bce-28d0-446f-8893-4af996d7cd2c	\N	\N	2026-02-19 10:41:11.644114
569422b3-c8cd-4644-8302-05421e3e514a	e476f21a-9e20-45cc-8896-fb92472c692e	79efc563-10ae-4693-80b4-ee485c76afb0	goal	868aab20-5bcb-49ad-9419-ac5fa5aebd30	1bd6501d-2308-4986-bb9a-2f61c84dc2ff	\N	\N	2026-02-19 10:41:19.272444
8d718c08-ec4f-41b9-b4ec-72399a4e6254	e476f21a-9e20-45cc-8896-fb92472c692e	79efc563-10ae-4693-80b4-ee485c76afb0	goal	908b7128-79d7-4f8d-a4a8-4753ffb31ddd	1bd6501d-2308-4986-bb9a-2f61c84dc2ff	\N	\N	2026-02-19 10:41:21.976818
\.


--
-- Data for Name: event_attendance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.event_attendance (id, event_id, user_id, role, status, checked_in_at, order_of_arrival, created_at, updated_at, preferred_position, secondary_position, removed_by_self_at) FROM stdin;
40575253-5cb3-481e-b1bd-0abfebdee61f	4ec5d37f-19bf-412c-96b2-4a09430d6736	33333333-3333-3333-3333-333333333333	line	yes	\N	\N	2025-10-30 18:40:40.873844	2025-10-30 18:40:40.873844	forward	midfielder	\N
aa0b47c4-70b2-4d27-b4b6-2719887535ba	eeeeee11-1111-1111-1111-111111111111	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	line	waitlist	\N	\N	2025-11-01 20:00:13.397134	2025-11-01 20:00:29.705131	midfielder	defender	\N
bcef5965-f6eb-481b-b1ed-8fdf8a1631ee	eeeeee11-1111-1111-1111-111111111111	99999999-9999-9999-9999-999999999999	line	yes	\N	\N	2025-10-28 13:47:43.192566	2025-10-30 21:36:06.318361	midfielder	defender	\N
9adb5ad2-58ca-44d0-b445-61a13d61ef92	e1111111-1111-1111-1111-111111111111	11111111-1111-1111-1111-111111111111	line	yes	2025-10-14 13:47:43.147144	1	2025-10-28 13:47:43.147144	2025-10-28 13:47:43.147144	midfielder	defender	\N
cc21fccd-5368-4fe6-a62a-7aafcc8b412a	e1111111-1111-1111-1111-111111111111	22222222-2222-2222-2222-222222222222	gk	yes	2025-10-14 13:47:43.147144	2	2025-10-28 13:47:43.147144	2025-10-28 13:47:43.147144	defender	midfielder	\N
6fa05981-f05d-46af-a11c-44a61c3688db	e1111111-1111-1111-1111-111111111111	33333333-3333-3333-3333-333333333333	line	yes	2025-10-14 13:47:43.147144	3	2025-10-28 13:47:43.147144	2025-10-28 13:47:43.147144	midfielder	defender	\N
7ba7eed9-61cf-4d16-b8ad-61a02642ed87	e1111111-1111-1111-1111-111111111111	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	line	yes	2025-10-14 13:47:43.147144	10	2025-10-28 13:47:43.147144	2025-10-28 13:47:43.147144	midfielder	defender	\N
9606e063-7405-44e3-a1cf-7adede37584a	e1111111-1111-1111-1111-111111111111	88888888-8888-8888-8888-888888888888	line	yes	2025-10-14 13:47:43.147144	8	2025-10-28 13:47:43.147144	2025-10-28 13:47:43.147144	midfielder	defender	\N
f5669ed0-79ab-481d-9e75-68f3e4d9490e	eeeeee11-1111-1111-1111-111111111111	22222222-2222-2222-2222-222222222222	gk	yes	\N	\N	2025-10-28 13:47:43.192566	2025-10-28 13:47:43.192566	midfielder	defender	\N
e2ec7338-1ad3-4403-b50e-3c08f019f54f	eeeeee11-1111-1111-1111-111111111111	11111111-1111-1111-1111-111111111111	line	yes	\N	\N	2025-10-28 13:47:43.192566	2025-10-28 13:47:43.192566	defender	midfielder	\N
f0080365-6d63-461a-ac58-2cc0209a1405	eeeeee11-1111-1111-1111-111111111111	88888888-8888-8888-8888-888888888888	line	yes	\N	\N	2025-10-28 13:47:43.192566	2025-10-28 13:47:43.192566	defender	midfielder	\N
df2c9f0e-5e93-4d04-98c7-c5daec4f0149	eeeeee11-1111-1111-1111-111111111111	55555555-5555-5555-5555-555555555555	line	yes	\N	\N	2025-10-28 13:47:43.192566	2025-10-28 13:47:43.192566	defender	midfielder	\N
3a5defc1-5208-42e0-8571-0d70f1b4e89d	e1111111-1111-1111-1111-111111111111	66666666-6666-6666-6666-666666666666	line	yes	2025-10-14 13:47:43.147144	6	2025-10-28 13:47:43.147144	2025-10-28 13:47:43.147144	forward	defender	\N
45a7cea4-c820-4a97-9593-599d51d129dd	e1111111-1111-1111-1111-111111111111	99999999-9999-9999-9999-999999999999	line	yes	2025-10-14 13:47:43.147144	9	2025-10-28 13:47:43.147144	2025-10-28 13:47:43.147144	forward	defender	\N
49121c56-5f9b-4489-8413-a757324dfacf	e1111111-1111-1111-1111-111111111111	77777777-7777-7777-7777-777777777777	line	yes	2025-10-14 13:47:43.147144	7	2025-10-28 13:47:43.147144	2025-10-28 13:47:43.147144	midfielder	defender	\N
04395ce1-6fb2-46f0-9c6c-f57945eed22c	1e525f5a-d834-4273-98d5-a98884260c62	33333333-3333-3333-3333-333333333333	gk	yes	\N	\N	2025-11-01 20:32:14.339002	2025-11-01 20:32:14.339002	gk	midfielder	\N
27f66c3f-ed09-46e9-a013-08dd303c386d	e1111111-1111-1111-1111-111111111111	55555555-5555-5555-5555-555555555555	line	yes	2025-10-14 13:47:43.147144	5	2025-10-28 13:47:43.147144	2025-10-28 13:47:43.147144	gk	forward	\N
29003335-6bd9-47e1-8943-570dd3d4e236	e1111111-1111-1111-1111-111111111111	44444444-4444-4444-4444-444444444444	line	yes	2025-10-14 13:47:43.147144	4	2025-10-28 13:47:43.147144	2025-10-28 13:47:43.147144	gk	forward	\N
4466b9bb-1b30-469b-b372-f1abe64b177a	1e525f5a-d834-4273-98d5-a98884260c62	88888888-8888-8888-8888-888888888888	line	yes	\N	\N	2025-11-01 20:32:20.990163	2025-11-01 20:32:20.990163	defender	gk	\N
d72ec2cf-413f-47f6-a19b-ba176831dfb4	eeeeee11-1111-1111-1111-111111111111	33333333-3333-3333-3333-333333333333	gk	yes	\N	\N	2025-11-01 19:32:43.3777	2025-11-01 19:32:43.3777	gk	defender	\N
5e3036d4-0052-47b0-af31-f8a8503e4eb9	eeeeee11-1111-1111-1111-111111111111	cccccccc-cccc-cccc-cccc-cccccccccccc	line	yes	\N	\N	2025-11-01 19:33:11.441205	2025-11-01 19:33:11.441205	defender	midfielder	\N
f99bb504-9b6d-4a44-81a4-dd180d9e1a00	eeeeee11-1111-1111-1111-111111111111	66666666-6666-6666-6666-666666666666	line	yes	\N	\N	2025-11-01 19:39:32.909832	2025-11-01 19:39:32.909832	forward	midfielder	\N
757decf1-513c-4dcc-819e-2094df233426	eeeeee11-1111-1111-1111-111111111111	44444444-4444-4444-4444-444444444444	line	yes	\N	\N	2025-11-01 19:39:45.445114	2025-11-01 19:39:45.445114	forward	midfielder	\N
4ce60700-f4ec-4702-bbb1-0f1bdcc07068	eeeeee11-1111-1111-1111-111111111111	77777777-7777-7777-7777-777777777777	line	yes	\N	\N	2025-11-01 19:39:57.180575	2025-11-01 19:39:57.180575	defender	forward	\N
906a9dda-69ca-4fd2-b82b-57e63e70a4da	eeeeee11-1111-1111-1111-111111111111	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	line	waitlist	\N	\N	2025-11-01 20:00:19.957441	2025-11-01 20:00:19.957441	defender	forward	\N
ee537f33-8a67-47e6-8ac4-f8d8b1607424	1e525f5a-d834-4273-98d5-a98884260c62	cccccccc-cccc-cccc-cccc-cccccccccccc	line	yes	\N	\N	2025-11-01 20:32:27.459282	2025-11-01 20:32:27.459282	forward	midfielder	\N
f1875647-9ddb-409c-9237-37c3b75c2428	1e525f5a-d834-4273-98d5-a98884260c62	11111111-1111-1111-1111-111111111111	line	yes	\N	\N	2025-11-01 20:32:33.982074	2025-11-01 20:32:33.982074	forward	midfielder	\N
f3046e46-c932-4cc5-bbe4-24df8bda1352	1e525f5a-d834-4273-98d5-a98884260c62	99999999-9999-9999-9999-999999999999	line	yes	\N	\N	2025-11-01 20:32:39.127697	2025-11-01 20:32:39.127697	midfielder	forward	\N
48fd5712-b004-4506-9da5-e2b7e4a064b9	1e525f5a-d834-4273-98d5-a98884260c62	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	line	yes	\N	\N	2025-11-01 20:32:43.404412	2025-11-01 20:32:43.404412	midfielder	forward	\N
a10d34f8-4a75-4235-bdf3-489ee58d2686	1e525f5a-d834-4273-98d5-a98884260c62	55555555-5555-5555-5555-555555555555	line	yes	\N	\N	2025-11-01 20:32:48.422438	2025-11-01 20:32:48.422438	midfielder	forward	\N
7caf18f2-c81b-4fe8-abb1-bdec3fb1f0b9	1e525f5a-d834-4273-98d5-a98884260c62	44444444-4444-4444-4444-444444444444	line	yes	\N	\N	2025-11-01 20:32:53.006483	2025-11-01 20:32:53.006483	midfielder	forward	\N
c5eb8880-f483-4009-8a56-0d760764d574	1e525f5a-d834-4273-98d5-a98884260c62	77777777-7777-7777-7777-777777777777	line	yes	\N	\N	2025-11-01 20:32:57.018778	2025-11-01 20:32:57.018778	midfielder	forward	\N
20a8fb60-b0f3-4381-805f-59abcc358fa8	1e525f5a-d834-4273-98d5-a98884260c62	66666666-6666-6666-6666-666666666666	line	yes	\N	\N	2025-11-01 20:33:00.770313	2025-11-01 20:33:00.770313	midfielder	forward	\N
97fd5b9c-0cbd-4344-b69e-2d33331243be	1e525f5a-d834-4273-98d5-a98884260c62	22222222-2222-2222-2222-222222222222	line	yes	\N	\N	2025-11-01 20:33:06.336447	2025-11-01 20:33:06.336447	midfielder	forward	\N
0e4e8b33-50f1-4251-9de2-39fdd6e396d9	1e525f5a-d834-4273-98d5-a98884260c62	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	line	yes	\N	\N	2025-11-01 20:33:10.482794	2025-11-01 20:33:10.482794	midfielder	forward	\N
ea4a7797-3bb3-46b0-8bf3-c97397031723	1e525f5a-d834-4273-98d5-a98884260c62	4fe52ffd-10eb-4fd8-b3ca-382b242a64ea	line	yes	\N	\N	2025-11-02 14:33:10.899884	2025-11-02 14:33:10.899884	defender	forward	\N
2de4db41-5cf5-46f1-b189-7afd19d0f959	1e525f5a-d834-4273-98d5-a98884260c62	d913c0fa-fec7-49a1-ba7b-21602fdf43ee	gk	yes	\N	\N	2025-11-02 14:33:59.922137	2025-11-02 14:33:59.922137	gk	defender	\N
14b4dc9a-3177-46f5-bda7-a0e6a4b6206a	4cab49e5-b655-461e-860b-f75cc86b8999	33333333-3333-3333-3333-333333333333	line	yes	\N	\N	2025-11-28 20:22:51.154687	2025-11-28 20:22:51.154687	defender	midfielder	\N
e5616f5d-0044-4d71-8539-7625a83320ea	4cab49e5-b655-461e-860b-f75cc86b8999	11111111-1111-1111-1111-111111111111	gk	yes	\N	\N	2025-11-28 20:23:08.311931	2025-11-28 20:23:08.311931	gk	defender	\N
aeb3b99c-459a-43d7-a8f1-436d13f4b58c	4cab49e5-b655-461e-860b-f75cc86b8999	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	line	yes	\N	\N	2025-11-28 20:23:21.957915	2025-11-28 20:23:21.957915	midfielder	forward	\N
86965816-fbf8-48ad-9b28-067bfa384f53	4cab49e5-b655-461e-860b-f75cc86b8999	3f7043e5-3379-4f94-8ece-bebc99db71c2	gk	yes	\N	\N	2025-11-28 20:23:30.233442	2025-11-28 20:23:30.233442	gk	forward	\N
216bdaf1-1050-4bd9-95fb-8e79c3c54b2b	0eb13abf-ad96-43d8-b08c-49a11d14ebe6	33333333-3333-3333-3333-333333333333	line	yes	\N	\N	2025-12-02 00:37:02.105955	2025-12-02 00:37:02.105955	midfielder	forward	\N
c0579cc5-d7d0-4204-ab1e-aaa0b4bad21c	0eb13abf-ad96-43d8-b08c-49a11d14ebe6	cccccccc-cccc-cccc-cccc-cccccccccccc	gk	yes	\N	\N	2025-12-02 00:37:32.856097	2025-12-02 00:37:32.856097	gk	midfielder	\N
d705e432-4909-43b1-8996-1c2b5a4d06da	0eb13abf-ad96-43d8-b08c-49a11d14ebe6	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	line	yes	\N	\N	2025-12-02 00:37:42.929872	2025-12-02 00:37:42.929872	forward	defender	\N
333af5dc-b3c1-4cfb-9be3-842083f18c39	0eb13abf-ad96-43d8-b08c-49a11d14ebe6	55555555-5555-5555-5555-555555555555	line	yes	\N	\N	2025-12-02 00:38:01.535106	2025-12-02 00:38:01.535106	defender	midfielder	\N
7a58e221-671b-4c90-bdc3-b46df11a5be7	cfa8bd48-764c-4c0c-afd6-64a4b2675bd0	4fe52ffd-10eb-4fd8-b3ca-382b242a64ea	line	yes	\N	\N	2025-12-08 18:14:16.653919	2025-12-08 18:14:16.653919	midfielder	defender	\N
bd1413ce-c135-4b57-9252-2de2966d5320	cfa8bd48-764c-4c0c-afd6-64a4b2675bd0	33333333-3333-3333-3333-333333333333	line	yes	\N	\N	2025-12-08 18:14:43.547567	2025-12-08 18:14:43.547567	midfielder	defender	\N
d395ff3b-4bda-4c29-a9cf-d397cf894cb8	732cb4e5-7936-4ccf-95a8-083ac8d3dba3	33333333-3333-3333-3333-333333333333	line	yes	\N	\N	2025-12-09 14:28:49.641924	2025-12-09 14:28:49.641924	forward	midfielder	\N
d18721d4-3fb3-48a4-aa50-8bd76fed16c0	732cb4e5-7936-4ccf-95a8-083ac8d3dba3	11111111-1111-1111-1111-111111111111	gk	waitlist	\N	\N	2025-12-09 14:29:02.633369	2025-12-09 14:29:02.633369	gk	midfielder	\N
b5aa20f4-46bc-4fb1-a74c-3a122dbf0d57	732cb4e5-7936-4ccf-95a8-083ac8d3dba3	22222222-2222-2222-2222-222222222222	line	yes	\N	\N	2025-12-09 14:29:11.272269	2025-12-09 14:29:11.272269	defender	midfielder	\N
a3c31dd3-8527-44d2-9b5d-f1f7b291b413	732cb4e5-7936-4ccf-95a8-083ac8d3dba3	88888888-8888-8888-8888-888888888888	line	yes	\N	\N	2025-12-09 14:29:21.827315	2025-12-09 14:29:21.827315	forward	midfielder	\N
847c2ea1-3389-4342-9da2-9410e3f82acf	732cb4e5-7936-4ccf-95a8-083ac8d3dba3	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	line	yes	\N	\N	2025-12-09 14:30:02.422639	2025-12-09 14:30:02.422639	midfielder	defender	\N
1c2baa71-69b2-4067-99d6-36f1f2b47bc8	732cb4e5-7936-4ccf-95a8-083ac8d3dba3	cccccccc-cccc-cccc-cccc-cccccccccccc	line	yes	\N	\N	2025-12-09 14:35:50.608142	2025-12-09 14:35:50.608142	forward	midfielder	\N
6679b32c-4119-4b73-9835-9634a5d11fd9	732cb4e5-7936-4ccf-95a8-083ac8d3dba3	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	line	yes	\N	\N	2025-12-09 14:34:57.828471	2025-12-09 14:36:04.754684	defender	midfielder	\N
2ed7ad68-c84d-42a8-9699-ccf2418167af	732cb4e5-7936-4ccf-95a8-083ac8d3dba3	d913c0fa-fec7-49a1-ba7b-21602fdf43ee	line	yes	\N	\N	2025-12-09 14:44:13.610308	2025-12-09 14:44:13.610308	forward	defender	\N
274b1a9c-802d-437d-bb1e-e244c095831d	70628031-fd89-4a8d-a7f1-cf28791d83c8	33333333-3333-3333-3333-333333333333	line	yes	\N	\N	2025-12-12 02:15:02.643071	2025-12-12 02:15:02.643071	defender	midfielder	\N
d67bc576-8769-46f0-b8d5-091f1ecc66d1	41814f14-16a4-4c91-ab42-9ade50b4fa16	37894bdc-ef87-4199-abc9-57fd3b14c574	line	yes	\N	\N	2025-12-17 14:08:33.606465	2025-12-17 14:08:33.606465	forward	defender	\N
2a4c2fbc-0f62-46a2-afac-a25dfc75808c	b1339bab-0a27-4310-8e1c-c9105d9e4fe4	33333333-3333-3333-3333-333333333333	line	yes	\N	\N	2026-01-13 14:28:15.125833	2026-01-13 14:28:49.245841	defender	midfielder	\N
1433392c-62bb-4b6c-ba23-9f0e6f0685ec	b1339bab-0a27-4310-8e1c-c9105d9e4fe4	99999999-9999-9999-9999-999999999999	line	yes	\N	\N	2026-01-13 14:28:59.39246	2026-01-13 14:28:59.39246	defender	midfielder	\N
11a22a51-aaaa-452c-bfcb-ca22f86d02bd	b1339bab-0a27-4310-8e1c-c9105d9e4fe4	66666666-6666-6666-6666-666666666666	line	yes	\N	\N	2026-01-13 14:29:11.634433	2026-01-13 14:29:11.634433	midfielder	forward	\N
e7f62793-8925-4c36-b1b8-f98143b06972	b1339bab-0a27-4310-8e1c-c9105d9e4fe4	4fe52ffd-10eb-4fd8-b3ca-382b242a64ea	gk	yes	\N	\N	2026-01-13 14:29:28.559403	2026-01-13 14:29:28.559403	gk	defender	\N
0787730d-7e72-4cfe-9fa0-8f4d198a72c8	b1339bab-0a27-4310-8e1c-c9105d9e4fe4	d913c0fa-fec7-49a1-ba7b-21602fdf43ee	gk	yes	\N	\N	2026-01-13 14:30:27.622961	2026-01-13 14:30:27.622961	gk	defender	\N
5950c639-ae4b-438b-aefe-958612802bf5	b1339bab-0a27-4310-8e1c-c9105d9e4fe4	22222222-2222-2222-2222-222222222222	line	yes	\N	\N	2026-01-13 14:30:37.601613	2026-01-13 14:30:37.601613	defender	midfielder	\N
ede31d30-2fc5-4af0-99de-1d7a94c42294	b1339bab-0a27-4310-8e1c-c9105d9e4fe4	cccccccc-cccc-cccc-cccc-cccccccccccc	line	yes	\N	\N	2026-01-13 14:30:44.750593	2026-01-13 14:30:44.750593	midfielder	forward	\N
e74f157c-346f-46e4-882d-32747976e14f	b1339bab-0a27-4310-8e1c-c9105d9e4fe4	88888888-8888-8888-8888-888888888888	line	yes	\N	\N	2026-01-13 14:30:56.679321	2026-01-13 14:30:56.679321	forward	midfielder	\N
026098b3-ad33-429f-918a-41b876aff4e9	b1339bab-0a27-4310-8e1c-c9105d9e4fe4	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	line	yes	\N	\N	2026-01-13 14:31:02.31651	2026-01-13 14:31:02.31651	forward	midfielder	\N
24129476-a5a9-4055-802c-b5ef6d01dc31	b1339bab-0a27-4310-8e1c-c9105d9e4fe4	11111111-1111-1111-1111-111111111111	line	yes	\N	\N	2026-01-13 14:31:09.101817	2026-01-13 14:31:09.101817	defender	midfielder	\N
6ba297c9-73ef-4c6d-8736-911385e3f6e5	b1339bab-0a27-4310-8e1c-c9105d9e4fe4	77777777-7777-7777-7777-777777777777	line	yes	\N	\N	2026-01-13 14:31:20.1649	2026-01-13 14:31:20.1649	forward	midfielder	\N
f90d21ca-33b8-4745-8a8f-ae9dafa54ef3	b1339bab-0a27-4310-8e1c-c9105d9e4fe4	3f7043e5-3379-4f94-8ece-bebc99db71c2	line	yes	\N	\N	2026-01-13 14:31:27.236874	2026-01-13 14:31:27.236874	midfielder	forward	\N
2c806493-d779-4699-9dce-c03391296593	b1339bab-0a27-4310-8e1c-c9105d9e4fe4	55555555-5555-5555-5555-555555555555	line	yes	\N	\N	2026-01-13 14:31:37.595188	2026-01-13 14:31:37.595188	midfielder	forward	\N
0f5c93ee-ebc6-4675-ad8c-61e3d5e3f4e5	b1339bab-0a27-4310-8e1c-c9105d9e4fe4	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	line	yes	\N	\N	2026-01-13 14:31:44.927716	2026-01-13 14:31:44.927716	defender	midfielder	\N
6bc15336-70f2-4e43-be56-0b489dd81bb3	b1339bab-0a27-4310-8e1c-c9105d9e4fe4	44444444-4444-4444-4444-444444444444	line	yes	\N	\N	2026-01-13 14:31:55.915096	2026-01-13 14:31:55.915096	midfielder	forward	\N
42274e01-4052-44e6-abeb-b3c09b253566	6a5f63c1-a379-412b-b706-5124394c1469	79efc563-10ae-4693-80b4-ee485c76afb0	line	yes	\N	\N	2026-01-21 23:45:17.717334	2026-01-21 23:45:17.717334	midfielder	forward	\N
fec84087-c747-4b9a-8956-3b392e6c4d8d	6a5f63c1-a379-412b-b706-5124394c1469	05c0aeff-3b21-4fe8-a652-72cfbacafbe7	gk	yes	\N	\N	2026-01-21 23:45:32.844862	2026-01-21 23:45:32.844862	gk	midfielder	\N
bd0c581b-0543-43b1-a7d0-4153cc564b4f	0a14dead-1a13-477e-9e0a-eae5c0896284	79efc563-10ae-4693-80b4-ee485c76afb0	line	yes	\N	\N	2026-01-27 14:39:54.547897	2026-01-27 14:39:54.547897	midfielder	forward	\N
7a6fecaf-8827-45f5-82e5-8d186b2c55b2	0a14dead-1a13-477e-9e0a-eae5c0896284	e133eacc-09e1-4d95-8c9e-e5d555ae11d2	line	yes	\N	\N	2026-01-27 15:02:06.346907	2026-01-27 15:02:25.018577	forward	defender	\N
5ddb8890-bf93-4123-9159-ca1f262658f2	0a14dead-1a13-477e-9e0a-eae5c0896284	40ea3527-4c0c-4652-868f-f1a24e534a4b	line	yes	\N	\N	2026-01-27 15:03:30.521313	2026-01-27 15:03:30.521313	forward	midfielder	\N
71473fae-1c82-4996-8705-98b97eacb4c1	0a14dead-1a13-477e-9e0a-eae5c0896284	9ac9f410-f53b-412a-9263-e26fc68a08ab	line	yes	\N	\N	2026-01-27 15:03:30.586124	2026-01-27 15:03:30.586124	midfielder	forward	\N
cea3fc38-fa79-4441-b998-06d706a57f83	0a14dead-1a13-477e-9e0a-eae5c0896284	f71f03cb-b7a0-4d75-820c-d7a46369697e	line	yes	\N	\N	2026-01-27 15:04:42.015201	2026-01-27 15:04:42.015201	defender	midfielder	\N
58f2e3bc-313c-4fc4-81b6-104af9e66443	0a14dead-1a13-477e-9e0a-eae5c0896284	16fd5577-dfa1-4875-9dc3-9570fa41d6a1	line	yes	\N	\N	2026-01-27 15:05:15.019653	2026-01-27 15:05:33.283378	midfielder	defender	\N
51820322-e9dd-455e-b0a2-d1bced8709a4	0a14dead-1a13-477e-9e0a-eae5c0896284	3d3b3929-2627-4712-88db-cb5a8490d2e7	line	yes	\N	\N	2026-01-27 15:05:02.18168	2026-01-27 15:06:25.755239	forward	midfielder	\N
99d001b8-8546-4328-bb7a-683330ad3811	0a14dead-1a13-477e-9e0a-eae5c0896284	8bec2716-c2bc-4e7a-bdf1-e727e210aa8a	line	yes	\N	\N	2026-01-27 15:07:51.306059	2026-01-27 15:07:51.306059	defender	midfielder	\N
b97311cb-cfe6-4435-90af-7e8dc0f7bd22	0a14dead-1a13-477e-9e0a-eae5c0896284	fb647db8-10fa-4d7c-a19e-440b084768b4	line	yes	\N	\N	2026-01-27 15:08:05.384822	2026-01-27 15:08:05.384822	midfielder	forward	\N
a0f128c2-8a18-4495-985d-0d52b6d8e312	0a14dead-1a13-477e-9e0a-eae5c0896284	f5cf48d3-54d9-4d94-8fb9-132952633900	line	yes	\N	\N	2026-01-27 15:09:12.354845	2026-01-27 15:09:12.354845	midfielder	forward	\N
b7965ff6-2adc-4a78-8d7c-fada2e7f29d7	0a14dead-1a13-477e-9e0a-eae5c0896284	34421d84-5293-4bc2-aef6-62fd61eeb0d2	line	yes	\N	\N	2026-01-27 15:09:38.655307	2026-01-27 15:09:38.655307	defender	gk	\N
6638abfd-2b4e-48ba-97e9-b3b35ca4a097	0a14dead-1a13-477e-9e0a-eae5c0896284	60a7aa8f-b320-4fc1-8dbb-2f22e770e985	line	yes	\N	\N	2026-01-27 15:12:27.789779	2026-01-27 15:12:27.789779	defender	midfielder	\N
4ec17fb8-6572-4fc4-adc4-b7515dcd3740	0a14dead-1a13-477e-9e0a-eae5c0896284	7c6a1e59-ee48-4570-a005-cbb09ccc7bb5	line	yes	\N	\N	2026-01-27 15:24:52.025624	2026-01-27 15:24:52.025624	defender	midfielder	\N
59ab074f-0501-47d7-92b9-3caa3a59ce07	0a14dead-1a13-477e-9e0a-eae5c0896284	47bde709-ca3b-402c-b47b-f608a445eced	line	yes	\N	\N	2026-01-27 17:07:24.459346	2026-01-27 17:07:24.459346	defender	midfielder	\N
638169a7-eb5b-40b9-91fb-63481c367523	0a14dead-1a13-477e-9e0a-eae5c0896284	908b7128-79d7-4f8d-a4a8-4753ffb31ddd	line	yes	\N	\N	2026-01-27 18:38:52.461732	2026-01-27 18:38:52.461732	midfielder	forward	\N
71f43397-b78e-4f74-9ba7-4c3dde00fcce	0a14dead-1a13-477e-9e0a-eae5c0896284	0ce3e02e-5ba1-4117-9169-664cb1b86649	line	yes	\N	\N	2026-01-27 19:42:02.46783	2026-01-27 19:42:02.46783	midfielder	forward	\N
823510a2-1b1b-4b5b-84a0-7bddb7758b3d	0a14dead-1a13-477e-9e0a-eae5c0896284	5ce0a256-dc51-4c20-8d54-ea8e0171376c	gk	yes	\N	\N	2026-01-27 19:45:38.84151	2026-01-27 19:45:38.84151	gk	forward	\N
66271395-84ff-411c-9bc9-fcdb4cfbf7ef	0a14dead-1a13-477e-9e0a-eae5c0896284	33333333-3333-3333-3333-333333333333	gk	yes	\N	\N	2026-01-27 22:56:34.137791	2026-01-27 22:56:34.137791	gk	defender	\N
b841554d-4b6e-4e47-a541-6d20cab0d074	cda8d404-ee00-4736-ab8f-e251c4c1ca17	34421d84-5293-4bc2-aef6-62fd61eeb0d2	line	yes	\N	\N	2026-01-29 12:15:55.486942	2026-01-29 12:15:55.486942	defender	midfielder	\N
3215d15d-6c9b-4b9e-a5e4-637f392c8b8a	cda8d404-ee00-4736-ab8f-e251c4c1ca17	8bec2716-c2bc-4e7a-bdf1-e727e210aa8a	line	yes	\N	\N	2026-01-29 12:16:04.419224	2026-01-29 12:16:04.419224	defender	midfielder	\N
70945854-c4ae-48aa-b1b3-0b0bc88228cc	cda8d404-ee00-4736-ab8f-e251c4c1ca17	908b7128-79d7-4f8d-a4a8-4753ffb31ddd	line	yes	\N	\N	2026-01-29 12:16:16.401192	2026-01-29 12:16:16.401192	midfielder	forward	\N
189e1b45-7b89-42cc-bebb-73dbe85568f7	cda8d404-ee00-4736-ab8f-e251c4c1ca17	16fd5577-dfa1-4875-9dc3-9570fa41d6a1	line	yes	\N	\N	2026-01-29 12:16:25.53682	2026-01-29 12:16:25.53682	defender	midfielder	\N
cb43d77b-3b09-471d-aa9b-90d93bfb44d1	cda8d404-ee00-4736-ab8f-e251c4c1ca17	fb647db8-10fa-4d7c-a19e-440b084768b4	line	yes	\N	\N	2026-01-29 12:16:39.048325	2026-01-29 12:16:39.048325	forward	midfielder	\N
cb8eabf4-4d10-4c23-84c4-951f6219c894	cda8d404-ee00-4736-ab8f-e251c4c1ca17	a2ead9b4-c4a6-4483-8fa5-3d374a4f3d41	line	yes	\N	\N	2026-01-29 12:16:49.884886	2026-01-29 12:16:49.884886	midfielder	forward	\N
6f930f7d-4068-4c89-b2ac-4c115471ad33	cda8d404-ee00-4736-ab8f-e251c4c1ca17	cbe1706f-2284-4dc2-9f5f-37038b72c11a	line	yes	\N	\N	2026-01-29 12:57:10.576151	2026-01-29 12:57:10.576151	midfielder	forward	\N
2cf5fea2-fc69-4893-b58a-d51ccaf40f87	cda8d404-ee00-4736-ab8f-e251c4c1ca17	3d3b3929-2627-4712-88db-cb5a8490d2e7	line	yes	\N	\N	2026-01-29 12:57:17.217534	2026-01-29 12:57:17.217534	midfielder	forward	\N
998aecbc-dbe1-4cc8-bb19-cb741e461ad7	cda8d404-ee00-4736-ab8f-e251c4c1ca17	47bde709-ca3b-402c-b47b-f608a445eced	line	yes	\N	\N	2026-01-29 12:57:29.621179	2026-01-29 12:57:29.621179	defender	midfielder	\N
62926957-988c-45cc-8b07-0d4fb46a7c05	cda8d404-ee00-4736-ab8f-e251c4c1ca17	60a7aa8f-b320-4fc1-8dbb-2f22e770e985	line	yes	\N	\N	2026-01-29 12:57:45.046444	2026-01-29 12:57:45.046444	defender	midfielder	\N
98c52c67-d849-4db1-9fdd-be9d506d2c23	cda8d404-ee00-4736-ab8f-e251c4c1ca17	f71f03cb-b7a0-4d75-820c-d7a46369697e	line	yes	\N	\N	2026-01-29 12:57:56.501584	2026-01-29 12:57:56.501584	defender	midfielder	\N
16e0d86b-dc33-46ee-ba34-3f17edb8eb62	cda8d404-ee00-4736-ab8f-e251c4c1ca17	9ac9f410-f53b-412a-9263-e26fc68a08ab	line	yes	\N	\N	2026-01-29 12:58:03.115083	2026-01-29 12:58:03.115083	midfielder	forward	\N
a47a3d73-a62b-4dcb-aeb1-c9ac717d5133	cda8d404-ee00-4736-ab8f-e251c4c1ca17	7c6a1e59-ee48-4570-a005-cbb09ccc7bb5	line	yes	\N	\N	2026-01-29 12:58:11.817277	2026-01-29 12:58:11.817277	defender	midfielder	\N
668170fc-56a7-47f4-b263-0799ec9ed96f	cda8d404-ee00-4736-ab8f-e251c4c1ca17	79efc563-10ae-4693-80b4-ee485c76afb0	line	yes	\N	\N	2026-01-29 12:58:19.810053	2026-01-29 12:58:19.810053	midfielder	forward	\N
56778f99-ac13-4806-8822-7c1cf22e95f7	cda8d404-ee00-4736-ab8f-e251c4c1ca17	40ea3527-4c0c-4652-868f-f1a24e534a4b	line	yes	\N	\N	2026-01-29 12:58:30.12855	2026-01-29 12:58:30.12855	forward	midfielder	\N
2ac34e20-8b17-424c-b026-c26f01a1509e	cda8d404-ee00-4736-ab8f-e251c4c1ca17	e133eacc-09e1-4d95-8c9e-e5d555ae11d2	line	yes	\N	\N	2026-01-29 12:58:37.115745	2026-01-29 12:58:37.115745	forward	midfielder	\N
a49e2e03-0781-44c0-9758-6bb0dd68afff	c0357338-dac9-4700-85dc-f0a24777e59f	8bec2716-c2bc-4e7a-bdf1-e727e210aa8a	line	yes	\N	\N	2026-01-29 21:19:51.820942	2026-01-29 21:19:51.820942	defender	forward	\N
c9553075-c585-4d0d-bed4-f1b2a6bafbaf	c0357338-dac9-4700-85dc-f0a24777e59f	d8c54b42-d79d-4d82-aa02-5e60240cab42	line	yes	\N	\N	2026-01-29 21:20:29.562057	2026-01-29 21:20:29.562057	midfielder	forward	\N
75d28874-2165-40b7-a263-a1fcc3725398	c0357338-dac9-4700-85dc-f0a24777e59f	47bde709-ca3b-402c-b47b-f608a445eced	line	yes	\N	\N	2026-01-29 21:20:03.609478	2026-01-29 21:20:03.609478	defender	midfielder	\N
4bdfcee7-95e3-43f7-940d-0504f77e9174	c0357338-dac9-4700-85dc-f0a24777e59f	16fd5577-dfa1-4875-9dc3-9570fa41d6a1	line	yes	\N	\N	2026-01-29 21:20:53.662962	2026-01-29 21:20:53.662962	midfielder	defender	\N
e37345cb-adf5-4fe7-b8e6-bcd7358050ce	c0357338-dac9-4700-85dc-f0a24777e59f	f71f03cb-b7a0-4d75-820c-d7a46369697e	line	yes	\N	\N	2026-01-29 21:21:06.209316	2026-01-29 21:21:06.209316	midfielder	defender	\N
fb9a259e-0fe6-4d6c-91ee-3059d65adcf5	c0357338-dac9-4700-85dc-f0a24777e59f	79efc563-10ae-4693-80b4-ee485c76afb0	line	yes	\N	\N	2026-01-29 21:19:36.7898	2026-01-29 21:20:56.361323	midfielder	forward	\N
df49d590-eabd-4bae-824a-28d08fb1bdba	c0357338-dac9-4700-85dc-f0a24777e59f	3d3b3929-2627-4712-88db-cb5a8490d2e7	line	yes	\N	\N	2026-01-29 21:21:33.897271	2026-01-29 21:21:33.897271	midfielder	forward	\N
c0ab1ccd-bc7a-4051-a189-26fcf5f04d4f	c0357338-dac9-4700-85dc-f0a24777e59f	9ac9f410-f53b-412a-9263-e26fc68a08ab	line	yes	\N	\N	2026-01-29 21:21:52.057073	2026-01-29 21:21:52.057073	midfielder	forward	\N
9f36986b-63c1-424b-b6e1-f0bbd8fdddd4	c0357338-dac9-4700-85dc-f0a24777e59f	05bd251d-85f8-40c0-834e-fe627e3a63ad	line	yes	\N	\N	2026-01-29 21:22:28.186012	2026-01-29 21:22:28.186012	defender	midfielder	\N
8f7e67bc-93de-45cf-a964-55656dfb5e73	c0357338-dac9-4700-85dc-f0a24777e59f	05c0aeff-3b21-4fe8-a652-72cfbacafbe7	line	yes	\N	\N	2026-01-29 21:22:41.339214	2026-01-29 21:22:41.339214	defender	midfielder	\N
dd86dc76-3bf3-4450-81ba-14724596a281	c0357338-dac9-4700-85dc-f0a24777e59f	908b7128-79d7-4f8d-a4a8-4753ffb31ddd	line	yes	\N	\N	2026-01-29 21:23:00.622436	2026-01-29 21:23:00.622436	forward	midfielder	\N
9095a910-2de5-4594-bedb-d4dce0db311f	c0357338-dac9-4700-85dc-f0a24777e59f	7c6a1e59-ee48-4570-a005-cbb09ccc7bb5	line	yes	\N	\N	2026-01-29 21:23:21.323676	2026-01-29 21:23:21.323676	defender	midfielder	\N
11cbd9bd-5001-4fc8-af2f-da7bd5158a73	c0357338-dac9-4700-85dc-f0a24777e59f	cbe1706f-2284-4dc2-9f5f-37038b72c11a	line	yes	\N	\N	2026-01-29 21:23:38.964374	2026-01-29 21:23:38.964374	midfielder	forward	\N
d1a2a751-a3f5-46a7-a09e-856a3ddfb050	c0357338-dac9-4700-85dc-f0a24777e59f	40ea3527-4c0c-4652-868f-f1a24e534a4b	line	yes	\N	\N	2026-01-29 21:23:56.240601	2026-01-29 21:23:56.240601	forward	midfielder	\N
8a6b9007-b52f-498c-aa2d-856eda3dce27	c0357338-dac9-4700-85dc-f0a24777e59f	f5cf48d3-54d9-4d94-8fb9-132952633900	line	yes	\N	\N	2026-01-29 21:24:05.377161	2026-01-29 21:24:05.377161	midfielder	forward	\N
6e8e5970-65af-4cf2-b0bf-8041e70f8f12	c0357338-dac9-4700-85dc-f0a24777e59f	60a7aa8f-b320-4fc1-8dbb-2f22e770e985	line	yes	\N	\N	2026-01-29 21:25:24.768911	2026-01-29 21:25:24.768911	forward	midfielder	\N
75dc0d50-eafc-4b50-9c59-802f9fb2eb3b	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	79efc563-10ae-4693-80b4-ee485c76afb0	line	yes	\N	\N	2026-01-29 21:33:20.254397	2026-01-29 21:33:20.254397	midfielder	forward	\N
a8870910-328b-4b43-b83c-d81d4a91e2a3	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	34421d84-5293-4bc2-aef6-62fd61eeb0d2	line	yes	\N	\N	2026-01-29 21:33:42.563276	2026-01-29 21:33:42.563276	defender	midfielder	\N
e9ade387-ebff-4415-8b95-fba4615880e1	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	8bec2716-c2bc-4e7a-bdf1-e727e210aa8a	line	yes	\N	\N	2026-01-29 21:33:53.596092	2026-01-29 21:33:53.596092	defender	midfielder	\N
8018b095-ef53-4db8-a330-c53945cc268e	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	60a7aa8f-b320-4fc1-8dbb-2f22e770e985	line	yes	\N	\N	2026-01-29 21:34:02.377975	2026-01-29 21:34:02.377975	defender	midfielder	\N
e2aca065-4547-4329-b26d-904ea509eb90	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	fb647db8-10fa-4d7c-a19e-440b084768b4	line	yes	\N	\N	2026-01-29 21:34:14.65443	2026-01-29 21:34:14.65443	midfielder	forward	\N
59f497a1-11fd-4c46-beb2-1105feaa074e	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	9ac9f410-f53b-412a-9263-e26fc68a08ab	line	yes	\N	\N	2026-01-29 21:34:27.484799	2026-01-29 21:34:27.484799	midfielder	forward	\N
a262a305-64e7-467c-bd8b-8b41bafa389d	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	0ce3e02e-5ba1-4117-9169-664cb1b86649	line	yes	\N	\N	2026-01-29 21:34:37.022322	2026-01-29 21:34:37.022322	midfielder	forward	\N
8d9f16b2-7b62-4569-a799-8664099933d2	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	16fd5577-dfa1-4875-9dc3-9570fa41d6a1	line	yes	\N	\N	2026-01-29 21:34:49.949534	2026-01-29 21:34:49.949534	defender	midfielder	\N
a88fc901-1768-4b41-80f7-55ede30ef0e9	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	3d3b3929-2627-4712-88db-cb5a8490d2e7	line	yes	\N	\N	2026-01-29 21:35:41.779653	2026-01-29 21:35:41.779653	forward	midfielder	\N
02fd6872-8cd8-46ac-b80b-147379f8a7f6	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	5ce0a256-dc51-4c20-8d54-ea8e0171376c	gk	yes	\N	\N	2026-01-29 21:35:50.465094	2026-01-29 21:35:50.465094	gk	midfielder	\N
3bd77620-27ae-4623-b4ad-50917a7b54ed	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	33333333-3333-3333-3333-333333333333	gk	yes	\N	\N	2026-01-29 21:36:01.694297	2026-01-29 21:36:01.694297	gk	midfielder	\N
633a69df-6384-4a6b-a154-27d2268ecefe	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	7c6a1e59-ee48-4570-a005-cbb09ccc7bb5	line	yes	\N	\N	2026-01-29 21:36:10.033667	2026-01-29 21:36:10.033667	defender	midfielder	\N
b7b8b12f-d1af-4bf8-9e81-b48f28225d8f	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	47bde709-ca3b-402c-b47b-f608a445eced	line	yes	\N	\N	2026-01-29 21:36:18.884356	2026-01-29 21:36:18.884356	defender	midfielder	\N
8eba6a42-559d-4860-acf3-61a0855bf959	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	f71f03cb-b7a0-4d75-820c-d7a46369697e	line	yes	\N	\N	2026-01-29 21:36:28.408892	2026-01-29 21:36:28.408892	defender	midfielder	\N
00ff3234-4baf-46b7-829c-fe6ed327122e	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	908b7128-79d7-4f8d-a4a8-4753ffb31ddd	line	yes	\N	\N	2026-01-29 21:36:41.227689	2026-01-29 21:36:41.227689	defender	forward	\N
a62ba3e2-2acb-41b3-92cb-a709493dc8ac	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	e133eacc-09e1-4d95-8c9e-e5d555ae11d2	line	yes	\N	\N	2026-01-29 21:36:50.621312	2026-01-29 21:36:50.621312	forward	midfielder	\N
32c2713e-05e5-4089-a602-79933fae9b17	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	40ea3527-4c0c-4652-868f-f1a24e534a4b	line	yes	\N	\N	2026-01-29 21:36:57.62397	2026-01-29 21:36:57.62397	forward	midfielder	\N
4a0de9e8-9cdb-4252-bc9d-3cde2617e169	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	f5cf48d3-54d9-4d94-8fb9-132952633900	line	yes	\N	\N	2026-01-29 21:37:11.112579	2026-01-29 21:37:11.112579	midfielder	forward	\N
6f035157-33eb-40a1-900b-c294eb56e35b	707352ef-8960-4fed-aca0-c8d0e22ba213	79efc563-10ae-4693-80b4-ee485c76afb0	line	yes	\N	\N	2026-02-04 13:15:22.565939	2026-02-04 13:15:22.565939	midfielder	forward	\N
6adbb35d-2e5a-4b55-ab76-e639caf4af54	707352ef-8960-4fed-aca0-c8d0e22ba213	3d3b3929-2627-4712-88db-cb5a8490d2e7	line	yes	\N	\N	2026-02-04 13:15:35.859011	2026-02-04 13:15:35.859011	forward	midfielder	\N
99fd0b25-cf19-4d70-8ae2-07b5a030347c	707352ef-8960-4fed-aca0-c8d0e22ba213	0ce3e02e-5ba1-4117-9169-664cb1b86649	line	yes	\N	\N	2026-02-04 13:15:47.224828	2026-02-04 13:15:47.224828	midfielder	forward	\N
6e53c9b9-889d-4d27-aab8-2d3d79680ef7	707352ef-8960-4fed-aca0-c8d0e22ba213	f71f03cb-b7a0-4d75-820c-d7a46369697e	line	yes	\N	\N	2026-02-04 13:16:10.831602	2026-02-04 13:16:10.831602	defender	midfielder	\N
2b95044f-12bb-4c7e-81a9-cac9ef76e7d6	707352ef-8960-4fed-aca0-c8d0e22ba213	60a7aa8f-b320-4fc1-8dbb-2f22e770e985	line	yes	\N	\N	2026-02-04 13:16:17.673414	2026-02-04 13:16:17.673414	defender	midfielder	\N
fa624907-682d-4e7c-8512-c0731eb33d47	707352ef-8960-4fed-aca0-c8d0e22ba213	8bec2716-c2bc-4e7a-bdf1-e727e210aa8a	line	yes	\N	\N	2026-02-04 13:16:25.046245	2026-02-04 13:16:25.046245	defender	midfielder	\N
5b657cd3-f7d7-41de-a883-acbe3462b1f1	707352ef-8960-4fed-aca0-c8d0e22ba213	7c6a1e59-ee48-4570-a005-cbb09ccc7bb5	line	yes	\N	\N	2026-02-04 13:16:53.926378	2026-02-04 13:16:53.926378	defender	midfielder	\N
07ee0608-317b-4a7a-9b6b-be4acbfca1f3	707352ef-8960-4fed-aca0-c8d0e22ba213	e133eacc-09e1-4d95-8c9e-e5d555ae11d2	line	yes	\N	\N	2026-02-04 13:17:24.642666	2026-02-04 13:17:24.642666	forward	midfielder	\N
bc298087-b2c5-4c32-8c93-bf4483daae96	707352ef-8960-4fed-aca0-c8d0e22ba213	9ac9f410-f53b-412a-9263-e26fc68a08ab	line	yes	\N	\N	2026-02-04 13:17:41.203255	2026-02-04 13:17:41.203255	midfielder	forward	\N
230949d3-fda6-4d86-9502-67e1e83aae38	707352ef-8960-4fed-aca0-c8d0e22ba213	908b7128-79d7-4f8d-a4a8-4753ffb31ddd	line	yes	\N	\N	2026-02-04 13:17:49.388711	2026-02-04 13:17:49.388711	midfielder	defender	\N
99a79b6c-07d1-4af3-ae21-edb0fb628110	707352ef-8960-4fed-aca0-c8d0e22ba213	f5cf48d3-54d9-4d94-8fb9-132952633900	line	yes	\N	\N	2026-02-04 13:18:17.879184	2026-02-04 13:18:17.879184	midfielder	forward	\N
26dbdbf0-4b66-4af7-a37f-f0731f95c75d	707352ef-8960-4fed-aca0-c8d0e22ba213	fb647db8-10fa-4d7c-a19e-440b084768b4	line	yes	\N	\N	2026-02-04 13:18:30.670758	2026-02-04 13:18:30.670758	midfielder	forward	\N
00a216db-9589-425b-b7d2-0f987a27803e	707352ef-8960-4fed-aca0-c8d0e22ba213	05c0aeff-3b21-4fe8-a652-72cfbacafbe7	line	yes	\N	\N	2026-02-04 13:18:39.871959	2026-02-04 13:18:39.871959	defender	midfielder	\N
206f5e95-4cba-44f5-8a36-c6502a448579	707352ef-8960-4fed-aca0-c8d0e22ba213	6e9d11ce-69eb-4841-997a-9202de0e1a1f	line	yes	\N	\N	2026-02-04 13:18:48.750602	2026-02-04 13:18:48.750602	defender	midfielder	\N
c84c266c-7c76-4a63-a088-6b40cda28781	707352ef-8960-4fed-aca0-c8d0e22ba213	5ce0a256-dc51-4c20-8d54-ea8e0171376c	gk	yes	\N	\N	2026-02-04 13:18:55.765077	2026-02-04 13:18:55.765077	gk	defender	\N
301ab526-f958-44e9-8e94-29775c0872d9	707352ef-8960-4fed-aca0-c8d0e22ba213	33333333-3333-3333-3333-333333333333	gk	yes	\N	\N	2026-02-04 13:19:03.198411	2026-02-04 13:19:03.198411	gk	defender	\N
77b1af28-4758-4cd3-8809-3a64da0885d1	707352ef-8960-4fed-aca0-c8d0e22ba213	05bd251d-85f8-40c0-834e-fe627e3a63ad	line	yes	\N	\N	2026-02-05 15:40:19.611419	2026-02-05 15:40:19.611419	defender	midfielder	\N
c64aaf08-c6b7-4678-99c6-20345004542b	dd7ef953-adef-4f67-8100-ef2234cf8259	79efc563-10ae-4693-80b4-ee485c76afb0	line	yes	\N	\N	2026-02-07 13:27:29.799647	2026-02-07 13:27:29.799647	midfielder	forward	\N
f795c921-3646-423f-8d65-33106b2bce72	bb610f7e-f23c-4105-bf33-137155422532	33333333-3333-3333-3333-333333333333	line	yes	\N	\N	2026-02-07 13:30:23.34667	2026-02-07 13:30:23.34667	midfielder	forward	\N
55463c60-fb34-4fad-9b37-d61897632724	bb610f7e-f23c-4105-bf33-137155422532	11111111-1111-1111-1111-111111111111	line	yes	\N	\N	2026-02-07 13:30:30.654989	2026-02-07 13:30:30.654989	forward	midfielder	\N
df1f98eb-0484-4ba8-ac83-02054b913b77	bb610f7e-f23c-4105-bf33-137155422532	ffffffff-ffff-ffff-ffff-ffffffffffff	line	yes	\N	\N	2026-02-07 13:30:37.775677	2026-02-07 13:30:37.775677	midfielder	forward	\N
65186023-b76b-4e5e-9bbc-a038f5cca925	bb610f7e-f23c-4105-bf33-137155422532	99999999-9999-9999-9999-999999999999	gk	yes	\N	\N	2026-02-07 13:30:43.937361	2026-02-07 13:30:43.937361	gk	forward	\N
e980fd72-759b-4501-bb51-253934faca12	bb610f7e-f23c-4105-bf33-137155422532	dddddddd-dddd-dddd-dddd-dddddddddddd	line	yes	\N	\N	2026-02-07 13:31:00.601928	2026-02-07 13:31:00.601928	forward	midfielder	\N
ba80dba2-e4da-4ea7-8343-2b1590345141	bb610f7e-f23c-4105-bf33-137155422532	55555555-5555-5555-5555-555555555555	line	yes	\N	\N	2026-02-07 13:31:07.944098	2026-02-07 13:31:07.944098	forward	defender	\N
1e7f02bf-ef01-4ce8-8cb7-8b3e6ba300ee	bb610f7e-f23c-4105-bf33-137155422532	22222222-2222-2222-2222-222222222222	gk	yes	\N	\N	2026-02-07 13:31:15.562018	2026-02-07 13:31:15.562018	gk	midfielder	\N
91eceac0-2393-4a29-b4d2-a8371e58ae22	bb610f7e-f23c-4105-bf33-137155422532	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	line	yes	\N	\N	2026-02-07 13:31:21.428246	2026-02-07 13:31:21.428246	defender	forward	\N
1467ba50-365e-4e88-a7f1-b24931ef574a	bb610f7e-f23c-4105-bf33-137155422532	77777777-7777-7777-7777-777777777777	line	yes	\N	\N	2026-02-07 13:31:26.846585	2026-02-07 13:31:26.846585	midfielder	forward	\N
f79f97f7-8223-4adb-927d-7860cc799c0a	bb610f7e-f23c-4105-bf33-137155422532	eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee	line	yes	\N	\N	2026-02-07 13:31:32.03903	2026-02-07 13:31:32.03903	defender	forward	\N
b142204a-b02c-44e4-96bf-70ac1e5fe588	d430a65b-1474-40ad-b3e8-b91086eb029f	79efc563-10ae-4693-80b4-ee485c76afb0	line	yes	\N	\N	2026-02-09 02:24:39.373328	2026-02-09 02:24:39.373328	forward	midfielder	\N
5ab7aa56-1fae-49ea-bd7b-40c276099f62	d430a65b-1474-40ad-b3e8-b91086eb029f	f71f03cb-b7a0-4d75-820c-d7a46369697e	line	yes	\N	\N	2026-02-09 02:35:58.315649	2026-02-09 02:35:58.315649	defender	midfielder	\N
96579ea4-7fed-4874-af7d-6df014ce3ce2	d430a65b-1474-40ad-b3e8-b91086eb029f	7c6a1e59-ee48-4570-a005-cbb09ccc7bb5	line	yes	\N	\N	2026-02-09 02:37:32.084649	2026-02-09 02:37:32.084649	defender	midfielder	\N
d83a7eef-cd04-48c9-915d-387d6faeca47	d430a65b-1474-40ad-b3e8-b91086eb029f	3d3b3929-2627-4712-88db-cb5a8490d2e7	line	yes	\N	\N	2026-02-09 02:54:20.788736	2026-02-09 02:54:20.788736	forward	midfielder	\N
efb806ba-693c-4a98-99ec-bc6943845b09	d430a65b-1474-40ad-b3e8-b91086eb029f	8bec2716-c2bc-4e7a-bdf1-e727e210aa8a	line	yes	\N	\N	2026-02-09 10:15:16.864894	2026-02-09 10:15:43.182346	defender	midfielder	\N
e2fbb586-5d15-4efc-ac61-9cc267106d4d	d430a65b-1474-40ad-b3e8-b91086eb029f	05c0aeff-3b21-4fe8-a652-72cfbacafbe7	line	yes	\N	\N	2026-02-09 10:33:32.223514	2026-02-09 10:33:32.223514	defender	midfielder	\N
287fc704-766d-49ae-9548-346e116a607e	d430a65b-1474-40ad-b3e8-b91086eb029f	16fd5577-dfa1-4875-9dc3-9570fa41d6a1	line	yes	\N	\N	2026-02-09 11:30:50.43715	2026-02-09 11:30:50.43715	midfielder	defender	\N
bafb5e9e-cc63-474c-95c3-57a682f6b3ce	d430a65b-1474-40ad-b3e8-b91086eb029f	908b7128-79d7-4f8d-a4a8-4753ffb31ddd	line	yes	\N	\N	2026-02-09 11:33:45.91011	2026-02-09 11:33:45.91011	midfielder	defender	\N
1b255392-a09c-4bb8-8ba6-f1750e0f2c2e	d430a65b-1474-40ad-b3e8-b91086eb029f	34421d84-5293-4bc2-aef6-62fd61eeb0d2	line	yes	\N	\N	2026-02-09 12:02:54.182327	2026-02-09 12:02:54.182327	defender	midfielder	\N
f0a34cab-bb5a-48be-bf38-a685c6ce9592	d430a65b-1474-40ad-b3e8-b91086eb029f	c7c15951-c357-4bc4-b83d-25086e818e1c	line	yes	\N	\N	2026-02-09 12:08:19.848651	2026-02-09 12:08:19.848651	defender	midfielder	\N
31c640f3-f956-425f-a11d-b26490857aba	d430a65b-1474-40ad-b3e8-b91086eb029f	47bde709-ca3b-402c-b47b-f608a445eced	line	yes	\N	\N	2026-02-09 12:35:10.382799	2026-02-09 12:35:10.382799	defender	forward	\N
33e74511-1eca-4fa2-82e4-d3f84de5fdd2	d430a65b-1474-40ad-b3e8-b91086eb029f	9ac9f410-f53b-412a-9263-e26fc68a08ab	line	yes	\N	\N	2026-02-09 17:29:12.70821	2026-02-09 17:29:12.70821	midfielder	forward	\N
d27ac9d0-40d3-411c-a0ef-178dd4762af7	d430a65b-1474-40ad-b3e8-b91086eb029f	fb647db8-10fa-4d7c-a19e-440b084768b4	line	yes	\N	\N	2026-02-09 20:03:48.987611	2026-02-09 20:03:48.987611	midfielder	forward	\N
5d659380-83dc-40bb-8bf6-5c7f7da83098	d430a65b-1474-40ad-b3e8-b91086eb029f	33333333-3333-3333-3333-333333333333	gk	yes	\N	\N	2026-02-11 13:27:18.952898	2026-02-11 13:27:18.952898	gk	defender	\N
0e600d18-3cd2-4f5f-a2c7-6a16b02a60ff	d430a65b-1474-40ad-b3e8-b91086eb029f	e133eacc-09e1-4d95-8c9e-e5d555ae11d2	line	yes	\N	\N	2026-02-11 13:27:38.003937	2026-02-11 13:27:38.003937	forward	midfielder	\N
618c26da-b0da-4c62-af16-9e886eac2b0e	d430a65b-1474-40ad-b3e8-b91086eb029f	059e3d4a-7bec-4c01-80c7-ea770f402e64	line	yes	\N	\N	2026-02-11 13:29:14.486817	2026-02-11 13:29:14.486817	defender	midfielder	\N
235bfee2-5d9f-42ad-b830-e16c4491c705	e476f21a-9e20-45cc-8896-fb92472c692e	40ea3527-4c0c-4652-868f-f1a24e534a4b	line	yes	\N	\N	2026-02-16 17:20:06.271838	2026-02-16 17:20:06.271838	forward	midfielder	\N
3b6509c4-c6fc-4902-96f9-eeecb51d279f	e476f21a-9e20-45cc-8896-fb92472c692e	f71f03cb-b7a0-4d75-820c-d7a46369697e	line	yes	\N	\N	2026-02-16 17:21:02.437868	2026-02-16 17:21:02.437868	defender	midfielder	\N
96e29b83-1e88-4f69-9078-a14ac30fa33e	e476f21a-9e20-45cc-8896-fb92472c692e	9ac9f410-f53b-412a-9263-e26fc68a08ab	line	yes	\N	\N	2026-02-16 17:21:39.98433	2026-02-16 17:21:39.98433	midfielder	forward	\N
c381b1eb-bbad-4188-bde2-191e1e51aa9d	e476f21a-9e20-45cc-8896-fb92472c692e	908b7128-79d7-4f8d-a4a8-4753ffb31ddd	line	yes	\N	\N	2026-02-16 17:29:09.636809	2026-02-16 17:29:09.636809	midfielder	forward	\N
45ae2db3-1d49-4621-86dc-39afaace48af	e476f21a-9e20-45cc-8896-fb92472c692e	16fd5577-dfa1-4875-9dc3-9570fa41d6a1	line	yes	\N	\N	2026-02-16 17:32:00.145852	2026-02-16 17:32:00.145852	defender	midfielder	\N
e8cd878b-7a2b-48da-a5dd-4a7f109ee9e8	e476f21a-9e20-45cc-8896-fb92472c692e	34421d84-5293-4bc2-aef6-62fd61eeb0d2	line	yes	\N	\N	2026-02-16 17:38:26.226038	2026-02-16 17:38:26.226038	defender	midfielder	\N
651e2182-df47-4fe6-b058-a638786ce2a9	e476f21a-9e20-45cc-8896-fb92472c692e	79efc563-10ae-4693-80b4-ee485c76afb0	line	yes	\N	\N	2026-02-16 17:04:03.387844	2026-02-16 18:40:22.446374	forward	midfielder	\N
23f667ba-dff2-49d8-b005-47a6b9c1fc56	e476f21a-9e20-45cc-8896-fb92472c692e	f5cf48d3-54d9-4d94-8fb9-132952633900	line	yes	\N	\N	2026-02-16 19:35:37.033774	2026-02-16 19:35:37.033774	midfielder	defender	\N
395f0e22-a6c4-4d9a-91a8-0ec3883e1cd5	e476f21a-9e20-45cc-8896-fb92472c692e	3d3b3929-2627-4712-88db-cb5a8490d2e7	line	yes	\N	\N	2026-02-16 19:42:10.232438	2026-02-16 19:42:10.232438	forward	midfielder	\N
29d762be-9c73-4ba7-8404-74f4fbdc2375	e476f21a-9e20-45cc-8896-fb92472c692e	60a7aa8f-b320-4fc1-8dbb-2f22e770e985	line	yes	\N	\N	2026-02-17 17:57:33.061556	2026-02-17 17:57:33.061556	defender	midfielder	\N
26a44ba4-40c0-495f-a3be-030df0104dff	e476f21a-9e20-45cc-8896-fb92472c692e	7c6a1e59-ee48-4570-a005-cbb09ccc7bb5	line	yes	\N	\N	2026-02-17 21:10:34.176929	2026-02-17 21:10:34.176929	defender	midfielder	\N
30a958e1-8033-4548-b983-ca258375a914	e476f21a-9e20-45cc-8896-fb92472c692e	8bec2716-c2bc-4e7a-bdf1-e727e210aa8a	line	yes	\N	\N	2026-02-17 21:37:33.642501	2026-02-17 21:37:33.642501	defender	midfielder	\N
9c1e6a75-77cf-4f9e-9421-37b2c85995e4	e476f21a-9e20-45cc-8896-fb92472c692e	c7c15951-c357-4bc4-b83d-25086e818e1c	line	yes	\N	\N	2026-02-18 11:27:44.113387	2026-02-18 11:27:44.113387	defender	midfielder	\N
22b3d3ce-a46d-42c5-bd1f-64198142b240	e476f21a-9e20-45cc-8896-fb92472c692e	33333333-3333-3333-3333-333333333333	gk	yes	\N	\N	2026-02-18 11:35:13.926809	2026-02-18 11:35:13.926809	gk	defender	\N
1010d091-bb70-4933-9d54-ad9e63e8ff95	e476f21a-9e20-45cc-8896-fb92472c692e	059e3d4a-7bec-4c01-80c7-ea770f402e64	line	yes	\N	\N	2026-02-18 11:36:03.508694	2026-02-18 11:36:03.508694	defender	midfielder	\N
a908e8c9-2be9-487e-a2d2-cf4ceff819af	e476f21a-9e20-45cc-8896-fb92472c692e	868aab20-5bcb-49ad-9419-ac5fa5aebd30	line	yes	\N	\N	2026-02-18 11:59:02.032897	2026-02-18 11:59:02.032897	midfielder	defender	\N
ce410e7d-fb9e-461d-aff4-d85765af4d62	e476f21a-9e20-45cc-8896-fb92472c692e	e133eacc-09e1-4d95-8c9e-e5d555ae11d2	line	yes	\N	\N	2026-02-18 13:07:47.435194	2026-02-18 13:07:47.435194	forward	defender	\N
7b01373f-d258-4dd5-97f3-c37dbe2d57b1	421989f7-ad20-4871-930e-b5b5f08aef57	16fd5577-dfa1-4875-9dc3-9570fa41d6a1	line	yes	\N	\N	2026-02-23 12:02:44.978768	2026-02-23 12:02:44.978768	defender	midfielder	\N
fa379bf5-2bb0-49e5-9374-2db5139d2711	421989f7-ad20-4871-930e-b5b5f08aef57	40ea3527-4c0c-4652-868f-f1a24e534a4b	line	yes	\N	\N	2026-02-23 12:03:23.425634	2026-02-23 12:03:23.425634	forward	midfielder	\N
69a00293-39ab-4fdb-a005-2f189fdddd6d	421989f7-ad20-4871-930e-b5b5f08aef57	0ce3e02e-5ba1-4117-9169-664cb1b86649	line	yes	\N	\N	2026-02-23 12:04:44.637325	2026-02-23 12:04:48.468664	midfielder	forward	\N
a56272a9-5022-4d01-a1b3-fe0c84f092c1	421989f7-ad20-4871-930e-b5b5f08aef57	8bec2716-c2bc-4e7a-bdf1-e727e210aa8a	line	yes	\N	\N	2026-02-23 12:04:57.752771	2026-02-23 12:05:02.406788	defender	midfielder	\N
7afb4668-0bbf-48b3-a8b0-b996fbe6f975	421989f7-ad20-4871-930e-b5b5f08aef57	f71f03cb-b7a0-4d75-820c-d7a46369697e	line	yes	\N	\N	2026-02-23 12:44:31.292159	2026-02-23 12:44:31.292159	defender	midfielder	\N
048fd3c8-b421-468d-a869-2414396bfebb	421989f7-ad20-4871-930e-b5b5f08aef57	34421d84-5293-4bc2-aef6-62fd61eeb0d2	line	yes	\N	\N	2026-02-23 12:58:50.616224	2026-02-23 12:58:50.616224	defender	midfielder	\N
907b5947-d2fa-4396-86d6-2306352ad432	421989f7-ad20-4871-930e-b5b5f08aef57	9ac9f410-f53b-412a-9263-e26fc68a08ab	line	yes	\N	\N	2026-02-23 13:00:13.804718	2026-02-23 13:00:13.804718	midfielder	forward	\N
9caf641d-040e-4c2a-95e7-24896e79411b	421989f7-ad20-4871-930e-b5b5f08aef57	79efc563-10ae-4693-80b4-ee485c76afb0	line	yes	\N	\N	2026-02-23 13:32:55.705669	2026-02-23 13:32:55.705669	forward	midfielder	\N
f4b73ea1-5e46-43f8-bd3f-592a891b5437	421989f7-ad20-4871-930e-b5b5f08aef57	05c0aeff-3b21-4fe8-a652-72cfbacafbe7	line	yes	\N	\N	2026-02-23 16:03:39.086882	2026-02-23 16:03:39.086882	defender	midfielder	\N
06dbeb72-0143-48c0-a694-4b88a672911f	421989f7-ad20-4871-930e-b5b5f08aef57	3d3b3929-2627-4712-88db-cb5a8490d2e7	line	yes	\N	\N	2026-02-23 17:20:09.505458	2026-02-23 17:20:09.505458	forward	midfielder	\N
bf1f8032-3644-4c3e-9838-4054d2afa4b4	421989f7-ad20-4871-930e-b5b5f08aef57	7c6a1e59-ee48-4570-a005-cbb09ccc7bb5	line	yes	\N	\N	2026-02-23 19:12:36.723258	2026-02-23 19:12:36.723258	defender	midfielder	\N
a998a8cc-f3a7-4d38-9f46-af57dc81eb66	421989f7-ad20-4871-930e-b5b5f08aef57	60a7aa8f-b320-4fc1-8dbb-2f22e770e985	line	yes	\N	\N	2026-02-23 19:16:07.830506	2026-02-23 19:16:07.830506	defender	midfielder	\N
7f9295ef-83c3-4a09-9deb-5cc31956a74b	421989f7-ad20-4871-930e-b5b5f08aef57	908b7128-79d7-4f8d-a4a8-4753ffb31ddd	line	yes	\N	\N	2026-02-23 19:36:07.758587	2026-02-23 19:36:07.758587	midfielder	defender	\N
a6f377b6-480c-4474-922a-5005998cda66	421989f7-ad20-4871-930e-b5b5f08aef57	5ce0a256-dc51-4c20-8d54-ea8e0171376c	gk	yes	\N	\N	2026-02-23 19:39:22.970586	2026-02-23 19:39:22.970586	gk	forward	\N
5cf241ab-1b13-4acf-a4d7-2fde0861dab0	421989f7-ad20-4871-930e-b5b5f08aef57	fb647db8-10fa-4d7c-a19e-440b084768b4	line	yes	\N	\N	2026-02-23 22:42:44.161479	2026-02-23 22:42:44.161479	midfielder	forward	\N
b1cb1b29-17e4-4627-81f6-d90a4a7994b3	421989f7-ad20-4871-930e-b5b5f08aef57	33333333-3333-3333-3333-333333333333	gk	yes	\N	\N	2026-02-24 14:54:05.966347	2026-02-24 14:54:05.966347	gk	defender	\N
e2066dcd-6ac7-4733-9e60-f198709f4908	421989f7-ad20-4871-930e-b5b5f08aef57	868aab20-5bcb-49ad-9419-ac5fa5aebd30	line	yes	\N	\N	2026-02-24 18:43:31.0168	2026-02-24 18:43:31.0168	midfielder	defender	\N
\.


--
-- Data for Name: event_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.event_settings (id, group_id, min_players, max_players, max_waitlist, created_by, created_at, updated_at) FROM stdin;
8a0032c1-2280-451f-ad67-22088271ae9b	aaaabbbb-cccc-dddd-eeee-222222222222	4	22	10	\N	2025-11-01 20:09:35.596781	2025-11-01 20:09:35.596781
298ff955-9f1c-4852-bb9b-eb781c9541d6	9f5a92a6-6cc4-4c9b-87c2-dc943f458359	4	22	10	\N	2025-11-01 20:09:35.596781	2025-11-01 20:09:35.596781
821d39a7-4721-484d-9e66-479ae0fe0554	aaaabbbb-cccc-dddd-eeee-111111111111	4	22	10	\N	2025-11-01 20:09:35.596781	2025-11-01 20:30:39.819618
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.events (id, group_id, starts_at, venue_id, max_players, max_goalkeepers, status, waitlist_enabled, created_by, created_at, updated_at) FROM stdin;
e1111111-1111-1111-1111-111111111111	aaaabbbb-cccc-dddd-eeee-111111111111	2025-10-14 13:47:43.052579	aaaabbbb-1111-1111-1111-111111111111	10	2	finished	t	11111111-1111-1111-1111-111111111111	2025-10-07 13:47:43.052579	2025-10-28 13:47:43.052579
e2222222-2222-2222-2222-222222222222	aaaabbbb-cccc-dddd-eeee-111111111111	2025-10-21 13:47:43.052579	aaaabbbb-1111-1111-1111-111111111111	10	2	finished	t	11111111-1111-1111-1111-111111111111	2025-10-14 13:47:43.052579	2025-10-28 13:47:43.052579
868edc55-7cf8-4c20-ad53-1b85789f88f7	9f5a92a6-6cc4-4c9b-87c2-dc943f458359	2025-11-01 00:00:00	aaaabbbb-1111-1111-1111-111111111111	10	2	scheduled	t	33333333-3333-3333-3333-333333333333	2025-10-30 18:03:05.279112	2025-10-30 18:03:05.279112
4ec5d37f-19bf-412c-96b2-4a09430d6736	9f5a92a6-6cc4-4c9b-87c2-dc943f458359	2025-11-01 00:00:00	aaaabbbb-1111-1111-1111-111111111111	10	2	scheduled	t	33333333-3333-3333-3333-333333333333	2025-10-30 18:37:28.153819	2025-10-30 18:37:28.153819
1e525f5a-d834-4273-98d5-a98884260c62	aaaabbbb-cccc-dddd-eeee-111111111111	2025-11-10 00:00:00	aaaabbbb-1111-1111-1111-111111111111	20	2	finished	t	33333333-3333-3333-3333-333333333333	2025-11-01 20:31:04.610249	2025-11-02 15:06:52.349614
eeeeee11-1111-1111-1111-111111111111	aaaabbbb-cccc-dddd-eeee-111111111111	2025-11-03 13:47:43.100867	aaaabbbb-1111-1111-1111-111111111111	10	2	finished	t	11111111-1111-1111-1111-111111111111	2025-10-26 13:47:43.100867	2025-11-02 15:24:16.489781
4cab49e5-b655-461e-860b-f75cc86b8999	aaaabbbb-cccc-dddd-eeee-111111111111	2025-11-30 00:00:00	\N	10	2	finished	t	33333333-3333-3333-3333-333333333333	2025-11-28 20:22:26.735211	2025-11-28 20:24:29.898952
eecef0c5-c6ea-46c9-b6e8-2812fe9e8dbe	aaaabbbb-cccc-dddd-eeee-222222222222	2025-12-06 00:00:00	\N	10	2	canceled	t	33333333-3333-3333-3333-333333333333	2025-11-28 20:28:06.185094	2025-11-29 21:39:36.203999
181cc7b4-7ee1-4706-add6-e5b8883a26ef	aaaabbbb-cccc-dddd-eeee-111111111111	2025-12-04 00:00:00	\N	10	2	canceled	t	33333333-3333-3333-3333-333333333333	2025-11-29 21:22:08.638346	2025-11-29 21:39:43.650256
eeeeee22-2222-2222-2222-222222222222	aaaabbbb-cccc-dddd-eeee-111111111111	2025-11-10 13:47:43.100867	bbbbbbbb-2222-2222-2222-222222222222	10	2	canceled	t	11111111-1111-1111-1111-111111111111	2025-10-27 13:47:43.100867	2025-11-29 21:39:45.787668
0eb13abf-ad96-43d8-b08c-49a11d14ebe6	aaaabbbb-cccc-dddd-eeee-111111111111	2025-12-03 00:00:00	\N	18	2	finished	t	33333333-3333-3333-3333-333333333333	2025-12-02 00:36:50.896802	2025-12-02 00:40:03.124898
cfa8bd48-764c-4c0c-afd6-64a4b2675bd0	0106aace-cb71-4389-bd4c-49003a20b717	2025-12-11 00:00:00	\N	18	2	finished	t	4fe52ffd-10eb-4fd8-b3ca-382b242a64ea	2025-12-08 18:14:00.636519	2025-12-08 18:16:39.098284
732cb4e5-7936-4ccf-95a8-083ac8d3dba3	aaaabbbb-cccc-dddd-eeee-111111111111	2025-12-13 00:00:00	\N	18	0	finished	t	33333333-3333-3333-3333-333333333333	2025-12-09 14:28:34.918987	2025-12-09 14:46:40.986957
41814f14-16a4-4c91-ab42-9ade50b4fa16	ae0cd047-a04d-4f7b-a910-5461e0a2bd32	2025-12-19 00:00:00	\N	16	2	scheduled	t	37894bdc-ef87-4199-abc9-57fd3b14c574	2025-12-17 14:04:06.018663	2025-12-17 14:04:06.018663
6a5f63c1-a379-412b-b706-5124394c1469	673a26b1-7390-4fd3-824b-3e2ea8fddacc	2026-01-23 00:00:00	\N	18	2	canceled	t	79efc563-10ae-4693-80b4-ee485c76afb0	2026-01-21 23:44:53.319096	2026-01-22 16:41:12.044756
70628031-fd89-4a8d-a7f1-cf28791d83c8	aaaabbbb-cccc-dddd-eeee-111111111111	2025-12-13 00:00:00	\N	18	2	canceled	t	33333333-3333-3333-3333-333333333333	2025-12-12 02:14:49.557924	2026-01-26 18:34:40.266338
0a14dead-1a13-477e-9e0a-eae5c0896284	673a26b1-7390-4fd3-824b-3e2ea8fddacc	2026-01-29 00:00:00	\N	18	2	canceled	t	79efc563-10ae-4693-80b4-ee485c76afb0	2026-01-27 14:39:39.314455	2026-01-29 12:13:58.389433
cda8d404-ee00-4736-ab8f-e251c4c1ca17	673a26b1-7390-4fd3-824b-3e2ea8fddacc	2026-01-29 12:16:00	\N	18	2	finished	t	79efc563-10ae-4693-80b4-ee485c76afb0	2026-01-29 12:14:32.272772	2026-01-29 13:01:41.491292
c0357338-dac9-4700-85dc-f0a24777e59f	673a26b1-7390-4fd3-824b-3e2ea8fddacc	2026-01-29 21:20:00	\N	18	2	finished	t	79efc563-10ae-4693-80b4-ee485c76afb0	2026-01-29 21:18:22.95016	2026-01-29 21:31:57.861918
3f3998a7-d0cf-4a9f-8445-4491f96eeea1	673a26b1-7390-4fd3-824b-3e2ea8fddacc	2026-01-31 00:00:00	\N	18	2	finished	t	79efc563-10ae-4693-80b4-ee485c76afb0	2026-01-29 21:33:04.179693	2026-01-29 21:42:00.979015
707352ef-8960-4fed-aca0-c8d0e22ba213	673a26b1-7390-4fd3-824b-3e2ea8fddacc	2026-02-05 00:00:00	\N	18	2	finished	t	79efc563-10ae-4693-80b4-ee485c76afb0	2026-02-04 13:15:14.049773	2026-02-05 18:44:38.61069
dd7ef953-adef-4f67-8100-ef2234cf8259	673a26b1-7390-4fd3-824b-3e2ea8fddacc	2026-02-09 00:00:00	\N	18	2	canceled	t	79efc563-10ae-4693-80b4-ee485c76afb0	2026-02-07 13:27:23.387285	2026-02-07 13:29:26.378796
bb610f7e-f23c-4105-bf33-137155422532	aaaabbbb-cccc-dddd-eeee-222222222222	2026-02-09 00:00:00	\N	10	2	finished	t	33333333-3333-3333-3333-333333333333	2026-02-07 13:30:16.737612	2026-02-07 13:33:32.555149
b1339bab-0a27-4310-8e1c-c9105d9e4fe4	aaaabbbb-cccc-dddd-eeee-111111111111	2026-01-13 14:30:00	\N	18	2	canceled	t	33333333-3333-3333-3333-333333333333	2026-01-13 14:27:59.893319	2026-02-07 13:39:30.821261
d430a65b-1474-40ad-b3e8-b91086eb029f	673a26b1-7390-4fd3-824b-3e2ea8fddacc	2026-02-12 00:00:00	\N	18	2	finished	t	79efc563-10ae-4693-80b4-ee485c76afb0	2026-02-09 02:24:26.60844	2026-02-12 16:29:23.55855
e476f21a-9e20-45cc-8896-fb92472c692e	673a26b1-7390-4fd3-824b-3e2ea8fddacc	2026-02-19 00:00:00	\N	18	2	finished	t	79efc563-10ae-4693-80b4-ee485c76afb0	2026-02-16 17:03:56.281226	2026-02-19 10:44:54.01673
421989f7-ad20-4871-930e-b5b5f08aef57	673a26b1-7390-4fd3-824b-3e2ea8fddacc	2026-02-26 00:00:00	\N	18	2	scheduled	t	79efc563-10ae-4693-80b4-ee485c76afb0	2026-02-23 11:34:45.145442	2026-02-23 11:34:45.145442
\.


--
-- Data for Name: group_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.group_members (id, user_id, group_id, role, is_goalkeeper, base_rating, joined_at, deleted_at) FROM stdin;
6e641a8d-5e74-427a-b022-a6cdc4a5844d	11111111-1111-1111-1111-111111111111	aaaabbbb-cccc-dddd-eeee-111111111111	admin	f	7	2025-07-30 13:22:54.193494	\N
c372b285-7bc9-487b-9e21-7ef1d64b7e39	22222222-2222-2222-2222-222222222222	aaaabbbb-cccc-dddd-eeee-111111111111	member	t	8	2025-07-31 13:22:54.193494	\N
d6ad5b70-4395-40d8-863a-a06fb0729041	44444444-4444-4444-4444-444444444444	aaaabbbb-cccc-dddd-eeee-111111111111	member	f	8	2025-08-02 13:22:54.193494	\N
3b912d74-fd12-4c8a-aa0c-6b3fa08ece3e	55555555-5555-5555-5555-555555555555	aaaabbbb-cccc-dddd-eeee-111111111111	member	f	7	2025-08-03 13:22:54.193494	\N
2cbf1dab-a3d8-483c-b6ca-32ffbb65ef32	66666666-6666-6666-6666-666666666666	aaaabbbb-cccc-dddd-eeee-111111111111	member	f	5	2025-08-04 13:22:54.193494	\N
fd116b6b-9635-46a5-ade4-0d56f2dd6bc3	77777777-7777-7777-7777-777777777777	aaaabbbb-cccc-dddd-eeee-111111111111	member	f	7	2025-08-05 13:22:54.193494	\N
82a6b87f-2457-441c-971f-1a7f45c9b9eb	88888888-8888-8888-8888-888888888888	aaaabbbb-cccc-dddd-eeee-111111111111	member	f	6	2025-08-06 13:22:54.193494	\N
ffae2867-1122-44b4-a9d0-d7b50dd09b7b	99999999-9999-9999-9999-999999999999	aaaabbbb-cccc-dddd-eeee-111111111111	member	f	8	2025-08-07 13:22:54.193494	\N
825b87d6-3a15-47a3-8cc8-47fa8d121015	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	aaaabbbb-cccc-dddd-eeee-111111111111	member	f	7	2025-08-08 13:22:54.193494	\N
83fe7524-ae0f-4b48-8585-c14764a993c9	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	aaaabbbb-cccc-dddd-eeee-111111111111	member	t	7	2025-08-09 13:22:54.193494	\N
1ac869fd-0735-4cce-883a-1e649c0c35a3	cccccccc-cccc-cccc-cccc-cccccccccccc	aaaabbbb-cccc-dddd-eeee-111111111111	member	f	6	2025-08-10 13:22:54.193494	\N
eb3d0c60-473e-4d7c-ab54-a81a2b499531	22222222-2222-2222-2222-222222222222	aaaabbbb-cccc-dddd-eeee-222222222222	admin	f	8	2025-08-29 13:22:54.234908	\N
7696293b-0119-4fc3-aeb6-26effd9c0691	55555555-5555-5555-5555-555555555555	aaaabbbb-cccc-dddd-eeee-222222222222	member	t	8	2025-08-31 13:22:54.234908	\N
93dda604-a7a9-4b01-b724-627272604319	77777777-7777-7777-7777-777777777777	aaaabbbb-cccc-dddd-eeee-222222222222	member	f	7	2025-09-01 13:22:54.234908	\N
8e666a2d-f7fc-46d4-8234-2c6b08440e9b	99999999-9999-9999-9999-999999999999	aaaabbbb-cccc-dddd-eeee-222222222222	member	f	6	2025-09-02 13:22:54.234908	\N
32a447b8-3c19-4543-8422-bd107a971d50	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	aaaabbbb-cccc-dddd-eeee-222222222222	member	f	7	2025-09-03 13:22:54.234908	\N
10a94b53-b7ae-486e-b8ef-d07d3652ec20	dddddddd-dddd-dddd-dddd-dddddddddddd	aaaabbbb-cccc-dddd-eeee-222222222222	member	f	8	2025-09-04 13:22:54.234908	\N
b562c736-fbba-4baf-b67b-63be058073da	eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee	aaaabbbb-cccc-dddd-eeee-222222222222	member	t	7	2025-09-05 13:22:54.234908	\N
74171546-eeef-45bb-8731-14477c215d51	ffffffff-ffff-ffff-ffff-ffffffffffff	aaaabbbb-cccc-dddd-eeee-222222222222	member	f	6	2025-09-06 13:22:54.234908	\N
0032a708-138b-4475-bb13-322bfb721308	11111111-1111-1111-1111-111111111111	aaaabbbb-cccc-dddd-eeee-222222222222	member	f	7	2025-09-07 13:22:54.234908	\N
d29a649f-ff44-4208-be37-299daffad642	33333333-3333-3333-3333-333333333333	9f5a92a6-6cc4-4c9b-87c2-dc943f458359	admin	f	5	2025-10-30 18:02:52.836149	\N
3a590d45-de51-4cf0-b0c8-020dae1186e9	33333333-3333-3333-3333-333333333333	aaaabbbb-cccc-dddd-eeee-222222222222	admin	f	7	2025-08-30 13:22:54.234908	\N
be8e9dfc-490c-42d8-9b78-e4ed41f16c99	33333333-3333-3333-3333-333333333333	aaaabbbb-cccc-dddd-eeee-111111111111	admin	f	6	2025-08-01 13:22:54.193494	\N
6bcef21d-6406-46cd-bf6b-42e612533128	d913c0fa-fec7-49a1-ba7b-21602fdf43ee	aaaabbbb-cccc-dddd-eeee-111111111111	member	f	5	2025-11-02 14:31:53.76363	\N
2e552ca1-9e7e-480d-b6b7-b9922addea13	4fe52ffd-10eb-4fd8-b3ca-382b242a64ea	aaaabbbb-cccc-dddd-eeee-111111111111	member	f	5	2025-11-02 14:32:02.072497	\N
42ae6714-a7be-4b57-b9fb-65ecf49a247e	3f7043e5-3379-4f94-8ece-bebc99db71c2	aaaabbbb-cccc-dddd-eeee-111111111111	member	f	5	2025-11-02 14:40:14.29977	\N
082e7b0b-d702-4d2e-aa96-27f07de81a0e	4fe52ffd-10eb-4fd8-b3ca-382b242a64ea	0106aace-cb71-4389-bd4c-49003a20b717	admin	f	5	2025-12-08 18:07:24.607444	\N
7d18523e-e06a-4348-a43a-f6186f13577f	33333333-3333-3333-3333-333333333333	0106aace-cb71-4389-bd4c-49003a20b717	member	f	5	2025-12-08 18:09:49.617003	\N
402a580f-1b8e-4610-9433-e443ac84cc53	37894bdc-ef87-4199-abc9-57fd3b14c574	ae0cd047-a04d-4f7b-a910-5461e0a2bd32	admin	f	5	2025-12-17 14:03:38.5502	\N
00c00c48-2048-43f2-aa66-4f26da0be8ca	645ac7d8-5371-4287-b1c6-cbad405db643	0e492f02-8eff-4907-85ef-68d71e9d2038	admin	f	5	2025-12-17 14:09:37.843168	\N
b7da4617-c331-4bb9-ae67-cf215d03adfe	79efc563-10ae-4693-80b4-ee485c76afb0	673a26b1-7390-4fd3-824b-3e2ea8fddacc	admin	f	5	2026-01-21 23:38:22.30177	\N
a62d66d0-9fc8-4fa9-a384-05b926476dde	05c0aeff-3b21-4fe8-a652-72cfbacafbe7	673a26b1-7390-4fd3-824b-3e2ea8fddacc	member	f	5	2026-01-21 23:44:21.419191	\N
509ac058-03ef-44a2-8474-9c7635894512	e133eacc-09e1-4d95-8c9e-e5d555ae11d2	673a26b1-7390-4fd3-824b-3e2ea8fddacc	member	f	5	2026-01-22 16:40:39.268956	\N
407ac7ed-bcca-48ca-bfd8-c09da5fc74a8	3d3b3929-2627-4712-88db-cb5a8490d2e7	673a26b1-7390-4fd3-824b-3e2ea8fddacc	member	f	5	2026-01-22 16:46:44.056148	\N
8974678c-449d-4474-836c-e196c5b08a62	908b7128-79d7-4f8d-a4a8-4753ffb31ddd	673a26b1-7390-4fd3-824b-3e2ea8fddacc	member	f	5	2026-01-22 16:53:59.886712	\N
00821c92-337c-4aea-8196-126d97638acc	f71f03cb-b7a0-4d75-820c-d7a46369697e	673a26b1-7390-4fd3-824b-3e2ea8fddacc	member	f	5	2026-01-22 17:28:02.153332	\N
a6cd06bc-dde1-46ea-b10e-d340828760a0	868aab20-5bcb-49ad-9419-ac5fa5aebd30	673a26b1-7390-4fd3-824b-3e2ea8fddacc	member	f	5	2026-01-22 17:35:54.957131	\N
ef84d644-14c7-4b73-a380-ce6f1e586f96	47bde709-ca3b-402c-b47b-f608a445eced	673a26b1-7390-4fd3-824b-3e2ea8fddacc	member	f	5	2026-01-22 18:10:55.703069	\N
4c1d0a00-65d9-4413-9e84-6f17073a26e6	8bec2716-c2bc-4e7a-bdf1-e727e210aa8a	673a26b1-7390-4fd3-824b-3e2ea8fddacc	member	f	5	2026-01-22 18:41:29.329803	\N
e194a528-bf29-4367-afcb-4d81aba47de1	9ac9f410-f53b-412a-9263-e26fc68a08ab	673a26b1-7390-4fd3-824b-3e2ea8fddacc	member	f	5	2026-01-22 22:50:32.71821	\N
8364ff5c-ca36-4267-9497-0cde6c921f12	16fd5577-dfa1-4875-9dc3-9570fa41d6a1	673a26b1-7390-4fd3-824b-3e2ea8fddacc	member	f	5	2026-01-26 13:03:09.599227	\N
7dec54ff-4f72-4243-b01d-7c77e480e782	60a7aa8f-b320-4fc1-8dbb-2f22e770e985	673a26b1-7390-4fd3-824b-3e2ea8fddacc	member	f	5	2026-01-26 13:07:38.253222	\N
f80bce6b-ee35-402e-ac78-f84dae632fff	7c6a1e59-ee48-4570-a005-cbb09ccc7bb5	673a26b1-7390-4fd3-824b-3e2ea8fddacc	member	f	5	2026-01-26 13:57:22.818457	\N
57f5430f-6b32-43e5-a5af-b7957063259a	34421d84-5293-4bc2-aef6-62fd61eeb0d2	673a26b1-7390-4fd3-824b-3e2ea8fddacc	member	f	5	2026-01-26 14:08:28.001931	\N
0133b651-85b2-4511-836f-d0214fdee199	6e9d11ce-69eb-4841-997a-9202de0e1a1f	673a26b1-7390-4fd3-824b-3e2ea8fddacc	member	f	5	2026-01-26 14:37:45.069356	\N
b33bc240-874a-4320-9943-500c8fcd66dd	a2ead9b4-c4a6-4483-8fa5-3d374a4f3d41	673a26b1-7390-4fd3-824b-3e2ea8fddacc	member	f	5	2026-01-26 14:51:37.362505	\N
b7fc4806-b5dd-40f2-b3a2-f0d460c42bae	f5cf48d3-54d9-4d94-8fb9-132952633900	673a26b1-7390-4fd3-824b-3e2ea8fddacc	member	f	5	2026-01-26 15:04:07.470831	\N
4e53527a-0355-4586-bf8a-35c066843c03	05bd251d-85f8-40c0-834e-fe627e3a63ad	673a26b1-7390-4fd3-824b-3e2ea8fddacc	member	f	5	2026-01-26 15:45:36.431146	\N
34802c24-fa59-47b1-9234-dcd24c010281	40ea3527-4c0c-4652-868f-f1a24e534a4b	673a26b1-7390-4fd3-824b-3e2ea8fddacc	admin	f	5	2026-01-22 18:26:55.741927	\N
2675bef4-c2fb-4977-a981-030e198b6d1c	fb647db8-10fa-4d7c-a19e-440b084768b4	673a26b1-7390-4fd3-824b-3e2ea8fddacc	member	f	5	2026-01-27 00:54:48.964571	\N
d4c4652a-a027-46be-ad16-dd0d55552d2b	0ce3e02e-5ba1-4117-9169-664cb1b86649	673a26b1-7390-4fd3-824b-3e2ea8fddacc	member	f	5	2026-01-27 11:07:36.308687	\N
139ab20f-94f1-42a2-be70-cfa33748ebfa	d8c54b42-d79d-4d82-aa02-5e60240cab42	673a26b1-7390-4fd3-824b-3e2ea8fddacc	member	f	5	2026-01-27 11:15:59.82468	\N
66341c6c-7eee-4096-a18c-8b36e2b2eac5	da78256e-8580-4ba8-a624-d2d06b8f969f	673a26b1-7390-4fd3-824b-3e2ea8fddacc	member	f	5	2026-01-27 11:54:55.209122	\N
530ac387-2836-4e12-b78b-770a1cccf6f5	5ce0a256-dc51-4c20-8d54-ea8e0171376c	673a26b1-7390-4fd3-824b-3e2ea8fddacc	member	f	5	2026-01-27 19:45:05.123563	\N
eb69b6c4-21dc-4d82-811c-6967056560dd	33333333-3333-3333-3333-333333333333	673a26b1-7390-4fd3-824b-3e2ea8fddacc	member	f	5	2026-01-27 22:56:16.354078	\N
267def20-af92-4c6a-afeb-02dafea4bcf4	cbe1706f-2284-4dc2-9f5f-37038b72c11a	673a26b1-7390-4fd3-824b-3e2ea8fddacc	member	f	5	2026-01-29 12:37:34.099535	\N
344d3893-fe23-45c2-b2a3-ab38240b0a76	f1957bc3-db6a-4bd1-9a88-70f5c04547bd	aaaabbbb-cccc-dddd-eeee-111111111111	member	f	5	2026-01-29 21:04:31.75718	\N
96eee228-3225-4a16-9229-b7ec0180dee2	c7c15951-c357-4bc4-b83d-25086e818e1c	673a26b1-7390-4fd3-824b-3e2ea8fddacc	member	f	5	2026-02-09 12:07:42.137512	\N
f2941cc3-5eae-4a14-92c1-6eabfc52c128	059e3d4a-7bec-4c01-80c7-ea770f402e64	673a26b1-7390-4fd3-824b-3e2ea8fddacc	member	f	5	2026-02-11 13:29:00.855606	\N
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.groups (id, name, description, privacy, photo_url, created_by, created_at, updated_at, deleted_at) FROM stdin;
aaaabbbb-cccc-dddd-eeee-222222222222	Futebol de Quinta	Racha de quinta-feira à noite. Jogadores experientes.	private	\N	22222222-2222-2222-2222-222222222222	2025-08-29 13:22:54.15121	2025-10-28 13:22:54.15121	\N
9f5a92a6-6cc4-4c9b-87c2-dc943f458359	POKER	\N	private	\N	33333333-3333-3333-3333-333333333333	2025-10-30 18:02:52.712046	2025-10-30 18:02:52.712046	\N
0106aace-cb71-4389-bd4c-49003a20b717	JOGOS 2026	teste pra 2026	private	\N	4fe52ffd-10eb-4fd8-b3ca-382b242a64ea	2025-12-08 18:07:24.47351	2025-12-08 18:07:24.47351	\N
aaaabbbb-cccc-dddd-eeee-111111111111	Pelada do Parque	Pelada de sábado no Parque da Cidade. Racha toda semana!	private	\N	11111111-1111-1111-1111-111111111111	2025-07-30 13:22:54.15121	2025-12-09 14:27:16.6266	\N
ae0cd047-a04d-4f7b-a910-5461e0a2bd32	Grupo pv	Grupo de treinos e jogos	public	\N	37894bdc-ef87-4199-abc9-57fd3b14c574	2025-12-17 14:03:38.417352	2025-12-17 14:03:38.417352	\N
0e492f02-8eff-4907-85ef-68d71e9d2038	Futebol quarta	Jsjaha	private	\N	645ac7d8-5371-4287-b1c6-cbad405db643	2025-12-17 14:09:37.72163	2025-12-17 14:09:37.72163	\N
673a26b1-7390-4fd3-824b-3e2ea8fddacc	PELADEIROS FC	Futebol entre amigos na quarta-feira, 21h	private	\N	79efc563-10ae-4693-80b4-ee485c76afb0	2026-01-21 23:38:22.181121	2026-01-21 23:38:22.181121	\N
\.


--
-- Data for Name: invites; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invites (id, group_id, code, created_by, expires_at, max_uses, used_count, created_at, deleted_at) FROM stdin;
33b2b5a0-59d4-4260-9c2f-44703ea70912	9f5a92a6-6cc4-4c9b-87c2-dc943f458359	E38CJTBN	33333333-3333-3333-3333-333333333333	\N	\N	0	2025-10-30 18:02:53.081848	\N
a59787b9-12db-47f5-a038-66fe09e13e67	0106aace-cb71-4389-bd4c-49003a20b717	H48KREUP	4fe52ffd-10eb-4fd8-b3ca-382b242a64ea	\N	\N	0	2025-12-08 18:07:24.862153	\N
03896bad-c45c-45a7-98d0-8c7bff3f6653	0106aace-cb71-4389-bd4c-49003a20b717	8HSPRUD9	4fe52ffd-10eb-4fd8-b3ca-382b242a64ea	2030-10-15 23:00:00	\N	0	2025-12-08 18:08:26.431386	\N
40166359-78fd-4f05-85e3-b1761e4b044d	ae0cd047-a04d-4f7b-a910-5461e0a2bd32	ODN2A3O1	37894bdc-ef87-4199-abc9-57fd3b14c574	\N	\N	0	2025-12-17 14:03:38.817338	\N
0ad210f3-1e3a-40cf-8219-29fb5dd9638b	0e492f02-8eff-4907-85ef-68d71e9d2038	XICRN8HC	645ac7d8-5371-4287-b1c6-cbad405db643	\N	\N	0	2025-12-17 14:09:38.082319	\N
0b3538eb-e884-47c4-b18f-2093f9402813	aaaabbbb-cccc-dddd-eeee-222222222222	S9M6UB9G	33333333-3333-3333-3333-333333333333	\N	\N	0	2026-01-12 18:20:03.328364	\N
3200e58e-504b-465a-9e46-2ef33f017997	673a26b1-7390-4fd3-824b-3e2ea8fddacc	M6V4PLM5	79efc563-10ae-4693-80b4-ee485c76afb0	2026-07-21 23:38:00	\N	0	2026-01-21 23:38:54.047545	\N
70155f82-d675-4959-bb3c-913ec7d13abd	aaaabbbb-cccc-dddd-eeee-111111111111	PARQUE2024	11111111-1111-1111-1111-111111111111	\N	\N	11	2025-10-28 13:47:43.493218	\N
ab9489d1-6e2e-4d36-8f45-9a487a88dad5	673a26b1-7390-4fd3-824b-3e2ea8fddacc	PAGPN3U1	79efc563-10ae-4693-80b4-ee485c76afb0	\N	\N	27	2026-01-21 23:38:22.545393	\N
\.


--
-- Data for Name: mvp_tiebreaker_votes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mvp_tiebreaker_votes (id, tiebreaker_id, voter_user_id, voted_user_id, created_at) FROM stdin;
\.


--
-- Data for Name: mvp_tiebreakers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mvp_tiebreakers (id, event_id, round, status, tied_user_ids, winner_user_id, decided_by, created_at, completed_at) FROM stdin;
\.


--
-- Data for Name: player_ratings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.player_ratings (id, event_id, rater_user_id, rated_user_id, score, tags, created_at) FROM stdin;
e182de56-f27d-46fe-bfad-c213d368d144	e1111111-1111-1111-1111-111111111111	11111111-1111-1111-1111-111111111111	44444444-4444-4444-4444-444444444444	9	{mvp,artilheiro}	2025-10-28 13:47:43.403347
e6573016-95a4-409a-8560-8f27cdfd35b7	e1111111-1111-1111-1111-111111111111	11111111-1111-1111-1111-111111111111	22222222-2222-2222-2222-222222222222	8	{paredao}	2025-10-28 13:47:43.403347
fdc3145e-86de-4f90-8a5d-54b4d762022e	e1111111-1111-1111-1111-111111111111	22222222-2222-2222-2222-222222222222	44444444-4444-4444-4444-444444444444	9	{mvp}	2025-10-28 13:47:43.403347
7baf353b-ba2d-40ca-9dbe-2ab9191813d4	e1111111-1111-1111-1111-111111111111	22222222-2222-2222-2222-222222222222	77777777-7777-7777-7777-777777777777	8	{garcom}	2025-10-28 13:47:43.403347
95371def-5491-4cd0-b1fc-923908daac16	1e525f5a-d834-4273-98d5-a98884260c62	33333333-3333-3333-3333-333333333333	77777777-7777-7777-7777-777777777777	\N	{mvp}	2025-11-18 01:16:57.359773
608ba704-a606-4b5f-b91f-14f7de1a4327	eeeeee11-1111-1111-1111-111111111111	33333333-3333-3333-3333-333333333333	55555555-5555-5555-5555-555555555555	\N	{mvp}	2025-11-18 10:41:42.846443
a0d6dd6a-e8cd-4a70-b106-23dd539914ee	4cab49e5-b655-461e-860b-f75cc86b8999	33333333-3333-3333-3333-333333333333	11111111-1111-1111-1111-111111111111	\N	{mvp}	2025-11-28 20:24:49.29232
e601a699-6797-4c6b-ba60-b453090f6206	cfa8bd48-764c-4c0c-afd6-64a4b2675bd0	4fe52ffd-10eb-4fd8-b3ca-382b242a64ea	33333333-3333-3333-3333-333333333333	\N	{mvp}	2025-12-08 18:16:54.585628
c3cf02b4-ac83-4122-8563-968271dd9228	cfa8bd48-764c-4c0c-afd6-64a4b2675bd0	33333333-3333-3333-3333-333333333333	4fe52ffd-10eb-4fd8-b3ca-382b242a64ea	\N	{mvp}	2025-12-08 18:17:34.297237
c95d2afe-b3d3-4f7a-ab1f-b1550ae41fa4	732cb4e5-7936-4ccf-95a8-083ac8d3dba3	33333333-3333-3333-3333-333333333333	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	\N	{mvp}	2025-12-12 02:13:41.733204
a861bc48-b985-40f8-b606-880afd364ab6	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	79efc563-10ae-4693-80b4-ee485c76afb0	40ea3527-4c0c-4652-868f-f1a24e534a4b	\N	{mvp}	2026-01-29 21:42:23.026386
a872f803-dc56-437f-b580-a1ebd3ef2536	c0357338-dac9-4700-85dc-f0a24777e59f	79efc563-10ae-4693-80b4-ee485c76afb0	f71f03cb-b7a0-4d75-820c-d7a46369697e	\N	{mvp}	2026-01-29 21:42:56.879675
09f2dbc8-03b1-49e8-8aa8-91564b8fdf9d	707352ef-8960-4fed-aca0-c8d0e22ba213	79efc563-10ae-4693-80b4-ee485c76afb0	79efc563-10ae-4693-80b4-ee485c76afb0	\N	{mvp}	2026-02-05 18:44:50.837705
a793f0c1-d473-46e1-a098-38fc92314599	bb610f7e-f23c-4105-bf33-137155422532	33333333-3333-3333-3333-333333333333	77777777-7777-7777-7777-777777777777	\N	{mvp}	2026-02-07 13:34:03.970572
c7daa236-9457-47c1-bd67-ffcbab1aef01	d430a65b-1474-40ad-b3e8-b91086eb029f	33333333-3333-3333-3333-333333333333	79efc563-10ae-4693-80b4-ee485c76afb0	\N	{mvp}	2026-02-12 16:30:29.604187
2a20846e-8b41-492d-9d73-79afab20bd0d	d430a65b-1474-40ad-b3e8-b91086eb029f	059e3d4a-7bec-4c01-80c7-ea770f402e64	79efc563-10ae-4693-80b4-ee485c76afb0	\N	{mvp}	2026-02-12 16:31:41.813169
50476888-6052-4395-9730-2facf4b2a93f	e476f21a-9e20-45cc-8896-fb92472c692e	79efc563-10ae-4693-80b4-ee485c76afb0	059e3d4a-7bec-4c01-80c7-ea770f402e64	\N	{mvp}	2026-02-19 10:45:16.597695
7e93efcd-7e42-4b35-b658-e18048f540cb	e476f21a-9e20-45cc-8896-fb92472c692e	8bec2716-c2bc-4e7a-bdf1-e727e210aa8a	9ac9f410-f53b-412a-9263-e26fc68a08ab	\N	{mvp}	2026-02-23 12:04:09.711071
8bcec349-2f7d-407d-8442-37a99f5cba0f	e476f21a-9e20-45cc-8896-fb92472c692e	34421d84-5293-4bc2-aef6-62fd61eeb0d2	40ea3527-4c0c-4652-868f-f1a24e534a4b	\N	{mvp}	2026-02-23 12:57:35.860043
\.


--
-- Data for Name: scoring_configs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.scoring_configs (id, group_id, points_win, points_draw, points_loss, points_goal, points_assist, points_mvp, points_presence, ranking_mode, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: team_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.team_members (id, team_id, user_id, "position", starter, created_at) FROM stdin;
9635eac8-cee9-457a-ae87-b302b0b7cdb3	aaaa1111-1111-1111-1111-111111111111	22222222-2222-2222-2222-222222222222	gk	t	2025-10-28 13:47:43.272145
b0e8e86e-6f26-496e-9606-8fd3755fbc14	aaaa1111-1111-1111-1111-111111111111	11111111-1111-1111-1111-111111111111	line	t	2025-10-28 13:47:43.272145
a0c24b2f-6f61-402c-ab8a-1c88cc90f9c5	aaaa1111-1111-1111-1111-111111111111	44444444-4444-4444-4444-444444444444	line	t	2025-10-28 13:47:43.272145
e529977b-f760-4b2b-81bd-88555aa3e47a	aaaa1111-1111-1111-1111-111111111111	55555555-5555-5555-5555-555555555555	line	t	2025-10-28 13:47:43.272145
3fef969e-1020-47e7-964d-5a227c708ee1	aaaa1111-1111-1111-1111-111111111111	77777777-7777-7777-7777-777777777777	line	t	2025-10-28 13:47:43.272145
e0476d44-452e-4f72-b084-276a4a81a5f7	bbbb1111-1111-1111-1111-111111111111	33333333-3333-3333-3333-333333333333	line	t	2025-10-28 13:47:43.272145
24f1b773-bf35-4cdd-9fd7-d6e25f0606a0	bbbb1111-1111-1111-1111-111111111111	66666666-6666-6666-6666-666666666666	line	t	2025-10-28 13:47:43.272145
2dba84b5-1b16-431c-8f05-785354ce5d0e	bbbb1111-1111-1111-1111-111111111111	88888888-8888-8888-8888-888888888888	line	t	2025-10-28 13:47:43.272145
2f9e04e9-7521-4369-8ba7-8e2d6c9459f8	bbbb1111-1111-1111-1111-111111111111	99999999-9999-9999-9999-999999999999	line	t	2025-10-28 13:47:43.272145
46e1a52c-f220-427f-8bf0-a226b40b47a8	bbbb1111-1111-1111-1111-111111111111	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	line	t	2025-10-28 13:47:43.272145
25674acb-fa92-4b0e-b05b-2945f6909fc3	c8aaf117-b254-4e7c-b1bb-e3d0c9c9a6f8	11111111-1111-1111-1111-111111111111	gk	t	2025-11-28 20:23:35.740991
7f1bfbae-6a41-41e1-a477-879e03d907de	c8aaf117-b254-4e7c-b1bb-e3d0c9c9a6f8	33333333-3333-3333-3333-333333333333	defender	t	2025-11-28 20:23:35.863898
0ceb91b0-e56b-4c90-aac5-abaca0cd7c70	c8aaf117-b254-4e7c-b1bb-e3d0c9c9a6f8	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	midfielder	t	2025-11-28 20:23:35.982678
afad087d-7b8b-4aca-9f3d-c0402f83a279	49103a86-164e-49b5-83a8-d14ac144fc9c	3f7043e5-3379-4f94-8ece-bebc99db71c2	gk	t	2025-11-28 20:23:36.221238
c7fb3c0d-3c38-4e31-8964-dae7ae334713	4bcd785f-caa7-4cce-b911-bf2ae2df8d42	cccccccc-cccc-cccc-cccc-cccccccccccc	gk	t	2025-12-02 00:38:44.56555
4be50894-57a3-465d-9d4b-9c7270106474	4bcd785f-caa7-4cce-b911-bf2ae2df8d42	55555555-5555-5555-5555-555555555555	defender	t	2025-12-02 00:38:44.684474
2210a1d0-3f78-472c-b9c3-f5b24afdfb54	f6f1fc03-362c-455a-846c-3b033bdf7357	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	forward	t	2025-12-02 00:38:44.922278
f7a53b38-f6e2-4568-b861-f156db05b2a4	f6f1fc03-362c-455a-846c-3b033bdf7357	33333333-3333-3333-3333-333333333333	midfielder	t	2025-12-02 00:38:45.041442
a3487c17-4add-4cce-98da-4ca138f6fe13	df308ea8-24bf-49ba-8fff-90ff365667c9	4fe52ffd-10eb-4fd8-b3ca-382b242a64ea	midfielder	t	2025-12-08 18:16:12.094361
69e2d61f-6042-4c33-b1ab-9fe5169ddfc2	986d8389-7203-4f0b-b027-45ecbb7998e5	33333333-3333-3333-3333-333333333333	midfielder	t	2025-12-08 18:16:12.335072
e55e9929-147e-42a1-bdc5-b82e9fe6040c	eec05055-7a1e-4d7b-957d-3da0482f2ec8	22222222-2222-2222-2222-222222222222	defender	t	2025-12-09 14:44:20.749811
300d7dbc-44d6-4a25-8f9c-bbd1da174f97	eec05055-7a1e-4d7b-957d-3da0482f2ec8	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	defender	t	2025-12-09 14:44:20.87418
bbc647e5-515b-45f9-bbc8-8bd8b9cf35b1	eec05055-7a1e-4d7b-957d-3da0482f2ec8	88888888-8888-8888-8888-888888888888	midfielder	t	2025-12-09 14:44:20.99314
24505806-9b2a-4027-bb1c-8ea6063bf461	eec05055-7a1e-4d7b-957d-3da0482f2ec8	33333333-3333-3333-3333-333333333333	midfielder	t	2025-12-09 14:44:21.113423
cb989704-7682-4524-a9f5-1b1ef3ff5ba9	1d1e80a8-b0c9-4cdb-a269-edceae2c9713	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	defender	t	2025-12-09 14:44:21.354995
20d9dcfc-aaad-4e5f-8ecc-f0356529c3df	1d1e80a8-b0c9-4cdb-a269-edceae2c9713	d913c0fa-fec7-49a1-ba7b-21602fdf43ee	defender	t	2025-12-09 14:44:21.474055
8b01af70-508b-45cb-a5be-70458e9581ae	1d1e80a8-b0c9-4cdb-a269-edceae2c9713	cccccccc-cccc-cccc-cccc-cccccccccccc	midfielder	t	2025-12-09 14:44:21.59379
2c5773ed-d4e7-4e8b-b7b1-f72d966144ad	1472fe8d-834c-4f93-87ab-0f5a8f183cf7	4fe52ffd-10eb-4fd8-b3ca-382b242a64ea	gk	t	2026-01-13 14:32:16.271308
62924173-12de-4885-a6f0-e734a3dedd4a	1472fe8d-834c-4f93-87ab-0f5a8f183cf7	99999999-9999-9999-9999-999999999999	defender	t	2026-01-13 14:32:16.392883
b2260f49-cb1c-464b-8402-9030637c0351	1472fe8d-834c-4f93-87ab-0f5a8f183cf7	11111111-1111-1111-1111-111111111111	defender	t	2026-01-13 14:32:16.511815
0a6ffa72-b5e4-4627-9e33-46e2f4f783c9	1472fe8d-834c-4f93-87ab-0f5a8f183cf7	44444444-4444-4444-4444-444444444444	midfielder	t	2026-01-13 14:32:16.62956
7fde6b9f-485a-466e-bfa0-ead4090ec97d	1472fe8d-834c-4f93-87ab-0f5a8f183cf7	77777777-7777-7777-7777-777777777777	midfielder	t	2026-01-13 14:32:16.748612
28677b7f-9cce-47f8-b932-ff080d35df44	1472fe8d-834c-4f93-87ab-0f5a8f183cf7	cccccccc-cccc-cccc-cccc-cccccccccccc	forward	t	2026-01-13 14:32:16.86683
9c5314ec-99d9-4f2b-8220-f78427eef38a	1472fe8d-834c-4f93-87ab-0f5a8f183cf7	66666666-6666-6666-6666-666666666666	forward	t	2026-01-13 14:32:16.985972
0209313f-4cf4-40a0-93e9-e9effa6b7ed9	1472fe8d-834c-4f93-87ab-0f5a8f183cf7	33333333-3333-3333-3333-333333333333	defender	f	2026-01-13 14:32:17.104322
49608530-d4c0-4c80-bd05-b7cf3fa27700	460a05f7-39b1-4a72-af3e-2fd30d0a03a4	d913c0fa-fec7-49a1-ba7b-21602fdf43ee	gk	t	2026-01-13 14:32:17.341722
d3573104-c0f4-4008-801b-6faf9a78bf56	460a05f7-39b1-4a72-af3e-2fd30d0a03a4	22222222-2222-2222-2222-222222222222	defender	t	2026-01-13 14:32:17.460638
898dc5eb-ec5e-4829-a2b3-3ef6f9cbea7d	460a05f7-39b1-4a72-af3e-2fd30d0a03a4	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	defender	t	2026-01-13 14:32:17.579229
b1703c00-9feb-4889-8031-ef46cc73a825	460a05f7-39b1-4a72-af3e-2fd30d0a03a4	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	midfielder	t	2026-01-13 14:32:17.697916
4bc1f20f-1d21-4c88-b637-233c107e3c8a	460a05f7-39b1-4a72-af3e-2fd30d0a03a4	55555555-5555-5555-5555-555555555555	midfielder	t	2026-01-13 14:32:17.817073
dc4a3c3f-e547-409a-b4a7-03c978a82302	460a05f7-39b1-4a72-af3e-2fd30d0a03a4	88888888-8888-8888-8888-888888888888	forward	t	2026-01-13 14:32:17.936404
6e1ce0b3-48cb-40fb-ac16-823c797fa70d	460a05f7-39b1-4a72-af3e-2fd30d0a03a4	3f7043e5-3379-4f94-8ece-bebc99db71c2	forward	t	2026-01-13 14:32:18.05483
26bbd671-3912-4f66-8e08-b2c3e409114a	90e14ca4-85c5-4e90-befd-82055a7dfc99	33333333-3333-3333-3333-333333333333	gk	t	2025-11-01 20:31:53.167302
ca660363-ab84-4762-bc5d-b68336bcbecb	90e14ca4-85c5-4e90-befd-82055a7dfc99	55555555-5555-5555-5555-555555555555	defender	t	2025-11-01 20:31:53.212239
1be25306-2760-4b82-95e9-34cfad97d2b6	90e14ca4-85c5-4e90-befd-82055a7dfc99	88888888-8888-8888-8888-888888888888	defender	t	2025-11-01 20:31:53.253477
943e6d55-e761-44d2-9807-20d653096307	90e14ca4-85c5-4e90-befd-82055a7dfc99	99999999-9999-9999-9999-999999999999	midfielder	t	2025-11-01 20:31:53.295003
c6e15926-23c4-4b1a-a8b9-022fb684f030	90e14ca4-85c5-4e90-befd-82055a7dfc99	66666666-6666-6666-6666-666666666666	forward	t	2025-11-01 20:31:53.334165
6c700b5c-745e-4edd-8f9a-157f88e5b843	a288a90c-a7d1-47a9-8183-9abf56ff4745	11111111-1111-1111-1111-111111111111	defender	t	2025-11-01 20:31:53.417037
2c295741-6710-480c-ba2c-3ce37d6cdce9	a288a90c-a7d1-47a9-8183-9abf56ff4745	77777777-7777-7777-7777-777777777777	defender	t	2025-11-01 20:31:53.459103
638a4fb3-45de-4ffd-942a-507a7034bdb6	a288a90c-a7d1-47a9-8183-9abf56ff4745	22222222-2222-2222-2222-222222222222	midfielder	t	2025-11-01 20:31:53.500734
7bd03d9b-678d-4780-a829-a850584ffe30	a288a90c-a7d1-47a9-8183-9abf56ff4745	44444444-4444-4444-4444-444444444444	forward	t	2025-11-01 20:31:53.540954
0e3f9a60-b228-4425-b7c4-5c3938dfe93f	a288a90c-a7d1-47a9-8183-9abf56ff4745	cccccccc-cccc-cccc-cccc-cccccccccccc	defender	t	2025-11-01 20:31:53.582431
f8c838d3-0949-4d1c-99fb-be9b20d769ea	168d26e4-d32d-4607-9dc8-da8fc4b5e79a	79efc563-10ae-4693-80b4-ee485c76afb0	midfielder	t	2026-01-28 16:30:13.617369
bb3da7f4-f4f0-479f-a8dc-560dc9cdddaf	168d26e4-d32d-4607-9dc8-da8fc4b5e79a	3d3b3929-2627-4712-88db-cb5a8490d2e7	forward	t	2026-01-28 16:30:13.737138
1eac079d-cac4-4bf6-ab55-41a80cefe2e5	168d26e4-d32d-4607-9dc8-da8fc4b5e79a	f71f03cb-b7a0-4d75-820c-d7a46369697e	defender	t	2026-01-28 16:30:13.856913
ac202fc5-cc45-4890-80e2-347c1170dbc4	168d26e4-d32d-4607-9dc8-da8fc4b5e79a	8bec2716-c2bc-4e7a-bdf1-e727e210aa8a	defender	t	2026-01-28 16:30:13.976957
ee8f667c-b667-48aa-885b-9704a6ff1088	168d26e4-d32d-4607-9dc8-da8fc4b5e79a	16fd5577-dfa1-4875-9dc3-9570fa41d6a1	midfielder	t	2026-01-28 16:30:14.097303
aeba4583-f2e7-46a8-91e3-c1ac86644b49	168d26e4-d32d-4607-9dc8-da8fc4b5e79a	7c6a1e59-ee48-4570-a005-cbb09ccc7bb5	defender	t	2026-01-28 16:30:14.21732
c0056424-4c48-4a78-a3b4-e71e1fafae74	168d26e4-d32d-4607-9dc8-da8fc4b5e79a	f5cf48d3-54d9-4d94-8fb9-132952633900	midfielder	t	2026-01-28 16:30:14.337725
fb2314fb-2226-4506-8b6c-5966aba1edd1	168d26e4-d32d-4607-9dc8-da8fc4b5e79a	fb647db8-10fa-4d7c-a19e-440b084768b4	midfielder	f	2026-01-28 16:30:14.4574
30dd6d23-f065-4977-a7a3-81bde2f00c42	168d26e4-d32d-4607-9dc8-da8fc4b5e79a	5ce0a256-dc51-4c20-8d54-ea8e0171376c	gk	f	2026-01-28 16:30:14.57754
3b781e9e-f6b5-4e8d-a360-287346a73e56	6a70edec-6475-4acf-8b3d-e69d8762e824	e133eacc-09e1-4d95-8c9e-e5d555ae11d2	forward	t	2026-01-28 16:30:14.817235
e8517d91-326d-4a6d-8ba1-2303aa646ce2	6a70edec-6475-4acf-8b3d-e69d8762e824	908b7128-79d7-4f8d-a4a8-4753ffb31ddd	midfielder	t	2026-01-28 16:30:14.938504
5c19cec0-8b2d-4e5a-846e-b873f844f6cf	6a70edec-6475-4acf-8b3d-e69d8762e824	47bde709-ca3b-402c-b47b-f608a445eced	defender	t	2026-01-28 16:30:15.058174
377fae28-b583-46ea-8dc8-ea8c2a5c5310	6a70edec-6475-4acf-8b3d-e69d8762e824	9ac9f410-f53b-412a-9263-e26fc68a08ab	midfielder	t	2026-01-28 16:30:15.178596
c957db4a-5430-41e6-8317-0b2ba6fa50ec	6a70edec-6475-4acf-8b3d-e69d8762e824	60a7aa8f-b320-4fc1-8dbb-2f22e770e985	defender	t	2026-01-28 16:30:15.298866
150f0b8b-cf8c-48fd-a671-beacc2c530f0	6a70edec-6475-4acf-8b3d-e69d8762e824	34421d84-5293-4bc2-aef6-62fd61eeb0d2	defender	t	2026-01-28 16:30:15.41843
84eae3e9-03b7-4c61-b5b1-c78bde3d7a45	6a70edec-6475-4acf-8b3d-e69d8762e824	40ea3527-4c0c-4652-868f-f1a24e534a4b	forward	t	2026-01-28 16:30:15.53794
40a36294-7663-4539-9c92-c6249488e530	6a70edec-6475-4acf-8b3d-e69d8762e824	0ce3e02e-5ba1-4117-9169-664cb1b86649	midfielder	f	2026-01-28 16:30:15.659789
3a3d0e46-31e8-451c-adf7-72095fe6cc4e	6a70edec-6475-4acf-8b3d-e69d8762e824	33333333-3333-3333-3333-333333333333	gk	f	2026-01-28 16:30:15.779367
a629b746-5d21-4e37-987f-9dca9b6b0f31	6aec5159-50a8-4868-9d7f-5eabb6f4aae1	0ce3e02e-5ba1-4117-9169-664cb1b86649	midfielder	t	2026-02-05 15:44:32.863174
04286d8a-6627-43a7-b87a-dffb261f5ef7	6aec5159-50a8-4868-9d7f-5eabb6f4aae1	f71f03cb-b7a0-4d75-820c-d7a46369697e	defender	t	2026-02-05 15:44:33.0059
da99eeba-2c1d-438f-b12c-ad389ee8efbf	6aec5159-50a8-4868-9d7f-5eabb6f4aae1	8bec2716-c2bc-4e7a-bdf1-e727e210aa8a	defender	t	2026-02-05 15:44:33.125041
a8c146ce-8afb-4db7-b672-9ef85bc69546	6aec5159-50a8-4868-9d7f-5eabb6f4aae1	e133eacc-09e1-4d95-8c9e-e5d555ae11d2	forward	t	2026-02-05 15:44:33.24447
a46fc176-8d19-4174-8610-57b1e0453c9f	6aec5159-50a8-4868-9d7f-5eabb6f4aae1	908b7128-79d7-4f8d-a4a8-4753ffb31ddd	midfielder	t	2026-02-05 15:44:33.364428
6e4b54a1-819c-43f7-8918-fe47ebf9e747	6aec5159-50a8-4868-9d7f-5eabb6f4aae1	fb647db8-10fa-4d7c-a19e-440b084768b4	midfielder	t	2026-02-05 15:44:33.483812
9b3b3f4f-133b-449d-ad8c-5137e66a2f06	6aec5159-50a8-4868-9d7f-5eabb6f4aae1	6e9d11ce-69eb-4841-997a-9202de0e1a1f	defender	t	2026-02-05 15:44:33.603545
fa8785ba-788a-4f2f-98a9-aa17e5538fa2	6aec5159-50a8-4868-9d7f-5eabb6f4aae1	33333333-3333-3333-3333-333333333333	gk	t	2026-02-05 15:44:33.722748
5588b1b7-14f3-4cce-ad7d-95e21f26afbc	6aec5159-50a8-4868-9d7f-5eabb6f4aae1	05bd251d-85f8-40c0-834e-fe627e3a63ad	defender	t	2026-02-05 15:44:33.842597
441b985d-84d5-468a-b50b-da760572f9f5	54d2e9a7-a02e-4679-b58e-a9e501c9a28d	79efc563-10ae-4693-80b4-ee485c76afb0	midfielder	t	2026-02-05 15:44:34.082695
7b546565-c3c0-4a99-a5f0-fc537804ad2a	54d2e9a7-a02e-4679-b58e-a9e501c9a28d	3d3b3929-2627-4712-88db-cb5a8490d2e7	forward	t	2026-02-05 15:44:34.202731
9350f858-c02a-432b-b29e-a8a6c7380446	54d2e9a7-a02e-4679-b58e-a9e501c9a28d	60a7aa8f-b320-4fc1-8dbb-2f22e770e985	defender	t	2026-02-05 15:44:34.322201
84448f4b-b67c-45dc-bf89-77f8aee9dc1e	54d2e9a7-a02e-4679-b58e-a9e501c9a28d	7c6a1e59-ee48-4570-a005-cbb09ccc7bb5	defender	t	2026-02-05 15:44:34.44181
6dc1ad17-3500-4c24-a737-ab8ed38ab34d	54d2e9a7-a02e-4679-b58e-a9e501c9a28d	9ac9f410-f53b-412a-9263-e26fc68a08ab	midfielder	t	2026-02-05 15:44:34.562824
971b8588-b505-4fb5-be6e-ed6a20c9f12c	54d2e9a7-a02e-4679-b58e-a9e501c9a28d	f5cf48d3-54d9-4d94-8fb9-132952633900	midfielder	t	2026-02-05 15:44:34.682119
2506d8fd-1df3-4bab-a183-e408ac4d00d0	54d2e9a7-a02e-4679-b58e-a9e501c9a28d	05c0aeff-3b21-4fe8-a652-72cfbacafbe7	defender	t	2026-02-05 15:44:34.801667
5153c0ee-d51e-4215-a916-e2158d246212	54d2e9a7-a02e-4679-b58e-a9e501c9a28d	5ce0a256-dc51-4c20-8d54-ea8e0171376c	gk	t	2026-02-05 15:44:34.921221
f5967d2d-0be5-4b07-9b59-dee45263547f	5656a237-8251-48a1-b0de-6d2c9335cd9c	33333333-3333-3333-3333-333333333333	midfielder	t	2026-02-07 13:32:08.891665
9b807ca2-c74c-4f30-b737-19d69b738240	5656a237-8251-48a1-b0de-6d2c9335cd9c	ffffffff-ffff-ffff-ffff-ffffffffffff	midfielder	t	2026-02-07 13:32:09.031532
3326fa0b-0652-44db-bb2c-e47843b70571	5656a237-8251-48a1-b0de-6d2c9335cd9c	22222222-2222-2222-2222-222222222222	gk	t	2026-02-07 13:32:09.150647
dbb2c0cb-08f5-4ff2-9e71-6bd767a01031	5656a237-8251-48a1-b0de-6d2c9335cd9c	77777777-7777-7777-7777-777777777777	midfielder	t	2026-02-07 13:32:09.268045
289c6895-ef4a-42f3-9708-e5c9ca6ff187	5656a237-8251-48a1-b0de-6d2c9335cd9c	eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee	defender	t	2026-02-07 13:32:09.396937
9ca301c7-4e8c-4d1d-b19c-abf6fb7e1839	a68ea565-f44b-49f4-a77e-b5f0297fe1c1	11111111-1111-1111-1111-111111111111	forward	t	2026-02-07 13:32:09.632384
dda1ef60-87b7-4a71-9446-fc493e7bbc47	a68ea565-f44b-49f4-a77e-b5f0297fe1c1	55555555-5555-5555-5555-555555555555	forward	t	2026-02-07 13:32:09.75004
f8abe32f-0322-46d9-a71d-12209a0e56d5	a68ea565-f44b-49f4-a77e-b5f0297fe1c1	99999999-9999-9999-9999-999999999999	gk	t	2026-02-07 13:32:09.871808
440d12a9-87fc-49f7-ab2d-87a6fcb4452f	a68ea565-f44b-49f4-a77e-b5f0297fe1c1	dddddddd-dddd-dddd-dddd-dddddddddddd	forward	t	2026-02-07 13:32:09.990403
d10fde45-b3a6-45c7-b96c-aa4c587c1986	a68ea565-f44b-49f4-a77e-b5f0297fe1c1	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	defender	t	2026-02-07 13:32:10.109262
97bce167-88c1-4af4-95ab-de0d122874d8	5b7389ce-0b64-49eb-9164-ed312eba3514	33333333-3333-3333-3333-333333333333	gk	t	2025-11-02 14:34:10.03185
dc2822a0-a87c-4bc5-8d44-84c62de669d8	5b7389ce-0b64-49eb-9164-ed312eba3514	4fe52ffd-10eb-4fd8-b3ca-382b242a64ea	defender	t	2025-11-02 14:34:10.073149
989801f3-70a0-4fc8-884a-1ef747b2d97b	5b7389ce-0b64-49eb-9164-ed312eba3514	99999999-9999-9999-9999-999999999999	midfielder	t	2025-11-02 14:34:10.117992
6cca2aa0-ad16-48af-a8a1-c1142b879416	5b7389ce-0b64-49eb-9164-ed312eba3514	22222222-2222-2222-2222-222222222222	midfielder	t	2025-11-02 14:34:10.157706
f6ccb9ac-b856-4b5f-8a72-1f05beb4dae9	5b7389ce-0b64-49eb-9164-ed312eba3514	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	forward	t	2025-11-02 14:34:10.202125
47da74cb-ba9f-4f5f-aea5-5ca5f5a490c6	5b7389ce-0b64-49eb-9164-ed312eba3514	77777777-7777-7777-7777-777777777777	forward	t	2025-11-02 14:34:10.240139
eb8ab5be-169d-4a1f-9a17-25a5bf137983	5b7389ce-0b64-49eb-9164-ed312eba3514	66666666-6666-6666-6666-666666666666	defender	t	2025-11-02 14:34:10.285148
65af7300-d05c-4981-a88a-e83d9db1ddf9	ccb1f71a-3ef9-4a29-9333-f866fc81db94	88888888-8888-8888-8888-888888888888	gk	t	2025-11-02 14:34:10.363811
4b68aefd-28cd-4cd9-b521-40516252117b	ccb1f71a-3ef9-4a29-9333-f866fc81db94	d913c0fa-fec7-49a1-ba7b-21602fdf43ee	defender	t	2025-11-02 14:34:10.402257
ca475dd3-0de0-4ba2-a1b0-e2ba442c2012	ccb1f71a-3ef9-4a29-9333-f866fc81db94	44444444-4444-4444-4444-444444444444	midfielder	t	2025-11-02 14:34:10.446545
93ad7908-d9c2-451c-be16-301eaedae3b1	ccb1f71a-3ef9-4a29-9333-f866fc81db94	11111111-1111-1111-1111-111111111111	midfielder	t	2025-11-02 14:34:10.485502
4ba4c6a8-b570-4bc9-a5e6-a5633a22b857	ccb1f71a-3ef9-4a29-9333-f866fc81db94	55555555-5555-5555-5555-555555555555	forward	t	2025-11-02 14:34:10.529046
07efd567-38bc-4ea2-b335-0c7b1cde0915	ccb1f71a-3ef9-4a29-9333-f866fc81db94	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	forward	t	2025-11-02 14:34:10.567603
a1112398-514b-4b8f-ad7b-f07df0bd82da	ccb1f71a-3ef9-4a29-9333-f866fc81db94	cccccccc-cccc-cccc-cccc-cccccccccccc	defender	t	2025-11-02 14:34:10.612942
f3d6c93f-bb72-432c-bd42-de84f9da34e4	9d176205-6e89-43af-8b4e-61652326f065	059e3d4a-7bec-4c01-80c7-ea770f402e64	defender	t	2026-02-12 03:29:55.749543
ebf82562-e8ac-4a33-894f-9375b0443898	9d176205-6e89-43af-8b4e-61652326f065	fb647db8-10fa-4d7c-a19e-440b084768b4	midfielder	t	2026-02-12 03:29:55.871885
4aa77957-a41b-4119-b6b5-014a5b3a863d	9d176205-6e89-43af-8b4e-61652326f065	c7c15951-c357-4bc4-b83d-25086e818e1c	defender	t	2026-02-12 03:29:55.991557
bc36b49a-8e8f-4f63-b618-7ea44ff92b1b	9d176205-6e89-43af-8b4e-61652326f065	34421d84-5293-4bc2-aef6-62fd61eeb0d2	defender	t	2026-02-12 03:29:56.110922
77b2d862-a218-4c7a-aa5a-7f622c2f3266	9d176205-6e89-43af-8b4e-61652326f065	05c0aeff-3b21-4fe8-a652-72cfbacafbe7	defender	t	2026-02-12 03:29:56.230392
c20c31e2-0fb4-4db0-853e-b8d7cdb0c12c	9d176205-6e89-43af-8b4e-61652326f065	3d3b3929-2627-4712-88db-cb5a8490d2e7	forward	t	2026-02-12 03:29:56.349598
4297423b-c572-48b3-9c52-cbb6c16c157c	9d176205-6e89-43af-8b4e-61652326f065	7c6a1e59-ee48-4570-a005-cbb09ccc7bb5	defender	t	2026-02-12 03:29:56.468985
3818a81d-088e-45ea-b628-4b81e6e7b7de	9d176205-6e89-43af-8b4e-61652326f065	f71f03cb-b7a0-4d75-820c-d7a46369697e	defender	t	2026-02-12 03:29:56.587775
f5e26b80-0fdd-46f8-92b2-f3d1c6f2822a	030945d1-e60d-4c79-9e77-c63428e2809f	e133eacc-09e1-4d95-8c9e-e5d555ae11d2	forward	t	2026-02-12 03:29:56.826158
dfdf96b5-b4ef-4c75-aae4-f033497c40b1	030945d1-e60d-4c79-9e77-c63428e2809f	33333333-3333-3333-3333-333333333333	gk	t	2026-02-12 03:29:56.945868
513fb999-f7fd-461a-b069-4a4984d3654c	030945d1-e60d-4c79-9e77-c63428e2809f	9ac9f410-f53b-412a-9263-e26fc68a08ab	midfielder	t	2026-02-12 03:29:57.065072
eb70c785-ac60-4a30-b53d-109829acfb9a	030945d1-e60d-4c79-9e77-c63428e2809f	47bde709-ca3b-402c-b47b-f608a445eced	defender	t	2026-02-12 03:29:57.186544
cd3d1804-ac86-4324-97b5-d8756148e0e3	030945d1-e60d-4c79-9e77-c63428e2809f	908b7128-79d7-4f8d-a4a8-4753ffb31ddd	midfielder	t	2026-02-12 03:29:57.30557
b0c9a712-bbea-4361-812a-288db39f1383	030945d1-e60d-4c79-9e77-c63428e2809f	16fd5577-dfa1-4875-9dc3-9570fa41d6a1	midfielder	t	2026-02-12 03:29:57.425689
c1668594-bad1-4153-ae30-fb735767e16c	030945d1-e60d-4c79-9e77-c63428e2809f	8bec2716-c2bc-4e7a-bdf1-e727e210aa8a	defender	t	2026-02-12 03:29:57.544559
1e8e6d77-db9e-49e6-a0dc-63dbf20fa52a	030945d1-e60d-4c79-9e77-c63428e2809f	79efc563-10ae-4693-80b4-ee485c76afb0	forward	t	2026-02-12 03:29:57.66398
41ce5af0-c50e-42c0-ab58-3cfcc900d3e2	c62a6bce-28d0-446f-8893-4af996d7cd2c	8bec2716-c2bc-4e7a-bdf1-e727e210aa8a	defender	t	2026-02-18 15:38:33.914307
53598eb2-97a8-4ff3-bbb3-3fdfcdfa8a8d	c62a6bce-28d0-446f-8893-4af996d7cd2c	34421d84-5293-4bc2-aef6-62fd61eeb0d2	defender	t	2026-02-18 15:38:34.036685
293371e1-77ca-4e96-912c-3afafa7517d8	c62a6bce-28d0-446f-8893-4af996d7cd2c	7c6a1e59-ee48-4570-a005-cbb09ccc7bb5	defender	t	2026-02-18 15:38:34.154742
18646e81-fbf1-40ea-a858-04cdf5e062f2	c62a6bce-28d0-446f-8893-4af996d7cd2c	16fd5577-dfa1-4875-9dc3-9570fa41d6a1	defender	t	2026-02-18 15:38:34.272365
ff50e1c0-aea2-48b0-8485-887366afb938	c62a6bce-28d0-446f-8893-4af996d7cd2c	9ac9f410-f53b-412a-9263-e26fc68a08ab	midfielder	t	2026-02-18 15:38:34.390525
65feae3b-8bb4-4533-a71a-9f7fde8c7dff	c62a6bce-28d0-446f-8893-4af996d7cd2c	40ea3527-4c0c-4652-868f-f1a24e534a4b	forward	t	2026-02-18 15:38:34.509219
98cde869-9190-4dbc-8da7-106dc49d911a	c62a6bce-28d0-446f-8893-4af996d7cd2c	f5cf48d3-54d9-4d94-8fb9-132952633900	midfielder	t	2026-02-18 15:38:34.627817
10e56631-82f6-44b6-8a8a-643f43c13e7d	c62a6bce-28d0-446f-8893-4af996d7cd2c	3d3b3929-2627-4712-88db-cb5a8490d2e7	forward	t	2026-02-18 15:38:34.74649
3b58d466-899d-42bb-bc40-2bed93a1285c	1bd6501d-2308-4986-bb9a-2f61c84dc2ff	60a7aa8f-b320-4fc1-8dbb-2f22e770e985	defender	t	2026-02-18 15:38:34.982885
451420d3-a701-4387-b5c4-e3d31e97fb3c	1bd6501d-2308-4986-bb9a-2f61c84dc2ff	059e3d4a-7bec-4c01-80c7-ea770f402e64	defender	t	2026-02-18 15:38:35.102108
2cf28c3a-d55d-4f79-9371-a697f98b9a70	1bd6501d-2308-4986-bb9a-2f61c84dc2ff	f71f03cb-b7a0-4d75-820c-d7a46369697e	defender	t	2026-02-18 15:38:35.219798
70960cd4-892f-4d2f-b03f-fdfb13316f30	1bd6501d-2308-4986-bb9a-2f61c84dc2ff	c7c15951-c357-4bc4-b83d-25086e818e1c	defender	t	2026-02-18 15:38:35.337788
b9ce75e5-2a35-42ac-93d6-05744ac55d2d	1bd6501d-2308-4986-bb9a-2f61c84dc2ff	868aab20-5bcb-49ad-9419-ac5fa5aebd30	midfielder	t	2026-02-18 15:38:35.455889
30ce090e-0896-4add-9bf7-83cde6093405	1bd6501d-2308-4986-bb9a-2f61c84dc2ff	79efc563-10ae-4693-80b4-ee485c76afb0	forward	t	2026-02-18 15:38:35.574409
d37988eb-0452-4feb-b1cb-fddc265125bd	1bd6501d-2308-4986-bb9a-2f61c84dc2ff	908b7128-79d7-4f8d-a4a8-4753ffb31ddd	midfielder	t	2026-02-18 15:38:35.692163
9bc34c19-b449-4a04-892e-b515cf55c22f	1bd6501d-2308-4986-bb9a-2f61c84dc2ff	e133eacc-09e1-4d95-8c9e-e5d555ae11d2	forward	t	2026-02-18 15:38:35.810308
13648c9f-f2b8-4796-8354-2c044b08b0a0	1bd6501d-2308-4986-bb9a-2f61c84dc2ff	33333333-3333-3333-3333-333333333333	gk	t	2026-02-18 15:38:35.928788
6ac8ade0-0caf-41d2-b36c-24f8d401ec1a	56332735-94e1-43e5-93ce-f63ca760f6b0	34421d84-5293-4bc2-aef6-62fd61eeb0d2	defender	t	2026-01-29 12:59:36.323165
c66f2275-3436-4ab0-956f-68443b553d84	56332735-94e1-43e5-93ce-f63ca760f6b0	8bec2716-c2bc-4e7a-bdf1-e727e210aa8a	defender	t	2026-01-29 12:59:36.444461
03d5d9a1-c762-42d8-8932-65ae504699b0	56332735-94e1-43e5-93ce-f63ca760f6b0	908b7128-79d7-4f8d-a4a8-4753ffb31ddd	midfielder	t	2026-01-29 12:59:36.561158
9aea2f3c-9734-460e-87d4-dd38d211e3aa	56332735-94e1-43e5-93ce-f63ca760f6b0	a2ead9b4-c4a6-4483-8fa5-3d374a4f3d41	midfielder	t	2026-01-29 12:59:36.678268
28f779e5-3b69-4e2a-81b2-c8fe7cb76012	56332735-94e1-43e5-93ce-f63ca760f6b0	cbe1706f-2284-4dc2-9f5f-37038b72c11a	midfielder	t	2026-01-29 12:59:36.794139
c453e84d-51c4-406d-b86c-aeeac7f436c4	56332735-94e1-43e5-93ce-f63ca760f6b0	fb647db8-10fa-4d7c-a19e-440b084768b4	forward	t	2026-01-29 12:59:36.911691
d792b947-b8a5-46bc-9c4b-ea2950a64378	56332735-94e1-43e5-93ce-f63ca760f6b0	16fd5577-dfa1-4875-9dc3-9570fa41d6a1	defender	t	2026-01-29 12:59:37.027427
4b7e8907-0d1a-4146-bf59-9753de818411	56332735-94e1-43e5-93ce-f63ca760f6b0	3d3b3929-2627-4712-88db-cb5a8490d2e7	midfielder	t	2026-01-29 12:59:37.145264
333efb3c-97a2-4960-a109-36dd54caf704	21cd101f-e41b-47b8-a948-5cc172f132af	47bde709-ca3b-402c-b47b-f608a445eced	defender	t	2026-01-29 12:59:37.378608
0ce0009c-a0e9-4b3a-99c5-1b4918ceb033	21cd101f-e41b-47b8-a948-5cc172f132af	60a7aa8f-b320-4fc1-8dbb-2f22e770e985	defender	t	2026-01-29 12:59:37.495126
180b103c-ebe0-4c66-a45d-0173aa32b821	21cd101f-e41b-47b8-a948-5cc172f132af	f71f03cb-b7a0-4d75-820c-d7a46369697e	defender	t	2026-01-29 12:59:37.612494
320c0d39-a13c-4650-b06c-ee6918616d6b	21cd101f-e41b-47b8-a948-5cc172f132af	9ac9f410-f53b-412a-9263-e26fc68a08ab	midfielder	t	2026-01-29 12:59:37.728086
3ed8dba9-10d8-4ee3-b51c-ee43291f1e80	21cd101f-e41b-47b8-a948-5cc172f132af	7c6a1e59-ee48-4570-a005-cbb09ccc7bb5	defender	t	2026-01-29 12:59:37.845275
fd35803c-71c2-4262-b52b-c97ebc1ab39c	21cd101f-e41b-47b8-a948-5cc172f132af	79efc563-10ae-4693-80b4-ee485c76afb0	midfielder	t	2026-01-29 12:59:37.96141
3bd22333-0c1d-46bc-9043-e416da21dd89	21cd101f-e41b-47b8-a948-5cc172f132af	40ea3527-4c0c-4652-868f-f1a24e534a4b	forward	t	2026-01-29 12:59:38.078318
50ea9198-68b7-43cf-b8b3-f3425fe3ce31	21cd101f-e41b-47b8-a948-5cc172f132af	e133eacc-09e1-4d95-8c9e-e5d555ae11d2	forward	t	2026-01-29 12:59:38.194045
05c186f7-8853-4fe2-94a9-267f327a3606	6fc47ef4-8a3e-4f44-b658-b54e2824fae2	79efc563-10ae-4693-80b4-ee485c76afb0	midfielder	t	2026-01-29 21:26:28.714222
c39da5c3-461c-4b44-98e1-7ea4fa985042	6fc47ef4-8a3e-4f44-b658-b54e2824fae2	8bec2716-c2bc-4e7a-bdf1-e727e210aa8a	defender	t	2026-01-29 21:26:28.845069
45538350-bb7c-4e3b-a0fc-795acc41d348	6fc47ef4-8a3e-4f44-b658-b54e2824fae2	47bde709-ca3b-402c-b47b-f608a445eced	defender	t	2026-01-29 21:26:28.961822
961d35c3-04df-4b24-8b7a-2210d58f0c30	6fc47ef4-8a3e-4f44-b658-b54e2824fae2	d8c54b42-d79d-4d82-aa02-5e60240cab42	midfielder	t	2026-01-29 21:26:29.089154
63687ad8-354f-4f74-a1fb-db196f45e858	6fc47ef4-8a3e-4f44-b658-b54e2824fae2	16fd5577-dfa1-4875-9dc3-9570fa41d6a1	midfielder	t	2026-01-29 21:26:29.206102
aee1840a-f794-44ab-ab72-54377d887def	6fc47ef4-8a3e-4f44-b658-b54e2824fae2	3d3b3929-2627-4712-88db-cb5a8490d2e7	midfielder	t	2026-01-29 21:26:29.333055
3f1863da-f47c-45c8-81f8-834c6dcb9571	6fc47ef4-8a3e-4f44-b658-b54e2824fae2	f71f03cb-b7a0-4d75-820c-d7a46369697e	midfielder	t	2026-01-29 21:26:29.450509
74f69018-7bbd-4eeb-bdb1-819896af4769	6fc47ef4-8a3e-4f44-b658-b54e2824fae2	9ac9f410-f53b-412a-9263-e26fc68a08ab	midfielder	t	2026-01-29 21:26:29.577065
f9764420-7317-4a13-9a8c-94f8bfe2d6aa	50669443-9432-45b4-a39d-a454ccdc2d67	05bd251d-85f8-40c0-834e-fe627e3a63ad	defender	t	2026-01-29 21:26:29.820047
56e2b166-317c-4195-9170-b19ed4340acb	50669443-9432-45b4-a39d-a454ccdc2d67	05c0aeff-3b21-4fe8-a652-72cfbacafbe7	defender	t	2026-01-29 21:26:29.938196
5d21045e-1b1c-41a4-83d4-a784ae225505	50669443-9432-45b4-a39d-a454ccdc2d67	908b7128-79d7-4f8d-a4a8-4753ffb31ddd	forward	t	2026-01-29 21:26:30.064342
6cc1ec49-4c8b-4cdd-aab2-b6e1f5b8d039	50669443-9432-45b4-a39d-a454ccdc2d67	7c6a1e59-ee48-4570-a005-cbb09ccc7bb5	defender	t	2026-01-29 21:26:30.182225
de7344aa-b0d9-4096-a2f4-ba3b66e23909	50669443-9432-45b4-a39d-a454ccdc2d67	cbe1706f-2284-4dc2-9f5f-37038b72c11a	midfielder	t	2026-01-29 21:26:30.307711
f7c5f17e-2033-4f15-8329-b971d36fa32b	50669443-9432-45b4-a39d-a454ccdc2d67	40ea3527-4c0c-4652-868f-f1a24e534a4b	forward	t	2026-01-29 21:26:30.424679
8beefa38-73ff-482b-8e01-12541935f313	50669443-9432-45b4-a39d-a454ccdc2d67	f5cf48d3-54d9-4d94-8fb9-132952633900	midfielder	t	2026-01-29 21:26:30.78504
e770d9af-0238-4da8-8515-6e28aeadb10d	50669443-9432-45b4-a39d-a454ccdc2d67	60a7aa8f-b320-4fc1-8dbb-2f22e770e985	forward	t	2026-01-29 21:26:30.903002
5443afb5-10d9-460a-978f-3373d6b43ef5	835b6d00-2288-4f5c-9290-630bb4c00155	8bec2716-c2bc-4e7a-bdf1-e727e210aa8a	defender	t	2026-01-29 21:39:01.148809
a4b24508-1def-4375-9f4f-f5e08244fe26	835b6d00-2288-4f5c-9290-630bb4c00155	60a7aa8f-b320-4fc1-8dbb-2f22e770e985	defender	t	2026-01-29 21:39:01.267009
1ce75b38-e4fa-4bb8-a80b-d68226dfc539	835b6d00-2288-4f5c-9290-630bb4c00155	fb647db8-10fa-4d7c-a19e-440b084768b4	midfielder	t	2026-01-29 21:39:01.386302
735d0498-6f28-4498-ab8c-c4c67eddcde3	835b6d00-2288-4f5c-9290-630bb4c00155	34421d84-5293-4bc2-aef6-62fd61eeb0d2	defender	t	2026-01-29 21:39:01.50422
e4ae0756-7810-4626-bd5c-abc70f50a1c7	835b6d00-2288-4f5c-9290-630bb4c00155	9ac9f410-f53b-412a-9263-e26fc68a08ab	midfielder	t	2026-01-29 21:39:01.622473
7b8aad46-809f-4bd6-a2ee-a83cc1b8e384	835b6d00-2288-4f5c-9290-630bb4c00155	0ce3e02e-5ba1-4117-9169-664cb1b86649	midfielder	t	2026-01-29 21:39:01.740433
448ccfea-572a-4a49-b712-f85006102d85	835b6d00-2288-4f5c-9290-630bb4c00155	16fd5577-dfa1-4875-9dc3-9570fa41d6a1	defender	t	2026-01-29 21:39:01.858726
a0b87dcc-effb-4768-bd95-49ccb8e3a63e	835b6d00-2288-4f5c-9290-630bb4c00155	3d3b3929-2627-4712-88db-cb5a8490d2e7	forward	t	2026-01-29 21:39:01.976562
04c88191-7f8c-4df5-813c-d46047c7cba8	835b6d00-2288-4f5c-9290-630bb4c00155	33333333-3333-3333-3333-333333333333	gk	t	2026-01-29 21:39:02.095161
da4533a9-bde6-4c18-a8d8-568cc2506500	abacee3d-b2dd-4e1e-a884-308a37ff2169	79efc563-10ae-4693-80b4-ee485c76afb0	midfielder	t	2026-01-29 21:39:02.331658
54748c17-5de2-40ed-b965-ff9a0ecb7677	abacee3d-b2dd-4e1e-a884-308a37ff2169	5ce0a256-dc51-4c20-8d54-ea8e0171376c	gk	t	2026-01-29 21:39:02.450111
46f78e24-e5ed-4187-80ab-10c53fcf6bcc	abacee3d-b2dd-4e1e-a884-308a37ff2169	7c6a1e59-ee48-4570-a005-cbb09ccc7bb5	defender	t	2026-01-29 21:39:02.568997
67789cb0-af00-4081-a4de-ed2c4a6309c4	abacee3d-b2dd-4e1e-a884-308a37ff2169	47bde709-ca3b-402c-b47b-f608a445eced	defender	t	2026-01-29 21:39:02.688486
551515ba-e745-49a2-96ab-23f75ea2efc0	abacee3d-b2dd-4e1e-a884-308a37ff2169	f71f03cb-b7a0-4d75-820c-d7a46369697e	defender	t	2026-01-29 21:39:02.806389
eb9f7099-8ce7-4384-b282-7a6ef27458d8	abacee3d-b2dd-4e1e-a884-308a37ff2169	908b7128-79d7-4f8d-a4a8-4753ffb31ddd	defender	t	2026-01-29 21:39:02.925083
38e9af1a-29b5-4ef6-9732-ba07aa567c1b	abacee3d-b2dd-4e1e-a884-308a37ff2169	e133eacc-09e1-4d95-8c9e-e5d555ae11d2	forward	t	2026-01-29 21:39:03.043362
bfefb840-c3ba-47c5-b67c-2f5134ed0d5c	abacee3d-b2dd-4e1e-a884-308a37ff2169	40ea3527-4c0c-4652-868f-f1a24e534a4b	forward	t	2026-01-29 21:39:03.161729
d6dca6c8-0a38-4137-9a94-f3af6fbd0733	abacee3d-b2dd-4e1e-a884-308a37ff2169	f5cf48d3-54d9-4d94-8fb9-132952633900	midfielder	t	2026-01-29 21:39:03.279994
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teams (id, event_id, name, seed, is_winner, created_at) FROM stdin;
aaaa1111-1111-1111-1111-111111111111	e1111111-1111-1111-1111-111111111111	Time A	1	t	2025-10-28 13:47:43.230832
bbbb1111-1111-1111-1111-111111111111	e1111111-1111-1111-1111-111111111111	Time B	2	f	2025-10-28 13:47:43.230832
a68ea565-f44b-49f4-a77e-b5f0297fe1c1	bb610f7e-f23c-4105-bf33-137155422532	Time B	1	\N	2026-02-07 13:32:09.514462
5656a237-8251-48a1-b0de-6d2c9335cd9c	bb610f7e-f23c-4105-bf33-137155422532	REAL MADRID	0	\N	2026-02-07 13:32:08.755065
5b7389ce-0b64-49eb-9164-ed312eba3514	1e525f5a-d834-4273-98d5-a98884260c62	Time A	0	\N	2025-11-02 14:34:09.990098
ccb1f71a-3ef9-4a29-9333-f866fc81db94	1e525f5a-d834-4273-98d5-a98884260c62	Time B	1	\N	2025-11-02 14:34:10.320386
c8aaf117-b254-4e7c-b1bb-e3d0c9c9a6f8	4cab49e5-b655-461e-860b-f75cc86b8999	Time A	0	\N	2025-11-28 20:23:35.618995
49103a86-164e-49b5-83a8-d14ac144fc9c	4cab49e5-b655-461e-860b-f75cc86b8999	Time B	1	\N	2025-11-28 20:23:36.102998
4bcd785f-caa7-4cce-b911-bf2ae2df8d42	0eb13abf-ad96-43d8-b08c-49a11d14ebe6	Time A	0	\N	2025-12-02 00:38:44.446193
f6f1fc03-362c-455a-846c-3b033bdf7357	0eb13abf-ad96-43d8-b08c-49a11d14ebe6	Time B	1	\N	2025-12-02 00:38:44.803662
df308ea8-24bf-49ba-8fff-90ff365667c9	cfa8bd48-764c-4c0c-afd6-64a4b2675bd0	Time A	0	\N	2025-12-08 18:16:11.97367
986d8389-7203-4f0b-b027-45ecbb7998e5	cfa8bd48-764c-4c0c-afd6-64a4b2675bd0	Time B	1	\N	2025-12-08 18:16:12.216853
eec05055-7a1e-4d7b-957d-3da0482f2ec8	732cb4e5-7936-4ccf-95a8-083ac8d3dba3	Time A	0	\N	2025-12-09 14:44:20.627961
1d1e80a8-b0c9-4cdb-a269-edceae2c9713	732cb4e5-7936-4ccf-95a8-083ac8d3dba3	Time B	1	\N	2025-12-09 14:44:21.232455
1472fe8d-834c-4f93-87ab-0f5a8f183cf7	b1339bab-0a27-4310-8e1c-c9105d9e4fe4	Time A	0	\N	2026-01-13 14:32:16.149299
460a05f7-39b1-4a72-af3e-2fd30d0a03a4	b1339bab-0a27-4310-8e1c-c9105d9e4fe4	Time B	1	\N	2026-01-13 14:32:17.223148
9d176205-6e89-43af-8b4e-61652326f065	d430a65b-1474-40ad-b3e8-b91086eb029f	Real	0	\N	2026-02-12 03:29:55.627134
030945d1-e60d-4c79-9e77-c63428e2809f	d430a65b-1474-40ad-b3e8-b91086eb029f	Barça	1	\N	2026-02-12 03:29:56.707506
c62a6bce-28d0-446f-8893-4af996d7cd2c	e476f21a-9e20-45cc-8896-fb92472c692e	REAL MADRID	0	\N	2026-02-18 15:38:33.781075
90e14ca4-85c5-4e90-befd-82055a7dfc99	eeeeee11-1111-1111-1111-111111111111	Time A	0	\N	2025-11-01 20:31:53.125784
a288a90c-a7d1-47a9-8183-9abf56ff4745	eeeeee11-1111-1111-1111-111111111111	Time B	1	\N	2025-11-01 20:31:53.375777
1bd6501d-2308-4986-bb9a-2f61c84dc2ff	e476f21a-9e20-45cc-8896-fb92472c692e	BARCELONA	1	\N	2026-02-18 15:38:34.864646
168d26e4-d32d-4607-9dc8-da8fc4b5e79a	0a14dead-1a13-477e-9e0a-eae5c0896284	Time A	0	\N	2026-01-28 16:30:13.497556
6a70edec-6475-4acf-8b3d-e69d8762e824	0a14dead-1a13-477e-9e0a-eae5c0896284	Time B	1	\N	2026-01-28 16:30:14.697516
56332735-94e1-43e5-93ce-f63ca760f6b0	cda8d404-ee00-4736-ab8f-e251c4c1ca17	Time A	0	\N	2026-01-29 12:59:36.194996
21cd101f-e41b-47b8-a948-5cc172f132af	cda8d404-ee00-4736-ab8f-e251c4c1ca17	Time B	1	\N	2026-01-29 12:59:37.261003
6fc47ef4-8a3e-4f44-b658-b54e2824fae2	c0357338-dac9-4700-85dc-f0a24777e59f	Time A	0	\N	2026-01-29 21:26:28.585901
50669443-9432-45b4-a39d-a454ccdc2d67	c0357338-dac9-4700-85dc-f0a24777e59f	Time B	1	\N	2026-01-29 21:26:29.694296
835b6d00-2288-4f5c-9290-630bb4c00155	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	Time A	0	\N	2026-01-29 21:39:01.030503
abacee3d-b2dd-4e1e-a884-308a37ff2169	3f3998a7-d0cf-4a9f-8445-4491f96eeea1	Time B	1	\N	2026-01-29 21:39:02.213314
6aec5159-50a8-4868-9d7f-5eabb6f4aae1	707352ef-8960-4fed-aca0-c8d0e22ba213	REAL MADRID	0	\N	2026-02-05 15:44:32.720578
54d2e9a7-a02e-4679-b58e-a9e501c9a28d	707352ef-8960-4fed-aca0-c8d0e22ba213	BARCELONA	1	\N	2026-02-05 15:44:33.962601
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transactions (id, wallet_id, charge_id, type, amount_cents, method, notes, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, email_verified, password_hash, image, created_at, updated_at, reset_token, reset_token_expiry) FROM stdin;
11111111-1111-1111-1111-111111111111	Carlos Silva	carlos@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-07-30 13:22:54.109506	2025-10-28 13:22:54.109506	\N	\N
22222222-2222-2222-2222-222222222222	João Santos	joao@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-08-04 13:22:54.109506	2025-10-28 13:22:54.109506	\N	\N
33333333-3333-3333-3333-333333333333	Pedro Costa	pedro@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-08-09 13:22:54.109506	2025-10-28 13:22:54.109506	\N	\N
44444444-4444-4444-4444-444444444444	Lucas Oliveira	lucas@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-08-14 13:22:54.109506	2025-10-28 13:22:54.109506	\N	\N
55555555-5555-5555-5555-555555555555	Fernando Lima	fernando@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-08-19 13:22:54.109506	2025-10-28 13:22:54.109506	\N	\N
66666666-6666-6666-6666-666666666666	Rafael Souza	rafael@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-08-24 13:22:54.109506	2025-10-28 13:22:54.109506	\N	\N
77777777-7777-7777-7777-777777777777	Marcelo Alves	marcelo@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-08-29 13:22:54.109506	2025-10-28 13:22:54.109506	\N	\N
88888888-8888-8888-8888-888888888888	Bruno Ferreira	bruno@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-09-03 13:22:54.109506	2025-10-28 13:22:54.109506	\N	\N
99999999-9999-9999-9999-999999999999	Diego Pereira	diego@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-09-08 13:22:54.109506	2025-10-28 13:22:54.109506	\N	\N
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	Thiago Rodrigues	thiago@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-09-13 13:22:54.109506	2025-10-28 13:22:54.109506	\N	\N
bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	Gustavo Martins	gustavo@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-09-18 13:22:54.109506	2025-10-28 13:22:54.109506	\N	\N
cccccccc-cccc-cccc-cccc-cccccccccccc	André Barbosa	andre@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-09-23 13:22:54.109506	2025-10-28 13:22:54.109506	\N	\N
dddddddd-dddd-dddd-dddd-dddddddddddd	Felipe Araújo	felipe@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-09-28 13:22:54.109506	2025-10-28 13:22:54.109506	\N	\N
eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee	Rodrigo Cunha	rodrigo@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-10-03 13:22:54.109506	2025-10-28 13:22:54.109506	\N	\N
ffffffff-ffff-ffff-ffff-ffffffffffff	Gabriel Rocha	gabriel@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-10-08 13:22:54.109506	2025-10-28 13:22:54.109506	\N	\N
d913c0fa-fec7-49a1-ba7b-21602fdf43ee	luis fernando boff	luisfboff@hotmail.com	\N	$2a$10$..9RQhiWpMjXNjMBb41TVOu/IYfNCOkNcUVRsaRjDKBBzhwHpyUr2	\N	2025-10-28 13:48:37.257169	2025-10-28 13:48:37.257169	\N	\N
a3724f37-55bf-4cb4-885f-e57c16ed3055	LUIS FERNANDO BOFF	000264770@ufrgs.br	\N	$2a$10$.Twh2WVtr/eu8Z7.G.59Hev/erVs4c7wAsnUrWjJ8AfIJfyW4oNnC	\N	2025-10-29 18:16:11.75586	2025-10-29 18:16:11.75586	\N	\N
4fe52ffd-10eb-4fd8-b3ca-382b242a64ea	VITOR REIS PIROLLI	vitorreispirolli@gmail.com	\N	$2a$10$CKKT0OYOX5KItSSv3oYHzuD3rn50O1cXfaRR5LNpRnz91PYeEY61i	\N	2025-10-29 18:31:50.663894	2025-10-29 18:31:50.663894	\N	\N
1619220b-0ee4-46e3-850b-5bc405435188	Eduardo Boff	baiano@gmail.com	\N	$2a$10$VOD0Djmi1VSwbn6/Nw0AbOWkYTodA1SrMfnwHZZrAfWKPJwDwEXVi	\N	2025-11-02 14:38:00.302508	2025-11-02 14:38:00.302508	\N	\N
3f7043e5-3379-4f94-8ece-bebc99db71c2	Eduardo Zacanni	zacanni@gmail.com	\N	$2a$10$Pc0N95FnEO96D0siLR59m.eqiVQKdfnxMu7T.7jhhrShfjsK6mAJq	\N	2025-11-02 14:40:14.20867	2025-11-02 14:40:14.20867	\N	\N
37894bdc-ef87-4199-abc9-57fd3b14c574	Pedro Vitor Pagliarin	pedro.pagliarin@uzzai.com.br	\N	$2a$10$DR5B0ZiRELcbNadYpQDaAe8t3dJFn47DO73HU4KeW8YQxy29XUnVW	\N	2025-12-17 14:03:08.733012	2025-12-17 14:03:08.733012	\N	\N
645ac7d8-5371-4287-b1c6-cbad405db643	Pedro Henrique corso	pedro_corso@hotmail.com	\N	$2a$10$roGgPs/ntwIdszNQscceyuoL635BJtuv9ekOb45OOstRzxtRcnfBi	\N	2025-12-17 14:08:37.287255	2025-12-17 14:08:37.287255	\N	\N
79efc563-10ae-4693-80b4-ee485c76afb0	Vitor Reis pirolli	v3pirolli@icloud.com	\N	$2a$10$0lvLrif.X2K3qMJ1iuxgGOc/WfwMCz3/yXBxiJFu7qksm4aKs5Edu	\N	2026-01-21 23:37:38.0502	2026-01-21 23:37:38.0502	\N	\N
05c0aeff-3b21-4fe8-a652-72cfbacafbe7	Giba	giba_tieppo@hotmail.com	\N	$2a$10$QLiKf9Jqm9TWc4qSt4Nv0eWT.yllgElI5m0x3Rwj8qxk1x6vSPrzO	\N	2026-01-21 23:43:31.299205	2026-01-21 23:43:31.299205	\N	\N
2c3fc18b-9c51-448c-b168-16c4e2024c04	Uzz.Ai GOD	contato@uzzai.com.br	\N	$2a$10$sEtl3IJDL50/GMQoHFV7OeKRcRaLCVjuX09RQgKIRDRHvHYnxYdKG	\N	2026-01-22 16:17:52.062014	2026-01-22 16:17:52.062014	\N	\N
e133eacc-09e1-4d95-8c9e-e5d555ae11d2	Guilherme Girelli	girino_c3@hotmail.com	\N	$2a$10$O8E2vZwHbMBnY1./Rd3U9eQmtaupZFJDjXZwAy1YWHC/N0nEEmVAK	\N	2026-01-22 16:39:31.741231	2026-01-22 16:39:31.741231	\N	\N
3d3b3929-2627-4712-88db-cb5a8490d2e7	Cristian Grazziotin	cristiangrazziotin@hotmail.com	\N	$2a$10$PjiSvEEIggg9WeAgdyWmu.lQ3eko9v/ScVWPW/eiPf4JoBs4yG1Vy	\N	2026-01-22 16:46:06.961471	2026-01-22 16:46:06.961471	\N	\N
908b7128-79d7-4f8d-a4a8-4753ffb31ddd	Thiago Rech Flores	thiagorechflores@gmail.com	\N	$2a$10$QoWk2veGko7ujZaWIwEbcu8O3vY1ayzZbQnoXfZMtCekeFXAzdnsq	\N	2026-01-22 16:53:30.595673	2026-01-22 16:53:30.595673	\N	\N
f71f03cb-b7a0-4d75-820c-d7a46369697e	Gustavo Dondé 	gustavo.donde@outlook.com	\N	$2a$10$7xcNOl02Lso10iBJ7zK5POLIgWhJT2Q5XCvQHcQBMNqKbdvbySq4W	\N	2026-01-22 17:27:36.119775	2026-01-22 17:27:36.119775	\N	\N
47bde709-ca3b-402c-b47b-f608a445eced	Cauê da Costa	cauedacosta@gmail.com	\N	$2a$10$n1nLsbj9wc5ug795AylufOkt9sCZHmbNZGBtB8kmWbyJZfWdK0nQa	\N	2026-01-22 18:10:25.982119	2026-01-22 18:10:25.982119	\N	\N
40ea3527-4c0c-4652-868f-f1a24e534a4b	Rael Haupt 	rael.3666@gmail.com	\N	$2a$10$wdDlaPxNwyTVte2BdUzvAub48DkKHr9Brbk8LxM9FfdrHGBfHbYCy	\N	2026-01-22 18:26:17.835821	2026-01-22 18:26:17.835821	\N	\N
8bec2716-c2bc-4e7a-bdf1-e727e210aa8a	Denzel tavares	tavaresdenzel7@gmail.com	\N	$2a$10$T3Su.7QwlXu7RxPlul3OHe77BZQoRCnrrlt/NpIhDcMiLEeOFBRi.	\N	2026-01-22 18:41:11.41126	2026-01-22 18:41:11.41126	\N	\N
9ac9f410-f53b-412a-9263-e26fc68a08ab	MAIKE ALEJANDRO OYAMBURO ALVEZ	maikealvez69@gmail.com	\N	$2a$10$te4QzlukchBoaZ41Vo0QjuE0BCoa4BQt44TkixD6/tUlQ34aYo8yi	\N	2026-01-22 22:49:57.532655	2026-01-22 22:49:57.532655	\N	\N
16fd5577-dfa1-4875-9dc3-9570fa41d6a1	Felipe Rimoldi Facchin	felipe_rimoldi@hotmail.com	\N	$2a$10$LVWTBg1bCZVEm6ss/Dy93eteUwlTwStKpe9NIsjUir.n/NrlzBHwy	\N	2026-01-26 13:02:46.625553	2026-01-26 13:02:46.625553	\N	\N
60a7aa8f-b320-4fc1-8dbb-2f22e770e985	Bruno Bertoldo 	bruno.bertoldo.souza@gmail.con	\N	$2a$10$2Kwlosd0w0iGupeqNN21auJvC7RcwdJRu5zA3wHOw67q8mrk1ZQSu	\N	2026-01-26 13:06:38.604287	2026-01-26 13:06:38.604287	\N	\N
05bd251d-85f8-40c0-834e-fe627e3a63ad	Cristian Togni Lopes	ctlopes92@gmail.com	\N	$2a$10$WFYqQ6blwo7DVdcALnA2QuTVdg1Quor9kNDLWDy43IZy1lnDKHru2	\N	2026-01-26 13:16:53.146551	2026-01-26 13:16:53.146551	\N	\N
7c6a1e59-ee48-4570-a005-cbb09ccc7bb5	Gabriel Erlo 	gabriel.erlo@hotmail.com	\N	$2a$10$GtShDLXXKtsaq6ahQzN0weRdL0wnXouGi3wmLg2oF/C6SQNuhrDBe	\N	2026-01-26 13:56:54.986955	2026-01-26 13:56:54.986955	\N	\N
34421d84-5293-4bc2-aef6-62fd61eeb0d2	Matheus Rotta 	matheusrotta94@gmail.com	\N	$2a$10$O2FQfILxCY0FjMEhnPS6oOQFDFiG2UUuwh4B/Q5JykD77S8xS8rk6	\N	2026-01-26 14:07:35.448294	2026-01-26 14:07:35.448294	\N	\N
6e9d11ce-69eb-4841-997a-9202de0e1a1f	Arthur Weber	afweber@ucs.br	\N	$2a$10$VphWVV0deYupBS2dRfu0teXE9tfcGzNG8t4gXhZSMkDBDxdsojLfK	\N	2026-01-26 14:37:17.94583	2026-01-26 14:37:17.94583	\N	\N
a2ead9b4-c4a6-4483-8fa5-3d374a4f3d41	Lucas Debona	lucasdebona05@gmail.com	\N	$2a$10$px2n3L7Nq7yxKfVi7dw3Ju06T0pwqQCYu96W9vQXHISObTzG20.2S	\N	2026-01-26 14:50:56.278745	2026-01-26 14:50:56.278745	\N	\N
f5cf48d3-54d9-4d94-8fb9-132952633900	Vinicius Hoffmann 	vshoff@gmail.com	\N	$2a$10$SQNUGUIANctqBygOUTdBF.LNwgscaPjDlEStIg7JA5wXlTctHJ5/O	\N	2026-01-26 15:03:25.971597	2026-01-26 15:03:25.971597	\N	\N
fb647db8-10fa-4d7c-a19e-440b084768b4	Eduardo Zaccani	eduardo.zaccani@hotmail.com	\N	$2a$10$Y2d5nit98q/k3RMY2pp2HuaJ9lwrX5ZGTt2zO.I9B1QQsoF.vG2Ci	\N	2026-01-27 00:53:59.826407	2026-01-27 00:53:59.826407	\N	\N
0ce3e02e-5ba1-4117-9169-664cb1b86649	Marcelo Ferreira Drum	marcelo99drum40@gmail.com	\N	$2a$10$nKdNMK9TYmRLjHNx..dO1.g7NjAkb9Tsp5kFq9Pb5mmHxSwNdn9PC	\N	2026-01-27 11:06:12.110125	2026-01-27 11:06:12.110125	\N	\N
d8c54b42-d79d-4d82-aa02-5e60240cab42	Kevin Nunes 	kevin_n.s@hotmail.com	\N	$2a$10$s4tc3xxPogyjqIk/A7Z8AOJ.8eiuyzi7AzSm8tFDZSxqNGWmD1/vu	\N	2026-01-27 11:15:00.785955	2026-01-27 11:15:00.785955	\N	\N
da78256e-8580-4ba8-a624-d2d06b8f969f	Henrique Lahm	henriquelahm@hotmail.com	\N	$2a$10$/nutHQ7gARBitnnJ8jyGcOgOdhVpk4EBu8IJa0gLKVZ0peuGYtKMG	\N	2026-01-27 11:54:22.15819	2026-01-27 11:54:22.15819	\N	\N
5ce0a256-dc51-4c20-8d54-ea8e0171376c	Artur Weber Meneguzzi	menewm@hotmail.com	\N	$2a$10$8BhGWmDqHjUIzXIBzMuUju3FocAZokPfRNCrLJGFJ1xTpgSjBfhSy	\N	2026-01-27 19:44:24.356555	2026-01-27 19:44:24.356555	\N	\N
cbe1706f-2284-4dc2-9f5f-37038b72c11a	Igor	igorerlo@hotmail.com	\N	$2a$10$7Kdxy3bs5nFRt0o1WLLfZOyBVfUYivvWMMI8NEoUR3jCgRFPHVXL.	\N	2026-01-29 12:27:17.475233	2026-01-29 12:27:17.475233	\N	\N
f1957bc3-db6a-4bd1-9a88-70f5c04547bd	Guilherme Horstmann 	guui1304@gmail.com	\N	$2a$10$etMTQFNSAPwALUOUeS5U.eP/R6elC4TwDEBi.lMyxMg5X/W5uAlFu	\N	2026-01-29 21:03:32.065708	2026-01-29 21:03:32.065708	\N	\N
059e3d4a-7bec-4c01-80c7-ea770f402e64	JOGADOR DE FORA	sportstrainingcxs@gmail.com	\N	$2a$10$o5INKuI9rZPYqIxr0c5V8udbypjXlBHn5EA8/vySIDmAZ28BVOmqi	\N	2026-02-11 13:28:39.165744	2026-02-11 13:28:39.165744	\N	\N
0e258b67-5118-481a-84a0-fcea7b633af4	Guilherme Zeni	guilherme.zeni98@gmail.com	\N	$2a$10$pM8bwxmP6PmeEDeM1er0VuTWtHLl96kevRnhptU5cYa9KNyTHeqLu	\N	2026-02-11 15:12:20.976376	2026-02-11 15:12:20.976376	\N	\N
c7c15951-c357-4bc4-b83d-25086e818e1c	Mateus Zini	mmz1998@hotmail.com	\N	$2a$10$cKa2skNTBq4TEI9HMELNo.hRJg4lcvZxAEoq2e.IsXnRu8wKEZDiC	\N	2026-02-09 11:33:05.356148	2026-02-09 11:33:05.356148	5323defbbba46d1a8dc7f1662ab07e1c21431aa20ae51a69fb3ba65e496d1249	2026-02-18 12:18:56.716
868aab20-5bcb-49ad-9419-ac5fa5aebd30	Guilherme Ascari 	gbascari@ucs.br	\N	$2a$10$HI5Gse6f8wCQOS0NjLMR.OVh3M12rK83Mr5xfd4lQ9F8Ag0ghzyfq	\N	2026-01-22 17:35:07.350099	2026-01-22 17:35:07.350099	ce4e72cf3a5dfc056b48a28e8c4db628d5559abd1709663ce8b5b60e332b0fa3	2026-02-18 12:42:35.405
\.


--
-- Data for Name: venues; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.venues (id, group_id, name, address, created_at) FROM stdin;
aaaabbbb-1111-1111-1111-111111111111	aaaabbbb-cccc-dddd-eeee-111111111111	Campo do Parque da Cidade	Av. Principal, 1000	2025-07-30 13:47:43.002749
bbbbbbbb-2222-2222-2222-222222222222	aaaabbbb-cccc-dddd-eeee-111111111111	Society Vila Nova	Rua das Flores, 500	2025-08-04 13:47:43.002749
\.


--
-- Data for Name: wallets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wallets (id, owner_type, owner_id, balance_cents, created_at, updated_at) FROM stdin;
8f4dd62f-d29c-499c-9c6b-abb429a24b9b	group	aaaabbbb-cccc-dddd-eeee-111111111111	25000	2025-10-28 13:47:43.448238	2025-10-28 13:47:43.448238
0cba0d23-32f3-42af-8fce-b78c4dadd843	group	aaaabbbb-cccc-dddd-eeee-222222222222	18000	2025-10-28 13:47:43.448238	2025-10-28 13:47:43.448238
8912acb5-77fc-4dd8-b784-f122e9bece61	group	9f5a92a6-6cc4-4c9b-87c2-dc943f458359	0	2025-10-30 18:02:52.959014	2025-10-30 18:02:52.959014
1242ed22-ae8f-4c99-b452-d32c4f13b702	user	3f7043e5-3379-4f94-8ece-bebc99db71c2	0	2025-11-02 14:40:14.253971	2025-11-02 14:40:14.253971
45d4b38a-a02f-4e77-9828-c8bb211eca39	group	0106aace-cb71-4389-bd4c-49003a20b717	0	2025-12-08 18:07:24.735929	2025-12-08 18:07:24.735929
89d6b539-0695-43dd-a87d-ad4f7d7336b7	group	ae0cd047-a04d-4f7b-a910-5461e0a2bd32	0	2025-12-17 14:03:38.685735	2025-12-17 14:03:38.685735
bff0e459-9c8c-43c6-bd40-98b4636ace0f	group	0e492f02-8eff-4907-85ef-68d71e9d2038	0	2025-12-17 14:09:37.962975	2025-12-17 14:09:37.962975
ca780ea8-e91d-4369-a692-52cb229718f9	group	673a26b1-7390-4fd3-824b-3e2ea8fddacc	0	2026-01-21 23:38:22.424872	2026-01-21 23:38:22.424872
0130b815-43f0-4919-b9c0-336c853cd569	user	05c0aeff-3b21-4fe8-a652-72cfbacafbe7	0	2026-01-21 23:44:21.777647	2026-01-21 23:44:21.777647
2849f9a1-5ab6-4ed8-b282-4e1e4c1466d4	user	e133eacc-09e1-4d95-8c9e-e5d555ae11d2	0	2026-01-22 16:40:39.631904	2026-01-22 16:40:39.631904
aab6dab5-9101-4109-a4bb-b4ee8a972024	user	3d3b3929-2627-4712-88db-cb5a8490d2e7	0	2026-01-22 16:46:44.409796	2026-01-22 16:46:44.409796
0c645b53-0403-4d4b-b57f-6ebb83fbf4c2	user	908b7128-79d7-4f8d-a4a8-4753ffb31ddd	0	2026-01-22 16:54:00.237525	2026-01-22 16:54:00.237525
41cbf50c-6e88-4188-bb0a-ae688a721fa7	user	f71f03cb-b7a0-4d75-820c-d7a46369697e	0	2026-01-22 17:28:02.517517	2026-01-22 17:28:02.517517
6893cc57-c40e-4520-80b0-053240750d66	user	868aab20-5bcb-49ad-9419-ac5fa5aebd30	0	2026-01-22 17:35:55.315006	2026-01-22 17:35:55.315006
a7b64835-5c69-48cc-9147-ba4b6cb3eada	user	47bde709-ca3b-402c-b47b-f608a445eced	0	2026-01-22 18:10:56.056989	2026-01-22 18:10:56.056989
ccefaac4-0e19-4ae2-b4f6-af641ffde3d4	user	40ea3527-4c0c-4652-868f-f1a24e534a4b	0	2026-01-22 18:26:56.102336	2026-01-22 18:26:56.102336
674c7a3c-6a11-42fd-87de-6b09189ad626	user	8bec2716-c2bc-4e7a-bdf1-e727e210aa8a	0	2026-01-22 18:41:29.698274	2026-01-22 18:41:29.698274
1f7f00aa-a1c8-46a6-9014-e194b37598a2	user	9ac9f410-f53b-412a-9263-e26fc68a08ab	0	2026-01-22 22:50:33.082045	2026-01-22 22:50:33.082045
dfb8c0ae-4a61-4896-9af3-10de82a33b97	user	16fd5577-dfa1-4875-9dc3-9570fa41d6a1	0	2026-01-26 13:03:09.964917	2026-01-26 13:03:09.964917
e721355f-381e-4a11-a281-e6d4b94d463a	user	60a7aa8f-b320-4fc1-8dbb-2f22e770e985	0	2026-01-26 13:07:38.610739	2026-01-26 13:07:38.610739
ad0526a9-e39a-41bd-9a39-ec7d2fa7a80c	user	7c6a1e59-ee48-4570-a005-cbb09ccc7bb5	0	2026-01-26 13:57:23.169458	2026-01-26 13:57:23.169458
683b4c32-ea28-4e94-8bec-ba335a3e3f1f	user	34421d84-5293-4bc2-aef6-62fd61eeb0d2	0	2026-01-26 14:08:28.359401	2026-01-26 14:08:28.359401
1f6c39a6-c8ff-4ad4-b837-3b94d016ee12	user	6e9d11ce-69eb-4841-997a-9202de0e1a1f	0	2026-01-26 14:37:45.423634	2026-01-26 14:37:45.423634
23204b0d-c613-49cb-90f6-e32c546f535e	user	a2ead9b4-c4a6-4483-8fa5-3d374a4f3d41	0	2026-01-26 14:51:37.718445	2026-01-26 14:51:37.718445
228aa04e-5ce3-4920-bed5-456ead3aae91	user	f5cf48d3-54d9-4d94-8fb9-132952633900	0	2026-01-26 15:04:07.831697	2026-01-26 15:04:07.831697
3d1904d4-6758-4ea8-847b-d1ad448d2afe	user	05bd251d-85f8-40c0-834e-fe627e3a63ad	0	2026-01-26 15:45:36.784373	2026-01-26 15:45:36.784373
607d8a09-6e37-469f-908c-9e94299da0e1	user	fb647db8-10fa-4d7c-a19e-440b084768b4	0	2026-01-27 00:54:49.332884	2026-01-27 00:54:49.332884
7a5db5aa-86c1-48f9-9e0c-c1bef448cc98	user	0ce3e02e-5ba1-4117-9169-664cb1b86649	0	2026-01-27 11:07:36.665441	2026-01-27 11:07:36.665441
4f5dac62-6cc2-4e32-a91f-2d28a2e07868	user	d8c54b42-d79d-4d82-aa02-5e60240cab42	0	2026-01-27 11:16:00.179857	2026-01-27 11:16:00.179857
c66833fa-04a9-472d-bdc3-404f2eb8d449	user	da78256e-8580-4ba8-a624-d2d06b8f969f	0	2026-01-27 11:54:55.574119	2026-01-27 11:54:55.574119
333bdfa6-ee3b-4a73-b6f5-f8b638e3a92a	user	5ce0a256-dc51-4c20-8d54-ea8e0171376c	0	2026-01-27 19:45:05.482764	2026-01-27 19:45:05.482764
d5c41db7-b901-468d-976e-993d34f7d724	user	33333333-3333-3333-3333-333333333333	0	2026-01-27 22:56:16.709946	2026-01-27 22:56:16.709946
006d8e28-c4a5-4686-99e8-2dd89226af4d	user	cbe1706f-2284-4dc2-9f5f-37038b72c11a	0	2026-01-29 12:37:34.464784	2026-01-29 12:37:34.464784
27f3efcd-cf3b-404e-b9a4-3b9f96d25422	user	f1957bc3-db6a-4bd1-9a88-70f5c04547bd	0	2026-01-29 21:04:32.124339	2026-01-29 21:04:32.124339
db1ebef7-63ed-449a-8fd8-f0c54e04eb3a	user	c7c15951-c357-4bc4-b83d-25086e818e1c	0	2026-02-09 12:07:42.505574	2026-02-09 12:07:42.505574
3b1d1526-8a1e-4dae-897e-50d7879ad44f	user	059e3d4a-7bec-4c01-80c7-ea770f402e64	0	2026-02-11 13:29:01.211321	2026-02-11 13:29:01.211321
\.


--
-- Name: charges charges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.charges
    ADD CONSTRAINT charges_pkey PRIMARY KEY (id);


--
-- Name: draw_configs draw_configs_group_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.draw_configs
    ADD CONSTRAINT draw_configs_group_id_key UNIQUE (group_id);


--
-- Name: draw_configs draw_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.draw_configs
    ADD CONSTRAINT draw_configs_pkey PRIMARY KEY (id);


--
-- Name: event_actions event_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_actions
    ADD CONSTRAINT event_actions_pkey PRIMARY KEY (id);


--
-- Name: event_attendance event_attendance_event_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendance
    ADD CONSTRAINT event_attendance_event_id_user_id_key UNIQUE (event_id, user_id);


--
-- Name: event_attendance event_attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendance
    ADD CONSTRAINT event_attendance_pkey PRIMARY KEY (id);


--
-- Name: event_settings event_settings_group_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_settings
    ADD CONSTRAINT event_settings_group_id_key UNIQUE (group_id);


--
-- Name: event_settings event_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_settings
    ADD CONSTRAINT event_settings_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: group_members group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_pkey PRIMARY KEY (id);


--
-- Name: group_members group_members_user_id_group_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_user_id_group_id_key UNIQUE (user_id, group_id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: invites invites_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_code_key UNIQUE (code);


--
-- Name: invites invites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_pkey PRIMARY KEY (id);


--
-- Name: mvp_tiebreaker_votes mvp_tiebreaker_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mvp_tiebreaker_votes
    ADD CONSTRAINT mvp_tiebreaker_votes_pkey PRIMARY KEY (id);


--
-- Name: mvp_tiebreaker_votes mvp_tiebreaker_votes_tiebreaker_id_voter_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mvp_tiebreaker_votes
    ADD CONSTRAINT mvp_tiebreaker_votes_tiebreaker_id_voter_user_id_key UNIQUE (tiebreaker_id, voter_user_id);


--
-- Name: mvp_tiebreakers mvp_tiebreakers_event_id_round_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mvp_tiebreakers
    ADD CONSTRAINT mvp_tiebreakers_event_id_round_key UNIQUE (event_id, round);


--
-- Name: mvp_tiebreakers mvp_tiebreakers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mvp_tiebreakers
    ADD CONSTRAINT mvp_tiebreakers_pkey PRIMARY KEY (id);


--
-- Name: player_ratings player_ratings_event_id_rater_user_id_rated_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_event_id_rater_user_id_rated_user_id_key UNIQUE (event_id, rater_user_id, rated_user_id);


--
-- Name: player_ratings player_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_pkey PRIMARY KEY (id);


--
-- Name: scoring_configs scoring_configs_group_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scoring_configs
    ADD CONSTRAINT scoring_configs_group_id_key UNIQUE (group_id);


--
-- Name: scoring_configs scoring_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scoring_configs
    ADD CONSTRAINT scoring_configs_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_team_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_user_id_key UNIQUE (team_id, user_id);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: venues venues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: idx_charges_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_charges_active ON public.charges USING btree (group_id, status) WHERE (deleted_at IS NULL);


--
-- Name: idx_charges_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_charges_due_date ON public.charges USING btree (due_date);


--
-- Name: idx_charges_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_charges_event ON public.charges USING btree (event_id);


--
-- Name: idx_charges_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_charges_event_id ON public.charges USING btree (event_id);


--
-- Name: idx_charges_group_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_charges_group_status ON public.charges USING btree (group_id, status);


--
-- Name: idx_charges_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_charges_user_status ON public.charges USING btree (user_id, status);


--
-- Name: idx_draw_configs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_draw_configs_created_at ON public.draw_configs USING btree (created_at);


--
-- Name: idx_draw_configs_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_draw_configs_group_id ON public.draw_configs USING btree (group_id);


--
-- Name: idx_event_actions_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_actions_event ON public.event_actions USING btree (event_id);


--
-- Name: idx_event_actions_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_actions_event_type ON public.event_actions USING btree (event_id, action_type);


--
-- Name: idx_event_actions_subject_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_actions_subject_user ON public.event_actions USING btree (subject_user_id, action_type);


--
-- Name: idx_event_actions_team; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_actions_team ON public.event_actions USING btree (team_id, action_type);


--
-- Name: idx_event_actions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_actions_type ON public.event_actions USING btree (action_type);


--
-- Name: idx_event_attendance_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendance_event ON public.event_attendance USING btree (event_id);


--
-- Name: idx_event_attendance_event_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendance_event_status ON public.event_attendance USING btree (event_id, status);


--
-- Name: idx_event_attendance_event_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendance_event_user ON public.event_attendance USING btree (event_id, user_id);


--
-- Name: idx_event_attendance_positions; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendance_positions ON public.event_attendance USING btree (event_id, preferred_position, secondary_position);


--
-- Name: idx_event_attendance_removed_by_self; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendance_removed_by_self ON public.event_attendance USING btree (removed_by_self_at) WHERE (removed_by_self_at IS NOT NULL);


--
-- Name: idx_event_attendance_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendance_user ON public.event_attendance USING btree (user_id);


--
-- Name: idx_event_settings_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_settings_group ON public.event_settings USING btree (group_id);


--
-- Name: idx_events_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_group ON public.events USING btree (group_id);


--
-- Name: idx_events_group_starts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_group_starts ON public.events USING btree (group_id, starts_at);


--
-- Name: idx_events_starts_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_starts_at ON public.events USING btree (starts_at);


--
-- Name: idx_events_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_status ON public.events USING btree (status);


--
-- Name: idx_events_status_starts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_status_starts ON public.events USING btree (status, starts_at);


--
-- Name: idx_group_members_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_group_members_active ON public.group_members USING btree (group_id, user_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_group_members_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_group_members_group ON public.group_members USING btree (group_id);


--
-- Name: idx_group_members_group_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_group_members_group_user ON public.group_members USING btree (group_id, user_id);


--
-- Name: idx_group_members_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_group_members_user ON public.group_members USING btree (user_id);


--
-- Name: idx_group_members_user_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_group_members_user_role ON public.group_members USING btree (user_id, role);


--
-- Name: idx_groups_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_groups_active ON public.groups USING btree (id) WHERE (deleted_at IS NULL);


--
-- Name: idx_invites_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invites_active ON public.invites USING btree (code) WHERE (deleted_at IS NULL);


--
-- Name: idx_mv_scoreboard_event_team; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_mv_scoreboard_event_team ON public.mv_event_scoreboard USING btree (event_id, team_id);


--
-- Name: idx_mvp_tiebreaker_votes_tiebreaker; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mvp_tiebreaker_votes_tiebreaker ON public.mvp_tiebreaker_votes USING btree (tiebreaker_id);


--
-- Name: idx_mvp_tiebreaker_votes_voter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mvp_tiebreaker_votes_voter ON public.mvp_tiebreaker_votes USING btree (voter_user_id);


--
-- Name: idx_mvp_tiebreakers_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mvp_tiebreakers_event ON public.mvp_tiebreakers USING btree (event_id);


--
-- Name: idx_mvp_tiebreakers_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mvp_tiebreakers_status ON public.mvp_tiebreakers USING btree (status);


--
-- Name: idx_player_ratings_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_player_ratings_event ON public.player_ratings USING btree (event_id);


--
-- Name: idx_player_ratings_rated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_player_ratings_rated ON public.player_ratings USING btree (rated_user_id);


--
-- Name: idx_team_members_team; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_members_team ON public.team_members USING btree (team_id);


--
-- Name: idx_team_members_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_members_user ON public.team_members USING btree (user_id);


--
-- Name: idx_teams_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teams_event ON public.teams USING btree (event_id);


--
-- Name: idx_users_reset_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_reset_token ON public.users USING btree (reset_token);


--
-- Name: event_actions trigger_refresh_scoreboard; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_refresh_scoreboard AFTER INSERT OR DELETE OR UPDATE ON public.event_actions FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_event_scoreboard();


--
-- Name: draw_configs update_draw_configs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_draw_configs_updated_at BEFORE UPDATE ON public.draw_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: charges charges_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.charges
    ADD CONSTRAINT charges_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: charges charges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.charges
    ADD CONSTRAINT charges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: draw_configs draw_configs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.draw_configs
    ADD CONSTRAINT draw_configs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: draw_configs draw_configs_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.draw_configs
    ADD CONSTRAINT draw_configs_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: event_actions event_actions_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_actions
    ADD CONSTRAINT event_actions_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: event_actions event_actions_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_actions
    ADD CONSTRAINT event_actions_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_actions event_actions_subject_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_actions
    ADD CONSTRAINT event_actions_subject_user_id_fkey FOREIGN KEY (subject_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: event_actions event_actions_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_actions
    ADD CONSTRAINT event_actions_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- Name: event_attendance event_attendance_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendance
    ADD CONSTRAINT event_attendance_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_attendance event_attendance_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendance
    ADD CONSTRAINT event_attendance_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: event_settings event_settings_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_settings
    ADD CONSTRAINT event_settings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: event_settings event_settings_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_settings
    ADD CONSTRAINT event_settings_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: events events_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: events events_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE SET NULL;


--
-- Name: charges fk_charges_event; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.charges
    ADD CONSTRAINT fk_charges_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL;


--
-- Name: group_members group_members_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: group_members group_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: groups groups_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: invites invites_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: invites invites_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: mvp_tiebreaker_votes mvp_tiebreaker_votes_tiebreaker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mvp_tiebreaker_votes
    ADD CONSTRAINT mvp_tiebreaker_votes_tiebreaker_id_fkey FOREIGN KEY (tiebreaker_id) REFERENCES public.mvp_tiebreakers(id) ON DELETE CASCADE;


--
-- Name: mvp_tiebreaker_votes mvp_tiebreaker_votes_voted_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mvp_tiebreaker_votes
    ADD CONSTRAINT mvp_tiebreaker_votes_voted_user_id_fkey FOREIGN KEY (voted_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: mvp_tiebreaker_votes mvp_tiebreaker_votes_voter_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mvp_tiebreaker_votes
    ADD CONSTRAINT mvp_tiebreaker_votes_voter_user_id_fkey FOREIGN KEY (voter_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: mvp_tiebreakers mvp_tiebreakers_decided_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mvp_tiebreakers
    ADD CONSTRAINT mvp_tiebreakers_decided_by_fkey FOREIGN KEY (decided_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: mvp_tiebreakers mvp_tiebreakers_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mvp_tiebreakers
    ADD CONSTRAINT mvp_tiebreakers_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: mvp_tiebreakers mvp_tiebreakers_winner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mvp_tiebreakers
    ADD CONSTRAINT mvp_tiebreakers_winner_user_id_fkey FOREIGN KEY (winner_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: player_ratings player_ratings_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: player_ratings player_ratings_rated_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_rated_user_id_fkey FOREIGN KEY (rated_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: player_ratings player_ratings_rater_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_rater_user_id_fkey FOREIGN KEY (rater_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: scoring_configs scoring_configs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scoring_configs
    ADD CONSTRAINT scoring_configs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: scoring_configs scoring_configs_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scoring_configs
    ADD CONSTRAINT scoring_configs_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: team_members team_members_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: team_members team_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: teams teams_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_charge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_charge_id_fkey FOREIGN KEY (charge_id) REFERENCES public.charges(id) ON DELETE SET NULL;


--
-- Name: transactions transactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: transactions transactions_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.wallets(id) ON DELETE CASCADE;


--
-- Name: venues venues_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: mv_event_scoreboard; Type: MATERIALIZED VIEW DATA; Schema: public; Owner: -
--

REFRESH MATERIALIZED VIEW public.mv_event_scoreboard;


--
-- PostgreSQL database dump complete
--

\unrestrict avP2TNhDMfl0TJmYAgtKbJiKurhKdTWvHzwdpaAlO9RQpmlLsT4W7jdVc0guvbk

