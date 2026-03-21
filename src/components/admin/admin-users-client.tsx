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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createUser,
  updateUser,
  deleteUser,
  type SerializedUser,
} from "@/lib/actions/admin-actions";

interface Props {
  users: SerializedUser[];
}

export function AdminUsersClient({ users }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<SerializedUser | null>(null);

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
              <TableHead>Criado em</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.fullname || "—"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.created_at}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditUser(user)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(user.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
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
    </div>
  );
}
