import { Dumbbell, Gift, Trophy } from "lucide-react"

/**
 * El ciclo completo del producto, en tres pasos.
 *
 * <p>Está numerado porque es una secuencia real: sin entrenar no hay
 * repes, y sin repes no hay canje. El número dice algo verdadero
 * sobre el contenido, no lo decora.</p>
 */
const STEPS = [
  {
    icon: Dumbbell,
    title: "Entrená",
    copy: "Con el plan de tu entrenador o con el tuyo propio. Cada entrenamiento que cuenta suma puntos.",
  },
  {
    icon: Trophy,
    title: "Sumá repes",
    copy: "Los puntos se convierten solos en repes, la moneda de la app. La constancia semanal suma un extra.",
  },
  {
    icon: Gift,
    title: "Canjeá",
    copy: "Elegí un producto del catálogo y retiralo en el comercio. Las repes se descuentan al confirmar.",
  },
]

export function HowItWorks() {
  return (
    <section className="border-t border-border bg-muted/40 px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-heading text-headline font-semibold tracking-tight uppercase text-balance">
          Cómo funciona
        </h2>
        <p className="mt-2.5 max-w-xl text-body-lg text-muted-foreground text-pretty">
          Entrenar deja de ser sólo un hábito y pasa a tener premio.
        </p>

        <ol className="mt-9 grid gap-5 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, copy }, index) => (
            <li key={title} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary-text">
                  <Icon className="size-5" />
                </span>
                <span className="font-mono text-caption tabular-nums text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 font-heading text-subtitle font-semibold tracking-tight uppercase">
                {title}
              </h3>
              <p className="mt-2 text-body text-muted-foreground text-pretty">{copy}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
