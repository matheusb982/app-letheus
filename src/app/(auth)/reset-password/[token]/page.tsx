"use client";

import { useActionState } from "react";
import { useParams } from "next/navigation";
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
import { resetPasswordAction, type ActionState } from "@/lib/actions/auth-actions";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    resetPasswordAction,
    {}
  );

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Nova Senha</CardTitle>
        <CardDescription>
          {state.success
            ? "Sua senha foi redefinida com sucesso!"
            : "Digite sua nova senha"}
        </CardDescription>
      </CardHeader>
      {!state.success ? (
        <form action={formAction}>
          <input type="hidden" name="token" value={token} />
          <CardContent className="space-y-4">
            {state.error && (
              <p className="text-sm text-destructive text-center">{state.error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Repita a senha"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Redefinindo..." : "Redefinir senha"}
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
            <Button className="w-full">
              Fazer login
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
