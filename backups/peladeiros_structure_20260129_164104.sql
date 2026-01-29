--
-- PostgreSQL database dump
--

\restrict 4iCM0bebAQhXoJ5dKf5ALC3ru4FCX5ZyryCQqR6jDDbSx13Hmss3qcyK4v7tmcD

-- Dumped from database version 17.7 (bdd1736)
-- Dumped by pg_dump version 18.0

-- Started on 2026-01-29 16:41:09

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
-- TOC entry 10 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- TOC entry 3701 (class 0 OID 0)
-- Dependencies: 10
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 280 (class 1255 OID 65846)
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
-- TOC entry 279 (class 1255 OID 139298)
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
-- TOC entry 3702 (class 0 OID 0)
-- Dependencies: 279
-- Name: FUNCTION update_updated_at_column(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Função trigger para atualizar automaticamente a coluna updated_at';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 245 (class 1259 OID 65565)
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
-- TOC entry 3703 (class 0 OID 0)
-- Dependencies: 245
-- Name: COLUMN group_members.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.group_members.deleted_at IS 'Timestamp when member was removed from group. NULL means active.';


--
-- TOC entry 261 (class 1259 OID 237589)
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
-- TOC entry 3704 (class 0 OID 0)
-- Dependencies: 261
-- Name: VIEW active_group_members; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.active_group_members IS 'Returns only active (non-deleted) group members';


--
-- TOC entry 244 (class 1259 OID 65548)
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
-- TOC entry 3705 (class 0 OID 0)
-- Dependencies: 244
-- Name: COLUMN groups.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.groups.deleted_at IS 'Timestamp when group was soft deleted. NULL means active.';


--
-- TOC entry 260 (class 1259 OID 237585)
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
-- TOC entry 3706 (class 0 OID 0)
-- Dependencies: 260
-- Name: VIEW active_groups; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.active_groups IS 'Returns only active (non-deleted) groups';


--
-- TOC entry 255 (class 1259 OID 65777)
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
-- TOC entry 3707 (class 0 OID 0)
-- Dependencies: 255
-- Name: COLUMN charges.event_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.charges.event_id IS 'Optional reference to the event this charge was created from';


--
-- TOC entry 3708 (class 0 OID 0)
-- Dependencies: 255
-- Name: COLUMN charges.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.charges.deleted_at IS 'Timestamp when charge was deleted. NULL means active.';


--
-- TOC entry 258 (class 1259 OID 139299)
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
-- TOC entry 3709 (class 0 OID 0)
-- Dependencies: 258
-- Name: TABLE draw_configs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.draw_configs IS 'Configurações de sorteio de times por grupo';


--
-- TOC entry 3710 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN draw_configs.players_per_team; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.draw_configs.players_per_team IS 'Número de jogadores titulares por time';


--
-- TOC entry 3711 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN draw_configs.reserves_per_team; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.draw_configs.reserves_per_team IS 'Número de reservas por time';


--
-- TOC entry 3712 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN draw_configs.gk_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.draw_configs.gk_count IS 'Número de goleiros necessários por time';


--
-- TOC entry 3713 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN draw_configs.defender_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.draw_configs.defender_count IS 'Número de zagueiros necessários por time';


--
-- TOC entry 3714 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN draw_configs.midfielder_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.draw_configs.midfielder_count IS 'Número de meio-campistas necessários por time';


--
-- TOC entry 3715 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN draw_configs.forward_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.draw_configs.forward_count IS 'Número de atacantes necessários por time';


--
-- TOC entry 251 (class 1259 OID 65690)
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
-- TOC entry 248 (class 1259 OID 65631)
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
-- TOC entry 3716 (class 0 OID 0)
-- Dependencies: 248
-- Name: COLUMN event_attendance.preferred_position; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_attendance.preferred_position IS 'Primeira posição preferida do jogador (goleiro, zagueiro, meio-campo, atacante)';


--
-- TOC entry 3717 (class 0 OID 0)
-- Dependencies: 248
-- Name: COLUMN event_attendance.secondary_position; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_attendance.secondary_position IS 'Segunda posição preferida do jogador como alternativa';


--
-- TOC entry 3718 (class 0 OID 0)
-- Dependencies: 248
-- Name: COLUMN event_attendance.removed_by_self_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_attendance.removed_by_self_at IS 'Timestamp quando usuário mudou status de yes para no (auto-remoção)';


--
-- TOC entry 259 (class 1259 OID 147456)
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
-- TOC entry 247 (class 1259 OID 65603)
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
-- TOC entry 253 (class 1259 OID 65747)
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
-- TOC entry 3719 (class 0 OID 0)
-- Dependencies: 253
-- Name: COLUMN invites.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.invites.deleted_at IS 'Timestamp when invite was deleted. NULL means active.';


--
-- TOC entry 249 (class 1259 OID 65655)
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
-- TOC entry 257 (class 1259 OID 65837)
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
-- TOC entry 263 (class 1259 OID 270365)
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
-- TOC entry 3720 (class 0 OID 0)
-- Dependencies: 263
-- Name: TABLE mvp_tiebreaker_votes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.mvp_tiebreaker_votes IS 'Votes cast during MVP tiebreaker rounds';


--
-- TOC entry 3721 (class 0 OID 0)
-- Dependencies: 263
-- Name: COLUMN mvp_tiebreaker_votes.tiebreaker_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.mvp_tiebreaker_votes.tiebreaker_id IS 'Reference to the tiebreaker round';


--
-- TOC entry 3722 (class 0 OID 0)
-- Dependencies: 263
-- Name: COLUMN mvp_tiebreaker_votes.voter_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.mvp_tiebreaker_votes.voter_user_id IS 'User casting the vote';


--
-- TOC entry 3723 (class 0 OID 0)
-- Dependencies: 263
-- Name: COLUMN mvp_tiebreaker_votes.voted_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.mvp_tiebreaker_votes.voted_user_id IS 'User receiving the vote (must be in tied_user_ids)';


--
-- TOC entry 262 (class 1259 OID 270336)
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
-- TOC entry 3724 (class 0 OID 0)
-- Dependencies: 262
-- Name: TABLE mvp_tiebreakers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.mvp_tiebreakers IS 'Manages MVP voting tiebreakers for events';


--
-- TOC entry 3725 (class 0 OID 0)
-- Dependencies: 262
-- Name: COLUMN mvp_tiebreakers.round; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.mvp_tiebreakers.round IS 'Tiebreaker round number (starts at 1)';


--
-- TOC entry 3726 (class 0 OID 0)
-- Dependencies: 262
-- Name: COLUMN mvp_tiebreakers.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.mvp_tiebreakers.status IS 'pending: detected but not started | voting: active voting | completed: resolved via votes | admin_decided: admin chose winner';


--
-- TOC entry 3727 (class 0 OID 0)
-- Dependencies: 262
-- Name: COLUMN mvp_tiebreakers.tied_user_ids; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.mvp_tiebreakers.tied_user_ids IS 'Array of user IDs that are tied';


--
-- TOC entry 3728 (class 0 OID 0)
-- Dependencies: 262
-- Name: COLUMN mvp_tiebreakers.winner_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.mvp_tiebreakers.winner_user_id IS 'Final MVP winner after tiebreaker';


--
-- TOC entry 3729 (class 0 OID 0)
-- Dependencies: 262
-- Name: COLUMN mvp_tiebreakers.decided_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.mvp_tiebreakers.decided_by IS 'User ID of admin who decided (if admin_decided)';


--
-- TOC entry 252 (class 1259 OID 65720)
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
-- TOC entry 250 (class 1259 OID 65668)
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
-- TOC entry 3730 (class 0 OID 0)
-- Dependencies: 250
-- Name: COLUMN team_members."position"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.team_members."position" IS 'Posição do jogador no time (goleiro, zagueiro, meio-campo, atacante, ou linha genérica)';


--
-- TOC entry 256 (class 1259 OID 65798)
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
-- TOC entry 243 (class 1259 OID 65536)
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
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 246 (class 1259 OID 65589)
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
-- TOC entry 254 (class 1259 OID 65767)
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
-- TOC entry 3476 (class 2606 OID 65787)
-- Name: charges charges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.charges
    ADD CONSTRAINT charges_pkey PRIMARY KEY (id);


--
-- TOC entry 3487 (class 2606 OID 139320)
-- Name: draw_configs draw_configs_group_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.draw_configs
    ADD CONSTRAINT draw_configs_group_id_key UNIQUE (group_id);


--
-- TOC entry 3489 (class 2606 OID 139318)
-- Name: draw_configs draw_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.draw_configs
    ADD CONSTRAINT draw_configs_pkey PRIMARY KEY (id);


--
-- TOC entry 3456 (class 2606 OID 65699)
-- Name: event_actions event_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_actions
    ADD CONSTRAINT event_actions_pkey PRIMARY KEY (id);


--
-- TOC entry 3437 (class 2606 OID 65644)
-- Name: event_attendance event_attendance_event_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendance
    ADD CONSTRAINT event_attendance_event_id_user_id_key UNIQUE (event_id, user_id);


--
-- TOC entry 3439 (class 2606 OID 65642)
-- Name: event_attendance event_attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendance
    ADD CONSTRAINT event_attendance_pkey PRIMARY KEY (id);


--
-- TOC entry 3493 (class 2606 OID 147471)
-- Name: event_settings event_settings_group_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_settings
    ADD CONSTRAINT event_settings_group_id_key UNIQUE (group_id);


--
-- TOC entry 3495 (class 2606 OID 147469)
-- Name: event_settings event_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_settings
    ADD CONSTRAINT event_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 3430 (class 2606 OID 65615)
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- TOC entry 3419 (class 2606 OID 65576)
-- Name: group_members group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_pkey PRIMARY KEY (id);


--
-- TOC entry 3421 (class 2606 OID 65578)
-- Name: group_members group_members_user_id_group_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_user_id_group_id_key UNIQUE (user_id, group_id);


--
-- TOC entry 3416 (class 2606 OID 65559)
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- TOC entry 3470 (class 2606 OID 65756)
-- Name: invites invites_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_code_key UNIQUE (code);


--
-- TOC entry 3472 (class 2606 OID 65754)
-- Name: invites invites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_pkey PRIMARY KEY (id);


--
-- TOC entry 3506 (class 2606 OID 270371)
-- Name: mvp_tiebreaker_votes mvp_tiebreaker_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mvp_tiebreaker_votes
    ADD CONSTRAINT mvp_tiebreaker_votes_pkey PRIMARY KEY (id);


--
-- TOC entry 3508 (class 2606 OID 270373)
-- Name: mvp_tiebreaker_votes mvp_tiebreaker_votes_tiebreaker_id_voter_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mvp_tiebreaker_votes
    ADD CONSTRAINT mvp_tiebreaker_votes_tiebreaker_id_voter_user_id_key UNIQUE (tiebreaker_id, voter_user_id);


--
-- TOC entry 3500 (class 2606 OID 270349)
-- Name: mvp_tiebreakers mvp_tiebreakers_event_id_round_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mvp_tiebreakers
    ADD CONSTRAINT mvp_tiebreakers_event_id_round_key UNIQUE (event_id, round);


--
-- TOC entry 3502 (class 2606 OID 270347)
-- Name: mvp_tiebreakers mvp_tiebreakers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mvp_tiebreakers
    ADD CONSTRAINT mvp_tiebreakers_pkey PRIMARY KEY (id);


--
-- TOC entry 3465 (class 2606 OID 65731)
-- Name: player_ratings player_ratings_event_id_rater_user_id_rated_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_event_id_rater_user_id_rated_user_id_key UNIQUE (event_id, rater_user_id, rated_user_id);


--
-- TOC entry 3467 (class 2606 OID 65729)
-- Name: player_ratings player_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_pkey PRIMARY KEY (id);


--
-- TOC entry 3452 (class 2606 OID 65677)
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- TOC entry 3454 (class 2606 OID 65679)
-- Name: team_members team_members_team_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_user_id_key UNIQUE (team_id, user_id);


--
-- TOC entry 3448 (class 2606 OID 65662)
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- TOC entry 3484 (class 2606 OID 65808)
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 3412 (class 2606 OID 65547)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3414 (class 2606 OID 65545)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3428 (class 2606 OID 65597)
-- Name: venues venues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_pkey PRIMARY KEY (id);


--
-- TOC entry 3474 (class 2606 OID 65776)
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- TOC entry 3477 (class 1259 OID 237583)
-- Name: idx_charges_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_charges_active ON public.charges USING btree (group_id, status) WHERE (deleted_at IS NULL);


--
-- TOC entry 3478 (class 1259 OID 65836)
-- Name: idx_charges_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_charges_due_date ON public.charges USING btree (due_date);


--
-- TOC entry 3479 (class 1259 OID 311296)
-- Name: idx_charges_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_charges_event ON public.charges USING btree (event_id);


--
-- TOC entry 3480 (class 1259 OID 212997)
-- Name: idx_charges_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_charges_event_id ON public.charges USING btree (event_id);


--
-- TOC entry 3481 (class 1259 OID 237574)
-- Name: idx_charges_group_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_charges_group_status ON public.charges USING btree (group_id, status);


--
-- TOC entry 3482 (class 1259 OID 65835)
-- Name: idx_charges_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_charges_user_status ON public.charges USING btree (user_id, status);


--
-- TOC entry 3490 (class 1259 OID 139332)
-- Name: idx_draw_configs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_draw_configs_created_at ON public.draw_configs USING btree (created_at);


--
-- TOC entry 3491 (class 1259 OID 139331)
-- Name: idx_draw_configs_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_draw_configs_group_id ON public.draw_configs USING btree (group_id);


--
-- TOC entry 3457 (class 1259 OID 65831)
-- Name: idx_event_actions_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_actions_event ON public.event_actions USING btree (event_id);


--
-- TOC entry 3458 (class 1259 OID 237578)
-- Name: idx_event_actions_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_actions_event_type ON public.event_actions USING btree (event_id, action_type);


--
-- TOC entry 3459 (class 1259 OID 237579)
-- Name: idx_event_actions_subject_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_actions_subject_user ON public.event_actions USING btree (subject_user_id, action_type);


--
-- TOC entry 3460 (class 1259 OID 237580)
-- Name: idx_event_actions_team; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_actions_team ON public.event_actions USING btree (team_id, action_type);


--
-- TOC entry 3461 (class 1259 OID 65832)
-- Name: idx_event_actions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_actions_type ON public.event_actions USING btree (action_type);


--
-- TOC entry 3440 (class 1259 OID 65829)
-- Name: idx_event_attendance_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendance_event ON public.event_attendance USING btree (event_id);


--
-- TOC entry 3441 (class 1259 OID 237573)
-- Name: idx_event_attendance_event_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendance_event_status ON public.event_attendance USING btree (event_id, status);


--
-- TOC entry 3442 (class 1259 OID 237572)
-- Name: idx_event_attendance_event_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendance_event_user ON public.event_attendance USING btree (event_id, user_id);


--
-- TOC entry 3443 (class 1259 OID 81922)
-- Name: idx_event_attendance_positions; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendance_positions ON public.event_attendance USING btree (event_id, preferred_position, secondary_position);


--
-- TOC entry 3444 (class 1259 OID 270393)
-- Name: idx_event_attendance_removed_by_self; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendance_removed_by_self ON public.event_attendance USING btree (removed_by_self_at) WHERE (removed_by_self_at IS NOT NULL);


--
-- TOC entry 3445 (class 1259 OID 65830)
-- Name: idx_event_attendance_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_attendance_user ON public.event_attendance USING btree (user_id);


--
-- TOC entry 3496 (class 1259 OID 147482)
-- Name: idx_event_settings_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_settings_group ON public.event_settings USING btree (group_id);


--
-- TOC entry 3431 (class 1259 OID 65826)
-- Name: idx_events_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_group ON public.events USING btree (group_id);


--
-- TOC entry 3432 (class 1259 OID 237568)
-- Name: idx_events_group_starts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_group_starts ON public.events USING btree (group_id, starts_at);


--
-- TOC entry 3433 (class 1259 OID 65828)
-- Name: idx_events_starts_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_starts_at ON public.events USING btree (starts_at);


--
-- TOC entry 3434 (class 1259 OID 65827)
-- Name: idx_events_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_status ON public.events USING btree (status);


--
-- TOC entry 3435 (class 1259 OID 237569)
-- Name: idx_events_status_starts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_status_starts ON public.events USING btree (status, starts_at);


--
-- TOC entry 3422 (class 1259 OID 237582)
-- Name: idx_group_members_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_group_members_active ON public.group_members USING btree (group_id, user_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 3423 (class 1259 OID 65825)
-- Name: idx_group_members_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_group_members_group ON public.group_members USING btree (group_id);


--
-- TOC entry 3424 (class 1259 OID 237570)
-- Name: idx_group_members_group_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_group_members_group_user ON public.group_members USING btree (group_id, user_id);


--
-- TOC entry 3425 (class 1259 OID 65824)
-- Name: idx_group_members_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_group_members_user ON public.group_members USING btree (user_id);


--
-- TOC entry 3426 (class 1259 OID 237571)
-- Name: idx_group_members_user_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_group_members_user_role ON public.group_members USING btree (user_id, role);


--
-- TOC entry 3417 (class 1259 OID 237581)
-- Name: idx_groups_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_groups_active ON public.groups USING btree (id) WHERE (deleted_at IS NULL);


--
-- TOC entry 3468 (class 1259 OID 237584)
-- Name: idx_invites_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invites_active ON public.invites USING btree (code) WHERE (deleted_at IS NULL);


--
-- TOC entry 3485 (class 1259 OID 65845)
-- Name: idx_mv_scoreboard_event_team; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_mv_scoreboard_event_team ON public.mv_event_scoreboard USING btree (event_id, team_id);


--
-- TOC entry 3503 (class 1259 OID 270391)
-- Name: idx_mvp_tiebreaker_votes_tiebreaker; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mvp_tiebreaker_votes_tiebreaker ON public.mvp_tiebreaker_votes USING btree (tiebreaker_id);


--
-- TOC entry 3504 (class 1259 OID 270392)
-- Name: idx_mvp_tiebreaker_votes_voter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mvp_tiebreaker_votes_voter ON public.mvp_tiebreaker_votes USING btree (voter_user_id);


--
-- TOC entry 3497 (class 1259 OID 270389)
-- Name: idx_mvp_tiebreakers_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mvp_tiebreakers_event ON public.mvp_tiebreakers USING btree (event_id);


--
-- TOC entry 3498 (class 1259 OID 270390)
-- Name: idx_mvp_tiebreakers_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mvp_tiebreakers_status ON public.mvp_tiebreakers USING btree (status);


--
-- TOC entry 3462 (class 1259 OID 65833)
-- Name: idx_player_ratings_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_player_ratings_event ON public.player_ratings USING btree (event_id);


--
-- TOC entry 3463 (class 1259 OID 65834)
-- Name: idx_player_ratings_rated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_player_ratings_rated ON public.player_ratings USING btree (rated_user_id);


--
-- TOC entry 3449 (class 1259 OID 237576)
-- Name: idx_team_members_team; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_members_team ON public.team_members USING btree (team_id);


--
-- TOC entry 3450 (class 1259 OID 237577)
-- Name: idx_team_members_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_members_user ON public.team_members USING btree (user_id);


--
-- TOC entry 3446 (class 1259 OID 237575)
-- Name: idx_teams_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teams_event ON public.teams USING btree (event_id);


--
-- TOC entry 3546 (class 2620 OID 65847)
-- Name: event_actions trigger_refresh_scoreboard; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_refresh_scoreboard AFTER INSERT OR DELETE OR UPDATE ON public.event_actions FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_event_scoreboard();


--
-- TOC entry 3547 (class 2620 OID 139333)
-- Name: draw_configs update_draw_configs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_draw_configs_updated_at BEFORE UPDATE ON public.draw_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3530 (class 2606 OID 65788)
-- Name: charges charges_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.charges
    ADD CONSTRAINT charges_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3531 (class 2606 OID 65793)
-- Name: charges charges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.charges
    ADD CONSTRAINT charges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3536 (class 2606 OID 139326)
-- Name: draw_configs draw_configs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.draw_configs
    ADD CONSTRAINT draw_configs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3537 (class 2606 OID 139321)
-- Name: draw_configs draw_configs_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.draw_configs
    ADD CONSTRAINT draw_configs_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3521 (class 2606 OID 65705)
-- Name: event_actions event_actions_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_actions
    ADD CONSTRAINT event_actions_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3522 (class 2606 OID 65700)
-- Name: event_actions event_actions_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_actions
    ADD CONSTRAINT event_actions_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- TOC entry 3523 (class 2606 OID 65710)
-- Name: event_actions event_actions_subject_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_actions
    ADD CONSTRAINT event_actions_subject_user_id_fkey FOREIGN KEY (subject_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3524 (class 2606 OID 65715)
-- Name: event_actions event_actions_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_actions
    ADD CONSTRAINT event_actions_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- TOC entry 3516 (class 2606 OID 65645)
-- Name: event_attendance event_attendance_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendance
    ADD CONSTRAINT event_attendance_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- TOC entry 3517 (class 2606 OID 65650)
-- Name: event_attendance event_attendance_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_attendance
    ADD CONSTRAINT event_attendance_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3538 (class 2606 OID 147477)
-- Name: event_settings event_settings_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_settings
    ADD CONSTRAINT event_settings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3539 (class 2606 OID 147472)
-- Name: event_settings event_settings_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_settings
    ADD CONSTRAINT event_settings_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3513 (class 2606 OID 65626)
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3514 (class 2606 OID 65616)
-- Name: events events_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3515 (class 2606 OID 65621)
-- Name: events events_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE SET NULL;


--
-- TOC entry 3532 (class 2606 OID 221184)
-- Name: charges fk_charges_event; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.charges
    ADD CONSTRAINT fk_charges_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL;


--
-- TOC entry 3510 (class 2606 OID 65584)
-- Name: group_members group_members_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3511 (class 2606 OID 65579)
-- Name: group_members group_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3509 (class 2606 OID 65560)
-- Name: groups groups_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3528 (class 2606 OID 65762)
-- Name: invites invites_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3529 (class 2606 OID 65757)
-- Name: invites invites_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3543 (class 2606 OID 270374)
-- Name: mvp_tiebreaker_votes mvp_tiebreaker_votes_tiebreaker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mvp_tiebreaker_votes
    ADD CONSTRAINT mvp_tiebreaker_votes_tiebreaker_id_fkey FOREIGN KEY (tiebreaker_id) REFERENCES public.mvp_tiebreakers(id) ON DELETE CASCADE;


--
-- TOC entry 3544 (class 2606 OID 270384)
-- Name: mvp_tiebreaker_votes mvp_tiebreaker_votes_voted_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mvp_tiebreaker_votes
    ADD CONSTRAINT mvp_tiebreaker_votes_voted_user_id_fkey FOREIGN KEY (voted_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3545 (class 2606 OID 270379)
-- Name: mvp_tiebreaker_votes mvp_tiebreaker_votes_voter_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mvp_tiebreaker_votes
    ADD CONSTRAINT mvp_tiebreaker_votes_voter_user_id_fkey FOREIGN KEY (voter_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3540 (class 2606 OID 270360)
-- Name: mvp_tiebreakers mvp_tiebreakers_decided_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mvp_tiebreakers
    ADD CONSTRAINT mvp_tiebreakers_decided_by_fkey FOREIGN KEY (decided_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3541 (class 2606 OID 270350)
-- Name: mvp_tiebreakers mvp_tiebreakers_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mvp_tiebreakers
    ADD CONSTRAINT mvp_tiebreakers_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- TOC entry 3542 (class 2606 OID 270355)
-- Name: mvp_tiebreakers mvp_tiebreakers_winner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mvp_tiebreakers
    ADD CONSTRAINT mvp_tiebreakers_winner_user_id_fkey FOREIGN KEY (winner_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3525 (class 2606 OID 65732)
-- Name: player_ratings player_ratings_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- TOC entry 3526 (class 2606 OID 65742)
-- Name: player_ratings player_ratings_rated_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_rated_user_id_fkey FOREIGN KEY (rated_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3527 (class 2606 OID 65737)
-- Name: player_ratings player_ratings_rater_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_rater_user_id_fkey FOREIGN KEY (rater_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3519 (class 2606 OID 65680)
-- Name: team_members team_members_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- TOC entry 3520 (class 2606 OID 65685)
-- Name: team_members team_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3518 (class 2606 OID 65663)
-- Name: teams teams_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- TOC entry 3533 (class 2606 OID 65814)
-- Name: transactions transactions_charge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_charge_id_fkey FOREIGN KEY (charge_id) REFERENCES public.charges(id) ON DELETE SET NULL;


--
-- TOC entry 3534 (class 2606 OID 65819)
-- Name: transactions transactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3535 (class 2606 OID 65809)
-- Name: transactions transactions_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.wallets(id) ON DELETE CASCADE;


--
-- TOC entry 3512 (class 2606 OID 65598)
-- Name: venues venues_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


-- Completed on 2026-01-29 16:41:13

--
-- PostgreSQL database dump complete
--

\unrestrict 4iCM0bebAQhXoJ5dKf5ALC3ru4FCX5ZyryCQqR6jDDbSx13Hmss3qcyK4v7tmcD

