import Link from "next/link";
import {
  TrendingUp,
  Upload,
  Brain,
  Users,
  Target,
  MessageCircle,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Zap,
  PieChart,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Letheus IA Financeira - Organize suas finanças com inteligência artificial",
  description:
    "Pare de perder dinheiro sem saber pra onde vai. A Letheus usa IA para categorizar seus gastos, sugerir metas e te ajudar a tomar decisões financeiras melhores.",
};

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
        <TrendingUp className="size-5 text-primary-foreground" />
      </div>
      <span className="text-lg font-bold tracking-tight">Letheus</span>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <a href="#problema" className="text-muted-foreground transition hover:text-foreground">
            Por que usar
          </a>
          <a href="#como-funciona" className="text-muted-foreground transition hover:text-foreground">
            Como funciona
          </a>
          <a href="#beneficios" className="text-muted-foreground transition hover:text-foreground">
            Benefícios
          </a>
          <a href="#preco" className="text-muted-foreground transition hover:text-foreground">
            Preço
          </a>
          <a href="#faq" className="text-muted-foreground transition hover:text-foreground">
            Dúvidas
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">
              Começar grátis
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-24 md:pb-32 md:pt-36">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
          <Sparkles className="size-4" />
          IA que entende suas finanças
        </div>

        <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl md:leading-tight">
          Saiba exatamente pra onde vai cada real{" "}
          <span className="text-primary">em menos de 2 minutos</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Importe seu extrato e a IA da Letheus organiza tudo automaticamente:
          categoriza gastos, mostra onde você está perdendo dinheiro e sugere como economizar.
          Sem planilha. Sem digitar nada.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4">
          <Button size="lg" className="h-12 px-8 text-base" asChild>
            <Link href="/register">
              Testar grátis por 7 dias
              <ArrowRight className="size-5" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            7 dias grátis — sem cobrança nenhuma. Depois, apenas{" "}
            <span className="font-semibold text-foreground">R$ 19,90/mês</span>.
            Cancele quando quiser.
          </p>
        </div>

        {/* Social proof */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary" />
            Pronto em 2 minutos
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary" />
            Importação automática de extratos
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary" />
            IA que analisa seus dados reais
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const problems = [
    {
      text: "Você abre o app do banco e não faz ideia pra onde foi o dinheiro",
    },
    {
      text: "Já tentou planilha, mas desistiu na segunda semana",
    },
    {
      text: "Instala apps de finanças, mas todos pedem pra digitar tudo manualmente",
    },
    {
      text: "No final do mês, o saldo não bate e você não sabe por quê",
    },
    {
      text: "Você e seu parceiro(a) não conseguem organizar as finanças juntos",
    },
  ];

  return (
    <section id="problema" className="border-t border-border/40 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Soa familiar?
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Controlar dinheiro não deveria ser tão difícil
          </h2>
        </div>

        <div className="mt-12 space-y-4">
          {problems.map((problem, i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-xl border border-border/40 bg-card/50 p-5"
            >
              <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive/20 text-xs font-bold text-destructive">
                !
              </div>
              <p className="text-muted-foreground">{problem.text}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-lg text-muted-foreground">
          Se você se identificou com algum desses,{" "}
          <span className="font-semibold text-foreground">
            a Letheus foi feita pra você.
          </span>
        </p>
      </div>
    </section>
  );
}

function SolutionSection() {
  return (
    <section className="border-t border-border/40 bg-card/30 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">
          A solução
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          Imagine abrir um app e{" "}
          <span className="text-primary">já saber tudo</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          A Letheus faz o trabalho pesado por você. Nos primeiros minutos, você já consegue:
        </p>

        <div className="mx-auto mt-6 flex max-w-md flex-col gap-3 text-left">
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="size-5 shrink-0 text-primary" />
            <span className="text-muted-foreground">Importar o extrato do banco em segundos</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="size-5 shrink-0 text-primary" />
            <span className="text-muted-foreground">Ver todos os gastos organizados por categoria</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="size-5 shrink-0 text-primary" />
            <span className="text-muted-foreground">Descobrir exatamente onde está perdendo dinheiro</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="size-5 shrink-0 text-primary" />
            <span className="text-muted-foreground">Perguntar à IA como economizar mais</span>
          </div>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-border/40 bg-card p-6 text-left">
            <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-primary/15">
              <Upload className="size-5 text-primary" />
            </div>
            <h3 className="font-semibold">Importação inteligente</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Envie o CSV do banco ou cole o extrato em texto. A IA lê, entende e organiza tudo
              automaticamente.
            </p>
          </div>

          <div className="rounded-xl border border-border/40 bg-card p-6 text-left">
            <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-primary/15">
              <Brain className="size-5 text-primary" />
            </div>
            <h3 className="font-semibold">Categorização por IA</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Cada gasto é categorizado automaticamente. Sem digitar nada. A IA aprende com seus
              padrões.
            </p>
          </div>

          <div className="rounded-xl border border-border/40 bg-card p-6 text-left">
            <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-primary/15">
              <MessageCircle className="size-5 text-primary" />
            </div>
            <h3 className="font-semibold">Chat financeiro</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Pergunte &quot;onde estou gastando mais?&quot; e a IA responde com dados reais das
              suas finanças.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Crie sua conta",
      description: "Em menos de 2 minutos você já está dentro. Sem burocracia.",
      icon: Zap,
    },
    {
      number: "2",
      title: "Importe seus gastos",
      description:
        "Envie o extrato do banco (CSV) ou cole o texto. A IA cuida do resto.",
      icon: Upload,
    },
    {
      number: "3",
      title: "Veja pra onde vai seu dinheiro",
      description:
        "Dashboard com gastos por categoria, metas e evolução do patrimônio.",
      icon: PieChart,
    },
    {
      number: "4",
      title: "Converse com a IA",
      description:
        "Tire dúvidas, peça análises e receba sugestões personalizadas.",
      icon: MessageCircle,
    },
  ];

  return (
    <section id="como-funciona" className="border-t border-border/40 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Simples assim
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Como funciona
          </h2>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {step.number}
              </div>
              <div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  const benefits = [
    {
      icon: Brain,
      title: "IA que realmente ajuda",
      description:
        "Não é só um dashboard bonito. A IA analisa seus dados e dá sugestões práticas para economizar.",
    },
    {
      icon: Upload,
      title: "Importação automática",
      description:
        "Esqueça digitação manual. Importe extratos em CSV ou texto e tudo é organizado automaticamente.",
    },
    {
      icon: Target,
      title: "Metas inteligentes",
      description:
        "Defina metas financeiras e acompanhe seu progresso. A IA sugere metas com base no seu comportamento.",
    },
    {
      icon: Users,
      title: "Feito para famílias",
      description:
        "Compartilhe o controle financeiro com seu parceiro(a) ou família. Todos veem os mesmos dados.",
    },
    {
      icon: PieChart,
      title: "Visão completa",
      description:
        "Receitas, despesas, patrimônio, categorias — tudo em um lugar só, com gráficos claros.",
    },
    {
      icon: Zap,
      title: "Rápido e simples",
      description:
        "Interface limpa, sem complicação. Você entende tudo em 30 segundos.",
    },
  ];

  return (
    <section id="beneficios" className="border-t border-border/40 bg-card/30 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Por que escolher a Letheus
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Tudo que você precisa, nada que você não precisa
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/40 bg-card p-6"
            >
              <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-primary/15">
                <benefit.icon className="size-5 text-primary" />
              </div>
              <h3 className="font-semibold">{benefit.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AIDifferentiator() {
  return (
    <section className="border-t border-border/40 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
          <div className="p-8 md:p-12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary">
              <Sparkles className="size-4" />
              Diferencial
            </div>

            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Uma IA que conversa sobre{" "}
              <span className="text-primary">o seu dinheiro</span>
            </h2>

            <p className="mt-4 max-w-2xl text-muted-foreground">
              A maioria dos apps mostra gráficos e para por aí. Na Letheus, você
              conversa com uma IA que analisa seus dados reais — seus gastos, suas receitas
              e seus objetivos — para dar respostas e sugestões que fazem sentido pra você.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <ChevronRight className="mt-0.5 size-5 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    &quot;Onde estou gastando mais esse mês?&quot;
                  </span>{" "}
                  — A IA mostra o ranking de categorias com valores e percentuais reais.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <ChevronRight className="mt-0.5 size-5 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    &quot;Consigo economizar R$ 500 por mês?&quot;
                  </span>{" "}
                  — Ela analisa seus padrões e sugere onde cortar.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <ChevronRight className="mt-0.5 size-5 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    &quot;Como estão minhas finanças comparado ao mês passado?&quot;
                  </span>{" "}
                  — Comparativo automático com destaques.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialProof() {
  return (
    <section className="border-t border-border/40 bg-card/30 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">
          Feito com propósito
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          Por que a Letheus existe
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          A Letheus nasceu da frustração real com apps de finanças que exigem trabalho manual
          demais e entregam pouco. Construímos o que gostaríamos de ter usado — um assistente
          financeiro que faz o trabalho pesado por você.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-border/40 bg-card p-6">
            <div className="text-3xl font-bold text-primary">2min</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Tempo médio de setup
            </p>
          </div>
          <div className="rounded-xl border border-border/40 bg-card p-6">
            <div className="text-3xl font-bold text-primary">100%</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Categorização automática
            </p>
          </div>
          <div className="rounded-xl border border-border/40 bg-card p-6">
            <div className="text-3xl font-bold text-primary">0</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Gastos digitados manualmente
            </p>
          </div>
        </div>

        <div className="mt-12 mx-auto max-w-lg rounded-xl border border-border/40 bg-card p-6 text-left">
          <p className="text-sm italic text-muted-foreground">
            &quot;Eu já tinha desistido de controlar minhas finanças. Testei a Letheus, importei
            o extrato do Nubank e em 2 minutos já sabia onde estava torrando dinheiro.
            O chat com IA é surreal — parece que tem alguém olhando suas contas com você.&quot;
          </p>
          <p className="mt-3 text-sm font-medium">
            — Camila R., usuária desde janeiro
          </p>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    {
      question: "É difícil de usar?",
      answer:
        "Não. Se você sabe usar WhatsApp, sabe usar a Letheus. A interface é simples e a IA faz o trabalho pesado. Você importa o extrato e pronto.",
    },
    {
      question: "Meus dados estão seguros?",
      answer:
        "Sim. Usamos criptografia em todas as conexões, seus dados ficam em servidores seguros e nunca compartilhamos informações com terceiros.",
    },
    {
      question: "Funciona com qualquer banco?",
      answer:
        "Funciona com qualquer banco que exporte extrato em CSV (a maioria dos bancos brasileiros). Você também pode colar o extrato em texto e a IA interpreta.",
    },
    {
      question: "Meu parceiro(a) pode usar junto?",
      answer:
        "Sim! O plano família permite que vocês compartilhem a mesma conta e vejam todos os gastos e receitas juntos.",
    },
    {
      question: "Quanto custa?",
      answer:
        "Os primeiros 7 dias são grátis. Depois, custa R$ 19,90 por mês. Sem taxa escondida, sem cobrança automática no trial. Você decide se quer continuar.",
    },
    {
      question: "O que acontece depois dos 7 dias grátis?",
      answer:
        "Se você gostar, assina por R$ 19,90/mês. Se não quiser continuar, seus dados ficam salvos esperando você voltar. Sem surpresas.",
    },
    {
      question: "A IA realmente funciona?",
      answer:
        "Sim. Usamos inteligência artificial avançada para categorizar gastos, responder perguntas e sugerir metas. Não é um chatbot genérico — ela conhece seus dados reais.",
    },
  ];

  return (
    <section id="faq" className="border-t border-border/40 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Perguntas frequentes
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Ainda com dúvidas?
          </h2>
        </div>

        <div className="mt-12 space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/40 bg-card p-6"
            >
              <h3 className="font-semibold">{faq.question}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const features = [
    "Dashboard completo com KPIs",
    "Importação de extratos (CSV e texto com IA)",
    "Categorização automática por IA",
    "Chat com IA sobre suas finanças",
    "Controle de receitas, despesas e patrimônio",
    "Metas financeiras inteligentes",
    "Acesso para toda a família",
    "Gráficos e relatórios",
  ];

  return (
    <section id="preco" className="border-t border-border/40 bg-card/30 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-xl">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Preço transparente
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Um plano. Tudo incluso.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Sem planos confusos, sem funcionalidades travadas.
            Você tem acesso a tudo desde o primeiro dia.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border-2 border-primary/40 bg-card">
          <div className="bg-primary/10 px-8 py-4 text-center">
            <p className="text-sm font-medium text-primary">
              Comece grátis — pague só se gostar
            </p>
          </div>

          <div className="p-8">
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold tracking-tight">R$ 19,90</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <p className="mt-1 text-sm font-medium text-primary">
                Menos de R$ 0,70 por dia
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Primeiros <span className="font-semibold text-primary">7 dias grátis</span> —
                você só paga se decidir continuar.
              </p>
            </div>

            <div className="my-8 border-t border-border/40" />

            <ul className="space-y-3">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="size-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="my-8 border-t border-border/40" />

            <Button size="lg" className="h-12 w-full text-base" asChild>
              <Link href="/register">
                Testar grátis por 7 dias
                <ArrowRight className="size-5" />
              </Link>
            </Button>

            <div className="mt-4 flex flex-col items-center gap-1 text-center text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary" />
                Sem compromisso. Cancele quando quiser.
              </div>
              <span>Nenhuma cobrança durante o período grátis.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="border-t border-border/40 bg-card/30 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Daqui a 2 minutos você pode saber exatamente pra onde vai seu dinheiro
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Crie sua conta, importe o extrato e deixe a IA fazer o resto.
          É grátis por 7 dias — sem cobrança nenhuma.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4">
          <Button size="lg" className="h-14 px-10 text-lg" asChild>
            <Link href="/register">
              Quero organizar minhas finanças agora
              <ArrowRight className="size-5" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            7 dias grátis. Depois, R$ 19,90/mês. Cancele quando quiser.
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/40 px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
        <Logo />
        <p className="text-sm text-muted-foreground">
          © 2026 Letheus IA Financeira. Todos os direitos reservados.
        </p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#" className="transition hover:text-foreground">
            Termos
          </a>
          <a href="#" className="transition hover:text-foreground">
            Privacidade
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <HowItWorks />
        <BenefitsSection />
        <AIDifferentiator />
        <SocialProof />
        <PricingSection />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
