"use client";

import { AlertTriangle, Clock } from "lucide-react";

interface TrialBannerProps {
  daysRemaining: number | null;
  expired: boolean;
}

export function TrialBanner({ daysRemaining, expired }: TrialBannerProps) {
  if (expired) {
    return (
      <div className="flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-sm text-destructive-foreground">
        <AlertTriangle className="h-4 w-4" />
        <span>
          Seu período de teste expirou. Funcionalidades de edição estão bloqueadas.{" "}
          <strong>Assine para continuar usando.</strong>
        </span>
      </div>
    );
  }

  if (daysRemaining !== null && daysRemaining >= 0) {
    const isUrgent = daysRemaining <= 3;
    return (
      <div className={`flex items-center justify-center gap-2 px-4 py-2 text-sm ${
        isUrgent ? "bg-amber-500 text-white" : "bg-blue-500/10 text-blue-700"
      }`}>
        <Clock className="h-4 w-4" />
        <span>
          {daysRemaining === 0
            ? "Último dia do seu período de teste!"
            : daysRemaining === 1
              ? "Falta 1 dia para o fim do período de teste."
              : `Período de teste: ${daysRemaining} dias restantes.`}
        </span>
      </div>
    );
  }

  return null;
}
