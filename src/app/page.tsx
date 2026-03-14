import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Goal,
  Users,
  Shuffle,
  Trophy,
  DollarSign,
  BarChart3,
  CalendarCheck,
  ChevronRight,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Grupos & Membros",
    description: "Crie seu grupo, convide jogadores e gerencie tudo em um só lugar.",
  },
  {
    icon: CalendarCheck,
    title: "Confirmação de Presença",
    description:
      "Lista de presença com limite de vagas e lista de espera automática.",
  },
  {
    icon: Shuffle,
    title: "Sorteio de Times",
    description:
      "Sorteio inteligente com posições, goleiros e equilíbrio de equipes.",
  },
  {
    icon: Trophy,
    title: "Votação MVP",
    description:
      "Vote no Craque da Partida com contagem em tempo real e desempate.",
  },
  {
    icon: DollarSign,
    title: "Controle Financeiro",
    description:
      "Mensalidades, diárias, despesas e caixa do grupo sempre organizados.",
  },
  {
    icon: BarChart3,
    title: "Rankings & Estatísticas",
    description:
      "Artilheiros, garçons, frequência e ranking geral com pontuação configurável.",
  },
];

const steps = [
  {
    number: "01",
    title: "Crie seu grupo",
    description: "Cadastre-se, crie um grupo e compartilhe o código de convite com a galera.",
  },
  {
    number: "02",
    title: "Convoque a pelada",
    description: "Defina data, horário e local. A lista de presença abre automaticamente.",
  },
  {
    number: "03",
    title: "Jogue e acompanhe",
    description: "Sorteie os times, registre gols e votem no craque da partida.",
  },
];

const faqs = [
  {
    question: "O Convoca é gratuito?",
    answer:
      "Sim! Todas as funcionalidades principais são gratuitas: criação de grupo, organização de peladas, sorteio de times, votação MVP e rankings.",
  },
  {
    question: "Como convido jogadores para meu grupo?",
    answer:
      "Ao criar um grupo, um código de convite é gerado automaticamente. Compartilhe esse código e os jogadores podem entrar pelo app em segundos.",
  },
  {
    question: "Posso ter mais de um grupo?",
    answer:
      "Claro! Você pode criar e participar de quantos grupos quiser. Cada grupo tem suas próprias configurações, rankings e controle financeiro.",
  },
  {
    question: "Como funciona o sorteio de times?",
    answer:
      "O admin configura o número de jogadores por time, goleiros e posições. O sorteio distribui os jogadores de forma equilibrada, respeitando as posições preferidas.",
  },
  {
    question: "Preciso de um app para usar?",
    answer:
      "Não! O Convoca funciona diretamente no navegador do celular ou computador. Basta acessar o site, sem precisar instalar nada.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white scroll-smooth">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-light to-green-dark text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.04),transparent_60%)]" />
        <div className="relative mx-auto max-w-5xl px-6 py-24 md:py-36 text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
            <Goal className="h-10 w-10 text-green-400" />
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Convoca
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-gray-300 sm:text-xl">
            Organize suas peladas, sorteie times, vote no craque e acompanhe rankings — tudo em um só lugar.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-6 font-semibold"
            >
              <Link href="/auth/signup">
                Começar Grátis
                <ChevronRight className="ml-1 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-2 border-white/30 bg-white/10 hover:bg-white/20 text-white text-lg px-8 py-6 font-semibold backdrop-blur-sm"
            >
              <Link href="/auth/signin">Já tenho conta</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Tudo que sua pelada precisa
          </h2>
          <p className="mt-3 text-gray-500 text-lg">
            Do convite ao apito final, cada detalhe organizado.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 transition-colors group-hover:bg-green-100">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Como funciona
            </h2>
            <p className="mt-3 text-gray-500 text-lg">
              Três passos para nunca mais ter dor de cabeça com a pelada.
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.number} className="text-center">
                <span className="inline-block text-5xl font-extrabold text-green-600/20">
                  {s.number}
                </span>
                <h3 className="mt-2 text-xl font-semibold text-gray-900">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Perguntas Frequentes
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-base font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-500 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-navy via-navy-light to-green-dark text-white">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Pronto para organizar sua pelada?
          </h2>
          <p className="mt-4 text-gray-300 text-lg">
            Cadastre-se em segundos e comece a convocar a galera.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-green-600 hover:bg-green-700 text-white text-lg px-10 py-6 font-semibold"
          >
            <Link href="/auth/signup">
              Criar Conta Grátis
              <ChevronRight className="ml-1 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 text-gray-900 font-semibold">
            <Goal className="h-5 w-5 text-green-600" />
            Convoca
          </div>
          <nav className="flex gap-6 text-sm text-gray-500">
            <Link href="#features" className="hover:text-gray-900 transition-colors">
              Funcionalidades
            </Link>
            <Link href="#faq" className="hover:text-gray-900 transition-colors">
              FAQ
            </Link>
            <Link href="/auth/signin" className="hover:text-gray-900 transition-colors">
              Entrar
            </Link>
          </nav>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Convoca. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
