import { describe, expect, it } from "vitest"

import type { BrandChallenge, ChallengeRequirement, Redemption } from "./challenge.model"
import {
  describeMode,
  describeRequirement,
  familiesOf,
  isLive,
  isPendingDelivery,
  METRIC_OPTIONS,
  metricOption,
  notLiveReason,
} from "./challenge.model"

const NOW = new Date("2026-09-15T12:00:00Z")

function requirement(overrides: Partial<ChallengeRequirement> = {}): ChallengeRequirement {
  return {
    id: 1,
    metric: "WORKOUTS_COMPLETED",
    label: "Entrenamientos completados",
    unit: "entrenamientos",
    metricFamily: "FREQUENCY",
    targetValue: 5,
    goalKey: "WORKOUTS_COMPLETED:5",
    ...overrides,
  }
}

function challenge(overrides: Partial<BrandChallenge> = {}): BrandChallenge {
  return {
    id: 1,
    name: "Constancia de acero",
    description: null,
    imageUrl: null,
    terms: null,
    status: "PUBLISHED",
    requirementMode: "ALL",
    requiredCount: null,
    startsAt: "2026-09-01T00:00:00Z",
    endsAt: "2026-09-30T23:59:59Z",
    reward: {
      name: "Café gratis",
      description: null,
      imageUrl: null,
      terms: null,
      expiresAt: "2026-10-30T23:59:59Z",
      stock: 20,
    },
    requirements: [requirement()],
    goalSignature: "ALL|WORKOUTS_COMPLETED:5",
    acceptedCount: 3,
    completedCount: 1,
    redeemedCount: 0,
    stockLeft: 17,
    editable: false,
    ...overrides,
  }
}

describe("isLive / notLiveReason", () => {
  it("publicado, dentro de fechas y con unidades: lo están viendo", () => {
    expect(isLive(challenge(), NOW)).toBe(true)
    expect(notLiveReason(challenge(), NOW)).toBeNull()
  })

  it("en borrador todavía no lo ve nadie", () => {
    expect(isLive(challenge({ status: "DRAFT" }), NOW)).toBe(false)
    expect(notLiveReason(challenge({ status: "DRAFT" }), NOW)).toBe("Todavía no lo publicaste")
  })

  it("pausado sale del catálogo, y el motivo lo dice", () => {
    expect(notLiveReason(challenge({ status: "PAUSED" }), NOW)).toBe("Pausado por vos")
  })

  it("sin unidades no se puede aceptar, aunque esté publicado", () => {
    expect(isLive(challenge({ stockLeft: 0 }), NOW)).toBe(false)
    expect(notLiveReason(challenge({ stockLeft: 0 }), NOW)).toBe("Sin unidades disponibles")
  })

  it("antes de empezar y después de vencer tampoco", () => {
    expect(notLiveReason(challenge({ startsAt: "2026-10-01T00:00:00Z" }), NOW)).toBe("Todavía no empieza")
    expect(notLiveReason(challenge({ endsAt: "2026-09-10T00:00:00Z" }), NOW)).toBe("Terminó su vigencia")
  })
})

describe("describeRequirement", () => {
  it("dice cuánto y de qué, con separador de miles", () => {
    expect(describeRequirement(requirement())).toBe("5 entrenamientos")
    expect(
      describeRequirement(requirement({ metric: "VOLUME_KG", unit: "kg", targetValue: 5000 })),
    ).toBe("5.000 kg")
  })
})

describe("describeMode", () => {
  it("con una sola condición no habla de modos", () => {
    expect(describeMode(challenge())).toBe("Una condición")
  })

  it("N de M dice cuántas de cuántas", () => {
    const dos = challenge({
      requirementMode: "N_OF_M",
      requiredCount: 1,
      requirements: [requirement(), requirement({ id: 2, metric: "SETS_COMPLETED", metricFamily: "SETS" })],
    })
    expect(describeMode(dos)).toBe("1 de 2 condiciones")
  })
})

describe("familiesOf", () => {
  it("dos condiciones de familias distintas ocupan las dos", () => {
    const mixto = challenge({
      requirements: [
        requirement(),
        requirement({ id: 2, metric: "SETS_COMPLETED", metricFamily: "SETS" }),
      ],
    })
    expect(familiesOf(mixto)).toEqual(["FREQUENCY", "SETS"])
  })

  it("no repite: es la unidad con la que el alumno queda bloqueado", () => {
    const repetido = challenge({
      requirements: [
        requirement(),
        requirement({ id: 2, metric: "CURRENT_STREAK_DAYS", metricFamily: "FREQUENCY" }),
      ],
    })
    expect(familiesOf(repetido)).toEqual(["FREQUENCY"])
  })
})

describe("METRIC_OPTIONS", () => {
  it("cubre las nueve métricas del backend, sin repetir", () => {
    expect(METRIC_OPTIONS).toHaveLength(9)
    expect(new Set(METRIC_OPTIONS.map((option) => option.value)).size).toBe(9)
  })

  it("cada métrica sabe a qué familia pertenece", () => {
    for (const option of METRIC_OPTIONS) {
      expect(metricOption(option.value)?.family).toBe(option.family)
    }
  })

  it("las cuatro formas de contar constancia comparten familia", () => {
    const frecuencia = METRIC_OPTIONS.filter((option) => option.family === "FREQUENCY")
    expect(frecuencia.map((option) => option.value)).toEqual([
      "WORKOUTS_COMPLETED",
      "CURRENT_STREAK_DAYS",
      "BEST_STREAK_DAYS",
      "ACTIVE_WEEKS",
    ])
  })
})

describe("isPendingDelivery", () => {
  function redemption(overrides: Partial<Redemption> = {}): Redemption {
    return {
      id: 1,
      challengeId: 1,
      challengeName: "Constancia de acero",
      rewardName: "Café gratis",
      rewardImageUrl: null,
      status: "REDEEMED",
      redeemedAt: "2026-09-14T10:00:00Z",
      deliveredAt: null,
      redemptionCode: "K7M2P4QX",
      rewardExpiresAt: "2026-10-30T23:59:59Z",
      ...overrides,
    }
  }

  it("canjeado y sin entregar es trabajo para el mostrador", () => {
    expect(isPendingDelivery(redemption())).toBe(true)
  })

  it("una vez entregado sale de la cola", () => {
    expect(isPendingDelivery(redemption({ deliveredAt: "2026-09-15T11:00:00Z" }))).toBe(false)
  })
})
