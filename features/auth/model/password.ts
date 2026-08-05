import { z } from "zod"

import { OTP_LENGTH } from "../dto/auth.dto"

/**
 * Password rules, mirrored from `AuthRegisterRequestDTO`:
 *
 *   @Size(min = 8)
 *   @Pattern("^(?=.*[A-Z])(?=.*\\d).+$")
 *
 * Applied to password *reset* too, even though `ResetPasswordDTO` only checks
 * the length. Accepting a weaker password on reset than on signup would let
 * anyone downgrade their own account below the policy, and the discrepancy
 * looks like an oversight upstream rather than an intent.
 */
export const PASSWORD_RULES = [
  { id: "length", label: "Al menos 8 caracteres", test: (v: string) => v.length >= 8 },
  { id: "uppercase", label: "Una letra mayúscula", test: (v: string) => /[A-Z]/.test(v) },
  { id: "digit", label: "Un número", test: (v: string) => /\d/.test(v) },
] as const

export const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
  .regex(/\d/, "La contraseña debe contener al menos un número")

export const emailSchema = z
  .string()
  .min(1, "El correo es obligatorio")
  .email("Introduce un correo válido")

/** `^\+?[0-9]{7,15}$` upstream, and optional — blank is allowed. */
export const phoneSchema = z
  .string()
  .refine((value) => value.trim() === "" || /^\+?[0-9]{7,15}$/.test(value.trim()), {
    message: "Introduce un teléfono válido (7 a 15 dígitos)",
  })

export const otpSchema = z
  .string()
  .length(OTP_LENGTH, `El código tiene ${OTP_LENGTH} dígitos`)
  .regex(/^\d+$/, "El código solo contiene números")

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    phone: phoneSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

export type RegisterFormValues = z.infer<typeof registerSchema>

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
