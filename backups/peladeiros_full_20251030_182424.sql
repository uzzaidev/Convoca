--
-- PostgreSQL database dump
--

\restrict nqnM3nGNOalRaZNMIUoR4KLSQJbnI9RM18o6UluRPLmDQvs2oDNWahKcXx1bwZM

-- Dumped from database version 17.5 (6bc9ef8)
-- Dumped by pg_dump version 18.0

-- Started on 2025-10-30 18:24:24

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
-- TOC entry 3585 (class 0 OID 0)
-- Dependencies: 10
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 255 (class 1255 OID 65846)
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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 237 (class 1259 OID 65777)
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
-- TOC entry 233 (class 1259 OID 65690)
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
-- TOC entry 230 (class 1259 OID 65631)
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
-- TOC entry 3590 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN event_attendance.preferred_position; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.event_attendance.preferred_position IS 'Primeira posição preferida do jogador (goleiro, zagueiro, meio-campo, atacante)';


--
-- TOC entry 3591 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN event_attendance.secondary_position; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.event_attendance.secondary_position IS 'Segunda posição preferida do jogador como alternativa';


--
-- TOC entry 229 (class 1259 OID 65603)
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
-- TOC entry 227 (class 1259 OID 65565)
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
-- TOC entry 226 (class 1259 OID 65548)
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
-- TOC entry 235 (class 1259 OID 65747)
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
-- TOC entry 231 (class 1259 OID 65655)
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
-- TOC entry 239 (class 1259 OID 65837)
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
-- TOC entry 234 (class 1259 OID 65720)
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
-- TOC entry 232 (class 1259 OID 65668)
-- Name: team_members; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    user_id uuid NOT NULL,
    "position" character varying(20) DEFAULT 'line'::character varying,
    starter boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT team_members_position_check CHECK ((("position")::text = ANY ((ARRAY['gk'::character varying, 'line'::character varying])::text[])))
);


ALTER TABLE public.team_members OWNER TO neondb_owner;

--
-- TOC entry 238 (class 1259 OID 65798)
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
-- TOC entry 225 (class 1259 OID 65536)
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
-- TOC entry 228 (class 1259 OID 65589)
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
-- TOC entry 236 (class 1259 OID 65767)
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
-- TOC entry 3577 (class 0 OID 65777)
-- Dependencies: 237
-- Data for Name: charges; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.charges (id, group_id, user_id, type, amount_cents, due_date, status, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3573 (class 0 OID 65690)
-- Dependencies: 233
-- Data for Name: event_actions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
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
\.


--
-- TOC entry 3570 (class 0 OID 65631)
-- Dependencies: 230
-- Data for Name: event_attendance; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.event_attendance (id, event_id, user_id, role, status, checked_in_at, order_of_arrival, created_at, updated_at, preferred_position, secondary_position) FROM stdin;
9adb5ad2-58ca-44d0-b445-61a13d61ef92	e1111111-1111-1111-1111-111111111111	11111111-1111-1111-1111-111111111111	line	yes	2025-10-14 13:47:43.147144	1	2025-10-28 13:47:43.147144	2025-10-28 13:47:43.147144	\N	\N
cc21fccd-5368-4fe6-a62a-7aafcc8b412a	e1111111-1111-1111-1111-111111111111	22222222-2222-2222-2222-222222222222	gk	yes	2025-10-14 13:47:43.147144	2	2025-10-28 13:47:43.147144	2025-10-28 13:47:43.147144	\N	\N
6fa05981-f05d-46af-a11c-44a61c3688db	e1111111-1111-1111-1111-111111111111	33333333-3333-3333-3333-333333333333	line	yes	2025-10-14 13:47:43.147144	3	2025-10-28 13:47:43.147144	2025-10-28 13:47:43.147144	\N	\N
29003335-6bd9-47e1-8943-570dd3d4e236	e1111111-1111-1111-1111-111111111111	44444444-4444-4444-4444-444444444444	line	yes	2025-10-14 13:47:43.147144	4	2025-10-28 13:47:43.147144	2025-10-28 13:47:43.147144	\N	\N
27f66c3f-ed09-46e9-a013-08dd303c386d	e1111111-1111-1111-1111-111111111111	55555555-5555-5555-5555-555555555555	line	yes	2025-10-14 13:47:43.147144	5	2025-10-28 13:47:43.147144	2025-10-28 13:47:43.147144	\N	\N
3a5defc1-5208-42e0-8571-0d70f1b4e89d	e1111111-1111-1111-1111-111111111111	66666666-6666-6666-6666-666666666666	line	yes	2025-10-14 13:47:43.147144	6	2025-10-28 13:47:43.147144	2025-10-28 13:47:43.147144	\N	\N
49121c56-5f9b-4489-8413-a757324dfacf	e1111111-1111-1111-1111-111111111111	77777777-7777-7777-7777-777777777777	line	yes	2025-10-14 13:47:43.147144	7	2025-10-28 13:47:43.147144	2025-10-28 13:47:43.147144	\N	\N
9606e063-7405-44e3-a1cf-7adede37584a	e1111111-1111-1111-1111-111111111111	88888888-8888-8888-8888-888888888888	line	yes	2025-10-14 13:47:43.147144	8	2025-10-28 13:47:43.147144	2025-10-28 13:47:43.147144	\N	\N
45a7cea4-c820-4a97-9593-599d51d129dd	e1111111-1111-1111-1111-111111111111	99999999-9999-9999-9999-999999999999	line	yes	2025-10-14 13:47:43.147144	9	2025-10-28 13:47:43.147144	2025-10-28 13:47:43.147144	\N	\N
7ba7eed9-61cf-4d16-b8ad-61a02642ed87	e1111111-1111-1111-1111-111111111111	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	line	yes	2025-10-14 13:47:43.147144	10	2025-10-28 13:47:43.147144	2025-10-28 13:47:43.147144	\N	\N
e2ec7338-1ad3-4403-b50e-3c08f019f54f	eeeeee11-1111-1111-1111-111111111111	11111111-1111-1111-1111-111111111111	line	yes	\N	\N	2025-10-28 13:47:43.192566	2025-10-28 13:47:43.192566	\N	\N
f5669ed0-79ab-481d-9e75-68f3e4d9490e	eeeeee11-1111-1111-1111-111111111111	22222222-2222-2222-2222-222222222222	gk	yes	\N	\N	2025-10-28 13:47:43.192566	2025-10-28 13:47:43.192566	\N	\N
d3c1fb84-1beb-4928-bd3a-3a0fe3db9afb	eeeeee11-1111-1111-1111-111111111111	33333333-3333-3333-3333-333333333333	line	yes	\N	\N	2025-10-28 13:47:43.192566	2025-10-28 13:47:43.192566	\N	\N
975929b8-e097-4bf3-aa28-f3a06e702f41	eeeeee11-1111-1111-1111-111111111111	44444444-4444-4444-4444-444444444444	line	yes	\N	\N	2025-10-28 13:47:43.192566	2025-10-28 13:47:43.192566	\N	\N
df2c9f0e-5e93-4d04-98c7-c5daec4f0149	eeeeee11-1111-1111-1111-111111111111	55555555-5555-5555-5555-555555555555	line	yes	\N	\N	2025-10-28 13:47:43.192566	2025-10-28 13:47:43.192566	\N	\N
bbe33cd5-a093-4f81-8f94-9d1191e5440f	eeeeee11-1111-1111-1111-111111111111	66666666-6666-6666-6666-666666666666	line	yes	\N	\N	2025-10-28 13:47:43.192566	2025-10-28 13:47:43.192566	\N	\N
b9065f31-10ef-4f83-9038-0f0a0c0086b4	eeeeee11-1111-1111-1111-111111111111	77777777-7777-7777-7777-777777777777	line	yes	\N	\N	2025-10-28 13:47:43.192566	2025-10-28 13:47:43.192566	\N	\N
f0080365-6d63-461a-ac58-2cc0209a1405	eeeeee11-1111-1111-1111-111111111111	88888888-8888-8888-8888-888888888888	line	yes	\N	\N	2025-10-28 13:47:43.192566	2025-10-28 13:47:43.192566	\N	\N
bcef5965-f6eb-481b-b1ed-8fdf8a1631ee	eeeeee11-1111-1111-1111-111111111111	99999999-9999-9999-9999-999999999999	line	waitlist	\N	\N	2025-10-28 13:47:43.192566	2025-10-28 13:47:43.192566	\N	\N
49bc7ac7-0e5a-406d-b14e-c6355fe02351	eeeeee11-1111-1111-1111-111111111111	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	line	waitlist	\N	\N	2025-10-28 13:47:43.192566	2025-10-28 13:47:43.192566	\N	\N
40575253-5cb3-481e-b1bd-0abfebdee61f	4ec5d37f-19bf-412c-96b2-4a09430d6736	33333333-3333-3333-3333-333333333333	line	yes	\N	\N	2025-10-30 18:40:40.873844	2025-10-30 18:40:40.873844	forward	midfielder
\.


--
-- TOC entry 3569 (class 0 OID 65603)
-- Dependencies: 229
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.events (id, group_id, starts_at, venue_id, max_players, max_goalkeepers, status, waitlist_enabled, created_by, created_at, updated_at) FROM stdin;
e1111111-1111-1111-1111-111111111111	aaaabbbb-cccc-dddd-eeee-111111111111	2025-10-14 13:47:43.052579	aaaabbbb-1111-1111-1111-111111111111	10	2	finished	t	11111111-1111-1111-1111-111111111111	2025-10-07 13:47:43.052579	2025-10-28 13:47:43.052579
e2222222-2222-2222-2222-222222222222	aaaabbbb-cccc-dddd-eeee-111111111111	2025-10-21 13:47:43.052579	aaaabbbb-1111-1111-1111-111111111111	10	2	finished	t	11111111-1111-1111-1111-111111111111	2025-10-14 13:47:43.052579	2025-10-28 13:47:43.052579
eeeeee11-1111-1111-1111-111111111111	aaaabbbb-cccc-dddd-eeee-111111111111	2025-11-03 13:47:43.100867	aaaabbbb-1111-1111-1111-111111111111	10	2	scheduled	t	11111111-1111-1111-1111-111111111111	2025-10-26 13:47:43.100867	2025-10-28 13:47:43.100867
eeeeee22-2222-2222-2222-222222222222	aaaabbbb-cccc-dddd-eeee-111111111111	2025-11-10 13:47:43.100867	bbbbbbbb-2222-2222-2222-222222222222	10	2	scheduled	t	11111111-1111-1111-1111-111111111111	2025-10-27 13:47:43.100867	2025-10-28 13:47:43.100867
868edc55-7cf8-4c20-ad53-1b85789f88f7	9f5a92a6-6cc4-4c9b-87c2-dc943f458359	2025-11-01 00:00:00	\N	10	2	scheduled	t	33333333-3333-3333-3333-333333333333	2025-10-30 18:03:05.279112	2025-10-30 18:03:05.279112
4ec5d37f-19bf-412c-96b2-4a09430d6736	9f5a92a6-6cc4-4c9b-87c2-dc943f458359	2025-11-01 00:00:00	\N	10	2	scheduled	t	33333333-3333-3333-3333-333333333333	2025-10-30 18:37:28.153819	2025-10-30 18:37:28.153819
\.


--
-- TOC entry 3567 (class 0 OID 65565)
-- Dependencies: 227
-- Data for Name: group_members; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.group_members (id, user_id, group_id, role, is_goalkeeper, base_rating, joined_at) FROM stdin;
6e641a8d-5e74-427a-b022-a6cdc4a5844d	11111111-1111-1111-1111-111111111111	aaaabbbb-cccc-dddd-eeee-111111111111	admin	f	7	2025-07-30 13:22:54.193494
c372b285-7bc9-487b-9e21-7ef1d64b7e39	22222222-2222-2222-2222-222222222222	aaaabbbb-cccc-dddd-eeee-111111111111	member	t	8	2025-07-31 13:22:54.193494
be8e9dfc-490c-42d8-9b78-e4ed41f16c99	33333333-3333-3333-3333-333333333333	aaaabbbb-cccc-dddd-eeee-111111111111	member	f	6	2025-08-01 13:22:54.193494
d6ad5b70-4395-40d8-863a-a06fb0729041	44444444-4444-4444-4444-444444444444	aaaabbbb-cccc-dddd-eeee-111111111111	member	f	8	2025-08-02 13:22:54.193494
3b912d74-fd12-4c8a-aa0c-6b3fa08ece3e	55555555-5555-5555-5555-555555555555	aaaabbbb-cccc-dddd-eeee-111111111111	member	f	7	2025-08-03 13:22:54.193494
2cbf1dab-a3d8-483c-b6ca-32ffbb65ef32	66666666-6666-6666-6666-666666666666	aaaabbbb-cccc-dddd-eeee-111111111111	member	f	5	2025-08-04 13:22:54.193494
fd116b6b-9635-46a5-ade4-0d56f2dd6bc3	77777777-7777-7777-7777-777777777777	aaaabbbb-cccc-dddd-eeee-111111111111	member	f	7	2025-08-05 13:22:54.193494
82a6b87f-2457-441c-971f-1a7f45c9b9eb	88888888-8888-8888-8888-888888888888	aaaabbbb-cccc-dddd-eeee-111111111111	member	f	6	2025-08-06 13:22:54.193494
ffae2867-1122-44b4-a9d0-d7b50dd09b7b	99999999-9999-9999-9999-999999999999	aaaabbbb-cccc-dddd-eeee-111111111111	member	f	8	2025-08-07 13:22:54.193494
825b87d6-3a15-47a3-8cc8-47fa8d121015	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	aaaabbbb-cccc-dddd-eeee-111111111111	member	f	7	2025-08-08 13:22:54.193494
83fe7524-ae0f-4b48-8585-c14764a993c9	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	aaaabbbb-cccc-dddd-eeee-111111111111	member	t	7	2025-08-09 13:22:54.193494
1ac869fd-0735-4cce-883a-1e649c0c35a3	cccccccc-cccc-cccc-cccc-cccccccccccc	aaaabbbb-cccc-dddd-eeee-111111111111	member	f	6	2025-08-10 13:22:54.193494
eb3d0c60-473e-4d7c-ab54-a81a2b499531	22222222-2222-2222-2222-222222222222	aaaabbbb-cccc-dddd-eeee-222222222222	admin	f	8	2025-08-29 13:22:54.234908
3a590d45-de51-4cf0-b0c8-020dae1186e9	33333333-3333-3333-3333-333333333333	aaaabbbb-cccc-dddd-eeee-222222222222	member	f	7	2025-08-30 13:22:54.234908
7696293b-0119-4fc3-aeb6-26effd9c0691	55555555-5555-5555-5555-555555555555	aaaabbbb-cccc-dddd-eeee-222222222222	member	t	8	2025-08-31 13:22:54.234908
93dda604-a7a9-4b01-b724-627272604319	77777777-7777-7777-7777-777777777777	aaaabbbb-cccc-dddd-eeee-222222222222	member	f	7	2025-09-01 13:22:54.234908
8e666a2d-f7fc-46d4-8234-2c6b08440e9b	99999999-9999-9999-9999-999999999999	aaaabbbb-cccc-dddd-eeee-222222222222	member	f	6	2025-09-02 13:22:54.234908
32a447b8-3c19-4543-8422-bd107a971d50	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	aaaabbbb-cccc-dddd-eeee-222222222222	member	f	7	2025-09-03 13:22:54.234908
10a94b53-b7ae-486e-b8ef-d07d3652ec20	dddddddd-dddd-dddd-dddd-dddddddddddd	aaaabbbb-cccc-dddd-eeee-222222222222	member	f	8	2025-09-04 13:22:54.234908
b562c736-fbba-4baf-b67b-63be058073da	eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee	aaaabbbb-cccc-dddd-eeee-222222222222	member	t	7	2025-09-05 13:22:54.234908
74171546-eeef-45bb-8731-14477c215d51	ffffffff-ffff-ffff-ffff-ffffffffffff	aaaabbbb-cccc-dddd-eeee-222222222222	member	f	6	2025-09-06 13:22:54.234908
0032a708-138b-4475-bb13-322bfb721308	11111111-1111-1111-1111-111111111111	aaaabbbb-cccc-dddd-eeee-222222222222	member	f	7	2025-09-07 13:22:54.234908
d29a649f-ff44-4208-be37-299daffad642	33333333-3333-3333-3333-333333333333	9f5a92a6-6cc4-4c9b-87c2-dc943f458359	admin	f	5	2025-10-30 18:02:52.836149
\.


--
-- TOC entry 3566 (class 0 OID 65548)
-- Dependencies: 226
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.groups (id, name, description, privacy, photo_url, created_by, created_at, updated_at) FROM stdin;
aaaabbbb-cccc-dddd-eeee-111111111111	Pelada do Parque	Pelada de sábado no Parque da Cidade. Racha toda semana!	private	\N	11111111-1111-1111-1111-111111111111	2025-07-30 13:22:54.15121	2025-10-28 13:22:54.15121
aaaabbbb-cccc-dddd-eeee-222222222222	Futebol de Quinta	Racha de quinta-feira à noite. Jogadores experientes.	private	\N	22222222-2222-2222-2222-222222222222	2025-08-29 13:22:54.15121	2025-10-28 13:22:54.15121
9f5a92a6-6cc4-4c9b-87c2-dc943f458359	POKER	\N	private	\N	33333333-3333-3333-3333-333333333333	2025-10-30 18:02:52.712046	2025-10-30 18:02:52.712046
\.


--
-- TOC entry 3575 (class 0 OID 65747)
-- Dependencies: 235
-- Data for Name: invites; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.invites (id, group_id, code, created_by, expires_at, max_uses, used_count, created_at) FROM stdin;
70155f82-d675-4959-bb3c-913ec7d13abd	aaaabbbb-cccc-dddd-eeee-111111111111	PARQUE2024	11111111-1111-1111-1111-111111111111	\N	\N	10	2025-10-28 13:47:43.493218
33b2b5a0-59d4-4260-9c2f-44703ea70912	9f5a92a6-6cc4-4c9b-87c2-dc943f458359	E38CJTBN	33333333-3333-3333-3333-333333333333	\N	\N	0	2025-10-30 18:02:53.081848
\.


--
-- TOC entry 3574 (class 0 OID 65720)
-- Dependencies: 234
-- Data for Name: player_ratings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.player_ratings (id, event_id, rater_user_id, rated_user_id, score, tags, created_at) FROM stdin;
e182de56-f27d-46fe-bfad-c213d368d144	e1111111-1111-1111-1111-111111111111	11111111-1111-1111-1111-111111111111	44444444-4444-4444-4444-444444444444	9	{mvp,artilheiro}	2025-10-28 13:47:43.403347
e6573016-95a4-409a-8560-8f27cdfd35b7	e1111111-1111-1111-1111-111111111111	11111111-1111-1111-1111-111111111111	22222222-2222-2222-2222-222222222222	8	{paredao}	2025-10-28 13:47:43.403347
fdc3145e-86de-4f90-8a5d-54b4d762022e	e1111111-1111-1111-1111-111111111111	22222222-2222-2222-2222-222222222222	44444444-4444-4444-4444-444444444444	9	{mvp}	2025-10-28 13:47:43.403347
7baf353b-ba2d-40ca-9dbe-2ab9191813d4	e1111111-1111-1111-1111-111111111111	22222222-2222-2222-2222-222222222222	77777777-7777-7777-7777-777777777777	8	{garcom}	2025-10-28 13:47:43.403347
\.


--
-- TOC entry 3572 (class 0 OID 65668)
-- Dependencies: 232
-- Data for Name: team_members; Type: TABLE DATA; Schema: public; Owner: neondb_owner
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
\.


--
-- TOC entry 3571 (class 0 OID 65655)
-- Dependencies: 231
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.teams (id, event_id, name, seed, is_winner, created_at) FROM stdin;
aaaa1111-1111-1111-1111-111111111111	e1111111-1111-1111-1111-111111111111	Time A	1	t	2025-10-28 13:47:43.230832
bbbb1111-1111-1111-1111-111111111111	e1111111-1111-1111-1111-111111111111	Time B	2	f	2025-10-28 13:47:43.230832
\.


--
-- TOC entry 3578 (class 0 OID 65798)
-- Dependencies: 238
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.transactions (id, wallet_id, charge_id, type, amount_cents, method, notes, created_by, created_at) FROM stdin;
\.


--
-- TOC entry 3565 (class 0 OID 65536)
-- Dependencies: 225
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, name, email, email_verified, password_hash, image, created_at, updated_at) FROM stdin;
11111111-1111-1111-1111-111111111111	Carlos Silva	carlos@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-07-30 13:22:54.109506	2025-10-28 13:22:54.109506
22222222-2222-2222-2222-222222222222	João Santos	joao@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-08-04 13:22:54.109506	2025-10-28 13:22:54.109506
33333333-3333-3333-3333-333333333333	Pedro Costa	pedro@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-08-09 13:22:54.109506	2025-10-28 13:22:54.109506
44444444-4444-4444-4444-444444444444	Lucas Oliveira	lucas@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-08-14 13:22:54.109506	2025-10-28 13:22:54.109506
55555555-5555-5555-5555-555555555555	Fernando Lima	fernando@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-08-19 13:22:54.109506	2025-10-28 13:22:54.109506
66666666-6666-6666-6666-666666666666	Rafael Souza	rafael@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-08-24 13:22:54.109506	2025-10-28 13:22:54.109506
77777777-7777-7777-7777-777777777777	Marcelo Alves	marcelo@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-08-29 13:22:54.109506	2025-10-28 13:22:54.109506
88888888-8888-8888-8888-888888888888	Bruno Ferreira	bruno@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-09-03 13:22:54.109506	2025-10-28 13:22:54.109506
99999999-9999-9999-9999-999999999999	Diego Pereira	diego@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-09-08 13:22:54.109506	2025-10-28 13:22:54.109506
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	Thiago Rodrigues	thiago@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-09-13 13:22:54.109506	2025-10-28 13:22:54.109506
bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	Gustavo Martins	gustavo@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-09-18 13:22:54.109506	2025-10-28 13:22:54.109506
cccccccc-cccc-cccc-cccc-cccccccccccc	André Barbosa	andre@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-09-23 13:22:54.109506	2025-10-28 13:22:54.109506
dddddddd-dddd-dddd-dddd-dddddddddddd	Felipe Araújo	felipe@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-09-28 13:22:54.109506	2025-10-28 13:22:54.109506
eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee	Rodrigo Cunha	rodrigo@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-10-03 13:22:54.109506	2025-10-28 13:22:54.109506
ffffffff-ffff-ffff-ffff-ffffffffffff	Gabriel Rocha	gabriel@test.com	\N	$2a$10$sVugJaUKZMrodev0GwmyYOdKGnTm7T4ciO4/935r0.p1QhY9pXuB2	\N	2025-10-08 13:22:54.109506	2025-10-28 13:22:54.109506
d913c0fa-fec7-49a1-ba7b-21602fdf43ee	luis fernando boff	luisfboff@hotmail.com	\N	$2a$10$..9RQhiWpMjXNjMBb41TVOu/IYfNCOkNcUVRsaRjDKBBzhwHpyUr2	\N	2025-10-28 13:48:37.257169	2025-10-28 13:48:37.257169
a3724f37-55bf-4cb4-885f-e57c16ed3055	LUIS FERNANDO BOFF	000264770@ufrgs.br	\N	$2a$10$.Twh2WVtr/eu8Z7.G.59Hev/erVs4c7wAsnUrWjJ8AfIJfyW4oNnC	\N	2025-10-29 18:16:11.75586	2025-10-29 18:16:11.75586
4fe52ffd-10eb-4fd8-b3ca-382b242a64ea	VITOR REIS PIROLLI	vitorreispirolli@gmail.com	\N	$2a$10$CKKT0OYOX5KItSSv3oYHzuD3rn50O1cXfaRR5LNpRnz91PYeEY61i	\N	2025-10-29 18:31:50.663894	2025-10-29 18:31:50.663894
\.


--
-- TOC entry 3568 (class 0 OID 65589)
-- Dependencies: 228
-- Data for Name: venues; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.venues (id, group_id, name, address, created_at) FROM stdin;
aaaabbbb-1111-1111-1111-111111111111	aaaabbbb-cccc-dddd-eeee-111111111111	Campo do Parque da Cidade	Av. Principal, 1000	2025-07-30 13:47:43.002749
bbbbbbbb-2222-2222-2222-222222222222	aaaabbbb-cccc-dddd-eeee-111111111111	Society Vila Nova	Rua das Flores, 500	2025-08-04 13:47:43.002749
\.


--
-- TOC entry 3576 (class 0 OID 65767)
-- Dependencies: 236
-- Data for Name: wallets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.wallets (id, owner_type, owner_id, balance_cents, created_at, updated_at) FROM stdin;
8f4dd62f-d29c-499c-9c6b-abb429a24b9b	group	aaaabbbb-cccc-dddd-eeee-111111111111	25000	2025-10-28 13:47:43.448238	2025-10-28 13:47:43.448238
0cba0d23-32f3-42af-8fce-b78c4dadd843	group	aaaabbbb-cccc-dddd-eeee-222222222222	18000	2025-10-28 13:47:43.448238	2025-10-28 13:47:43.448238
8912acb5-77fc-4dd8-b784-f122e9bece61	group	9f5a92a6-6cc4-4c9b-87c2-dc943f458359	0	2025-10-30 18:02:52.959014	2025-10-30 18:02:52.959014
\.


--
-- TOC entry 3386 (class 2606 OID 65787)
-- Name: charges charges_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.charges
    ADD CONSTRAINT charges_pkey PRIMARY KEY (id);


--
-- TOC entry 3370 (class 2606 OID 65699)
-- Name: event_actions event_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_actions
    ADD CONSTRAINT event_actions_pkey PRIMARY KEY (id);


--
-- TOC entry 3357 (class 2606 OID 65644)
-- Name: event_attendance event_attendance_event_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_attendance
    ADD CONSTRAINT event_attendance_event_id_user_id_key UNIQUE (event_id, user_id);


--
-- TOC entry 3359 (class 2606 OID 65642)
-- Name: event_attendance event_attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_attendance
    ADD CONSTRAINT event_attendance_pkey PRIMARY KEY (id);


--
-- TOC entry 3352 (class 2606 OID 65615)
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- TOC entry 3344 (class 2606 OID 65576)
-- Name: group_members group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_pkey PRIMARY KEY (id);


--
-- TOC entry 3346 (class 2606 OID 65578)
-- Name: group_members group_members_user_id_group_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_user_id_group_id_key UNIQUE (user_id, group_id);


--
-- TOC entry 3342 (class 2606 OID 65559)
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- TOC entry 3380 (class 2606 OID 65756)
-- Name: invites invites_code_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_code_key UNIQUE (code);


--
-- TOC entry 3382 (class 2606 OID 65754)
-- Name: invites invites_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_pkey PRIMARY KEY (id);


--
-- TOC entry 3376 (class 2606 OID 65731)
-- Name: player_ratings player_ratings_event_id_rater_user_id_rated_user_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_event_id_rater_user_id_rated_user_id_key UNIQUE (event_id, rater_user_id, rated_user_id);


--
-- TOC entry 3378 (class 2606 OID 65729)
-- Name: player_ratings player_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_pkey PRIMARY KEY (id);


--
-- TOC entry 3366 (class 2606 OID 65677)
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- TOC entry 3368 (class 2606 OID 65679)
-- Name: team_members team_members_team_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_user_id_key UNIQUE (team_id, user_id);


--
-- TOC entry 3364 (class 2606 OID 65662)
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- TOC entry 3390 (class 2606 OID 65808)
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 3338 (class 2606 OID 65547)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3340 (class 2606 OID 65545)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3350 (class 2606 OID 65597)
-- Name: venues venues_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_pkey PRIMARY KEY (id);


--
-- TOC entry 3384 (class 2606 OID 65776)
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- TOC entry 3387 (class 1259 OID 65836)
-- Name: idx_charges_due_date; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_charges_due_date ON public.charges USING btree (due_date);


--
-- TOC entry 3388 (class 1259 OID 65835)
-- Name: idx_charges_user_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_charges_user_status ON public.charges USING btree (user_id, status);


--
-- TOC entry 3371 (class 1259 OID 65831)
-- Name: idx_event_actions_event; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_actions_event ON public.event_actions USING btree (event_id);


--
-- TOC entry 3372 (class 1259 OID 65832)
-- Name: idx_event_actions_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_actions_type ON public.event_actions USING btree (action_type);


--
-- TOC entry 3360 (class 1259 OID 65829)
-- Name: idx_event_attendance_event; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_attendance_event ON public.event_attendance USING btree (event_id);


--
-- TOC entry 3361 (class 1259 OID 81922)
-- Name: idx_event_attendance_positions; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_attendance_positions ON public.event_attendance USING btree (event_id, preferred_position, secondary_position);


--
-- TOC entry 3362 (class 1259 OID 65830)
-- Name: idx_event_attendance_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_event_attendance_user ON public.event_attendance USING btree (user_id);


--
-- TOC entry 3353 (class 1259 OID 65826)
-- Name: idx_events_group; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_events_group ON public.events USING btree (group_id);


--
-- TOC entry 3354 (class 1259 OID 65828)
-- Name: idx_events_starts_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_events_starts_at ON public.events USING btree (starts_at);


--
-- TOC entry 3355 (class 1259 OID 65827)
-- Name: idx_events_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_events_status ON public.events USING btree (status);


--
-- TOC entry 3347 (class 1259 OID 65825)
-- Name: idx_group_members_group; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_group_members_group ON public.group_members USING btree (group_id);


--
-- TOC entry 3348 (class 1259 OID 65824)
-- Name: idx_group_members_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_group_members_user ON public.group_members USING btree (user_id);


--
-- TOC entry 3391 (class 1259 OID 65845)
-- Name: idx_mv_scoreboard_event_team; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_mv_scoreboard_event_team ON public.mv_event_scoreboard USING btree (event_id, team_id);


--
-- TOC entry 3373 (class 1259 OID 65833)
-- Name: idx_player_ratings_event; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_player_ratings_event ON public.player_ratings USING btree (event_id);


--
-- TOC entry 3374 (class 1259 OID 65834)
-- Name: idx_player_ratings_rated; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_player_ratings_rated ON public.player_ratings USING btree (rated_user_id);


--
-- TOC entry 3418 (class 2620 OID 65847)
-- Name: event_actions trigger_refresh_scoreboard; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trigger_refresh_scoreboard AFTER INSERT OR DELETE OR UPDATE ON public.event_actions FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_event_scoreboard();


--
-- TOC entry 3413 (class 2606 OID 65788)
-- Name: charges charges_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.charges
    ADD CONSTRAINT charges_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3414 (class 2606 OID 65793)
-- Name: charges charges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.charges
    ADD CONSTRAINT charges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3404 (class 2606 OID 65705)
-- Name: event_actions event_actions_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_actions
    ADD CONSTRAINT event_actions_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3405 (class 2606 OID 65700)
-- Name: event_actions event_actions_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_actions
    ADD CONSTRAINT event_actions_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- TOC entry 3406 (class 2606 OID 65710)
-- Name: event_actions event_actions_subject_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_actions
    ADD CONSTRAINT event_actions_subject_user_id_fkey FOREIGN KEY (subject_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3407 (class 2606 OID 65715)
-- Name: event_actions event_actions_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_actions
    ADD CONSTRAINT event_actions_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- TOC entry 3399 (class 2606 OID 65645)
-- Name: event_attendance event_attendance_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_attendance
    ADD CONSTRAINT event_attendance_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- TOC entry 3400 (class 2606 OID 65650)
-- Name: event_attendance event_attendance_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_attendance
    ADD CONSTRAINT event_attendance_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3396 (class 2606 OID 65626)
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3397 (class 2606 OID 65616)
-- Name: events events_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3398 (class 2606 OID 65621)
-- Name: events events_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE SET NULL;


--
-- TOC entry 3393 (class 2606 OID 65584)
-- Name: group_members group_members_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3394 (class 2606 OID 65579)
-- Name: group_members group_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3392 (class 2606 OID 65560)
-- Name: groups groups_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3411 (class 2606 OID 65762)
-- Name: invites invites_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3412 (class 2606 OID 65757)
-- Name: invites invites_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invites
    ADD CONSTRAINT invites_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3408 (class 2606 OID 65732)
-- Name: player_ratings player_ratings_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- TOC entry 3409 (class 2606 OID 65742)
-- Name: player_ratings player_ratings_rated_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_rated_user_id_fkey FOREIGN KEY (rated_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3410 (class 2606 OID 65737)
-- Name: player_ratings player_ratings_rater_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_rater_user_id_fkey FOREIGN KEY (rater_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3402 (class 2606 OID 65680)
-- Name: team_members team_members_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- TOC entry 3403 (class 2606 OID 65685)
-- Name: team_members team_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3401 (class 2606 OID 65663)
-- Name: teams teams_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- TOC entry 3415 (class 2606 OID 65814)
-- Name: transactions transactions_charge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_charge_id_fkey FOREIGN KEY (charge_id) REFERENCES public.charges(id) ON DELETE SET NULL;


--
-- TOC entry 3416 (class 2606 OID 65819)
-- Name: transactions transactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3417 (class 2606 OID 65809)
-- Name: transactions transactions_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.wallets(id) ON DELETE CASCADE;


--
-- TOC entry 3395 (class 2606 OID 65598)
-- Name: venues venues_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3586 (class 0 OID 0)
-- Dependencies: 10
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO authenticated;


--
-- TOC entry 3587 (class 0 OID 0)
-- Dependencies: 255
-- Name: FUNCTION refresh_event_scoreboard(); Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT ALL ON FUNCTION public.refresh_event_scoreboard() TO authenticated;


--
-- TOC entry 3588 (class 0 OID 0)
-- Dependencies: 237
-- Name: TABLE charges; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.charges TO authenticated;


--
-- TOC entry 3589 (class 0 OID 0)
-- Dependencies: 233
-- Name: TABLE event_actions; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.event_actions TO authenticated;


--
-- TOC entry 3592 (class 0 OID 0)
-- Dependencies: 230
-- Name: TABLE event_attendance; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.event_attendance TO authenticated;


--
-- TOC entry 3593 (class 0 OID 0)
-- Dependencies: 229
-- Name: TABLE events; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.events TO authenticated;


--
-- TOC entry 3594 (class 0 OID 0)
-- Dependencies: 227
-- Name: TABLE group_members; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.group_members TO authenticated;


--
-- TOC entry 3595 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE groups; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.groups TO authenticated;


--
-- TOC entry 3596 (class 0 OID 0)
-- Dependencies: 235
-- Name: TABLE invites; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.invites TO authenticated;


--
-- TOC entry 3597 (class 0 OID 0)
-- Dependencies: 231
-- Name: TABLE teams; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.teams TO authenticated;


--
-- TOC entry 3598 (class 0 OID 0)
-- Dependencies: 239
-- Name: TABLE mv_event_scoreboard; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.mv_event_scoreboard TO authenticated;


--
-- TOC entry 3599 (class 0 OID 0)
-- Dependencies: 234
-- Name: TABLE player_ratings; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.player_ratings TO authenticated;


--
-- TOC entry 3600 (class 0 OID 0)
-- Dependencies: 232
-- Name: TABLE team_members; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.team_members TO authenticated;


--
-- TOC entry 3601 (class 0 OID 0)
-- Dependencies: 238
-- Name: TABLE transactions; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.transactions TO authenticated;


--
-- TOC entry 3602 (class 0 OID 0)
-- Dependencies: 225
-- Name: TABLE users; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.users TO authenticated;


--
-- TOC entry 3603 (class 0 OID 0)
-- Dependencies: 228
-- Name: TABLE venues; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.venues TO authenticated;


--
-- TOC entry 3604 (class 0 OID 0)
-- Dependencies: 236
-- Name: TABLE wallets; Type: ACL; Schema: public; Owner: neondb_owner
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.wallets TO authenticated;


--
-- TOC entry 2129 (class 826 OID 16394)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- TOC entry 2126 (class 826 OID 32785)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: neondb_owner
--

ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public GRANT USAGE ON SEQUENCES TO authenticated;


--
-- TOC entry 2127 (class 826 OID 32786)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: neondb_owner
--

ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;


--
-- TOC entry 2128 (class 826 OID 16393)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- TOC entry 2125 (class 826 OID 32784)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: neondb_owner
--

ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO authenticated;


--
-- TOC entry 3579 (class 0 OID 65837)
-- Dependencies: 239 3581
-- Name: mv_event_scoreboard; Type: MATERIALIZED VIEW DATA; Schema: public; Owner: neondb_owner
--

REFRESH MATERIALIZED VIEW public.mv_event_scoreboard;


-- Completed on 2025-10-30 18:24:30

--
-- PostgreSQL database dump complete
--

\unrestrict nqnM3nGNOalRaZNMIUoR4KLSQJbnI9RM18o6UluRPLmDQvs2oDNWahKcXx1bwZM

