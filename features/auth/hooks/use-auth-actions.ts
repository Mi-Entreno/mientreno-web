"use client"

import { useMutation } from "@tanstack/react-query"

import { authRepository, type RegisterInput } from "../api/auth.repository"

export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterInput) => authRepository.register(input),
  })
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) =>
      authRepository.verifyOtp(email, code),
  })
}

export function useResendOtp() {
  return useMutation({
    mutationFn: (email: string) => authRepository.resendOtp(email),
  })
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) => authRepository.requestPasswordReset(email),
  })
}

export function useVerifyResetCode() {
  return useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) =>
      authRepository.verifyResetCode(email, code),
  })
}

export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: ({
      email,
      code,
      newPassword,
    }: {
      email: string
      code: string
      newPassword: string
    }) => authRepository.confirmPasswordReset(email, code, newPassword),
  })
}
