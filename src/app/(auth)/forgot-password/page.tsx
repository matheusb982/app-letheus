"use client";

import { useActionState } from "react";
import Link from "next/link";
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
import { forgotPasswordAction, type ActionState } from "@/lib/actions/auth-actions";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    forgotPasswordAction,
    {}
  );

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
        <CardDescription>
          {state.success
            ? "Verifique seu email para as instruções de recuperação"
            : "Informe seu email para receber o link de recuperação"}
        </CardDescription>
      </CardHeader>
      {!state.success ? (
        <form action={formAction}>
          <CardContent className="space-y-4">
            {state.error && (
              <p className="text-sm text-destructive text-center">{state.error}</p>
            )}
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
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-6">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Enviando..." : "Enviar link de recuperação"}
            </Button>
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Voltar para o login
            </Link>
          </CardFooter>
        </form>
      ) : (
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              Voltar para o login
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
