"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  Upload,
  Loader2,
  Sparkles,
  ArrowRight,
  FileText,
  ClipboardPaste,
  PieChart,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Zap,
  DollarSign,
} from "lucide-react";
import {
  ensurePeriodExists,
  saveOnboardingRevenue,
  importOnboardingCSV,
  importOnboardingText,
  getOnboardingSummary,
  completeOnboarding,
  skipOnboarding,
  createSampleData,
  type OnboardingSummary,
} from "@/lib/actions/onboarding-actions";

interface Props {
  userName: string;
}

type Step = "welcome" | "revenue" | "import" | "processing" | "wow";

const STEPS: { key: Step; label: string }[] = [
  { key: "welcome", label: "Boas-vindas" },
  { key: "revenue", label: "Receita" },
  { key: "import", label: "Importar" },
  { key: "processing", label: "IA analisando" },
  { key: "wow", label: "Resultado" },
];

export function OnboardingWizard({ userName }: Props) {
  const [step, setStep] = useState<Step>("welcome");
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState<OnboardingSummary | null>(null);
  const [importCount, setImportCount] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingLabel, setProcessingLabel] = useState("");
  const [revenueError, setRevenueError] = useState("");
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [purchaseType, setPurchaseType] = useState<"credit" | "debit">("credit");

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const progressPercent = ((stepIndex + 1) / STEPS.length) * 100;

  const BACK_MAP: Partial<Record<Step, Step>> = {
    revenue: "welcome",
    import: "revenue",
  };

  function goBack() {
    const prev = BACK_MAP[step];
    if (prev) setStep(prev);
  }

  const canGoBack = !!BACK_MAP[step];

  function handleStart() {
    startTransition(async () => {
      await ensurePeriodExists();
      setStep("revenue");
    });
  }

  function handleRevenueSubmit(formData: FormData) {
    setRevenueError("");
    startTransition(async () => {
      const result = await saveOnboardingRevenue(formData);
      if (result.error) {
        setRevenueError(result.error);
        return;
      }
      setStep("import");
    });
  }

  function simulateProcessing(onDone: () => void) {
    const labels = [
      "Lendo seus dados...",
      "Identificando transações...",
      "Classificando com IA...",
      "Organizando por categorias...",
      "Gerando seu resumo...",
    ];
    let i = 0;
    setProcessingProgress(0);
    setProcessingLabel(labels[0]);

    const interval = setInterval(() => {
      i++;
      if (i < labels.length) {
        setProcessingProgress(Math.min((i / labels.length) * 100, 90));
        setProcessingLabel(labels[i]);
      } else {
        setProcessingProgress(100);
        setProcessingLabel("Pronto!");
        clearInterval(interval);
        setTimeout(onDone, 400);
      }
    }, 600);
  }

  function handleCSVSubmit(formData: FormData) {
    formData.set("purchaseType", purchaseType);
    startTransition(async () => {
      const result = await importOnboardingCSV(formData);
      setImportCount(result.created);
      setStep("processing");

      simulateProcessing(async () => {
        const data = await getOnboardingSummary();
        setSummary(data);
        setStep("wow");
      });
    });
  }

  function handleTextSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await importOnboardingText(formData);
      setImportCount(result.created);
      setStep("processing");

      simulateProcessing(async () => {
        const data = await getOnboardingSummary();
        setSummary(data);
        setStep("wow");
      });
    });
  }

  function handleUseSampleData() {
    startTransition(async () => {
      await createSampleData();
      setImportCount(12);
      setStep("processing");

      simulateProcessing(async () => {
        const data = await getOnboardingSummary();
        setSummary(data);
        setStep("wow");
      });
    });
  }

  function handleComplete() {
    startTransition(async () => {
      await completeOnboarding();
    });
  }

  function handleSkip() {
    startTransition(async () => {
      await skipOnboarding();
    });
  }

  function formatBRL(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-xl space-y-6">
        {/* Header + Progress */}
        <div className="space-y-3">
          <div className="relative flex items-center justify-center">
            {canGoBack && (
              <button
                type="button"
                onClick={goBack}
                disabled={isPending}
                className="absolute left-0 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="size-4" />
                Voltar
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <TrendingUp className="size-5" />
              </div>
              <span className="font-semibold text-xl">Letheus</span>
            </div>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            {STEPS.map((s) => (
              <span
                key={s.key}
                className={step === s.key ? "text-primary font-medium" : ""}
              >
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Step 1: Welcome */}
        {step === "welcome" && (
          <Card>
            <CardContent className="pt-8 pb-8 space-y-8 text-center">
              <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="size-10 text-primary" />
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold">
                  Oi, {userName}!
                </h1>
                <p className="text-lg text-muted-foreground">
                  Em 2 minutos você vai saber exatamente pra onde vai seu dinheiro.
                </p>
              </div>
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3 rounded-lg border p-4">
                  <DollarSign className="size-6 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-base">Informe sua renda</p>
                    <p className="text-sm text-muted-foreground">Quanto entra por mês</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border p-4">
                  <Upload className="size-6 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-base">Importe seu extrato</p>
                    <p className="text-sm text-muted-foreground">CSV do banco ou cole o texto</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border p-4">
                  <Zap className="size-6 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-base">IA organiza tudo</p>
                    <p className="text-sm text-muted-foreground">Categorização automática + insights</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleStart}
                disabled={isPending}
                size="lg"
                className="w-full text-base h-12"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-5 w-5" />
                )}
                Vamos começar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Revenue */}
        {step === "revenue" && (
          <Card>
            <CardContent className="pt-8 pb-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/10 mb-3">
                  <DollarSign className="size-8 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold">Quanto você ganha por mês?</h2>
                <p className="text-base text-muted-foreground">
                  Pode ser o salário ou sua renda principal
                </p>
              </div>

              <form action={handleRevenueSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="onb-revenue-name" className="text-base">Fonte de renda</Label>
                  <Input
                    id="onb-revenue-name"
                    name="name"
                    placeholder="Ex: Salário, Freelance, CLT..."
                    disabled={isPending}
                    className="h-11 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="onb-revenue-value" className="text-base">Valor mensal (R$)</Label>
                  <Input
                    id="onb-revenue-value"
                    name="value"
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex: 5000"
                    disabled={isPending}
                    autoFocus
                    className="h-11 text-base"
                  />
                  <p className="text-sm text-muted-foreground">
                    Não precisa ser exato, pode ajustar depois
                  </p>
                </div>

                {revenueError && (
                  <p className="text-base text-destructive">{revenueError}</p>
                )}

                <Button type="submit" disabled={isPending} className="w-full text-base h-12">
                  {isPending ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-5 w-5" />
                  )}
                  Continuar
                </Button>
              </form>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setStep("import")}
                  disabled={isPending}
                  className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
                >
                  Pular, informo depois
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Import */}
        {step === "import" && (
          <Card>
            <CardContent className="pt-8 pb-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Importe seus gastos</h2>
                <p className="text-base text-muted-foreground">
                  Escolha como quer enviar o extrato do banco
                </p>
              </div>

              <Tabs defaultValue="csv" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-11">
                  <TabsTrigger value="csv" className="gap-2 text-sm">
                    <FileText className="h-4 w-4" />
                    Arquivo CSV
                  </TabsTrigger>
                  <TabsTrigger value="text" className="gap-2 text-sm">
                    <ClipboardPaste className="h-4 w-4" />
                    Colar texto
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="csv" className="space-y-4 mt-4">
                  <form action={handleCSVSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-base">Tipo de extrato</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPurchaseType("credit")}
                          className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
                            purchaseType === "credit"
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-muted hover:border-muted-foreground/30"
                          }`}
                        >
                          Cartão de Crédito
                        </button>
                        <button
                          type="button"
                          onClick={() => setPurchaseType("debit")}
                          className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
                            purchaseType === "debit"
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-muted hover:border-muted-foreground/30"
                          }`}
                        >
                          Conta Corrente / Débito
                        </button>
                      </div>
                    </div>
                    <label
                      htmlFor="onb-csv"
                      className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                        <Upload className="size-6 text-primary" />
                      </div>
                      {selectedFile ? (
                        <div className="text-center">
                          <p className="text-base font-medium text-foreground">{selectedFile}</p>
                          <p className="text-sm text-muted-foreground mt-1">Clique para trocar o arquivo</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-base font-medium">Clique para escolher o arquivo CSV</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Aceita extratos de C6, Itaú, Nubank e outros bancos
                          </p>
                        </div>
                      )}
                      <Input
                        id="onb-csv"
                        name="file"
                        type="file"
                        accept=".csv"
                        disabled={isPending}
                        className="hidden"
                        onChange={(e) => setSelectedFile(e.target.files?.[0]?.name ?? "")}
                      />
                    </label>
                    {selectedFile && (
                      <Button type="submit" disabled={isPending} className="w-full text-base h-12">
                        {isPending ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Importando...
                          </>
                        ) : (
                          <>
                            <ArrowRight className="mr-2 h-5 w-5" />
                            Enviar e analisar com IA
                          </>
                        )}
                      </Button>
                    )}
                  </form>
                </TabsContent>

                <TabsContent value="text" className="space-y-4 mt-4">
                  <form action={handleTextSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="onb-text" className="text-base">Cole o texto do extrato aqui</Label>
                      <Textarea
                        id="onb-text"
                        name="text"
                        rows={6}
                        placeholder={"Copie do app do banco e cole aqui...\n\nEx:\nsegunda-feira, 23/03/2026\nMercado Extra  R$ 87,50\nUber  R$ 23,90"}
                        disabled={isPending}
                        className="text-base"
                      />
                    </div>
                    <Button type="submit" disabled={isPending} className="w-full text-base h-12">
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="mr-2 h-5 w-5" />
                          Enviar e analisar com IA
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="rounded-lg border border-dashed p-4 space-y-3 text-center">
                <p className="text-sm text-muted-foreground">
                  Não tem o extrato agora?
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUseSampleData}
                  disabled={isPending}
                  className="w-full h-11 text-base"
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Ver com dados de exemplo
                </Button>
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isPending}
                  className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
                >
                  Pular e explorar o app vazio
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Processing */}
        {step === "processing" && (
          <Card>
            <CardContent className="pt-8 pb-8 space-y-8 text-center">
              <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="size-10 text-primary animate-pulse" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold">IA trabalhando...</h2>
                <p className="text-base text-muted-foreground">
                  {importCount > 0
                    ? `${importCount} transações importadas. Organizando tudo pra você.`
                    : "Processando seus dados..."}
                </p>
              </div>
              <div className="space-y-3">
                <Progress value={processingProgress} className="h-2.5" />
                <p className="text-sm text-muted-foreground animate-pulse">
                  {processingLabel}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: WOW Moment */}
        {step === "wow" && summary && (
          <Card className="border-primary/30">
            <CardContent className="pt-8 pb-8 space-y-6">
              <div className="text-center space-y-3">
                <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="size-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold">Pra onde vai seu dinheiro</h2>
                <p className="text-base text-muted-foreground">
                  A IA organizou tudo automaticamente
                </p>
              </div>

              {/* KPI Summary */}
              <div className={`grid gap-3 ${summary.totalRevenue > 0 ? "grid-cols-3" : "grid-cols-2"}`}>
                {summary.totalRevenue > 0 && (
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-xl font-bold text-emerald-500">
                      {formatBRL(summary.totalRevenue)}
                    </p>
                    <p className="text-sm text-muted-foreground">Receita</p>
                  </div>
                )}
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-xl font-bold text-red-400">
                    {formatBRL(summary.totalExpenses)}
                  </p>
                  <p className="text-sm text-muted-foreground">Gastos</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className={`text-xl font-bold ${summary.balance >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                    {formatBRL(summary.balance)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {summary.totalRevenue > 0 ? "Saldo" : "Transações"}
                  </p>
                </div>
              </div>

              {/* Balance warning */}
              {summary.totalRevenue > 0 && summary.balance < 0 && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-center">
                  <p className="text-base text-red-400 font-medium">
                    Seus gastos ultrapassaram sua receita em {formatBRL(Math.abs(summary.balance))}
                  </p>
                </div>
              )}

              {/* Top Categories */}
              {summary.topCategories.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">Onde você mais gasta</h3>
                  <div className="space-y-3">
                    {summary.topCategories.map((cat, i) => (
                      <div key={cat.name} className="space-y-1.5">
                        <div className="flex justify-between text-base">
                          <span className="flex items-center gap-2">
                            <span className="text-muted-foreground text-sm">{i + 1}.</span>
                            {cat.name}
                          </span>
                          <span className="font-mono">
                            {formatBRL(cat.total)}
                            <span className="text-muted-foreground text-sm ml-1">
                              ({cat.percentage}%)
                            </span>
                          </span>
                        </div>
                        <Progress
                          value={cat.percentage}
                          className="h-2 [&>div]:bg-primary"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Biggest expense highlight */}
              {summary.biggestExpense && (
                <div className="rounded-lg bg-muted/50 p-4 text-center">
                  <p className="text-sm text-muted-foreground">Maior gasto do mês</p>
                  <p className="font-semibold text-base mt-1">
                    {summary.biggestExpense.description}
                    <span className="text-red-400 ml-2">
                      {formatBRL(summary.biggestExpense.value)}
                    </span>
                  </p>
                </div>
              )}

              {/* AI insight message */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex gap-3">
                  <Sparkles className="size-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-base">
                    <span className="font-medium">Dica da IA:</span>{" "}
                    {summary.topCategories[0]
                      ? `Sua maior categoria de gasto é "${summary.topCategories[0].name}" com ${summary.topCategories[0].percentage}% do total. Use o chat com IA para pedir dicas de como economizar.`
                      : "Importe mais dados para ter insights mais detalhados sobre seus gastos."}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleComplete}
                disabled={isPending}
                size="lg"
                className="w-full text-base h-12"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <ChevronRight className="mr-2 h-5 w-5" />
                )}
                Ver meu dashboard completo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
