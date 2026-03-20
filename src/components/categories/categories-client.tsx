"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { SerializedCategory } from "@/lib/actions/category-actions";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from "@/lib/actions/category-actions";

interface Props {
  categories: SerializedCategory[];
}

export function CategoriesClient({ categories }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<SerializedCategory | null>(null);
  const [editingSub, setEditingSub] = useState<{
    categoryId: string;
    id: string;
    name: string;
    description: string;
  } | null>(null);
  const [targetCategoryId, setTargetCategoryId] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  async function handleCategorySubmit(formData: FormData) {
    const result = editingCat
      ? await updateCategory(editingCat.id, formData)
      : await createCategory(formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(editingCat ? "Categoria atualizada!" : "Categoria criada!");
      setCatDialogOpen(false);
      setEditingCat(null);
    }
  }

  async function handleSubSubmit(formData: FormData) {
    const catId = editingSub ? editingSub.categoryId : targetCategoryId;
    const result = editingSub
      ? await updateSubcategory(catId, editingSub.id, formData)
      : await addSubcategory(catId, formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(editingSub ? "Subcategoria atualizada!" : "Subcategoria criada!");
      setSubDialogOpen(false);
      setEditingSub(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={catDialogOpen} onOpenChange={(o) => { setCatDialogOpen(o); if (!o) setEditingCat(null); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCat ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
            </DialogHeader>
            <form action={handleCategorySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Nome</Label>
                <Input id="cat-name" name="name" defaultValue={editingCat?.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-desc">Descrição</Label>
                <Input id="cat-desc" name="description" defaultValue={editingCat?.description} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-type">Tipo</Label>
                <Select name="category_type" defaultValue={editingCat?.category_type ?? "purchase"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Compra</SelectItem>
                    <SelectItem value="patrimony">Patrimônio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isPending}>Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={subDialogOpen} onOpenChange={(o) => { setSubDialogOpen(o); if (!o) setEditingSub(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSub ? "Editar Subcategoria" : "Nova Subcategoria"}</DialogTitle>
          </DialogHeader>
          <form action={handleSubSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sub-name">Nome</Label>
              <Input id="sub-name" name="name" defaultValue={editingSub?.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-desc">Descrição</Label>
              <Input id="sub-desc" name="description" defaultValue={editingSub?.description} />
            </div>
            <Button type="submit" disabled={isPending}>Salvar</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Subcategorias</TableHead>
              <TableHead className="w-[120px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <>
                <TableRow key={cat.id}>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleExpand(cat.id)}
                    >
                      {expanded.has(cat.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{cat.category_type_label}</Badge>
                  </TableCell>
                  <TableCell>{cat.subcategories.length}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setTargetCategoryId(cat.id);
                          setEditingSub(null);
                          setSubDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingCat(cat);
                          setCatDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Excluir categoria e todas subcategorias?")) {
                            startTransition(() => deleteCategory(cat.id));
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {expanded.has(cat.id) &&
                  cat.subcategories.map((sub) => (
                    <TableRow key={sub.id} className="bg-muted/30">
                      <TableCell></TableCell>
                      <TableCell className="pl-8">{sub.name}</TableCell>
                      <TableCell colSpan={2}>
                        <span className="text-muted-foreground text-sm">{sub.description}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingSub({
                                categoryId: cat.id,
                                id: sub.id,
                                name: sub.name,
                                description: sub.description,
                              });
                              setSubDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Excluir subcategoria?")) {
                                startTransition(() => deleteSubcategory(cat.id, sub.id));
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
