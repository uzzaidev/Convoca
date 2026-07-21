import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PitchBackground } from "@/components/ui/pitch-background";
import { Jersey } from "@/components/ui/jersey";
import {
  Users,
  Calendar,
  Trophy,
  CircleDot,
  Wallet,
  Activity,
  ArrowRight,
  Play,
  Flame,
  Bell,
  ClipboardList,
  BarChart3,
  Smartphone,
} from "lucide-react";

const FEATURES = [
  {
    icon: Users,
    title: "Grupos & comunidades",
    desc: "Crie grupos pra suas peladas, convide jogadores por link e gerencie membros sem complicação.",
  },
  {
    icon: Calendar,
    title: "Confirmação automática",
    desc: "Sistema de RSVP com lista de espera. Saiba quem vai jogar antes de chegar no campo.",
    highlight: true,
  },
  {
    icon: CircleDot,
    title: "Sorteio equilibrado",
    desc: "Times balanceados por nível. Goleiros separados automaticamente. Sem favoritismo.",
  },
  {
    icon: Activity,
    title: "Registro em tempo real",
    desc: "Gols, assistências e MVP direto pelo celular durante a partida. Placar atualizado.",
  },
  {
    icon: Trophy,
    title: "Rankings da temporada",
    desc: "Artilheiros, melhores assistentes, MVPs e tabela completa por temporada.",
  },
  {
    icon: Wallet,
    title: "Carteira & cobrança",
    desc: "Cobre diárias e mensalidades via Pix. Histórico completo, sem planilha.",
  },
];

const STEPS = [
  {
    n: 1,
    title: "CRIE SEU GRUPO",
    desc: "Cadastre-se e crie um grupo pra sua pelada em poucos segundos.",
    icon: Users,
  },
  {
    n: 2,
    title: "CONVOQUE A GALERA",
    desc: "Compartilhe o link de convite e monte seu elenco completo.",
    icon: Bell,
  },
  {
    n: 3,
    title: "JOGUE A PELADA",
    desc: "Crie o evento, confirme presenças, sorteie os times e bola pra rolar.",
    icon: Activity,
  },
];

const REASONS = [
  { icon: Users, text: "Lista de presença automática com limite de vagas" },
  { icon: CircleDot, text: "Sorteio equilibrado por nível e posição" },
  { icon: BarChart3, text: "Estatísticas detalhadas por jogador e temporada" },
  { icon: Wallet, text: "Cobrança da diária via Pix integrada" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* ───────── HERO ───────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <PitchBackground height="100%" style={{ height: "100%" }} />
        </div>

        {/* dark overlay */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,22,40,.35) 0%, rgba(10,22,40,.7) 100%)",
          }}
        />

        {/* glow accents */}
        <div
          className="absolute left-[-100px] top-[100px] z-[1] h-[360px] w-[360px] rounded-full opacity-20 blur-[120px]"
          style={{ background: "hsl(var(--pitch-glow))" }}
        />
        <div
          className="absolute bottom-[-100px] right-[-80px] z-[1] h-[420px] w-[420px] rounded-full opacity-20 blur-[140px]"
          style={{ background: "hsl(var(--gold))" }}
        />

        {/* Nav */}
        <nav className="relative z-30 px-6 py-5 sm:px-12">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 text-primary-foreground">
            <Link href="/" className="flex items-center gap-2.5">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-md font-display text-xl"
                style={{
                  background: "hsl(var(--navy))",
                  color: "hsl(var(--pitch-glow))",
                  letterSpacing: "0.02em",
                }}
              >
                C
              </div>
              <div>
                <div className="font-display text-xl tracking-display leading-none">
                  CONVOCA
                </div>
                <div className="text-[10px] uppercase tracking-eyebrow opacity-70">
                  Pelada Manager
                </div>
              </div>
            </Link>

            <div className="hidden items-center gap-6 text-sm font-medium md:flex">
              <a href="#features" className="opacity-80 hover:opacity-100 transition-opacity">
                Funcionalidades
              </a>
              <a href="#como-funciona" className="opacity-80 hover:opacity-100 transition-opacity">
                Como funciona
              </a>
              <a href="#beneficios" className="opacity-80 hover:opacity-100 transition-opacity">
                Por que Convoca
              </a>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/auth/signin"
                className="rounded-md px-3 py-1.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 hover:text-white"
              >
                Entrar
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-semibold transition-transform hover:scale-[1.02]"
                style={{
                  background: "hsl(var(--pitch-glow))",
                  color: "hsl(var(--navy))",
                  boxShadow: "0 0 0 4px hsl(var(--pitch-glow) / 0.18)",
                }}
              >
                Começar grátis
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-[5] mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 text-primary-foreground sm:px-12 sm:py-24 lg:grid-cols-[1.15fr_1fr] lg:py-32">
          <div>
            <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 backdrop-blur-sm">
              <Flame className="h-3.5 w-3.5 text-pitch-glow" />
              <span className="text-xs font-semibold tracking-wide text-pitch-glow">
                Marque sua pelada em 30 segundos
              </span>
            </span>

            <h1
              className="font-display tracking-scoreboard mb-6"
              style={{
                fontSize: "clamp(36px, 5.5vw, 72px)",
                lineHeight: 0.92,
              }}
            >
              CONVOQUE A GALERA.
              <br />
              <span
                style={{
                  color: "hsl(var(--pitch-glow))",
                  textShadow: "0 0 32px rgba(34,197,94,.35)",
                }}
              >
                JOGUE A PELADA.
              </span>
              <br />
              VENÇA A SEMANA.
            </h1>

            <p className="mb-9 max-w-xl text-base sm:text-lg leading-relaxed opacity-90">
              Marque jogos, confirme presença, sorteie times equilibrados e
              acompanhe rankings da turma — tudo num só lugar. Chega de
              discussão no grupo do zap.
            </p>

            <div className="mb-12 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-base font-semibold transition-transform hover:scale-[1.02]"
                style={{
                  background: "hsl(var(--pitch-glow))",
                  color: "hsl(var(--navy))",
                  boxShadow: "0 0 0 4px hsl(var(--pitch-glow) / 0.18), 0 8px 24px rgba(0,0,0,.25)",
                }}
              >
                Criar conta grátis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#como-funciona"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-white/25 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <Play className="h-4 w-4" />
                Ver como funciona
              </Link>
            </div>

          </div>

          {/* Right: scoreboard hero card */}
          <div className="relative">
            <div
              className="relative overflow-hidden rounded-2xl border border-navy-2"
              style={{
                background: "hsl(var(--navy))",
                color: "hsl(var(--primary-foreground))",
                boxShadow: "0 30px 80px rgba(0,0,0,.4)",
              }}
            >
              {/* mini header */}
              <div className="flex items-center justify-between border-b border-navy-2 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 animate-pulse-live rounded-full"
                    style={{
                      background: "hsl(var(--coral))",
                      boxShadow: "0 0 12px hsl(var(--coral))",
                    }}
                  />
                  <span className="text-[11px] font-semibold uppercase tracking-eyebrow opacity-80">
                    Galera do Sul · ao vivo
                  </span>
                </div>
                <span className="num font-mono text-xs opacity-60">67:42</span>
              </div>

              {/* score */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-6">
                <div className="text-center">
                  <Jersey
                    number=""
                    size={48}
                    color="hsl(var(--pitch-glow))"
                    textColor="hsl(var(--navy))"
                    stripeColor="rgba(0,0,0,.18)"
                    className="mx-auto"
                  />
                  <div className="mt-1.5 text-[10px] uppercase tracking-eyebrow opacity-70">
                    Brancos
                  </div>
                </div>
                <div
                  className="num font-display tracking-scoreboard text-center text-pitch-glow"
                  style={{
                    fontSize: 84,
                    lineHeight: 0.9,
                    textShadow: "0 0 24px rgba(34,197,94,.4)",
                  }}
                >
                  3—2
                </div>
                <div className="text-center">
                  <Jersey
                    number=""
                    size={48}
                    color="hsl(var(--coral))"
                    stripeColor="rgba(255,255,255,.4)"
                    className="mx-auto"
                  />
                  <div className="mt-1.5 text-[10px] uppercase tracking-eyebrow opacity-70">
                    Vermelhos
                  </div>
                </div>
              </div>

              {/* ranking */}
              <div className="border-t border-navy-2 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-eyebrow opacity-70">
                    Artilheiros
                  </span>
                  <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
                    Top 3
                  </span>
                </div>
                {[
                  { pos: 1, n: 10, name: "Lucas", goals: 22, color: "hsl(var(--pitch-glow))", fg: "hsl(var(--navy))" },
                  { pos: 2, n: 7, name: "Pedrão", goals: 18, color: "hsl(var(--pitch-glow))", fg: "hsl(var(--navy))" },
                  { pos: 3, n: 9, name: "Cauã", goals: 14, color: "hsl(var(--coral))" },
                ].map((p, i) => (
                  <div
                    key={p.pos}
                    className={`flex items-center gap-2.5 py-2 ${i ? "border-t border-navy-2" : ""}`}
                  >
                    <span
                      className="font-display"
                      style={{
                        fontSize: 20,
                        color: p.pos === 1 ? "hsl(var(--gold))" : "rgba(250,246,238,.4)",
                        minWidth: 20,
                      }}
                    >
                      {p.pos}
                    </span>
                    <Jersey
                      number={p.n}
                      size={28}
                      color={p.color}
                      textColor={p.fg}
                      stripeColor={i < 2 ? "rgba(0,0,0,.18)" : "rgba(255,255,255,.4)"}
                    />
                    <span className="flex-1 text-[13px] font-semibold">{p.name}</span>
                    <span
                      className="num font-display"
                      style={{
                        fontSize: 22,
                        color: p.pos === 1 ? "hsl(var(--gold))" : "hsl(var(--pitch-glow))",
                      }}
                    >
                      {p.goals}
                    </span>
                    <span className="text-[10px] uppercase tracking-eyebrow opacity-50">
                      gols
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ───────── FEATURES ───────── */}
      <section id="features" className="bg-background px-6 py-20 sm:px-12 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <Badge className="mb-3 bg-pitch-50 text-pitch hover:bg-pitch-50">
              Funcionalidades
            </Badge>
            <h2
              className="font-display tracking-display mb-3"
              style={{ fontSize: "clamp(32px, 4.5vw, 56px)", lineHeight: 0.95 }}
            >
              TUDO QUE SUA PELADA
              <br />
              PRECISA
            </h2>
            <p className="mx-auto max-w-lg text-base leading-relaxed text-muted-foreground">
              Do convite à estatística final, o Convoca cuida de cada detalhe
              do seu jogo.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={`relative overflow-hidden rounded-2xl border p-7 shadow-warm-md ${
                    f.highlight
                      ? "border-navy-2 bg-navy text-primary-foreground"
                      : "border-border bg-card"
                  }`}
                >
                  {f.highlight && (
                    <div
                      className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-2xl"
                      style={{ background: "hsl(var(--pitch-glow))" }}
                    />
                  )}
                  <div className="relative">
                    <div
                      className={`mb-5 flex h-12 w-12 items-center justify-center rounded-md ${
                        f.highlight ? "bg-pitch-glow/20 text-pitch-glow" : "bg-pitch-50 text-pitch"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3
                      className="font-display tracking-display mb-2"
                      style={{ fontSize: 26, lineHeight: 1 }}
                    >
                      {f.title.toUpperCase()}
                    </h3>
                    <p
                      className={`text-sm leading-relaxed ${
                        f.highlight ? "opacity-75" : "text-muted-foreground"
                      }`}
                    >
                      {f.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── HOW IT WORKS ───────── */}
      <section
        id="como-funciona"
        className="scroll-mt-20 bg-secondary px-6 py-20 sm:px-12 sm:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <Badge className="mb-3 bg-gold/20 text-foreground hover:bg-gold/20">
                Simples assim
              </Badge>
              <h2
                className="font-display tracking-display"
                style={{ fontSize: "clamp(32px, 4.5vw, 56px)", lineHeight: 0.95 }}
              >
                MARQUE A PELADA
                <br />
                EM 3 TOQUES
              </h2>
            </div>
            <Button asChild size="lg" className="bg-navy text-primary-foreground hover:bg-navy/90">
              <Link href="/auth/signup" className="flex items-center gap-2">
                Começar agora
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.n}
                  className="relative overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-warm-md"
                >
                  <div
                    className="font-display absolute right-4 top-2 opacity-15"
                    style={{ fontSize: 96, lineHeight: 1, color: "hsl(var(--pitch))" }}
                  >
                    {String(s.n).padStart(2, "0")}
                  </div>
                  <div
                    className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-pitch text-primary-foreground shadow-warm-md"
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3
                    className="font-display tracking-display mb-2"
                    style={{ fontSize: 26, lineHeight: 1 }}
                  >
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── BENEFITS ───────── */}
      <section id="beneficios" className="bg-background px-6 py-20 sm:px-12 sm:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Badge className="mb-3 bg-pitch-50 text-pitch hover:bg-pitch-50">
              Por que o Convoca?
            </Badge>
            <h2
              className="font-display tracking-display mb-5"
              style={{ fontSize: "clamp(30px, 4vw, 52px)", lineHeight: 0.95 }}
            >
              CHEGA DE LISTA
              <br />
              NO GRUPO DO ZAP
            </h2>
            <p className="mb-8 text-base leading-relaxed text-muted-foreground">
              Esqueça as discussões intermináveis e as listas confusas. O
              Convoca centraliza tudo da sua pelada em um só lugar — bonito,
              rápido e sem complicação.
            </p>
            <div className="flex flex-col gap-3.5">
              {REASONS.map((r) => {
                const Icon = r.icon;
                return (
                  <div key={r.text} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-pitch-50 text-pitch">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[15px]">{r.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* visual: tilted phone-like card */}
          <div className="relative">
            <div
              className="absolute right-[-20px] top-5 hidden h-[380px] w-full rounded-2xl bg-pitch-50 sm:block"
              style={{ transform: "rotate(4deg)" }}
            />
            <div
              className="relative overflow-hidden rounded-2xl border border-navy-2 shadow-warm-lg"
              style={{
                background: "hsl(var(--navy))",
                color: "hsl(var(--primary-foreground))",
                transform: "rotate(-3deg)",
              }}
            >
              <div className="relative">
                <PitchBackground height={130} className="rounded-none" />
                <div className="absolute inset-x-0 top-0 p-6 text-primary-foreground">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block rounded-full bg-navy/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm">
                        Próximo jogo
                      </span>
                      <div
                        className="mt-2 font-display tracking-scoreboard leading-none"
                        style={{ fontSize: 28 }}
                      >
                        QUI · 20:30
                      </div>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                      style={{ background: "hsl(var(--gold))", color: "hsl(var(--accent-foreground))" }}
                    >
                      5 vagas
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4 grid grid-cols-2 gap-2.5">
                  <div className="rounded-md bg-navy-2 p-3">
                    <div className="text-[10px] uppercase tracking-eyebrow opacity-60">
                      Confirmados
                    </div>
                    <div
                      className="num font-display text-pitch-glow"
                      style={{ fontSize: 28, lineHeight: 1 }}
                    >
                      11 / 16
                    </div>
                  </div>
                  <div className="rounded-md bg-navy-2 p-3">
                    <div className="text-[10px] uppercase tracking-eyebrow opacity-60">
                      Diária
                    </div>
                    <div
                      className="num font-display text-pitch-glow"
                      style={{ fontSize: 28, lineHeight: 1 }}
                    >
                      R$ 20
                    </div>
                  </div>
                </div>
                <div className="mb-4 flex items-center gap-1">
                  {[
                    { n: 10, color: "hsl(var(--pitch-glow))", fg: "hsl(var(--navy))" },
                    { n: 7, color: "hsl(var(--gold))", fg: "hsl(var(--accent-foreground))" },
                    { n: 9, color: "hsl(var(--coral))" },
                    { n: 4, color: "#FAF6EE", fg: "hsl(var(--navy))" },
                    { n: 1, color: "#1F2D48" },
                  ].map((j, i) => (
                    <div key={i} style={{ marginLeft: i ? -10 : 0 }}>
                      <Jersey
                        number={j.n}
                        size={30}
                        color={j.color}
                        textColor={j.fg}
                        stripeColor={i < 2 ? "rgba(0,0,0,.18)" : "rgba(255,255,255,.4)"}
                      />
                    </div>
                  ))}
                  <span className="ml-1.5 text-xs opacity-60">+5</span>
                </div>
                <div
                  className="flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold"
                  style={{
                    background: "hsl(var(--pitch-glow))",
                    color: "hsl(var(--navy))",
                    boxShadow: "0 0 0 4px hsl(var(--pitch-glow) / 0.18)",
                  }}
                >
                  Confirmar presença
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── CTA FINAL ───────── */}
      <section className="relative overflow-hidden px-6 py-20 sm:px-12 sm:py-28">
        <div className="absolute inset-0">
          <PitchBackground height="100%" style={{ height: "100%" }} />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,22,40,.45) 0%, rgba(10,22,40,.75) 100%)",
          }}
        />

        <div className="relative mx-auto max-w-3xl text-center text-primary-foreground">
          <span className="mb-5 inline-flex items-center rounded-full border border-white/25 bg-white/15 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-eyebrow text-pitch-glow backdrop-blur-sm">
            Pronto pra jogar?
          </span>
          <h2
            className="font-display tracking-display mb-5"
            style={{ fontSize: "clamp(36px, 6vw, 76px)", lineHeight: 0.92 }}
          >
            BORA MARCAR
            <br />
            <span style={{ color: "hsl(var(--pitch-glow))" }}>SUA PRÓXIMA PELADA?</span>
          </h2>
          <p className="mx-auto mb-9 max-w-xl text-base leading-relaxed opacity-90 sm:text-lg">
            Crie sua conta em 30 segundos e convoque seu time hoje mesmo. 100%
            grátis.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 rounded-md px-7 py-3.5 text-base font-semibold transition-transform hover:scale-[1.02]"
              style={{
                background: "hsl(var(--pitch-glow))",
                color: "hsl(var(--navy))",
                boxShadow: "0 0 0 4px hsl(var(--pitch-glow) / 0.18), 0 8px 24px rgba(0,0,0,.3)",
              }}
            >
              Criar conta grátis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/25 bg-white/10 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* ───────── FOOTER ───────── */}
      <footer
        className="px-6 py-10 sm:px-12"
        style={{ background: "hsl(var(--navy))", color: "rgba(250,246,238,.65)" }}
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-md font-display text-lg"
              style={{
                background: "hsl(var(--pitch))",
                color: "hsl(var(--primary-foreground))",
                letterSpacing: "0.02em",
              }}
            >
              C
            </div>
            <span className="font-display text-xl tracking-display text-white">
              CONVOCA
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="#" className="hover:text-white transition-colors">
              Sobre
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Privacidade
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Termos
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Contato
            </Link>
          </div>
          <span className="text-xs opacity-60">
            © {new Date().getFullYear()} Convoca · feito pra galera
          </span>
        </div>
      </footer>
    </div>
  );
}
