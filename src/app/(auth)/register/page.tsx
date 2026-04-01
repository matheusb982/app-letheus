"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type ActionState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

const initialState: ActionState = {};

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Criar Conta</CardTitle>
        <CardDescription>Preencha os dados para se cadastrar</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="fullname">Nome completo</Label>
            <Input
              id="fullname"
              name="fullname"
              type="text"
              placeholder="Seu nome"
              required
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              required
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Repita a senha"
              required
              autoComplete="new-password"
            />
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox id="terms" name="terms" required />
            <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
              Li e concordo com os{" "}
              <Link href="/terms" target="_blank" className="text-primary underline hover:text-primary/80">
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link href="/privacy" target="_blank" className="text-primary underline hover:text-primary/80">
                Política de Privacidade
              </Link>
            </label>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            Criar conta
          </Button>
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Já tem uma conta? Faça login
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
