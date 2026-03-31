"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, MoreHorizontal, CheckCircle, Clock, XCircle, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import {
  createUser,
  updateUser,
  deleteUser,
  activateSubscription,
  extendTrial,
  cancelSubscription,
  expireSubscription,
  type SerializedUser,
} from "@/lib/actions/admin-actions";

interface Props {
  users: SerializedUser[];
}

function SubscriptionBadge({ status }: { status: string }) {
  switch (status) {
    case "active":
      return <Badge className="bg-green-600">Ativo</Badge>;
    case "trialing":
      return <Badge className="bg-blue-600">Trial</Badge>;
    case "expired":
      return <Badge variant="destructive">Expirado</Badge>;
    case "canceled":
      return <Badge variant="secondary">Cancelado</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function formatTrialEnd(trialEndsAt: string | null): string {
  if (!trialEndsAt) return "—";
  const date = new Date(trialEndsAt);
  const now = new Date();
  const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = date.toLocaleDateString("pt-BR");
  if (days < 0) return `${formatted} (expirado)`;
  if (days === 0) return `${formatted} (hoje)`;
  if (days === 1) return `${formatted} (1 dia)`;
  return `${formatted} (${days} dias)`;
}

export function AdminUsersClient({ users }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<SerializedUser | null>(null);
  const [extendOpen, setExtendOpen] = useState<string | null>(null);

  async function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createUser(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Usuário criado com sucesso");
        setCreateOpen(false);
        router.refresh();
      }
    });
  }

  async function handleUpdate(formData: FormData) {
    if (!editUser) return;
    startTransition(async () => {
      const result = await updateUser(editUser.id, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Usuário atualizado com sucesso");
        setEditUser(null);
        router.refresh();
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este usuário?")) return;
    startTransition(async () => {
      const result = await deleteUser(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Usuário excluído");
        router.refresh();
      }
    });
  }

  async function handleActivate(familyId: string | null) {
    if (!familyId) return toast.error("Usuário sem família");
    startTransition(async () => {
      const result = await activateSubscription(familyId);
      if (result.success) {
        toast.success("Assinatura ativada");
        router.refresh();
      }
    });
  }

  async function handleExtendTrial(familyId: string | null, days: number) {
    if (!familyId) return toast.error("Usuário sem família");
    startTransition(async () => {
      const result = await extendTrial(familyId, days);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`Trial estendido em ${days} dias`);
        setExtendOpen(null);
        router.refresh();
      }
    });
  }

  async function handleCancel(familyId: string | null) {
    if (!familyId) return toast.error("Usuário sem família");
    if (!confirm("Cancelar assinatura desta família?")) return;
    startTransition(async () => {
      const result = await cancelSubscription(familyId);
      if (result.success) {
        toast.success("Assinatura cancelada");
        router.refresh();
      }
    });
  }

  async function handleExpire(familyId: string | null) {
    if (!familyId) return toast.error("Usuário sem família");
    if (!confirm("Expirar assinatura desta família?")) return;
    startTransition(async () => {
      const result = await expireSubscription(familyId);
      if (result.success) {
        toast.success("Assinatura expirada");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Usuário</DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-fullname">Nome</Label>
                <Input id="create-fullname" name="fullname" placeholder="Nome completo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-email">Email</Label>
                <Input id="create-email" name="email" type="email" required placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-password">Senha</Label>
                <Input id="create-password" name="password" type="password" required minLength={6} placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Criando..." : "Criar"}
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
              <TableHead>Família</TableHead>
              <TableHead>Assinatura</TableHead>
              <TableHead>Trial até</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.fullname || "—"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="text-sm">{user.family_name || "—"}</TableCell>
                <TableCell>
                  <SubscriptionBadge status={user.subscription_status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.subscription_status === "trialing"
                    ? formatTrialEnd(user.trial_ends_at)
                    : "—"}
                </TableCell>
                <TableCell>{user.created_at}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditUser(user)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleActivate(user.family_id)} disabled={!user.family_id}>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                        Ativar assinatura
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setExtendOpen(user.family_id)} disabled={!user.family_id}>
                        <CalendarPlus className="mr-2 h-4 w-4 text-blue-600" />
                        Estender trial
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExpire(user.family_id)} disabled={!user.family_id}>
                        <Clock className="mr-2 h-4 w-4 text-amber-600" />
                        Expirar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCancel(user.family_id)} disabled={!user.family_id}>
                        <XCircle className="mr-2 h-4 w-4 text-red-600" />
                        Cancelar assinatura
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(user.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir usuário
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum usuário cadastrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          {editUser && (
            <form action={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-fullname">Nome</Label>
                <Input
                  id="edit-fullname"
                  name="fullname"
                  defaultValue={editUser.fullname}
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  required
                  defaultValue={editUser.email}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">Nova Senha</Label>
                <Input
                  id="edit-password"
                  name="password"
                  type="password"
                  minLength={6}
                  placeholder="Deixe vazio para manter a atual"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditUser(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Extend Trial Dialog */}
      <Dialog open={!!extendOpen} onOpenChange={(open) => !open && setExtendOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estender Trial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Quantos dias deseja adicionar ao trial?
            </p>
            <div className="flex gap-2">
              {[7, 14, 30].map((days) => (
                <Button
                  key={days}
                  variant="outline"
                  onClick={() => extendOpen && handleExtendTrial(extendOpen, days)}
                  disabled={isPending}
                >
                  +{days} dias
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
