"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Clock, Pencil, Check, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  addMyFamilyMember,
  removeMyFamilyMember,
  updateMyFamilyName,
  deleteMyAccount,
  deleteMyFamily,
  type SerializedAuditLog,
} from "@/lib/actions/family-member-actions";
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
import type { SerializedFamilyMember } from "@/lib/actions/family-actions";

interface Props {
  familyName: string;
  members: SerializedFamilyMember[];
  memberCount: number;
  memberLimit: number;
  auditLog: SerializedAuditLog[];
}

const ACTION_LABELS: Record<string, string> = {
  member_added: "Membro adicionado",
  member_removed: "Membro removido",
  member_deleted_account: "Conta excluída",
  family_deleted: "Família excluída",
  owner_deleted_account: "Owner excluiu conta",
};

export function FamilyManagementClient({
  familyName,
  members,
  memberCount,
  memberLimit,
  auditLog,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(familyName);
  const isAtLimit = memberCount >= memberLimit;

  async function handleUpdateName() {
    if (!nameValue.trim() || nameValue === familyName) {
      setEditingName(false);
      setNameValue(familyName);
      return;
    }
    const formData = new FormData();
    formData.append("name", nameValue);
    startTransition(async () => {
      const result = await updateMyFamilyName(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Nome atualizado");
        setEditingName(false);
        router.refresh();
      }
    });
  }

  async function handleAdd(formData: FormData) {
    startTransition(async () => {
      const result = await addMyFamilyMember(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Membro adicionado com sucesso");
        setAddOpen(false);
        router.refresh();
      }
    });
  }

  async function handleDeleteAccount() {
    startTransition(async () => {
      const result = await deleteMyAccount();
      if (result.error) {
        toast.error(result.error);
      } else if (result.redirect) {
        toast.success("Conta excluída com sucesso");
        router.push(result.redirect);
      }
    });
  }

  async function handleDeleteFamily() {
    startTransition(async () => {
      const result = await deleteMyFamily();
      if (result.error) {
        toast.error(result.error);
      } else if (result.redirect) {
        toast.success("Família e dados excluídos com sucesso");
        router.push(result.redirect);
      }
    });
  }

  async function handleRemove(userId: string, email: string) {
    if (!confirm(`Remover ${email} da família?`)) return;
    startTransition(async () => {
      const result = await removeMyFamilyMember(userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Membro removido");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Family Name */}
      <div className="flex items-center gap-2">
        {editingName ? (
          <>
            <Input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              className="text-2xl font-bold h-auto py-1 max-w-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdateName();
                if (e.key === "Escape") {
                  setEditingName(false);
                  setNameValue(familyName);
                }
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleUpdateName}
              disabled={isPending}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setEditingName(false);
                setNameValue(familyName);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">{familyName}</h1>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setEditingName(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Members Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Membros</h2>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" disabled={isAtLimit}>
                <Plus className="h-4 w-4" />
                {isAtLimit
                  ? `Limite de ${memberLimit} atingido`
                  : "Adicionar Membro"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Membro</DialogTitle>
              </DialogHeader>
              <form action={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullname">Nome</Label>
                  <Input
                    id="fullname"
                    name="fullname"
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAddOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Adicionando..." : "Adicionar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.fullname || "—"}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        member.family_role === "admin" ? "default" : "secondary"
                      }
                    >
                      {member.family_role === "admin" ? "Dono" : "Membro"}
                    </Badge>
                  </TableCell>
                  <TableCell>{member.created_at}</TableCell>
                  <TableCell>
                    {member.family_role !== "admin" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() =>
                          handleRemove(member.id, member.email)
                        }
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Audit Log Section */}
      {auditLog.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Histórico</h2>
          <div className="space-y-2">
            {auditLog.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 rounded-md border p-3 text-sm"
              >
                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p>
                    <span className="font-medium">
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                    {log.target_email && (
                      <span className="text-muted-foreground">
                        {" "}
                        — {log.target_email}
                      </span>
                    )}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(log.created_at).toLocaleString("pt-BR")} por{" "}
                    {log.actor_email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="space-y-4 rounded-md border border-destructive/50 p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h2 className="text-lg font-semibold text-destructive">
            Zona de Perigo
          </h2>
        </div>

        <div className="space-y-3">
          {/* Excluir Família */}
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="font-medium">Excluir família</p>
              <p className="text-sm text-muted-foreground">
                Remove todos os dados financeiros, membros e a família. Irreversível.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isPending}>
                  Excluir Família
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir família?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação é <strong>irreversível</strong>. Todos os dados
                    financeiros (despesas, receitas, metas, patrimônio),
                    categorias, períodos e membros serão permanentemente
                    excluídos. Sua conta também será removida.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteFamily}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isPending ? "Excluindo..." : "Sim, excluir tudo"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Excluir Conta */}
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="font-medium">Excluir minha conta</p>
              <p className="text-sm text-muted-foreground">
                Remove sua conta. Dados da família são preservados e anonimizados.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isPending}>
                  Excluir Conta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Sua conta será permanentemente excluída. Os dados financeiros
                    da família serão mantidos, mas suas referências pessoais
                    serão anonimizadas conforme LGPD.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isPending ? "Excluindo..." : "Sim, excluir minha conta"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
