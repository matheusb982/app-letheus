"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useTransition } from "react";

interface DeleteButtonProps {
  action: () => Promise<void>;
  size?: "default" | "sm" | "icon";
}

export function DeleteButton({ action, size = "icon" }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size={size}
      disabled={isPending}
      onClick={() => {
        if (confirm("Tem certeza que deseja excluir?")) {
          startTransition(() => action());
        }
      }}
    >
      <Trash2 className="h-4 w-4 text-red-500" />
    </Button>
  );
}
