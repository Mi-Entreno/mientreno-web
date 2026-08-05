import { StudentsScreen } from "@/features/students/components/students-screen"

export default function StudentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-body text-muted-foreground">
        Gestiona las suscripciones, revisa los programas de entrenamiento y nutrición, y haz
        seguimiento del progreso de cada alumno.
      </p>
      <StudentsScreen />
    </div>
  )
}
