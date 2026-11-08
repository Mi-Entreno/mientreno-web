import { Mail } from "lucide-react"
import Link from "next/link"

import { SUPPORT_EMAIL } from "@/components/legal/documents"
import { PublicHeader } from "@/components/marketing/public-header"
import { SiteFooter } from "@/components/marketing/site-footer"

export const metadata = {
  title: "Soporte — Mi Entreno",
  description: "Cómo contactarnos y respuestas a las preguntas frecuentes sobre la app Mi Entreno.",
}

/**
 * Public support page.
 *
 * App Store Connect requires a support URL that works without a session, and
 * it is the page a reviewer opens first. Public on purpose: `/soporte` is not in
 * the `proxy.ts` matcher.
 *
 * The answers describe the student app (`../fitness_app`): menu names, the
 * store-billed Premium and the reps rules have to match what the app shows. If a
 * screen gets renamed there, it gets renamed here.
 */
export default function SupportPage() {
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Consulta sobre Mi Entreno")}`

  return (
    <div className="flex min-h-svh flex-col">
      <PublicHeader link={{ href: "/documentos", label: "Documentos" }} />

      <main className="flex-1">
        <div className="mx-auto flex max-w-prose flex-col gap-8 px-5 py-12 sm:px-8 lg:py-16">
          <div>
            <h1 className="font-heading text-headline font-semibold tracking-tight uppercase text-balance">
              Soporte
            </h1>
            <p className="mt-2 text-body-lg text-muted-foreground text-pretty">
              ¿Tenés un problema con la app o una duda? Escribinos y te respondemos por correo.
            </p>
          </div>

          <a
            href={mailto}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/50"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-text">
              <Mail className="size-5.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-body font-semibold">{SUPPORT_EMAIL}</span>
              <span className="block text-body text-muted-foreground text-pretty">
                Contanos qué pasó y desde qué teléfono. Si es sobre tu cuenta, escribinos desde el
                email con el que entrás.
              </span>
            </span>
          </a>

          <FaqGroup title="Cuenta y acceso">
            <Faq question="¿Cómo creo una cuenta?">
              Con &quot;Continuar con Google&quot; o, en iPhone, &quot;Continuar con Apple&quot;. La
              cuenta se crea la primera vez que entrás. Entrar con email y contraseña es sólo para
              cuentas que ya existen.
            </Faq>
            <Faq question="Olvidé mi contraseña">
              En la pantalla de ingreso tocá &quot;Olvidé mi contraseña&quot;. Te mandamos un código de
              6 dígitos al email; si no llega en unos minutos, revisá la carpeta de spam.
            </Faq>
            <Faq question="Ya tengo cuenta y al entrar con Google o Apple me dice que el email existe">
              Entrá con tu contraseña y vinculá Google o Apple desde Perfil → Privacidad y seguridad →
              Métodos de acceso. Desde ahí también podés desvincularlos.
            </Faq>
          </FaqGroup>

          <FaqGroup title="Mi plan (Premium)">
            <Faq question="¿Cómo me suscribo?">
              Desde Perfil → Mi plan. El pago lo cobra la tienda de tu teléfono (App Store o Google
              Play), con la cuenta que tengas ahí.
            </Faq>
            <Faq question="¿Cómo cancelo?">
              Desde Mi plan → Gestionar suscripción, o en los ajustes de suscripciones de tu teléfono.
              Seguís teniendo Premium hasta el final del período pagado. Eliminar tu cuenta no cancela
              la suscripción: cancelala primero en la tienda.
            </Faq>
            <Faq question="Cambié de teléfono y no veo mi suscripción">
              Entrá con tu misma cuenta y tocá Mi plan → Restaurar compras.
            </Faq>
            <Faq question="Quiero un reembolso">
              Los reembolsos los resuelve la tienda donde pagaste: Apple desde reportaproblem.apple.com
              y Google desde Google Play → Pagos y suscripciones.
            </Faq>
          </FaqGroup>

          <FaqGroup title="Entrenadores">
            <Faq question="¿Cómo funciona el pago a un entrenador?">
              Cada entrenador fija el precio de su servicio y lo cobra por Mercado Pago o transferencia.
              Tu plan lo arma el entrenador: para cambios en tu rutina o tu alimentación, hablá con él.
              Si tuviste un problema con un pago, escribinos.
            </Faq>
          </FaqGroup>

          <FaqGroup title="Repes, ruleta y desafíos">
            <Faq question="¿Cómo consigo repes?">
              Entrenando, registrando tus comidas y en la ruleta. Las repes no se compran y no tienen
              valor en dinero: sirven para desbloquear desafíos.
            </Faq>
            <Faq question="¿Quién entrega los premios?">
              Cada comercio adherido pone y entrega su premio. Al completar un desafío recibís un código
              para retirarlo en el lugar indicado, dentro del plazo del desafío. Las reglas completas
              están en la app, en Desafíos → Ver reglas. Apple y Google no son patrocinadores ni
              participan de ninguna forma en los desafíos, la ruleta ni sus premios.
            </Faq>
          </FaqGroup>

          <FaqGroup title="Apple Watch">
            <Faq question="El reloj no muestra mi entrenamiento">
              El reloj acompaña al entrenamiento guiado del iPhone: abrilo en el teléfono (puede quedar
              bloqueado) y el reloj muestra la serie o el descanso en curso. Revisá que el reloj esté
              conectado al iPhone y que la app Mi Entreno esté instalada en él.
            </Faq>
          </FaqGroup>

          <FaqGroup title="Privacidad">
            <Faq question="¿Cómo elimino mi cuenta?">
              Desde la app, en Perfil → Privacidad y seguridad → Eliminar cuenta. También podés pedirlo
              sin la app:{" "}
              <InlineLink href="/documentos/eliminar-cuenta">cómo eliminar tu cuenta</InlineLink>.
            </Faq>
            <Faq question="¿Qué datos guardan?">
              Lo explica la <InlineLink href="/documentos/privacidad">política de privacidad</InlineLink>.
            </Faq>
          </FaqGroup>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

function FaqGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-subtitle font-semibold tracking-tight">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

function Faq({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <article className="flex flex-col gap-1">
      <h3 className="text-body font-semibold text-pretty">{question}</h3>
      <p className="text-body text-muted-foreground text-pretty">{children}</p>
    </article>
  )
}

function InlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium text-foreground underline underline-offset-4">
      {children}
    </Link>
  )
}
