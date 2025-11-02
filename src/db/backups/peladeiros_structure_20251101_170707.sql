--
-- PostgreSQL database dump
--

\restrict fSstMDgXbGhmqSjFjTi3vopnYIQJforJYUAkbZeEpqiCaJsjtNO6R4LFLU3OW09

-- Dumped from database version 17.5 (6bc9ef8)
-- Dumped by pg_dump version 18.0

-- Started on 2025-11-01 17:07:13

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 3605 (class 0 OID 0)
-- Dependencies: 10
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 262 (class 1255 OID 65846)
-- Name: refresh_event_scoreboard(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.refresh_event_scoreboard() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_event_scoreboard;
  RETURN NULL;
END;
$$;


ALTER FUNCTION public.refresh_event_scoreboard() OWNER TO neondb_owner;

--
-- TOC entry 263 (class 1255 OID 139298)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO neondb_owner;

--
-- TOC entry 3608 (class 0 OID 0)
-- Dependencies: 263
-- Name: FUNCTION update_updated_at_column(); Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Função trigger para atualizar automaticamente a coluna updated_at';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 243 (class 1259 OID 65777)
-- Name: charges; Type: TABLE; Schema: public; Owner: neondb_owner
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
    CONSTRAINT charges_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'canceled'::character varying])::text[]))),
    CONSTRAINT charges_type_check CHECK (((type)::text = ANY ((ARRAY['monthly'::character varying, 'daily'::character varying, 'fine'::character varying, 'other'::character varying])::text[])))
);


ALTER TABLE public.charges OWNER TO neondb_owner;

--
-- TOC entry 246 (class 1259 OID 139299)
-- Name: draw_configs; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.draw_configs OWNER TO neondb_owner;

--
-- TOC entry 3611 (class 0 OID 0)
-- Dependencies: 246
-- Name: TABLE draw_configs; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.draw_configs IS 'Configurações de sorteio de times por grupo';


--
-- TOC entry 3612 (class 0 OID 0)
-- Dependencies: 246
-- Name: COLUMN draw_configs.players_per_team; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.draw_configs.players_per_team IS 'Número de jogadores titulares por time';


--
-- TOC entry 3613 (class 0 OID 0)
-- Dependencies: 246
-- Name: COLUMN draw_configs.reserves_per_team; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.draw_configs.reserves_per_team IS 'Número de reservas por time';


--
-- TOC entry 3614 (class 0 OID 0)
-- Dependencies: 246
-- Name: COLUMN draw_configs.gk_count; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.draw_configs.gk_count IS 'Número de goleiros necessários por time';


--
-- TOC entry 3615 (class 0 OID 0)
-- Dependencies: 246
-- Name: COLUMN draw_configs.defender_count; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.draw_configs.defender_count IS 'Número de zagueiros necessários por time';


--
-- TOC entry 3616 (class 0 OID 0)
-- Dependencies: 246
-- Name: COLUMN draw_configs.midfielder_count; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.draw_configs.midfielder_count IS 'Número de meio-campistas necessários por time';


--
-- TOC entry 3617 (class 0 OID 0)
-- Dependencies: 246
-- Name: COLUMN draw_configs.forward_count; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.draw_configs.forward_count IS 'Número de atacantes necessários por time';


--
-- TOC entry 239 (class 1259 OID 65690)
-- Name: event_actions; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.event_actions OWNER TO neondb_owner;

--
-- TOC entry 236 (class 1259 OID 65631)
-- Name: event_attendance; Type: TABLE; Schema: public; Owner: neondb_owner
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
    CONSTRAINT event_attendance_preferred_position_check CHECK (((preferred_position)::text = ANY ((ARRAY['gk'::character varying, 'defender'::character varying, 'midfielder'::character varying, 'forward'::character varying])::text[]))),
    CONSTRAINT event_attendance_role_check CHECK (((role)::text = ANY ((ARRAY['gk'::character varying, 'line'::character varying])::text[]))),
    CONSTRAINT event_attendance_secondary_position_check CHECK (((secondary_position)::text = ANY ((ARRAY['gk'::character varying, 'defender'::character varying, 'midfielder'::character varying, 'forward'::character varying])::text[]))),
    CONSTRAINT event_attendance_status_check CHECK (((status)::text = ANY ((ARRAY['yes'::character varying, 'no'::character varying, 'waitlist'::character varying])::text[])))
);


ALTER TABLE public.event_attendance OWNER TO neondb_owner;

--
-- TOC entry 3620 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN event_attendance.preferred_position; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.event_attendance.preferred_position IS 'Primeira posição preferida do jogador (goleiro, zagueiro, meio-campo, atacante)';


--
-- TOC entry 3621 (class 0 OID 0)
-- Dependencies: 236
-- Name: COLUMN event_attendance.secondary_position; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.event_attendance.secondary_position IS 'Segunda posição preferida do jogador como alternativa';


--
-- TOC entry 235 (class 1259 OID 65603)
-- Name: events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid NOT NULL,
    starts_at timestamp without time zone NOT NULL,
    venue_id uuid,
    max_players integer DEFAULT 10,
    max_goalkeepers integer DEFAULT 2,
    status character varying(20) DEFAULT 'scheduled'::character varying,
    waitlist_enabled boolean DEFAULT true,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT events_status_check CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'live'::character varying, 'finished'::character varying, 'canceled'::character varying])::text[])))
);


ALTER TABLE public.events OWNER TO neondb_owner;

--
-- TOC entry 233 (class 1259 OID 65565)
-- Name: group_members; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.group_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    group_id uuid NOT NULL,
    role character varying(20) DEFAULT 'member'::character varying,
    is_goalkeeper boolean DEFAULT false,
    base_rating integer DEFAULT 5,
    joined_at timestamp without time zone DEFAULT now(),
    CONSTRAINT group_members_base_rating_check CHECK (((base_rating >= 0) AND (base_rating <= 10))),
    CONSTRAINT group_members_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'member'::character varying])::text[])))
);


ALTER TABLE public.group_members OWNER TO neondb_owner;

--
-- TOC entry 232 (class 1259 OID 65548)
-- Name: groups; Type: TABLE; Schema: public; Owner: neondb_owner
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
    CONSTRAINT groups_privacy_check CHECK (((privacy)::text = ANY ((ARRAY['private'::character varying, 'public'::character varying])::text[])))
);


ALTER TABLE public.groups OWNER TO neondb_owner;

--
-- TOC entry 241 (class 1259 OID 65747)
-- Name: invites; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.invites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid NOT NULL,
    code character varying(20) NOT NULL,
    created_by uuid,
    expires_at timestamp without time zone,
    max_uses integer,
    used_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.invites OWNER TO neondb_owner;

--
-- TOC entry 237 (class 1259 OID 65655)
-- Name: teams; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    name character varying(50) NOT NULL,
    seed integer DEFAULT 0,
    is_winner boolean,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.teams OWNER TO neondb_owner;

--
-- TOC entry 245 (class 1259 OID 65837)
-- Name: mv_event_scoreboard; Type: MATERIALIZED VIEW; Schema: public; Owner: neondb_owner
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


ALTER MATERIALIZED VIEW public.mv_event_scoreboard OWNER TO neondb_owner;

--
-- TOC entry 240 (class 1259 OID 65720)
-- Name: player_ratings; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.player_ratings OWNER TO neondb_owner;

--
-- TOC entry 238 (class 1259 OID 65668)
-- Name: team_members; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.team_members OWNER TO neondb_owner;

--
-- TOC entry 3630 (class 0 OID 0)
-- Dependencies: 238
-- Name: COLUMN team_members."position"; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.team_members."position" IS 'Posição do jogador no time (goleiro, zagueiro, meio-campo, atacante, ou linha genérica)';


--
-- TOC entry 244 (class 1259 OID 65798)
-- Name: transactions; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.transactions OWNER TO neondb_owner;

--
-- TOC entry 231 (class 1259 OID 65536)
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- TOC entry 234 (class 1259 OID 65589)
-- Name: venues; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.venues (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid,
    name character varying(255) NOT NULL,
    address text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.venues OWNER TO neondb_owner;

--
-- TOC entry 242 (class 1259 OID 65767)
-- Name: wallets; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.wallets OWNER TO neondb_owner;

--
-- TOC entry 3412 (class 2606 OID 65787)
-- Name: charges charges_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.charges
    ADD CONSTRAINT charges_pkey PRIMARY KEY (id);


--
-- TOC entry 3419 (class 2606 OID 139320)
-- Name: draw_configs draw_configs_group_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.draw_configs
    ADD CONSTRAINT draw_configs_group_id_key UNIQUE (group_id);


--
-- TOC entry 3421 (class 2606 OID 139318)
-- Name: draw_configs draw_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.draw_configs
    ADD CONSTRAINT draw_configs_pkey PRIMARY KEY (id);


--
-- TOC entry 3396 (class 2606 OID 65699)
-- Name: event_actions event_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_actions
    ADD CONSTRAINT event_actions_pkey PRIMARY KEY (id);


--
-- TOC entry 3383 (class 2606 OID 65644)
-- Name: event_attendance event_attendance_event_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_attendance
    ADD CONSTRAINT event_attendance_event_id_user_id_key UNIQUE (event_id, user_id);


--
-- TOC entry 3385 (class 2606 OID 65642)
-- Name: event_attendance event_attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_attendance
    ADD CONSTRAINT event_attendance_pkey PRIMARY KEY (id);


--
-- TOC entry 3378 (class 2606 OID 65615)
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- TOC entry 3370 (class 2606 OID 65576)
-- Name: group_members group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_pkey PRIMARY KEY (id);


--
-- TOC entry 3372 (class 2606 OID 65578)
-- Name: group_members group_members_user_id_group_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_user_id_group_id_key UNIQUE (user_id, group_id);


--
-- TOC entry 3368 (class 2606 OID 65559)
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- TOC entry 3406 (class 2606 OID 65756)
-- Name: invites invites_code_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_code_key UNIQUE (code);


--
-- TOC entry 3408 (class 2606 OID 65754)
-- Name: invites invites_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_pkey PRIMARY KEY (id);


--
-- TOC entry 3402 (class 2606 OID 65731)
-- Name: player_ratings player_ratings_event_id_rater_user_id_rated_user_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_event_id_rater_user_id_rated_user_id_key UNIQUE (event_id, rater_user_id, rated_user_id);


--
-- TOC entry 3404 (class 2606 OID 65729)
-- Name: player_ratings player_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_pkey PRIMARY KEY (id);


--
-- TOC entry 3392 (class 2606 OID 65677)
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- TOC entry 3394 (class 2606 OID 65679)
-- Name: team_members team_members_team_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_user_id_key UNIQUE (team_id, user_id);


--
-- TOC entry 3390 (class 2606 OID 65662)
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- TOC entry 3416 (class 2606 OID 65808)
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 3364 (class 2606 OID 65547)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3366 (class 2606 OID 65545)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3376 (class 2606 OID 65597)
-- Name: venues venues_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_pkey PRIMARY KEY (id);


--
-- TOC entry 3410 (class 2606 OID 65776)
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- TOC entry 3413 (class 1259 OID 65836)
-- Name: idx_charges_due_date; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_charges_due_date ON public.charges USING btree (due_date);


--
-- TOC entry 3414 (class 1259 OID 65835)
-- Name: idx_charges_user_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_charges_user_status ON public.charges USING btree (user_id, status);


--
-- TOC entry 3422 (class 1259 OID 139332)
-- Name: idx_draw_configs_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_draw_configs_created_at ON public.draw_configs USING btree (created_at);


--
-- TOC entry 3423 (class 1259 OID 139331)
-- Name: idx_draw_configs_group_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_draw_configs_group_id ON public.draw_configs USING btree (group_id);


--
-- TOC entry 3397 (class 1259 OID 65831)
-- Name: idx_event_actions_event; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_actions_event ON public.event_actions USING btree (event_id);


--
-- TOC entry 3398 (class 1259 OID 65832)
-- Name: idx_event_actions_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_actions_type ON public.event_actions USING btree (action_type);


--
-- TOC entry 3386 (class 1259 OID 65829)
-- Name: idx_event_attendance_event; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_attendance_event ON public.event_attendance USING btree (event_id);


--
-- TOC entry 3387 (class 1259 OID 81922)
-- Name: idx_event_attendance_positions; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_attendance_positions ON public.event_attendance USING btree (event_id, preferred_position, secondary_position);


--
-- TOC entry 3388 (class 1259 OID 65830)
-- Name: idx_event_attendance_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_attendance_user ON public.event_attendance USING btree (user_id);


--
-- TOC entry 3379 (class 1259 OID 65826)
-- Name: idx_events_group; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_events_group ON public.events USING btree (group_id);


--
-- TOC entry 3380 (class 1259 OID 65828)
-- Name: idx_events_starts_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_events_starts_at ON public.events USING btree (starts_at);


--
-- TOC entry 3381 (class 1259 OID 65827)
-- Name: idx_events_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_events_status ON public.events USING btree (status);


--
-- TOC entry 3373 (class 1259 OID 65825)
-- Name: idx_group_members_group; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_group_members_group ON public.group_members USING btree (group_id);


--
-- TOC entry 3374 (class 1259 OID 65824)
-- Name: idx_group_members_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_group_members_user ON public.group_members USING btree (user_id);


--
-- TOC entry 3417 (class 1259 OID 65845)
-- Name: idx_mv_scoreboard_event_team; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_mv_scoreboard_event_team ON public.mv_event_scoreboard USING btree (event_id, team_id);


--
-- TOC entry 3399 (class 1259 OID 65833)
-- Name: idx_player_ratings_event; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_player_ratings_event ON public.player_ratings USING btree (event_id);


--
-- TOC entry 3400 (class 1259 OID 65834)
-- Name: idx_player_ratings_rated; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_player_ratings_rated ON public.player_ratings USING btree (rated_user_id);


--
-- TOC entry 3452 (class 2620 OID 65847)
-- Name: event_actions trigger_refresh_scoreboard; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trigger_refresh_scoreboard AFTER INSERT OR DELETE OR UPDATE ON public.event_actions FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_event_scoreboard();


--
-- TOC entry 3453 (class 2620 OID 139333)
-- Name: draw_configs update_draw_configs_updated_at; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER update_draw_configs_updated_at BEFORE UPDATE ON public.draw_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3445 (class 2606 OID 65788)
-- Name: charges charges_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.charges
    ADD CONSTRAINT charges_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3446 (class 2606 OID 65793)
-- Name: charges charges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.charges
    ADD CONSTRAINT charges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3450 (class 2606 OID 139326)
-- Name: draw_configs draw_configs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.draw_configs
    ADD CONSTRAINT draw_configs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3451 (class 2606 OID 139321)
-- Name: draw_configs draw_configs_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.draw_configs
    ADD CONSTRAINT draw_configs_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3436 (class 2606 OID 65705)
-- Name: event_actions event_actions_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_actions
    ADD CONSTRAINT event_actions_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3437 (class 2606 OID 65700)
-- Name: event_actions event_actions_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_actions
    ADD CONSTRAINT event_actions_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- TOC entry 3438 (class 2606 OID 65710)
-- Name: event_actions event_actions_subject_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_actions
    ADD CONSTRAINT event_actions_subject_user_id_fkey FOREIGN KEY (subject_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3439 (class 2606 OID 65715)
-- Name: event_actions event_actions_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_actions
    ADD CONSTRAINT event_actions_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- TOC entry 3431 (class 2606 OID 65645)
-- Name: event_attendance event_attendance_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_attendance
    ADD CONSTRAINT event_attendance_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- TOC entry 3432 (class 2606 OID 65650)
-- Name: event_attendance event_attendance_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_attendance
    ADD CONSTRAINT event_attendance_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3428 (class 2606 OID 65626)
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3429 (class 2606 OID 65616)
-- Name: events events_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3430 (class 2606 OID 65621)
-- Name: events events_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE SET NULL;


--
-- TOC entry 3425 (class 2606 OID 65584)
-- Name: group_members group_members_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3426 (class 2606 OID 65579)
-- Name: group_members group_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3424 (class 2606 OID 65560)
-- Name: groups groups_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3443 (class 2606 OID 65762)
-- Name: invites invites_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3444 (class 2606 OID 65757)
-- Name: invites invites_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3440 (class 2606 OID 65732)
-- Name: player_ratings player_ratings_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- TOC entry 3441 (class 2606 OID 65742)
-- Name: player_ratings player_ratings_rated_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_rated_user_id_fkey FOREIGN KEY (rated_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3442 (class 2606 OID 65737)
-- Name: player_ratings player_ratings_rater_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_rater_user_id_fkey FOREIGN KEY (rater_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3434 (class 2606 OID 65680)
-- Name: team_members team_members_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- TOC entry 3435 (class 2606 OID 65685)
-- Name: team_members team_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3433 (class 2606 OID 65663)
-- Name: teams teams_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- TOC entry 3447 (class 2606 OID 65814)
-- Name: transactions transactions_charge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_charge_id_fkey FOREIGN KEY (charge_id) REFERENCES public.charges(id) ON DELETE SET NULL;


--
-- TOC entry 3448 (class 2606 OID 65819)
-- Name: transactions transactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3449 (class 2606 OID 65809)
-- Name: transactions transactions_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.wallets(id) ON DELETE CASCADE;


--
-- TOC entry 3427 (class 2606 OID 65598)
-- Name: venues venues_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3606 (class 0 OID 0)
-- Dependencies: 10
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO authenticated;


--
-- TOC entry 3607 (class 0 OID 0)
-- Dependencies: 262
-- Name: FUNCTION refresh_event_scoreboard(); Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT ALL ON FUNCTION public.refresh_event_scoreboard() TO authenticated;


--
-- TOC entry 3609 (class 0 OID 0)
-- Dependencies: 263
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;


--
-- TOC entry 3610 (class 0 OID 0)
-- Dependencies: 243
-- Name: TABLE charges; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.charges TO authenticated;


--
-- TOC entry 3618 (class 0 OID 0)
-- Dependencies: 246
-- Name: TABLE draw_configs; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.draw_configs TO authenticated;


--
-- TOC entry 3619 (class 0 OID 0)
-- Dependencies: 239
-- Name: TABLE event_actions; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.event_actions TO authenticated;


--
-- TOC entry 3622 (class 0 OID 0)
-- Dependencies: 236
-- Name: TABLE event_attendance; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.event_attendance TO authenticated;


--
-- TOC entry 3623 (class 0 OID 0)
-- Dependencies: 235
-- Name: TABLE events; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.events TO authenticated;


--
-- TOC entry 3624 (class 0 OID 0)
-- Dependencies: 233
-- Name: TABLE group_members; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.group_members TO authenticated;


--
-- TOC entry 3625 (class 0 OID 0)
-- Dependencies: 232
-- Name: TABLE groups; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.groups TO authenticated;


--
-- TOC entry 3626 (class 0 OID 0)
-- Dependencies: 241
-- Name: TABLE invites; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.invites TO authenticated;


--
-- TOC entry 3627 (class 0 OID 0)
-- Dependencies: 237
-- Name: TABLE teams; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.teams TO authenticated;


--
-- TOC entry 3628 (class 0 OID 0)
-- Dependencies: 245
-- Name: TABLE mv_event_scoreboard; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.mv_event_scoreboard TO authenticated;


--
-- TOC entry 3629 (class 0 OID 0)
-- Dependencies: 240
-- Name: TABLE player_ratings; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.player_ratings TO authenticated;


--
-- TOC entry 3631 (class 0 OID 0)
-- Dependencies: 238
-- Name: TABLE team_members; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.team_members TO authenticated;


--
-- TOC entry 3632 (class 0 OID 0)
-- Dependencies: 244
-- Name: TABLE transactions; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.transactions TO authenticated;


--
-- TOC entry 3633 (class 0 OID 0)
-- Dependencies: 231
-- Name: TABLE users; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.users TO authenticated;


--
-- TOC entry 3634 (class 0 OID 0)
-- Dependencies: 234
-- Name: TABLE venues; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.venues TO authenticated;


--
-- TOC entry 3635 (class 0 OID 0)
-- Dependencies: 242
-- Name: TABLE wallets; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.wallets TO authenticated;


--
-- TOC entry 2140 (class 826 OID 16394)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- TOC entry 2137 (class 826 OID 32785)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: neondb_owner
--

ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public GRANT USAGE ON SEQUENCES TO authenticated;


--
-- TOC entry 2138 (class 826 OID 32786)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: neondb_owner
--

ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;


--
-- TOC entry 2139 (class 826 OID 16393)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- TOC entry 2136 (class 826 OID 32784)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: neondb_owner
--

ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO authenticated;


-- Completed on 2025-11-01 17:07:16

--
-- PostgreSQL database dump complete
--

\unrestrict fSstMDgXbGhmqSjFjTi3vopnYIQJforJYUAkbZeEpqiCaJsjtNO6R4LFLU3OW09

