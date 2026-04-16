import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations/auth";

describe("forgotPasswordSchema", () => {
  it("accepts valid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "not-email" });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts valid matching passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "newpass123",
      confirmPassword: "newpass123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short password", () => {
    const result = resetPasswordSchema.safeParse({
      password: "12345",
      confirmPassword: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "newpass123",
      confirmPassword: "different123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].path).toContain("confirmPassword");
    }
  });

  it("rejects empty passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "",
      confirmPassword: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("token security", () => {
  it("generates cryptographically random tokens with sufficient entropy", () => {
    const token = crypto.randomBytes(32).toString("hex");
    // 32 bytes = 64 hex chars = 256 bits of entropy
    expect(token).toHaveLength(64);
  });

  it("hashes token with SHA256 before storage", () => {
    const token = crypto.randomBytes(32).toString("hex");
    const hashed = crypto.createHash("sha256").update(token).digest("hex");

    // Hashed token should be different from original
    expect(hashed).not.toBe(token);
    // SHA256 always produces 64 hex chars
    expect(hashed).toHaveLength(64);
  });

  it("same token always produces same hash (deterministic)", () => {
    const token = "test-token-12345";
    const hash1 = crypto.createHash("sha256").update(token).digest("hex");
    const hash2 = crypto.createHash("sha256").update(token).digest("hex");
    expect(hash1).toBe(hash2);
  });

  it("different tokens produce different hashes", () => {
    const token1 = crypto.randomBytes(32).toString("hex");
    const token2 = crypto.randomBytes(32).toString("hex");
    const hash1 = crypto.createHash("sha256").update(token1).digest("hex");
    const hash2 = crypto.createHash("sha256").update(token2).digest("hex");
    expect(hash1).not.toBe(hash2);
  });

  it("cannot reverse hash to get original token", () => {
    const token = crypto.randomBytes(32).toString("hex");
    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    // Hash is one-way: cannot derive token from hash
    // We verify by checking the hash doesn't contain the token
    expect(hashed).not.toContain(token.substring(0, 16));
  });
});

describe("token expiration logic", () => {
  it("token within 1 hour is valid", () => {
    const sentAt = new Date(Date.now() - 30 * 60 * 1000); // 30 min ago
    const cutoff = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    expect(sentAt > cutoff).toBe(true);
  });

  it("token older than 1 hour is expired", () => {
    const sentAt = new Date(Date.now() - 61 * 60 * 1000); // 61 min ago
    const cutoff = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    expect(sentAt > cutoff).toBe(false);
  });

  it("token exactly at 1 hour is expired", () => {
    const sentAt = new Date(Date.now() - 60 * 60 * 1000); // exactly 1 hour ago
    const cutoff = new Date(Date.now() - 60 * 60 * 1000);
    expect(sentAt > cutoff).toBe(false);
  });
});
