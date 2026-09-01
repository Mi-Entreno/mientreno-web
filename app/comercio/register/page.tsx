import { RegisterForm } from "@/features/auth/components/register-form"
import { BRAND_AUDIENCE } from "@/features/auth/model/audience"

export default function BrandRegisterPage() {
  return <RegisterForm audience={BRAND_AUDIENCE} />
}
