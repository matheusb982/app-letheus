"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { importCSVAction, importTextAction } from "@/lib/actions/import-actions";

export function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCSVSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await importCSVAction(formData);
      if (result.created > 0) {
        let msg = `${result.created} de ${result.total} despesas importadas com sucesso!`;
        if (result.skipped > 0) msg += ` ${result.skipped} já existentes ignoradas.`;
        toast.success(msg);
      }
      if (result.errors.length > 0) {
        toast.error(`Erros: ${result.errors.length}`);
      }
      if (result.created === 0 && result.errors.length === 0) {
        toast.info("Nenhuma despesa nova para importar.");
      }
      setOpen(false);
    });
  }

  function handleTextSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await importTextAction(formData);
      if (result.created > 0) {
        let msg = `${result.created} de ${result.total} despesas importadas com sucesso!`;
        if (result.skipped > 0) msg += ` ${result.skipped} já existentes ignoradas.`;
        toast.success(msg);
      }
      if (result.errors.length > 0) {
        toast.error(`Erros: ${result.errors.length}`);
      }
      if (result.created === 0 && result.errors.length === 0) {
        toast.info("Nenhuma despesa nova para importar.");
      }
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Despesas</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="csv">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="csv">CSV</TabsTrigger>
            <TabsTrigger value="text">Texto</TabsTrigger>
          </TabsList>
          <TabsContent value="csv" className="space-y-4">
            <form action={handleCSVSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csv-file">Arquivo CSV</Label>
                <Input
                  id="csv-file"
                  name="file"
                  type="file"
                  accept=".csv"
                  disabled={isPending}
                />
                <p className="text-muted-foreground text-xs">
                  Formatos aceitos: extrato débito (C6/Itaú) ou fatura crédito (C6).
                </p>
              </div>
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  "Importar CSV"
                )}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="text" className="space-y-4">
            <form action={handleTextSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paste-text">Texto do extrato</Label>
                <Textarea
                  id="paste-text"
                  name="text"
                  rows={10}
                  placeholder="Cole aqui o texto copiado do app do banco..."
                  disabled={isPending}
                />
              </div>
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  "Importar Texto"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
