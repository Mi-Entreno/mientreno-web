import { AdherenceScreen } from "@/features/adherence/components/adherence-screen"

export default function AdherencePage() {
  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-prose text-body text-muted-foreground text-pretty">
        Qué alumnos vienen cumpliendo su plan y cuáles necesitan un mensaje.
      </p>
      <AdherenceScreen />
    </div>
  )
}
