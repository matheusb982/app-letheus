"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

interface DeleteButtonProps {
  action: () => Promise<void | { error?: string }>;
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
          startTransition(async () => {
            const result = await action();
            if (result && "error" in result && result.error) {
              toast.error(result.error);
            }
          });
        }
      }}
    >
      <Trash2 className="h-4 w-4 text-red-500" />
    </Button>
  );
}
