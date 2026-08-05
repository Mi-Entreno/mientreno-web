/** Literal mirrors of the `auth/dto` records. Do not edit without the Java. */

/**
 * `AuthRegisterRequestDTO`.
 *  - `email`: `@NotBlank @Email`
 *  - `password`: `@NotBlank @Size(min = 8)` and
 *    `@Pattern("^(?=.*[A-Z])(?=.*\\d).+$")` — at least one uppercase and one digit
 *  - `phone`: `@Pattern("^\\+?[0-9]{7,15}$")`, no `@NotBlank`, so null is valid
 */
export interface AuthRegisterRequestDTO {
  email: string
  password: string
  phone: string | null
}

/** `VerifyOtpRequestDTO` — the code is the 6-digit value from the email. */
export interface VerifyOtpRequestDTO {
  email: string
  code: string
}

export interface ResendOtpRequestDTO {
  email: string
}

/**
 * `PasswordResetRequestDTO`. The `method` field is kept upstream for
 * compatibility and constrained to the literal `"email"`; SMS was removed.
 */
export interface PasswordResetRequestDTO {
  email: string
  method: "email"
}

/** `VerifyCodeDTO` — `code` is `@Size(min = 6, max = 6)`. */
export interface VerifyCodeDTO {
  email: string
  code: string
}

/**
 * `ResetPasswordDTO`.
 *
 * Note the asymmetry: `newPassword` carries only `@Size(min = 8)` here, while
 * registration additionally requires an uppercase letter and a digit. The
 * frontend applies the stricter registration rules to both so a reset cannot
 * quietly weaken a password below what signup demands.
 */
export interface ResetPasswordDTO {
  email: string
  code: string
  newPassword: string
}

/** Most auth endpoints answer `Map.of("message", ...)`. */
export interface MessageResponse {
  message: string
}

/** Response of our own `/api/auth/register` handler. */
export interface RegisterResult {
  email: string
  verificationCodeSent: boolean
}

/** Backend constants, mirrored so the UI can explain itself accurately. */
export const OTP_LENGTH = 6
/** `email-verification.expiration-minutes`, default 10. */
export const OTP_EXPIRY_MINUTES = 10
/** `email-verification.resend-cooldown-seconds`, default 60. */
export const OTP_RESEND_COOLDOWN_SECONDS = 60
