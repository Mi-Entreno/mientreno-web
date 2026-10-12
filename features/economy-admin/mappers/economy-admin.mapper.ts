import type { AdminWalletStudentDTO, LedgerEntryDTO } from "../dto/economy-admin.dto"
import type { AdminWalletStudent, LedgerEntry } from "../model/economy-admin.model"

export function toAdminWalletStudent(dto: AdminWalletStudentDTO): AdminWalletStudent {
  const fullName = [dto.firstName, dto.lastName].filter(Boolean).join(" ").trim()
  return {
    studentId: dto.studentId,
    email: dto.email,
    fullName: fullName || dto.email,
    balance: dto.balance,
    lifetimeEarned: dto.lifetimeEarned,
    lifetimeSpent: dto.lifetimeSpent,
  }
}

export function toLedgerEntry(dto: LedgerEntryDTO): LedgerEntry {
  return {
    id: dto.id,
    type: dto.type,
    reps: dto.reps,
    balanceAfter: dto.balanceAfter,
    reason: dto.reason,
    createdAt: dto.createdAt,
  }
}
