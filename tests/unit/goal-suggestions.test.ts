import { describe, it, expect } from "vitest";

// Replicate pure functions from goal-suggestions.ts for unit testing

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
  subcategory_name: string;
  suggested_value: number;
  avg_3m: number;
  reason: string;
}

function isProtectedFromCap(suggestion: GoalSuggestion): boolean {
  if (suggestion.avg_3m === 0) return false;
  const ratio = suggestion.avg_3m / suggestion.suggested_value;
  if (ratio >= 0.85 && ratio <= 1.15) return true;
  if (suggestion.avg_3m > suggestion.suggested_value) return true;
  return false;
}

function capSuggestionsToRevenue(
  suggestions: GoalSuggestion[],
  totalRevenue: number
): GoalSuggestion[] {
  if (totalRevenue <= 0) return suggestions;

  const maxTotal = totalRevenue * 0.8;
  const currentTotal = suggestions.reduce((s, g) => s + g.suggested_value, 0);

  if (currentTotal <= maxTotal) return suggestions;

  const fixed = suggestions.filter((s) => isProtectedFromCap(s));
  const variable = suggestions.filter((s) => !isProtectedFromCap(s));

  const fixedTotal = fixed.reduce((s, g) => s + g.suggested_value, 0);
  const variableTotal = variable.reduce((s, g) => s + g.suggested_value, 0);

  const variableBudget = maxTotal - fixedTotal;

  if (variableBudget <= 0) return suggestions;

  const factor = variableBudget / variableTotal;

  return suggestions.map((s) => {
    if (isProtectedFromCap(s)) return s;
    return {
      ...s,
      suggested_value: Math.round(s.suggested_value * factor * 100) / 100,
      reason: s.reason + (factor < 0.95 ? " (ajustado para caber em 80% da receita)" : ""),
    };
  });
}

describe("suggestValueForGoal", () => {
  it("keeps goal when avg is close (within ±10%)", () => {
    const result = suggestValueForGoal(135, 134, "stable");
    expect(result.value).toBe(135);
    expect(result.reason).toContain("adequada");
  });

  it("keeps goal when avg is slightly above (within 10%)", () => {
    const result = suggestValueForGoal(1200, 1180, "stable");
    expect(result.value).toBe(1200);
  });

  it("reduces goal when avg is well below", () => {
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
    const result = suggestValueForGoal(1196, 1181, "stable");
    expect(result.value).toBe(1196);
  });

  it("does NOT suggest increasing Internet from 135 to 154 (real bug case)", () => {
    const result = suggestValueForGoal(135, 134.31, "stable");
    expect(result.value).toBe(135);
  });
});

describe("isProtectedFromCap", () => {
  it("protects Internet (fixed: avg ~= suggested)", () => {
    expect(isProtectedFromCap({ subcategory_name: "Internet", suggested_value: 135, avg_3m: 134, reason: "" })).toBe(true);
  });

  it("protects DAS (fixed: avg ~= suggested)", () => {
    expect(isProtectedFromCap({ subcategory_name: "DAS", suggested_value: 1196, avg_3m: 1181, reason: "" })).toBe(true);
  });

  it("protects over-budget goals (avg > suggested)", () => {
    // Refeição: avg R$766, meta R$600 — user is over budget, goal should stay
    expect(isProtectedFromCap({ subcategory_name: "Refeição", suggested_value: 600, avg_3m: 766, reason: "" })).toBe(true);
  });

  it("protects Casa/Mesa/Banho when over budget", () => {
    expect(isProtectedFromCap({ subcategory_name: "Casa, mesa e banho", suggested_value: 255, avg_3m: 425, reason: "" })).toBe(true);
  });

  it("does NOT protect Restaurante when avg is well below suggested", () => {
    expect(isProtectedFromCap({ subcategory_name: "Restaurante", suggested_value: 800, avg_3m: 520, reason: "" })).toBe(false);
  });

  it("does NOT protect zero avg", () => {
    expect(isProtectedFromCap({ subcategory_name: "Novo", suggested_value: 500, avg_3m: 0, reason: "" })).toBe(false);
  });
});

describe("capSuggestionsToRevenue", () => {
  it("does not modify when total is under 80% of revenue", () => {
    const suggestions: GoalSuggestion[] = [
      { subcategory_name: "A", suggested_value: 500, avg_3m: 300, reason: "test" },
      { subcategory_name: "B", suggested_value: 300, avg_3m: 200, reason: "test" },
    ];
    const result = capSuggestionsToRevenue(suggestions, 2000);
    expect(result[0].suggested_value).toBe(500);
    expect(result[1].suggested_value).toBe(300);
  });

  it("preserves fixed expenses and only reduces variable ones", () => {
    const suggestions: GoalSuggestion[] = [
      // Fixed: avg close to suggested
      { subcategory_name: "Internet", suggested_value: 135, avg_3m: 134, reason: "test" },
      { subcategory_name: "Aluguel", suggested_value: 2000, avg_3m: 2000, reason: "test" },
      // Variable: avg far from suggested
      { subcategory_name: "Restaurante", suggested_value: 5000, avg_3m: 2000, reason: "test" },
      { subcategory_name: "Lazer", suggested_value: 5000, avg_3m: 2000, reason: "test" },
    ];
    // Total: 12135, Revenue: 10000, Max: 8000
    const result = capSuggestionsToRevenue(suggestions, 10000);

    // Fixed should be preserved
    expect(result[0].suggested_value).toBe(135);  // Internet unchanged
    expect(result[1].suggested_value).toBe(2000); // Aluguel unchanged

    // Variable should be reduced
    expect(result[2].suggested_value).toBeLessThan(5000);
    expect(result[3].suggested_value).toBeLessThan(5000);

    // Variable should be reduced equally
    expect(result[2].suggested_value).toBe(result[3].suggested_value);
  });

  it("does NOT reduce Internet when capping (real bug case)", () => {
    const suggestions: GoalSuggestion[] = [
      { subcategory_name: "Internet", suggested_value: 135, avg_3m: 134, reason: "test" },
      { subcategory_name: "DAS", suggested_value: 1196, avg_3m: 1181, reason: "test" },
      { subcategory_name: "Restaurante", suggested_value: 3000, avg_3m: 1500, reason: "test" },
      { subcategory_name: "Mercado", suggested_value: 4000, avg_3m: 2000, reason: "test" },
    ];
    // Force cap to kick in
    const result = capSuggestionsToRevenue(suggestions, 5000);

    // Fixed expenses must be preserved
    expect(result[0].suggested_value).toBe(135);   // Internet
    expect(result[1].suggested_value).toBe(1196);  // DAS
  });

  it("does NOT reduce over-budget goals like Refeição (real bug case)", () => {
    const suggestions: GoalSuggestion[] = [
      // Over-budget: avg > suggested — goal is to incentivize reduction
      { subcategory_name: "Refeição", suggested_value: 600, avg_3m: 766, reason: "test" },
      { subcategory_name: "Casa, mesa e banho", suggested_value: 255, avg_3m: 425, reason: "test" },
      // Variable: avg well below suggested — CAN be reduced
      { subcategory_name: "Roupas", suggested_value: 3000, avg_3m: 1000, reason: "test" },
      { subcategory_name: "Lazer", suggested_value: 3000, avg_3m: 1000, reason: "test" },
    ];
    const result = capSuggestionsToRevenue(suggestions, 5000);

    // Over-budget goals must be preserved
    expect(result[0].suggested_value).toBe(600);  // Refeição
    expect(result[1].suggested_value).toBe(255);  // Casa, mesa e banho

    // Variable should be reduced
    expect(result[2].suggested_value).toBeLessThan(3000);
    expect(result[3].suggested_value).toBeLessThan(3000);
  });

  it("handles zero revenue gracefully", () => {
    const suggestions: GoalSuggestion[] = [
      { subcategory_name: "A", suggested_value: 500, avg_3m: 400, reason: "test" },
    ];
    const result = capSuggestionsToRevenue(suggestions, 0);
    expect(result[0].suggested_value).toBe(500);
  });
});
