import type { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Calendar,
  Trophy,
  DollarSign,
  Bot,
  Settings,
  HelpCircle,
  CheckCircle,
  Shuffle,
  CircleDot,
  Mail,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ajuda - Convoca",
  description: "Documentação e perguntas frequentes do Convoca",
};

const sections = [
  {
    id: "primeiros-passos",
    icon: <Users className="h-5 w-5 text-green-500" />,
    title: "Primeiros Passos",
    badge: "Início",
    items: [
      {
        q: "Como criar um grupo?",
        a: `No Dashboard, clique em "Criar Grupo". Dê um nome ao grupo, adicione uma descrição opcional e confirme. Você vira automaticamente o admin do grupo e recebe um código de convite para compartilhar.

Obs.: novos grupos passam por uma análise de até 24h antes de ficarem ativos.`,
      },
      {
        q: "Como convidar membros para o grupo?",
        a: `Vá em Configurações do grupo → Convites. Clique em "Novo Convite" para gerar um link único. Você pode definir um limite de usos e data de expiração.

Compartilhe o link pelo WhatsApp diretamente do botão de compartilhar. Quem clicar no link e tiver uma conta no Convoca entra automaticamente.`,
      },
      {
        q: "Por que meu grupo está 'em análise'?",
        a: `Novos grupos passam por uma verificação manual em até 24 horas. Enquanto isso, convites e eventos ficam bloqueados.

Se precisar agilizar, entre em contato pelo WhatsApp: (54) 99284-1942.`,
      },
      {
        q: "Como entrar em um grupo com código de convite?",
        a: `No Dashboard, clique em "Entrar em Grupo" e cole o código ou o link que você recebeu. Você pode também clicar diretamente no link compartilhado pelo WhatsApp — ele abre a tela de confirmação automaticamente.`,
      },
    ],
  },
  {
    id: "peladas",
    icon: <Calendar className="h-5 w-5 text-blue-500" />,
    title: "Peladas (Eventos)",
    badge: "Eventos",
    items: [
      {
        q: "Como criar uma pelada?",
        a: `Na página do grupo, clique em "Criar Evento". Preencha:
- Data e hora
- Local (opcional, você pode cadastrar locais fixos em Configurações → Locais)
- Número máximo de jogadores
- Número máximo de goleiros (opcional)

Após criar, os membros recebem a pelada na lista e podem confirmar presença.`,
      },
      {
        q: "Como confirmar presença (RSVP)?",
        a: `Abra a pelada e clique em "Confirmar presença". Você pode indicar se vai como goleiro ou linha. Se as vagas estiverem cheias, você entra na lista de espera e é avisado automaticamente se uma vaga abrir.

Para cancelar, clique em "Cancelar presença" na mesma tela.`,
      },
      {
        q: "Como o admin gerencia as confirmações?",
        a: `Na página do evento, o admin vê todos os membros do grupo e pode confirmar ou remover a presença de qualquer um. Há também o painel de check-in: no dia da pelada, marque quem realmente chegou ao campo antes de sortear os times.

Só jogadores com check-in entram no sorteio.`,
      },
      {
        q: "O que é a lista de espera?",
        a: `Quando o evento está cheio, novos confirmados entram na lista de espera em ordem de chegada. Se alguém cancelar, o primeiro da fila sobe automaticamente para confirmado.`,
      },
    ],
  },
  {
    id: "times",
    icon: <Shuffle className="h-5 w-5 text-purple-500" />,
    title: "Times e Sorteio",
    badge: "Times",
    items: [
      {
        q: "Como sortear os times?",
        a: `Na aba "Times" do evento, o admin clica em "Sortear Times". O sorteio usa apenas jogadores com check-in feito. Os goleiros são distribuídos automaticamente entre os times de forma equilibrada.

Configurações de sorteio (número de times, posições etc.) ficam em Configurações do grupo → Configurações de Sorteio.`,
      },
      {
        q: "Como trocar jogadores de time após o sorteio?",
        a: `Na aba "Times", clique em "Editar Times". Selecione dois jogadores de times diferentes e confirme a troca. Isso é útil para equilibrar os times ou acomodar jogadores que chegaram atrasados.`,
      },
      {
        q: "Como criar times manualmente?",
        a: `Na aba "Times", clique em "Montar Times Manualmente". Você pode arrastar os jogadores para os times como quiser, sem usar o sorteio aleatório.`,
      },
    ],
  },
  {
    id: "ao-vivo",
    icon: <CircleDot className="h-5 w-5 text-red-500" />,
    title: "Ao Vivo (Jogo em andamento)",
    badge: "Ao Vivo",
    items: [
      {
        q: "Como registrar gols e assistências?",
        a: `Na aba "Ao Vivo", o admin vê o placar e o Painel de Ações. Clique no tipo de ação (Gol, Assistência, Cartão), selecione o time e o jogador. A timeline e o placar atualizam em tempo real.`,
      },
      {
        q: "O que é um 'gol contra'?",
        a: `Na lista de ações, há a opção "Gol Contra". O gol é contado para o time adversário, mas o jogador responsável fica marcado na timeline.`,
      },
      {
        q: "Como finalizar a partida?",
        a: `No Painel de Ações, clique em "Finalizar Partida". Isso encerra o evento, define o time vencedor automaticamente pelo placar e libera o sistema de votos (MVP, melhor jogador etc.).`,
      },
    ],
  },
  {
    id: "rankings",
    icon: <Trophy className="h-5 w-5 text-yellow-500" />,
    title: "Rankings e Estatísticas",
    badge: "Stats",
    items: [
      {
        q: "Como funciona o ranking?",
        a: `O ranking é calculado por pontuação: vitória, empate, derrota, gols, assistências e presença — cada um tem um peso configurável pelo admin em Configurações do grupo → Pontuação.

Por padrão: Vitória = 3 pts, Empate = 1 pt, Derrota = 0 pts.`,
      },
      {
        q: "Qual a diferença entre Modo Ranking e Modo Controle?",
        a: `Modo Ranking (padrão): ranking, pontuação e estatísticas competitivas ficam visíveis para todos.

Modo Controle: o ranking fica oculto. Útil para grupos que preferem jogar sem pressão de classificação, mas ainda querem controlar presenças, times e pagamentos.

O admin troca o modo pelo toggle no menu lateral.`,
      },
      {
        q: "O que são Temporadas?",
        a: `Temporadas permitem recortar o ranking por período (ex: "1º Semestre 2026"). O admin cria temporadas em Configurações do grupo → Temporadas. Filtre pelo seletor no topo da página do grupo.`,
      },
    ],
  },
  {
    id: "pagamentos",
    icon: <DollarSign className="h-5 w-5 text-emerald-500" />,
    title: "Pagamentos",
    badge: "Financeiro",
    items: [
      {
        q: "Como criar uma cobrança?",
        a: `Em Pagamentos do grupo, clique em "Nova Cobrança". Defina o valor, o jogador, a data de vencimento e o tipo (mensalidade, pelada avulsa etc.). A cobrança aparece para o membro em "Meus Pagamentos".`,
      },
      {
        q: "Como marcar um pagamento como pago?",
        a: `Na lista de cobranças, clique nos três pontos ao lado da cobrança e selecione "Marcar como pago". Isso registra o pagamento na carteira do grupo.`,
      },
      {
        q: "O que é a carteira do grupo?",
        a: `Cada grupo tem uma carteira que registra entradas (pagamentos recebidos) e saídas (despesas cadastradas). O saldo aparece no topo da página de Pagamentos.`,
      },
      {
        q: "O assistente IA pode criar cobranças?",
        a: `Sim. No chat do assistente, você pode pedir "Crie uma cobrança de R$30 para o João referente à pelada de sexta". O assistente vai propor a cobrança e aguardar sua confirmação antes de criar.`,
      },
    ],
  },
  {
    id: "assistente",
    icon: <Bot className="h-5 w-5 text-indigo-500" />,
    title: "Assistente IA",
    badge: "IA",
    items: [
      {
        q: "O que o assistente IA faz?",
        a: `O assistente entende comandos em linguagem natural para ajudar na gestão do grupo. Ele pode:
- Criar e listar cobranças
- Resumir pendências financeiras
- Listar membros e presenças
- Responder dúvidas sobre o grupo

Acesse pelo ícone do robô no menu lateral ou pelo botão flutuante na página do grupo.`,
      },
      {
        q: "O assistente executa ações automaticamente?",
        a: `Não. Para qualquer ação que modifique dados (criar cobrança, confirmar presença), o assistente mostra um card de confirmação e aguarda seu OK antes de agir. Você pode cancelar ou ajustar antes de confirmar.`,
      },
      {
        q: "Existe limite de mensagens?",
        a: `Sim, cada grupo tem uma cota mensal de mensagens. Quando a cota estiver próxima do limite, o assistente avisará. O limite é reposto no início de cada mês.`,
      },
    ],
  },
  {
    id: "conta",
    icon: <Settings className="h-5 w-5 text-gray-500" />,
    title: "Conta e Configurações",
    badge: "Conta",
    items: [
      {
        q: "Como alterar meu nome ou foto?",
        a: `Clique em "Meu Perfil" no menu lateral. Você pode atualizar seu nome e foto de perfil.`,
      },
      {
        q: "Como sair de um grupo?",
        a: `Vá para a página do grupo → Configurações → Membros. Procure seu nome e clique em "Sair do grupo". Atenção: se você for o único admin, precisará nomear outro admin antes de sair.`,
      },
      {
        q: "Como excluir minha conta?",
        a: `Acesse /excluir-conta ou entre em contato pelo e-mail contato@uzzai.com.br. Todos os seus dados pessoais são removidos conforme a LGPD.`,
      },
    ],
  },
];

export default function AjudaPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="h-6 w-6 text-green-500" />
            <h1 className="font-display text-3xl tracking-display">Central de Ajuda</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Encontre respostas para as dúvidas mais comuns sobre o Convoca.
          </p>
        </div>

        {/* Quick nav */}
        <div className="mb-8 flex flex-wrap gap-2">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80 transition-colors">
                {s.badge}
              </Badge>
            </a>
          ))}
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section) => (
            <Card key={section.id} id={section.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {section.icon}
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {section.items.map((item, i) => (
                    <AccordionItem key={i} value={`${section.id}-${i}`}>
                      <AccordionTrigger className="text-left text-sm font-medium">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact */}
        <Card className="mt-8 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Não encontrou o que procurava?
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <Link
              href="https://wa.me/5554992841942"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-green-300 bg-white px-4 py-2.5 text-sm font-medium text-green-800 hover:bg-green-50 transition-colors dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Link>
            <Link
              href="mailto:contato@uzzai.com.br"
              className="flex items-center gap-2 rounded-lg border border-green-300 bg-white px-4 py-2.5 text-sm font-medium text-green-800 hover:bg-green-50 transition-colors dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
            >
              <Mail className="h-4 w-4" />
              contato@uzzai.com.br
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
