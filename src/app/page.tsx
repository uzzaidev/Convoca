import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Goal,
  Users,
  Shuffle,
  BarChart3,
  Trophy,
  CalendarCheck,
  ClipboardList,
  Star,
  ChevronRight,
  Zap,
  Shield,
  Smartphone,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Grupos & Comunidades",
    description:
      "Crie grupos para suas peladas, convide jogadores por link e gerencie membros com facilidade.",
  },
  {
    icon: CalendarCheck,
    title: "Confirmação de Presença",
    description:
      "Sistema de RSVP com lista de espera automática. Saiba quem vai jogar antes de chegar no campo.",
  },
  {
    icon: Shuffle,
    title: "Sorteio de Times",
    description:
      "Sorteie times equilibrados de forma aleatória. Separe goleiros automaticamente.",
  },
  {
    icon: Goal,
    title: "Registro de Partida",
    description:
      "Registre gols, assistências e cartões em tempo real. Placar atualizado automaticamente.",
  },
  {
    icon: Trophy,
    title: "Rankings & Estatísticas",
    description:
      "Acompanhe artilheiros, assistentes e os melhores jogadores do seu grupo com rankings detalhados.",
  },
  {
    icon: Star,
    title: "Sistema de Votação",
    description:
      "Vote nos melhores jogadores após cada partida. Reconheça quem se destacou em campo.",
  },
];

const steps = [
  {
    number: "01",
    title: "Crie seu grupo",
    description:
      "Cadastre-se e crie um grupo para sua pelada em poucos segundos.",
  },
  {
    number: "02",
    title: "Convoque os jogadores",
    description:
      "Compartilhe o link de convite e monte seu elenco completo.",
  },
  {
    number: "03",
    title: "Organize a partida",
    description:
      "Crie o evento, confirme presenças, sorteie os times e jogue!",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center">
              <Goal className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Convoca</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/signin">Entrar</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Link href="/auth/signup">Começar grátis</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 bg-gradient-to-br from-navy via-navy-light to-green-dark text-white overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-green-400 blur-[120px]" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-blue-400 blur-[150px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm text-green-300 mb-8 backdrop-blur-sm">
            <Zap className="w-4 h-4" />
            <span>Organize peladas como nunca antes</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] mb-6">
            Sua pelada.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-green-500">
              Organizada.
            </span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Convoque jogadores, sorteie times, registre gols e acompanhe
            estatísticas — tudo em um só lugar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              asChild
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-6 font-semibold shadow-lg shadow-green-600/25"
            >
              <Link href="/auth/signup">
                Criar conta grátis
                <ChevronRight className="w-5 h-5 ml-1" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-white/5 border-white/20 hover:bg-white/10 text-white text-lg px-8 py-6 font-semibold backdrop-blur-sm"
            >
              <Link href="#como-funciona">Como funciona</Link>
            </Button>
          </div>

          {/* Quick stats */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              { value: "100%", label: "Gratuito" },
              { value: "⚡", label: "Rápido" },
              { value: "📱", label: "Mobile-first" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold">{s.value}</div>
                <div className="text-xs sm:text-sm text-gray-400 mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 md:py-28 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-green-600 font-semibold text-sm uppercase tracking-wider mb-3">
              Funcionalidades
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Tudo que sua pelada precisa
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-lg">
              Do convite à estatística final, o Convoca cuida de cada detalhe do
              seu jogo.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative rounded-2xl border border-border/60 bg-card p-6 md:p-8 transition-all hover:shadow-lg hover:border-green-600/30 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-green-600/10 flex items-center justify-center mb-5 group-hover:bg-green-600/20 transition-colors">
                  <f.icon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        id="como-funciona"
        className="py-20 md:py-28 bg-muted/40 scroll-mt-20"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-green-600 font-semibold text-sm uppercase tracking-wider mb-3">
              Simples assim
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Como funciona
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-10 md:gap-8">
            {steps.map((step, i) => (
              <div key={step.number} className="relative text-center md:text-left">
                {/* Connector line (desktop) */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-border" />
                )}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-600 text-white text-2xl font-bold mb-5 shadow-lg shadow-green-600/20">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Highlights ── */}
      <section className="py-20 md:py-28 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Left - text */}
            <div>
              <p className="text-green-600 font-semibold text-sm uppercase tracking-wider mb-3">
                Por que o Convoca?
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                Chega de confusão no grupo do WhatsApp
              </h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Esqueça as listas confusas e as discussões intermináveis. O
                Convoca centraliza tudo da sua pelada em um só lugar — bonito,
                rápido e sem complicação.
              </p>
              <ul className="space-y-4">
                {[
                  {
                    icon: ClipboardList,
                    text: "Lista de presença automática com limite de vagas",
                  },
                  {
                    icon: Shield,
                    text: "Controle de administradores e membros",
                  },
                  {
                    icon: BarChart3,
                    text: "Estatísticas detalhadas por jogador",
                  },
                  {
                    icon: Smartphone,
                    text: "Funciona perfeitamente no celular",
                  },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-3">
                    <div className="mt-0.5 w-8 h-8 rounded-lg bg-green-600/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-foreground">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right - visual card */}
            <div className="relative">
              <div className="rounded-2xl bg-gradient-to-br from-navy via-navy-light to-green-dark p-8 md:p-10 text-white shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <div className="font-semibold">Ranking da Pelada</div>
                    <div className="text-xs text-gray-400">Top jogadores</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { pos: "1°", name: "Carlos M.", goals: 12, color: "text-yellow-400" },
                    { pos: "2°", name: "Rafael S.", goals: 9, color: "text-gray-300" },
                    { pos: "3°", name: "Bruno L.", goals: 7, color: "text-orange-400" },
                    { pos: "4°", name: "Diego F.", goals: 5, color: "text-gray-500" },
                  ].map((p) => (
                    <div
                      key={p.pos}
                      className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-bold text-sm ${p.color}`}>
                          {p.pos}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium">
                          {p.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Goal className="w-3.5 h-3.5 text-green-400" />
                        <span>{p.goals}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center text-xs text-gray-500">
                  Exemplo ilustrativo
                </div>
              </div>
              {/* Glow effect */}
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-green-600/10 blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-navy via-navy-light to-green-dark text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
            <Goal className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Pronto pra organizar sua pelada?
          </h2>
          <p className="text-lg text-gray-300 mb-10 max-w-xl mx-auto leading-relaxed">
            Crie sua conta em segundos e comece a convocar seus jogadores hoje
            mesmo. É grátis!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white text-lg px-10 py-6 font-semibold shadow-lg shadow-green-600/25"
            >
              <Link href="/auth/signup">
                Criar conta grátis
                <ChevronRight className="w-5 h-5 ml-1" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-white/5 border-white/20 hover:bg-white/10 text-white text-lg px-10 py-6 font-semibold"
            >
              <Link href="/auth/signin">Já tenho conta</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-navy text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
                <Goal className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-semibold text-lg">Convoca</span>
            </div>
            <div className="flex gap-6 text-sm">
              <Link
                href="#"
                className="hover:text-white transition-colors"
              >
                Sobre
              </Link>
              <Link
                href="#"
                className="hover:text-white transition-colors"
              >
                Privacidade
              </Link>
              <Link
                href="#"
                className="hover:text-white transition-colors"
              >
                Contato
              </Link>
            </div>
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Convoca. Todos os direitos
              reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
