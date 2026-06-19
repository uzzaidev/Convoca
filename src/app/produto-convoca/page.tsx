import type { Metadata } from "next";
import Image from "next/image";
import {
  Calendar,
  Users,
  Zap,
  Trophy,
  DollarSign,
  Bell,
  BarChart3,
  CheckCircle2,
  Clock,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Shuffle,
  Star,
  ArrowRight,
  MessageCircle,
} from "lucide-react";

import ConvocaLeadModal from "./components/ConvocaLeadModal";
import EventFlowCarousel from "./components/EventFlowCarousel";
import TeamDrawDemo from "./components/TeamDrawDemo";
import StatsShowcase from "./components/StatsShowcase";

export const metadata: Metadata = {
  title: "Convoca | Nunca mais perca tempo organizando pelada",
  description:
    "Organize peladas em segundos: confirmações automáticas, sorteio de times balanceado, Split Pix e rankings. 100% grátis para grupos de futebol.",
  keywords: [
    "pelada",
    "futebol",
    "organizar pelada",
    "sorteio de times",
    "racha",
    "futebol amador",
    "society",
    "app pelada",
  ],
};

const PROBLEMAS = [
  {
    icon: MessageCircle,
    title: "Grupo do WhatsApp caótico",
    description: "Mensagens perdidas, confirmações espalhadas e sempre alguém pergunta 'qual horário mesmo?'",
    emoji: "😵‍💫",
  },
  {
    icon: Users,
    title: "Sorteio de times demorado",
    description: "10 minutos no campo decidindo times, todo mundo reclama e alguém sempre fica de fora",
    emoji: "⏰",
  },
  {
    icon: DollarSign,
    title: "Cobrança de racha manual",
    description: "Anotar quem pagou em papel, ficar cobrando no privado e sempre sobra pro organizador",
    emoji: "💸",
  },
];

const SOLUCOES = [
  {
    title: "Confirmação em 1 clique",
    description: "Notificação push → jogador clica 'Confirmar' → pronto. Lista de espera automática.",
    icon: CheckCircle2,
    color: "#1ABC9C",
  },
  {
    title: "Sorteio IA em 5 segundos",
    description: "Algoritmo balanceia times por rating, posição e histórico. Times justos sempre.",
    icon: Shuffle,
    color: "#2E86AB",
  },
  {
    title: "Split Pix Automático",
    description: "QR Code individual gerado → jogador paga → status atualiza em tempo real.",
    icon: Zap,
    color: "#FFD700",
  },
  {
    title: "Rankings e Estatísticas",
    description: "Sistema de votação MVP, artilheiros, assistências e frequência. Gamificação automática.",
    icon: Trophy,
    color: "#16a085",
  },
];

const FEATURES = [
  {
    icon: Calendar,
    title: "Gestão de Eventos",
    items: ["Criar eventos em 30 segundos", "Notificações automáticas", "Lembretes programados"],
  },
  {
    icon: Users,
    title: "Sistema RSVP Inteligente",
    items: ["Lista de espera automática", "Check-in no dia do jogo", "Gestão de vagas em tempo real"],
  },
  {
    icon: Shuffle,
    title: "Sorteio de Times",
    items: ["IA balanceamento automático", "Consideração de posições", "Re-sorteio ilimitado"],
  },
  {
    icon: Star,
    title: "Sistema de Votação",
    items: ["Votação MVP pós-jogo", "Rankings automáticos", "Estatísticas individuais"],
  },
  {
    icon: DollarSign,
    title: "Controle Financeiro",
    items: ["Split Pix automático", "Histórico de pagamentos", "Relatórios exportáveis"],
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    items: ["Gráficos de atividade", "Tendências do grupo", "Métricas de engajamento"],
  },
];

const BENEFICIOS = [
  {
    icon: Clock,
    title: "Economize 2 horas por semana",
    description: "Pare de perder tempo com mensagens no WhatsApp e planilhas no Excel.",
    metric: "120h/ano",
    color: "#1ABC9C",
  },
  {
    icon: Shield,
    title: "Zero estresse",
    description: "Automatize tudo: confirmações, cobranças e sorteios. Você só joga.",
    metric: "100% automático",
    color: "#2E86AB",
  },
  {
    icon: TrendingUp,
    title: "Mais engajamento",
    description: "Rankings e gamificação aumentam motivação e frequência dos jogadores.",
    metric: "+35% presença",
    color: "#FFD700",
  },
  {
    icon: Target,
    title: "Transparência total",
    description: "Todos veem quem confirmou, quem pagou e quais são os rankings. Zero dúvidas.",
    metric: "0 conflitos",
    color: "#16a085",
  },
];

const FAQS = [
  {
    question: "É realmente 100% gratuito?",
    answer:
      "Sim! O Convoca é totalmente gratuito para sempre. Confirmações, sorteios, rankings e estatísticas são features core gratuitas. Split Pix Automático é opcional e tem uma taxa mínima por transação.",
  },
  {
    question: "Funciona para quantos jogadores?",
    answer:
      "De 6 a 100 jogadores por grupo. Funciona para society (12 jogadores), campo (22 jogadores) ou até campeonatos maiores com múltiplos grupos.",
  },
  {
    question: "Precisa instalar app?",
    answer:
      "Não obrigatoriamente. O Convoca funciona via navegador (PWA). Jogadores podem usar direto pelo link, mas instalar melhora a experiência (notificações push).",
  },
  {
    question: "Como funciona o Split Pix?",
    answer:
      "Você define o valor por pessoa (ex: R$ 15). O sistema gera QR Codes individuais. Quando alguém paga, o status atualiza automaticamente. Você recebe tudo na hora via Pix.",
  },
  {
    question: "O sorteio é balanceado de verdade?",
    answer:
      "Sim! O algoritmo considera: histórico de gols, assistências, MVPs recebidos, posição (goleiro vs linha) e rating base. Distribui fortes e fracos equilibradamente. Você pode re-sortear à vontade.",
  },
  {
    question: "E se alguém não quiser usar o app?",
    answer:
      "Como organizador, você ainda economiza tempo demais. Pode marcar presença manual de quem não quer usar. Mas geralmente, depois que o grupo vê os benefícios (rankings, stats), todo mundo adota.",
  },
  {
    question: "Tem suporte/ajuda se eu travar?",
    answer:
      "Sim! Temos documentação completa, vídeos tutoriais e suporte via WhatsApp. Respondemos rápido e ajudamos seu grupo a começar.",
  },
  {
    question: "Meus dados ficam seguros?",
    answer:
      "Sim. Usamos criptografia, banco seguro (Neon PostgreSQL) e estamos em conformidade com a LGPD. Seus dados jamais são vendidos ou compartilhados.",
  },
];

export default function ProdutoConvocaPage() {
  return (
    <main className="min-h-screen bg-[#1C1C1C] text-white font-sans selection:bg-[#1ABC9C] selection:text-[#1C1C1C]">
      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1C1C1C] via-[#0a1e1a] to-[#1C1C1C]" />
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#1ABC9C]/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-[#2E86AB]/10 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#1ABC9C]/30 bg-[#1ABC9C]/10 px-4 py-1.5 text-sm font-semibold uppercase tracking-widest text-[#1ABC9C]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1ABC9C] opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1ABC9C]"></span>
                </span>
                100% GRÁTIS PARA SEMPRE
              </div>

              {/* Título */}
              <h1 className="font-[family-name:var(--font-poppins)] text-4xl font-bold leading-tight md:text-6xl">
                Nunca mais perca tempo
                <br />
                <span className="text-[#1ABC9C]">organizando pelada</span>
              </h1>

              {/* Descrição */}
              <p className="text-lg text-[#B0B0B0] md:text-xl font-[family-name:var(--font-inter)] leading-relaxed">
                Confirmações automáticas, sorteio de times balanceado, Split Pix e rankings.
                <br />
                <strong className="text-white">Tudo isso em um app grátis.</strong>
              </p>

              {/* CTAs */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <ConvocaLeadModal />
                <a
                  href="#como-funciona"
                  className="inline-flex items-center justify-center rounded-full border border-[#1ABC9C]/50 px-8 py-4 text-base font-semibold text-[#1ABC9C] transition-all hover:-translate-y-1 hover:bg-[#1ABC9C]/10 hover:text-white"
                >
                  Ver Como Funciona
                </a>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-6 pt-4 text-sm text-[#B0B0B0]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#1ABC9C]" />
                  100% Grátis
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#1ABC9C]" />
                  Sem Anúncios
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#1ABC9C]" />
                  Sem Surpresas
                </div>
              </div>
            </div>

            {/* Mockup/Screenshot */}
            <div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
              <div className="relative rounded-[2rem] border border-white/10 bg-white/5 p-2 backdrop-blur-md shadow-2xl shadow-[#1ABC9C]/10">
                <div className="relative aspect-[9/16] overflow-hidden rounded-[1.5rem] bg-[#000]">
                  {/* Aqui você pode adicionar um screenshot real do app */}
                  <div className="flex h-full items-center justify-center text-[#B0B0B0]">
                    <div className="text-center p-8">
                      <Sparkles className="h-16 w-16 mx-auto mb-4 text-[#1ABC9C]" />
                      <p className="text-sm">Screenshot do Convoca aqui</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PROBLEMA SECTION */}
      {/* ============================================ */}
      <section className="py-24 bg-[#151515]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="font-[family-name:var(--font-poppins)] text-3xl font-bold text-white md:text-4xl">
              Organizar pelada dá trabalho demais
            </h2>
            <p className="mt-4 text-lg text-[#B0B0B0]">
              Você perde horas toda semana com isso. E ainda sobra pra você no final.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {PROBLEMAS.map((problema, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-3xl border border-white/5 bg-[#1C1C1C] p-8 transition-all hover:border-red-500/30 hover:-translate-y-1"
              >
                <div className="text-4xl mb-4">{problema.emoji}</div>
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                  <problema.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 font-[family-name:var(--font-poppins)] text-xl font-bold text-white">
                  {problema.title}
                </h3>
                <p className="text-[#B0B0B0] leading-relaxed">{problema.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SOLUÇÃO SECTION */}
      {/* ============================================ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[1000px] bg-[#1ABC9C]/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="font-[family-name:var(--font-poppins)] text-3xl font-bold text-white md:text-4xl">
              O Convoca <span className="text-[#1ABC9C]">automatiza tudo</span>
            </h2>
            <p className="mt-4 text-lg text-[#B0B0B0]">
              Do convite até o ranking final. Você só joga.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {SOLUCOES.map((solucao, i) => {
              const Icon = solucao.icon;
              return (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-3xl border border-white/5 bg-[#0A1F1C] p-8 transition-all hover:border-[#1ABC9C]/30 hover:-translate-y-1"
                >
                  <div
                    className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${solucao.color}20` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: solucao.color }} />
                  </div>
                  <h3 className="mb-3 font-[family-name:var(--font-poppins)] text-xl font-bold text-white group-hover:text-[#1ABC9C] transition-colors">
                    {solucao.title}
                  </h3>
                  <p className="text-[#B0B0B0] leading-relaxed">{solucao.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* COMO FUNCIONA - EVENT FLOW CAROUSEL */}
      {/* ============================================ */}
      <section id="como-funciona" className="py-24 bg-[#0f1614]">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-[family-name:var(--font-poppins)] text-3xl font-bold text-white md:text-4xl mb-4">
              Como funciona na prática
            </h2>
            <p className="text-lg text-[#B0B0B0]">
              Do convite dos jogadores até o resultado final
            </p>
          </div>

          <EventFlowCarousel />
        </div>
      </section>

      {/* ============================================ */}
      {/* TEAM DRAW DEMO - INTERACTIVE */}
      {/* ============================================ */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <TeamDrawDemo />
        </div>
      </section>

      {/* ============================================ */}
      {/* FEATURES GRID */}
      {/* ============================================ */}
      <section id="features" className="py-24 bg-[#0f1614]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-[family-name:var(--font-poppins)] text-3xl font-bold text-white md:text-4xl mb-4">
              Tudo que você precisa, <span className="text-[#1ABC9C]">em um só lugar</span>
            </h2>
            <p className="text-lg text-[#B0B0B0]">
              Recursos profissionais para grupos amadores
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 transition-all hover:border-[#1ABC9C]/30 hover:-translate-y-1"
                >
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#1ABC9C]/10 text-[#1ABC9C]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-4 font-[family-name:var(--font-poppins)] text-xl font-bold text-white">
                    {feature.title}
                  </h3>
                  <ul className="space-y-2">
                    {feature.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-[#B0B0B0]">
                        <CheckCircle2 className="h-4 w-4 text-[#1ABC9C] flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* STATS SHOWCASE */}
      {/* ============================================ */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-[family-name:var(--font-poppins)] text-3xl font-bold text-white md:text-4xl mb-4">
              Rankings e Estatísticas <span className="text-[#1ABC9C]">Automáticos</span>
            </h2>
            <p className="text-lg text-[#B0B0B0]">
              Sistema de votação MVP, artilheiros e muito mais
            </p>
          </div>

          <StatsShowcase />
        </div>
      </section>

      {/* ============================================ */}
      {/* BENEFÍCIOS */}
      {/* ============================================ */}
      <section className="py-24 bg-[#0f1614]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-[family-name:var(--font-poppins)] text-3xl font-bold text-white md:text-4xl">
              Por que usar o Convoca
            </h2>
            <p className="text-lg text-[#B0B0B0] max-w-3xl mx-auto">
              Benefícios reais para organizadores e jogadores
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {BENEFICIOS.map((beneficio) => {
              const Icon = beneficio.icon;
              return (
                <div
                  key={beneficio.title}
                  className="group relative overflow-hidden rounded-3xl border border-white/5 bg-[#0A1F1C] p-8 transition-all hover:border-[#1ABC9C]/30 hover:-translate-y-1"
                >
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#1ABC9C]/10 text-[#1ABC9C]">
                    <Icon className="h-6 w-6" style={{ color: beneficio.color }} />
                  </div>
                  <div className="mb-2 text-xs font-semibold text-[#1ABC9C] uppercase tracking-wider">
                    {beneficio.metric}
                  </div>
                  <h3 className="mb-3 font-[family-name:var(--font-poppins)] text-xl font-bold text-white group-hover:text-[#1ABC9C] transition-colors">
                    {beneficio.title}
                  </h3>
                  <p className="text-[#B0B0B0] leading-relaxed">{beneficio.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FAQ */}
      {/* ============================================ */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-[family-name:var(--font-poppins)] text-3xl font-bold text-white md:text-4xl mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-lg text-[#B0B0B0]">Respostas rápidas para dúvidas comuns</p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => (
              <details
                key={index}
                className="group rounded-2xl border border-white/10 bg-[#0A1F1C] p-6 hover:border-[#1ABC9C]/30 transition-colors"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="font-semibold text-lg text-white pr-4">{faq.question}</span>
                  <ArrowRight className="h-5 w-5 text-[#1ABC9C] transition-transform group-open:rotate-90 flex-shrink-0" />
                </summary>
                <p className="mt-4 text-[#B0B0B0] leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CTA FINAL */}
      {/* ============================================ */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-br from-[#1ABC9C]/10 via-[#2E86AB]/10 to-[#1C1C1C]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[400px] w-[800px] bg-[#1ABC9C]/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <Sparkles className="h-12 w-12 text-[#FFD700] mx-auto mb-6" />
          <h2 className="font-[family-name:var(--font-poppins)] text-3xl md:text-4xl font-bold mb-6 text-white">
            Pronto para nunca mais perder tempo?
          </h2>
          <p className="text-lg text-[#B0B0B0] mb-8 max-w-2xl mx-auto">
            Junte-se aos grupos que já economizam horas toda semana com o Convoca.
            <br />
            <strong className="text-white">100% grátis. Sem pegadinhas.</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ConvocaLeadModal />
          </div>
        </div>
      </section>
    </main>
  );
}
