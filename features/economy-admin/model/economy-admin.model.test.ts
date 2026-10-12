import { describe, expect, it } from "vitest"

import {
  diffEconomy,
  expectedRepsPerSpin,
  monthsToAfford,
  newRule,
  parseWhole,
  prizeProbabilities,
  simulate,
  slugify,
  spinsPerMonth,
  validateEconomy,
  type EconomyConfig,
} from "./economy-admin.model"

/** The backend seed (`economy.json`), so the simulation is checked against the real defaults. */
const seed: EconomyConfig = {
  "version": 1,
  "challenges": {
    "maxPerMonth": 1
  },
  "earning": {
    "dailyCapReps": 60,
    "rules": [
      {
        "id": "entrenamiento",
        "type": "PER_WORKOUT",
        "enabled": true,
        "reps": 10,
        "monthlyCapReps": 160,
        "label": "Por entrenar",
        "params": null
      },
      {
        "id": "constancia-semanal",
        "type": "WEEKLY_WORKOUTS",
        "enabled": true,
        "reps": 20,
        "monthlyCapReps": 80,
        "label": "3 entrenamientos en la semana",
        "params": {
          "targetWorkouts": 3
        }
      },
      {
        "id": "volumen-semanal",
        "type": "WEEKLY_VOLUME",
        "enabled": true,
        "reps": 20,
        "monthlyCapReps": 80,
        "label": "10.000 kg en la semana",
        "params": {
          "targetKg": 10000
        }
      },
      {
        "id": "constancia-mensual",
        "type": "MONTHLY_WORKOUTS",
        "enabled": true,
        "reps": 75,
        "monthlyCapReps": 75,
        "label": "12 entrenamientos en el mes",
        "params": {
          "targetWorkouts": 12
        }
      },
      {
        "id": "registro-comida",
        "type": "NUTRITION_LOG",
        "enabled": true,
        "reps": 2,
        "monthlyCapReps": 40,
        "label": "Registraste tu comida",
        "params": null
      },
      {
        "id": "marca-personal",
        "type": "PERSONAL_RECORD",
        "enabled": true,
        "reps": 15,
        "monthlyCapReps": 30,
        "label": "Nueva marca personal",
        "params": null
      },
      {
        "id": "check-in",
        "type": "CHECK_IN",
        "enabled": true,
        "reps": 2,
        "monthlyCapReps": 20,
        "label": "Check-in del día",
        "params": null
      },
      {
        "id": "racha-7",
        "type": "STREAK_DAYS",
        "enabled": false,
        "reps": 40,
        "label": "7 días seguidos entrenando",
        "params": {
          "days": 7
        },
        "monthlyCapReps": null
      },
      {
        "id": "bienvenida",
        "type": "WELCOME_BONUS",
        "enabled": true,
        "reps": 50,
        "label": "Bienvenida",
        "params": null,
        "monthlyCapReps": null
      }
    ]
  },
  "wheel": {
    "monthlySpin": true,
    "spinEveryTrainingDays": 10,
    "dailySpin": false,
    "prizes": [
      {
        "id": "p0",
        "label": "Esta vez no",
        "reps": 0,
        "weight": 30,
        "enabled": true
      },
      {
        "id": "p2",
        "label": "2 repes",
        "reps": 2,
        "weight": 35,
        "enabled": true
      },
      {
        "id": "p5",
        "label": "5 repes",
        "reps": 5,
        "weight": 20,
        "enabled": true
      },
      {
        "id": "p10",
        "label": "10 repes",
        "reps": 10,
        "weight": 10,
        "enabled": true
      },
      {
        "id": "p20",
        "label": "20 repes",
        "reps": 20,
        "weight": 5,
        "enabled": true
      }
    ]
  },
  "analytics": {
    "occasionalMaxReps": 200,
    "activeMinReps": 450
  }
}

const clone = (): EconomyConfig => structuredClone(seed)

describe("wheel maths", () => {
  it("matches the backend: the seed wheel pays 3–4 reps per spin on average", () => {
    expect(expectedRepsPerSpin(seed.wheel.prizes)).toBeCloseTo(3.7, 5)
  })

  it("ignores disabled prizes and gives probabilities that add up to 1", () => {
    const prizes = [...seed.wheel.prizes, { id: "x", label: "1000", reps: 1000, weight: 1000, enabled: false }]
    const probabilities = prizeProbabilities(prizes)
    expect(Object.keys(probabilities)).not.toContain("x")
    expect(Object.values(probabilities).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10)
  })

  it("is zero with no weight", () => {
    expect(expectedRepsPerSpin([{ id: "a", label: "a", reps: 5, weight: 0, enabled: true }])).toBe(0)
  })

  it("counts monthly, per-training-days and daily spins", () => {
    const constant = simulate(seed)[1].profile
    expect(spinsPerMonth(seed.wheel, constant)).toBe(2)
    expect(spinsPerMonth({ ...seed.wheel, dailySpin: true }, constant)).toBe(2 + constant.checkInDays)
  })
})

describe("simulate", () => {
  it("puts the occasional and constant profiles inside the model's ranges with the seed", () => {
    const [occasional, constant] = simulate(seed)
    expect(occasional.status).toBe("within")
    expect(constant.status).toBe("within")
  })

  it("applies monthly caps: the very active profile never earns more than 160 from training", () => {
    const active = simulate(seed)[2]
    expect(active.lines.find((line) => line.label === "Por entrenar")?.reps).toBe(160)
  })

  it("leaves out disabled rules and the welcome bonus", () => {
    const labels = simulate(seed)[2].lines.map((line) => line.label)
    expect(labels).not.toContain("Bienvenida")
    expect(labels).not.toContain("7 días seguidos entrenando")
  })

  it("turning the daily spin on raises the very active profile into its range", () => {
    const config = clone()
    config.wheel.dailySpin = true
    expect(simulate(config)[2].status).toBe("within")
  })
})

describe("validateEconomy", () => {
  it("accepts the seed", () => {
    expect(validateEconomy(seed)).toEqual([])
  })

  it("rejects a monthly cap below what the rule pays once", () => {
    const config = clone()
    config.earning.rules[0].monthlyCapReps = 5
    expect(validateEconomy(config).join()).toContain("tope mensual")
  })

  it("rejects ids with ':' and duplicated ids", () => {
    const config = clone()
    config.earning.rules[0].id = "a:b"
    config.earning.rules[1].id = config.earning.rules[2].id
    const errors = validateEconomy(config).join(" ")
    expect(errors).toContain(":")
    expect(errors).toContain("Dos reglas")
  })

  it("rejects missing params and a wheel with no weight", () => {
    const config = clone()
    config.earning.rules.find((r) => r.type === "WEEKLY_VOLUME")!.params = {}
    config.wheel.prizes.forEach((p) => (p.weight = 0))
    const errors = validateEconomy(config).join(" ")
    expect(errors).toContain("kg")
    expect(errors).toContain("peso")
  })

  it("rejects inverted profile thresholds and a zero quota", () => {
    const config = clone()
    config.analytics = { occasionalMaxReps: 500, activeMinReps: 400 }
    config.challenges.maxPerMonth = 0
    expect(validateEconomy(config)).toHaveLength(2)
  })
})

describe("diffEconomy", () => {
  it("is empty for the same economy", () => {
    expect(diffEconomy(seed, clone())).toEqual([])
  })

  it("describes changed values, toggles, new and removed rules", () => {
    const after = clone()
    after.earning.rules[0].reps = 12
    after.earning.rules[1].enabled = false
    after.earning.rules.push(newRule("CHECK_IN", after.earning.rules.map((r) => r.id)))
    after.earning.rules = after.earning.rules.filter((r) => r.id !== "racha-7")
    after.wheel.dailySpin = true
    const changes = diffEconomy(seed, after)
    expect(changes).toContain("Por entrenar · repes: 10 → 12")
    expect(changes).toContain("3 entrenamientos en la semana: apagada")
    expect(changes.some((c) => c.startsWith("Regla nueva: Check-in diario"))).toBe(true)
    expect(changes).toContain("Regla quitada: 7 días seguidos entrenando")
    expect(changes).toContain("Tirada diaria: prendida")
  })
})

describe("helpers", () => {
  it("slugifies without accents or ':'", () => {
    expect(slugify("Registro de comida: extra")).toBe("registro-de-comida-extra")
    expect(slugify("Marca personal ñandú")).toBe("marca-personal-nandu")
  })

  it("creates new rules disabled, with a unique id and its params", () => {
    const rule = newRule("MONTHLY_WORKOUTS", ["desafio-mensual"])
    expect(rule.id).toBe("desafio-mensual-2")
    expect(rule.enabled).toBe(false)
    expect(rule.params).toEqual({ targetWorkouts: 1 })
  })

  it("parses whole numbers", () => {
    expect(parseWhole("")).toEqual({ ok: false })
    expect(parseWhole("", true)).toEqual({ ok: true, value: null })
    expect(parseWhole("-30")).toEqual({ ok: true, value: -30 })
    expect(parseWhole("1.5")).toEqual({ ok: false })
  })

  it("estimates months to afford a reward", () => {
    expect(monthsToAfford(750, 300)).toBe(2.5)
    expect(monthsToAfford(750, 0)).toBeNull()
  })
})
