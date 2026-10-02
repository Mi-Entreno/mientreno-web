import { AccountDeletion } from "@/components/legal/account-deletion"
import { legalDocument } from "@/components/legal/documents"
import { LegalDocumentPage } from "@/components/legal/legal-document-page"

const DOCUMENT = legalDocument("eliminar-cuenta")

export const metadata = { title: DOCUMENT.title, description: DOCUMENT.description }

export default function AccountDeletionPage() {
  return (
    <LegalDocumentPage document={DOCUMENT}>
      <AccountDeletion />
    </LegalDocumentPage>
  )
}
