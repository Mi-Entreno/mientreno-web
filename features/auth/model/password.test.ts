import { describe, expect, it } from "vitest"

import { otpSchema, passwordSchema, phoneSchema, registerSchema } from "./password"

/**
 * Rules mirrored from `AuthRegisterRequestDTO`:
 *   @Size(min = 8) and @Pattern("^(?=.*[A-Z])(?=.*\\d).+$")
 */
describe("passwordSchema", () => {
  it("accepts a password meeting every backend rule", () => {
    expect(passwordSchema.safeParse("Secret123").success).toBe(true)
  })

  it("rejects passwords under 8 characters", () => {
    const result = passwordSchema.safeParse("Ab1")
    expect(result.success).toBe(false)
  })

  it("rejects passwords without an uppercase letter", () => {
    const result = passwordSchema.safeParse("secret123")
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/mayúscula/)
    }
  })

  it("rejects passwords without a digit", () => {
    const result = passwordSchema.safeParse("SecretPassword")
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/número/)
    }
  })

  it("agrees with the backend regex on the same inputs", () => {
    const backend = /^(?=.*[A-Z])(?=.*\d).+$/
    const samples = ["Secret123", "secret123", "SECRET123", "Secretpass", "Aa1aaaaa", "        "]

    for (const sample of samples) {
      const backendAccepts = sample.length >= 8 && backend.test(sample)
      expect(passwordSchema.safeParse(sample).success).toBe(backendAccepts)
    }
  })
})

describe("phoneSchema", () => {
  // `^\+?[0-9]{7,15}$`, and optional — the record has no @NotBlank.
  it("accepts a blank value", () => {
    expect(phoneSchema.safeParse("").success).toBe(true)
    expect(phoneSchema.safeParse("   ").success).toBe(true)
  })

  it("accepts 7 to 15 digits with an optional plus", () => {
    expect(phoneSchema.safeParse("+34600111222").success).toBe(true)
    expect(phoneSchema.safeParse("600111222").success).toBe(true)
  })

  it("rejects too short, too long and non-numeric values", () => {
    expect(phoneSchema.safeParse("12345").success).toBe(false)
    expect(phoneSchema.safeParse("1234567890123456").success).toBe(false)
    expect(phoneSchema.safeParse("600-111-222").success).toBe(false)
  })
})

describe("otpSchema", () => {
  // `generateRandomCode` formats "%06d", and VerifyCodeDTO is @Size(6, 6).
  it("accepts exactly 6 digits, including leading zeros", () => {
    expect(otpSchema.safeParse("000123").success).toBe(true)
  })

  it("rejects the wrong length or non-digits", () => {
    expect(otpSchema.safeParse("12345").success).toBe(false)
    expect(otpSchema.safeParse("1234567").success).toBe(false)
    expect(otpSchema.safeParse("12345a").success).toBe(false)
  })
})

describe("registerSchema", () => {
  const valid = {
    email: "trainer@gym.com",
    password: "Secret123",
    confirmPassword: "Secret123",
    phone: "",
  }

  it("accepts a complete form without a phone", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it("rejects mismatched passwords and points at the confirm field", () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: "Secret124" })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["confirmPassword"])
    }
  })

  it("rejects an invalid email", () => {
    expect(registerSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false)
  })
})
