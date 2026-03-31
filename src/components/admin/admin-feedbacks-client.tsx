"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Eye, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  updateFeedbackStatus,
  deleteFeedback,
  type SerializedFeedback,
} from "@/lib/actions/feedback-actions";

interface Props {
  feedbacks: SerializedFeedback[];
}

const statusConfig = {
  pending: { label: "Pendente", variant: "default" as const, icon: Clock },
  read: { label: "Lido", variant: "secondary" as const, icon: Eye },
  resolved: { label: "Resolvido", variant: "outline" as const, icon: CheckCircle2 },
};

export function AdminFeedbacksClient({ feedbacks }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleStatusChange(id: string, status: "pending" | "read" | "resolved") {
    startTransition(async () => {
      const result = await updateFeedbackStatus(id, status);
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este feedback?")) return;
    startTransition(async () => {
      const result = await deleteFeedback(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Feedback excluído");
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuário</TableHead>
            <TableHead>Mensagem</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="w-[80px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {feedbacks.map((f) => {
            const config = statusConfig[f.status];
            return (
              <TableRow key={f.id}>
                <TableCell>
                  <div>
                    <div className="text-sm font-medium">{f.user_name}</div>
                    <div className="text-xs text-muted-foreground">{f.user_email}</div>
                  </div>
                </TableCell>
                <TableCell className="max-w-md">
                  <p className="text-sm whitespace-pre-wrap line-clamp-3">{f.message}</p>
                </TableCell>
                <TableCell>
                  <Badge variant={config.variant} className="gap-1">
                    <config.icon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{f.created_at}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleStatusChange(f.id, "read")}>
                        <Eye className="h-4 w-4 mr-2" />
                        Marcar como lido
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(f.id, "resolved")}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Marcar como resolvido
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(f.id, "pending")}>
                        <Clock className="h-4 w-4 mr-2" />
                        Voltar para pendente
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(f.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
          {feedbacks.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                Nenhum feedback recebido
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
