"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Smartphone, LinkIcon, Unlink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { linkWhatsApp, unlinkWhatsApp } from "@/lib/actions/whatsapp-actions";

interface WhatsAppSettingsClientProps {
  linked: boolean;
  phoneNumber?: string;
  verified: boolean;
  linkToken?: string;
}

export function WhatsAppSettingsClient({
  linked,
  phoneNumber,
  verified,
  linkToken: initialToken,
}: WhatsAppSettingsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState(initialToken ?? "");
  const [showToken, setShowToken] = useState(!!initialToken && !verified);
  const [copied, setCopied] = useState(false);

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11)
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(formatPhone(e.target.value));
  }

  function handleLink() {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("Numero invalido. Use o formato (11) 99999-9999");
      return;
    }

    startTransition(async () => {
      const result = await linkWhatsApp(digits);
      if (result.success && result.token) {
        setToken(result.token);
        setShowToken(true);
        toast.success("Codigo gerado! Envie no WhatsApp para confirmar.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Erro ao vincular");
      }
    });
  }

  function handleUnlink() {
    startTransition(async () => {
      const result = await unlinkWhatsApp();
      if (result.success) {
        setPhone("");
        setToken("");
        setShowToken(false);
        toast.success("WhatsApp desvinculado");
        router.refresh();
      } else {
        toast.error(result.error ?? "Erro ao desvincular");
      }
    });
  }

  function handleCopyToken() {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Linked and verified state
  if (linked && verified) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-green-600" />
              <div>
                <CardTitle className="text-lg">WhatsApp Vinculado</CardTitle>
                <CardDescription>
                  +{phoneNumber?.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, "$1 ($2) $3-$4")}
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Ativo
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">O que voce pode fazer via WhatsApp:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Registrar gastos: <span className="font-mono">Cafe R$15,00</span></li>
              <li>Fazer perguntas: <span className="font-mono">Quanto gastei esse mes?</span></li>
              <li>Digite <span className="font-mono">ajuda</span> no WhatsApp para mais opcoes</li>
            </ul>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" disabled={isPending}>
                <Unlink className="h-4 w-4" />
                Desvincular
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Desvincular WhatsApp?</AlertDialogTitle>
                <AlertDialogDescription>
                  Voce nao podera mais usar o WhatsApp para registrar gastos ou fazer perguntas.
                  Podera vincular novamente a qualquer momento.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleUnlink}>
                  {isPending ? "Desvinculando..." : "Sim, desvincular"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    );
  }

  // Pending verification state (token generated but not yet confirmed)
  if (showToken && token) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-yellow-600" />
            <div>
              <CardTitle className="text-lg">Confirme a Vinculacao</CardTitle>
              <CardDescription>
                Envie o codigo abaixo como mensagem no WhatsApp do Letheus
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-lg border bg-muted p-4 text-center">
              <span className="text-2xl font-bold tracking-[0.3em] font-mono">{token}</span>
            </div>
            <Button variant="outline" size="icon" onClick={handleCopyToken}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>1. Abra o WhatsApp e envie uma mensagem para o numero do Letheus</p>
            <p>2. Digite o codigo <strong>{token}</strong> e envie</p>
            <p>3. Voce recebera uma confirmacao quando a vinculacao for concluida</p>
            <p className="text-xs">O codigo expira em 10 minutos.</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowToken(false);
              setToken("");
            }}
          >
            Voltar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Not linked state — show phone input form
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Smartphone className="h-5 w-5" />
          <div>
            <CardTitle className="text-lg">Vincular WhatsApp</CardTitle>
            <CardDescription>
              Conecte seu WhatsApp para registrar gastos e tirar duvidas financeiras direto pelo celular
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Numero do celular</Label>
          <Input
            id="phone"
            placeholder="(11) 99999-9999"
            value={phone}
            onChange={handlePhoneChange}
            maxLength={15}
          />
          <p className="text-xs text-muted-foreground">
            Informe o numero que voce usa no WhatsApp
          </p>
        </div>
        <Button onClick={handleLink} disabled={isPending} className="gap-2">
          <LinkIcon className="h-4 w-4" />
          {isPending ? "Gerando codigo..." : "Vincular"}
        </Button>
      </CardContent>
    </Card>
  );
}
