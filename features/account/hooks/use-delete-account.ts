"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { ApiError } from "@/core/http/errors"
import { accountRepository } from "../api/account.repository"

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: () => accountRepository.remove(),
    onSuccess: () => {
      // Every cached response belongs to an account that no longer exists.
      queryClient.clear()
      toast.success("Tu cuenta ha sido eliminada")
      router.replace("/login")
      router.refresh()
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "No se ha podido eliminar la cuenta")
    },
  })
}
