"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { specificMessage } from "@/core/http/user-message"
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
      toast.error(specificMessage(error) ?? "No pudimos eliminar tu cuenta. Volvé a intentarlo.")
    },
  })
}
