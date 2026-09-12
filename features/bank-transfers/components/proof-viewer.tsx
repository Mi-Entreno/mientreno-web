"use client"

import { AlertTriangle, ExternalLink, Loader2 } from "lucide-react"
import { useState } from "react"

import { proofUrl } from "../model/bank-transfer.model"

/**
 * The receipt itself.
 *
 * `src` points at our own authenticated route, never at the storage URL — the
 * backend does not publish one. A trainer reading a transfer receipt needs to
 * check an amount and a date on a phone photo, so the image is shown as large
 * as the dialog allows and opens full size in a new tab.
 */
export function ProofViewer({ paymentId, fileName }: { paymentId: number; fileName: string | null }) {
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading")
  const src = proofUrl(paymentId)

  return (
    <div className="flex flex-col gap-2">
      <div className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary/40">
        {state === "loading" && (
          <Loader2 className="absolute size-6 animate-spin text-muted-foreground" />
        )}

        {state === "failed" ? (
          <p className="flex items-center gap-2 p-6 text-body text-muted-foreground text-pretty">
            <AlertTriangle className="size-4 shrink-0" />
            No pudimos mostrar el comprobante. Probá abrirlo en una pestaña nueva.
          </p>
        ) : (
          // The proxy streams whatever the student uploaded: next/image would
          // need a loader and known dimensions for a one-off private image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={fileName ? `Comprobante ${fileName}` : "Comprobante de transferencia"}
            className="max-h-[60vh] w-full object-contain"
            onLoad={() => setState("ready")}
            onError={() => setState("failed")}
          />
        )}
      </div>

      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        className="flex w-fit items-center gap-1.5 text-body text-muted-foreground underline-offset-4 hover:underline"
      >
        <ExternalLink className="size-3.5" />
        Abrir en tamaño completo
      </a>
    </div>
  )
}
