"use client";

import { useActionState } from "react";
import { loginAction, type ActionState } from "@/lib/actions/auth-actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Loader2, TrendingUp } from "lucide-react";

const initialState: ActionState = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <TrendingUp className="size-4" />
          </div>
          Letheus IA Financeira
        </div>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Bem-vindo de volta</CardTitle>
              <CardDescription>
                Seu assistente financeiro com IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={formAction}>
                <FieldGroup>
                  {state.error && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {state.error}
                    </div>
                  )}
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      autoComplete="email"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="password">Senha</FieldLabel>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••"
                      required
                      autoComplete="current-password"
                    />
                  </Field>
                  <div className="flex justify-end">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <Field>
                    <Button type="submit" className="w-full" disabled={isPending}>
                      {isPending && <Loader2 className="animate-spin" />}
                      Entrar
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
