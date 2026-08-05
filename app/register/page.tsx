import { RegisterForm } from "@/features/auth/components/register-form"

export default function RegisterPage() {
  return (
    <main className="flex min-h-svh flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <RegisterForm />
      </div>
    </main>
  )
}
