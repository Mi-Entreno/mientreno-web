import { describe, expect, it } from "vitest"

import type { TrainerProfileResponseDTO } from "../dto/trainer-profile.dto"
import type { TrainerProfileFormValues } from "../model/trainer-profile.model"
import {
  toCompleteRequest,
  toFormValues,
  toTrainerProfile,
  toUpdateRequest,
} from "./trainer-profile.mapper"

/** Shaped exactly like `TrainerProfileResponseDTO.java`. */
const RESPONSE: TrainerProfileResponseDTO = {
  id: 12,
  fullName: "Alex Ruiz",
  profileImageUrl: "http://localhost:8080/api/files/avatars/12/photo.jpg",
  description: "Entrenador de fuerza con 8 años de experiencia.",
  basePrice: 45.5,
  experienceYears: 8,
  location: "Madrid",
  avgRating: 4.7,
  totalReviews: 23,
  currentStudents: 6,
  specialties: ["Fuerza", "Pérdida de peso"],
  certifications: [
    {
      id: 3,
      name: "NSCA-CPT",
      issuedBy: "NSCA",
      issuedAt: "2019-06-01",
      expiresAt: null,
      certificateUrl: null,
    },
  ],
}

describe("toTrainerProfile", () => {
  it("maps every field the old lib/types.ts got wrong", () => {
    const profile = toTrainerProfile(RESPONSE)

    // description -> bio, basePrice -> basePrice (was `hourlyRate`),
    // experienceYears (was `yearsOfExperience`), avgRating/totalReviews
    // (were `rating`/`reviewCount`).
    expect(profile.bio).toBe(RESPONSE.description)
    expect(profile.basePrice).toBe(45.5)
    expect(profile.experienceYears).toBe(8)
    expect(profile.rating).toEqual({ average: 4.7, total: 23 })
    expect(profile.activeStudents).toBe(6)
    expect(profile.specialtyNames).toEqual(["Fuerza", "Pérdida de peso"])
  })

  it("routes the avatar through the media proxy but keeps the raw path", () => {
    const profile = toTrainerProfile(RESPONSE)

    // Display URL: /api/files/** needs a bearer token an <img> cannot send.
    expect(profile.avatarUrl).toBe("/api/media/avatars/12/photo.jpg")
    // Write value: echoing the proxied form back would destroy the stored path.
    expect(profile.avatarPath).toBe(RESPONSE.profileImageUrl)
  })

  it("survives a profile with everything null", () => {
    const profile = toTrainerProfile({
      id: 1,
      fullName: null,
      profileImageUrl: null,
      description: null,
      basePrice: null,
      experienceYears: null,
      location: null,
      avgRating: null,
      totalReviews: null,
      currentStudents: null,
      specialties: [],
      certifications: [],
    })

    expect(profile.bio).toBe("")
    expect(profile.basePrice).toBeNull()
    expect(profile.rating).toEqual({ average: null, total: 0 })
    expect(profile.activeStudents).toBe(0)
    expect(profile.avatarUrl).toBeNull()
  })
})

describe("toFormValues", () => {
  it("keeps blank numbers blank rather than collapsing to zero", () => {
    const profile = toTrainerProfile({ ...RESPONSE, basePrice: null, experienceYears: null })
    const values = toFormValues(profile, [])

    // "" and "0" mean different things: a zero price would be a real offer.
    expect(values.basePrice).toBe("")
    expect(values.experienceYears).toBe("")
  })
})

const FORM: TrainerProfileFormValues = {
  bio: "  Entrenador de fuerza  ",
  basePrice: "45,50",
  experienceYears: "8",
  location: "Madrid",
  avatarPath: "http://localhost:8080/api/files/avatars/12/photo.jpg",
  specialtyIds: [1, 4],
  certifications: [
    {
      id: 3,
      name: "NSCA-CPT",
      issuedBy: "NSCA",
      issuedAt: "2019-06-01",
      expiresAt: null,
      certificateUrl: null,
    },
    // Blank row the editor leaves behind — must not reach the backend, where
    // `name` is @NotBlank.
    { id: null, name: "   ", issuedBy: "", issuedAt: null, expiresAt: null, certificateUrl: null },
  ],
}

describe("toUpdateRequest", () => {
  it("sends the raw avatar path, not the proxied one", () => {
    expect(toUpdateRequest(FORM).profileImageUrl).toBe(
      "http://localhost:8080/api/files/avatars/12/photo.jpg",
    )
  })

  it("accepts a comma decimal separator", () => {
    expect(toUpdateRequest(FORM).basePrice).toBe(45.5)
  })

  it("drops nameless certification rows", () => {
    expect(toUpdateRequest(FORM).certifications).toHaveLength(1)
  })

  it("trims text and nulls out empties", () => {
    const request = toUpdateRequest({ ...FORM, bio: "   ", location: "" })

    expect(request.description).toBeNull()
    expect(request.location).toBeNull()
    expect(toUpdateRequest(FORM).description).toBe("Entrenador de fuerza")
  })

  it("never emits NaN for an unparseable number", () => {
    const request = toUpdateRequest({ ...FORM, basePrice: "abc" })
    expect(request.basePrice).toBeNull()
  })

  it("sends specialty ids, since the write endpoints do not take names", () => {
    expect(toUpdateRequest(FORM).specialtyIds).toEqual([1, 4])
  })
})

describe("toCompleteRequest", () => {
  const identity = {
    firstName: " Alex ",
    lastName: "Ruiz",
    birthDate: "1990-04-23",
    gender: "male",
    country: "España",
  }

  it("adds the identity fields only this endpoint accepts", () => {
    const request = toCompleteRequest(FORM, identity)

    expect(request.firstName).toBe("Alex")
    expect(request.lastName).toBe("Ruiz")
  })

  it("sends birthDate as ISO", () => {
    // CompleteTrainerProfileRequestDTO has no @JsonFormat, unlike
    // UserProfileUpdateRequestDTO which wants dd-MM-yyyy for the same concept.
    expect(toCompleteRequest(FORM, identity).birthDate).toBe("1990-04-23")
  })

  it("carries the shared professional fields too", () => {
    const request = toCompleteRequest(FORM, identity)

    expect(request.basePrice).toBe(45.5)
    expect(request.specialtyIds).toEqual([1, 4])
    expect(request.certifications).toHaveLength(1)
  })

  it("nulls an unset birth date", () => {
    expect(toCompleteRequest(FORM, { ...identity, birthDate: "" }).birthDate).toBeNull()
  })
})
