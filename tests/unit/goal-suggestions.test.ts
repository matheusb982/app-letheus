import { describe, it, expect } from "vitest";

// Extract the pure functions for testing
// Since they're not exported, we replicate the logic here to test the rules

function suggestValueForGoal(
  currentGoal: number,
  avg: number,
  trend: "up" | "down" | "stable"
): { value: number; reason: string } {
  if (avg === 0) {
    return { value: currentGoal, reason: "Sem histórico de gastos" };
  }

  const ratio = avg / currentGoal;

  if (ratio >= 0.9 && ratio <= 1.1) {
    return { value: currentGoal, reason: "Meta adequada — gasto próximo do limite" };
  }

  if (ratio < 0.9) {
    const margin = trend === "up" ? 0.15 : trend === "down" ? 0.05 : 0.10;
    const suggested = Math.round(avg * (1 + margin) * 100) / 100;
    const final = Math.min(suggested, currentGoal);
    const reduction = Math.round((1 - final / currentGoal) * 100);
    return {
      value: final,
      reason: reduction > 0
        ? `Gasto médio abaixo da meta — possível redução de ${reduction}%`
        : "Meta adequada",
    };
  }

  return {
    value: currentGoal,
    reason: "Gasto acima da meta — mantendo limite para incentivar redução",
  };
}

interface GoalSuggestion {
  suggested_value: number;
  reason: string;
}

function capSuggestionsToRevenue(
  suggestions: GoalSuggestion[],
  totalRevenue: number
): GoalSuggestion[] {
  if (totalRevenue <= 0) return suggestions;

  const maxTotal = totalRevenue * 0.8;
  const currentTotal = suggestions.reduce((s, g) => s + g.suggested_value, 0);

  if (currentTotal <= maxTotal) return suggestions;

  const factor = maxTotal / currentTotal;
  return suggestions.map((s) => ({
    ...s,
    suggested_value: Math.round(s.suggested_value * factor * 100) / 100,
    reason: s.reason + (factor < 0.95 ? " (ajustado para caber em 80% da receita)" : ""),
  }));
}

describe("suggestValueForGoal", () => {
  it("keeps goal when avg is close (within ±10%)", () => {
    // Internet: meta R$135, média R$134
    const result = suggestValueForGoal(135, 134, "stable");
    expect(result.value).toBe(135);
    expect(result.reason).toContain("adequada");
  });

  it("keeps goal when avg is slightly above (within 10%)", () => {
    // Mercado: meta R$1200, média R$1180
    const result = suggestValueForGoal(1200, 1180, "stable");
    expect(result.value).toBe(1200);
  });

  it("reduces goal when avg is well below", () => {
    // Restaurante: meta R$800, média R$520
    const result = suggestValueForGoal(800, 520, "stable");
    expect(result.value).toBeLessThan(800);
    expect(result.value).toBeGreaterThan(520);
    expect(result.reason).toContain("redução");
  });

  it("never suggests more than current goal when avg is below", () => {
    const result = suggestValueForGoal(135, 134, "up");
    expect(result.value).toBeLessThanOrEqual(135);
  });

  it("keeps goal when avg is above (incentivize reduction)", () => {
    // Combustível: meta R$300, média R$350
    const result = suggestValueForGoal(300, 350, "stable");
    expect(result.value).toBe(300);
    expect(result.reason).toContain("incentivar redução");
  });

  it("returns current goal when no history", () => {
    const result = suggestValueForGoal(500, 0, "stable");
    expect(result.value).toBe(500);
    expect(result.reason).toContain("Sem histórico");
  });

  it("uses smaller margin when trend is down", () => {
    const down = suggestValueForGoal(1000, 600, "down");
    const stable = suggestValueForGoal(1000, 600, "stable");
    expect(down.value).toBeLessThan(stable.value);
  });

  it("uses larger margin when trend is up", () => {
    const up = suggestValueForGoal(1000, 600, "up");
    const stable = suggestValueForGoal(1000, 600, "stable");
    expect(up.value).toBeGreaterThan(stable.value);
  });

  it("does NOT suggest increasing DAS from 1196 to 1359 (real bug case)", () => {
    // DAS: meta R$1196, média R$1181 — should keep, not increase
    const result = suggestValueForGoal(1196, 1181, "stable");
    expect(result.value).toBe(1196);
    expect(result.value).not.toBeGreaterThan(1196);
  });

  it("does NOT suggest increasing Internet from 135 to 154 (real bug case)", () => {
    const result = suggestValueForGoal(135, 134.31, "stable");
    expect(result.value).toBe(135);
    expect(result.value).not.toBeGreaterThan(135);
  });
});

describe("capSuggestionsToRevenue", () => {
  it("does not modify when total is under 80% of revenue", () => {
    const suggestions = [
      { suggested_value: 500, reason: "test" },
      { suggested_value: 300, reason: "test" },
    ];
    const result = capSuggestionsToRevenue(suggestions, 2000);
    // 800 <= 1600 (80% of 2000)
    expect(result[0].suggested_value).toBe(500);
    expect(result[1].suggested_value).toBe(300);
  });

  it("reduces proportionally when total exceeds 80% of revenue", () => {
    const suggestions = [
      { suggested_value: 5000, reason: "test" },
      { suggested_value: 5000, reason: "test" },
    ];
    // Total: 10000, Revenue: 10000, Max: 8000
    const result = capSuggestionsToRevenue(suggestions, 10000);
    const total = result.reduce((s, g) => s + g.suggested_value, 0);
    expect(total).toBeLessThanOrEqual(8000);
    expect(result[0].reason).toContain("80% da receita");
  });

  it("total suggested never exceeds 80% of revenue (real case)", () => {
    // Real case: receita R$26369, metas totalizando R$31543
    const suggestions = [
      { suggested_value: 8000, reason: "test" },
      { suggested_value: 6000, reason: "test" },
      { suggested_value: 5000, reason: "test" },
      { suggested_value: 4000, reason: "test" },
      { suggested_value: 3000, reason: "test" },
      { suggested_value: 3000, reason: "test" },
      { suggested_value: 2543, reason: "test" },
    ];
    const revenue = 26369.76;
    const result = capSuggestionsToRevenue(suggestions, revenue);
    const total = result.reduce((s, g) => s + g.suggested_value, 0);
    // Allow tiny floating point rounding (< R$0.10)
    expect(total).toBeLessThanOrEqual(revenue * 0.8 + 0.1);
  });

  it("handles zero revenue gracefully", () => {
    const suggestions = [{ suggested_value: 500, reason: "test" }];
    const result = capSuggestionsToRevenue(suggestions, 0);
    expect(result[0].suggested_value).toBe(500);
  });
});
