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
import { Plus, Users, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  createFamily,
  deleteFamily,
  type SerializedFamily,
} from "@/lib/actions/family-actions";

interface Props {
  families: SerializedFamily[];
}

export function AdminFamiliesClient({ families }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);

  async function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createFamily(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Família criada com sucesso");
        setCreateOpen(false);
        router.refresh();
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta família?")) return;
    startTransition(async () => {
      const result = await deleteFamily(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Família excluída");
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
              Nova Família
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Família</DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="family_name">Nome da Família</Label>
                <Input id="family_name" name="family_name" required placeholder="Ex: Família Silva" />
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-3">Primeiro membro (admin da família)</p>
                <div className="space-y-2">
                  <Label htmlFor="member_fullname">Nome</Label>
                  <Input id="member_fullname" name="member_fullname" placeholder="Nome completo" />
                </div>
                <div className="space-y-2 mt-2">
                  <Label htmlFor="member_email">Email</Label>
                  <Input id="member_email" name="member_email" type="email" required placeholder="email@exemplo.com" />
                </div>
                <div className="space-y-2 mt-2">
                  <Label htmlFor="member_password">Senha</Label>
                  <Input id="member_password" name="member_password" type="password" required minLength={6} placeholder="Mínimo 6 caracteres" />
                </div>
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
              <TableHead>Família</TableHead>
              <TableHead>Dono</TableHead>
              <TableHead>Membros</TableHead>
              <TableHead>Criada em</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {families.map((family) => (
              <TableRow key={family.id}>
                <TableCell className="font-medium">{family.name}</TableCell>
                <TableCell>
                  <div>
                    <div className="text-sm">{family.owner_name}</div>
                    <div className="text-xs text-muted-foreground">{family.owner_email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{family.member_count}</Badge>
                </TableCell>
                <TableCell>{family.created_at}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <Link href={`/admin/families/${family.id}`}>
                        <Users className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(family.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {families.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhuma família cadastrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
