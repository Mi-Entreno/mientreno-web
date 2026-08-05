import { TrainerNutritionScreen } from "@/features/nutrition-plans/components/trainer-nutrition-screen"

export default function NutritionPlansPage() {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-body text-muted-foreground text-pretty">
        El plan nutricional actual de cada alumno. Igual que los de entrenamiento, pertenecen a una
        suscripción y se editan desde la ficha del alumno.
      </p>
      <TrainerNutritionScreen />
    </div>
  )
}
