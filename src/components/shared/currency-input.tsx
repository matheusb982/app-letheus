"use client";

import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";

interface CurrencyInputProps {
  id?: string;
  name: string;
  defaultValue?: number;
  required?: boolean;
  disabled?: boolean;
}

function formatBRL(cents: number): string {
  const reais = cents / 100;
  return reais.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseCentsFromDisplay(display: string): number {
  const digits = display.replace(/\D/g, "");
  return parseInt(digits || "0", 10);
}

export function CurrencyInput({ id, name, defaultValue, required, disabled }: CurrencyInputProps) {
  const initialCents = defaultValue ? Math.round(defaultValue * 100) : 0;
  const [cents, setCents] = useState(initialCents);
  const hiddenRef = useRef<HTMLInputElement>(null);

  const displayValue = cents > 0 ? `R$ ${formatBRL(cents)}` : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const newCents = parseCentsFromDisplay(raw);
    setCents(newCents);
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    if (cents === 0) {
      e.target.value = "";
    }
  }

  return (
    <>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder="R$ 0,00"
        required={required}
        disabled={disabled}
      />
      <input
        ref={hiddenRef}
        type="hidden"
        name={name}
        value={cents > 0 ? (cents / 100).toFixed(2) : ""}
      />
    </>
  );
}
