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
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  addFamilyMember,
  removeFamilyMember,
  type SerializedFamilyMember,
} from "@/lib/actions/family-actions";

interface Props {
  familyId: string;
  members: SerializedFamilyMember[];
}

export function AdminFamilyMembersClient({ familyId, members }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);

  async function handleAdd(formData: FormData) {
    startTransition(async () => {
      const result = await addFamilyMember(familyId, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Membro adicionado com sucesso");
        setAddOpen(false);
        router.refresh();
      }
    });
  }

  async function handleRemove(userId: string) {
    if (!confirm("Remover este membro?")) return;
    startTransition(async () => {
      const result = await removeFamilyMember(userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Membro removido");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <Link href="/admin/families">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Membro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Membro</DialogTitle>
            </DialogHeader>
            <form action={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullname">Nome</Label>
                <Input id="fullname" name="fullname" placeholder="Nome completo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" name="password" type="password" required minLength={6} placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
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
              <TableHead>Criado em</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.fullname || "—"}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>
                  <Badge variant={member.family_role === "admin" ? "default" : "secondary"}>
                    {member.family_role === "admin" ? "Admin" : "Membro"}
                  </Badge>
                </TableCell>
                <TableCell>{member.created_at}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleRemove(member.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {members.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum membro
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
