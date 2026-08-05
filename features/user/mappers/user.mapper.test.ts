import { describe, expect, it } from "vitest"

import type { UserProfileResponseDTO } from "../dto/user.dto"
import { toUserProfile, toUserProfileUpdateRequest } from "./user.mapper"

const RESPONSE: UserProfileResponseDTO = {
  userId: 7,
  email: "alex@gym.com",
  phone: "+34600111222",
  firstName: "Alex",
  lastName: "Ruiz",
  birthDate: "1990-04-23",
  gender: "male",
  pathProfilePicture: "http://localhost:8080/api/files/avatars/7/me.png",
  country: "España",
}

describe("toUserProfile", () => {
  it("keeps birthDate in ISO, which is what the date input needs", () => {
    expect(toUserProfile(RESPONSE).birthDate).toBe("1990-04-23")
  })

  it("splits the avatar into a display URL and the raw stored path", () => {
    const profile = toUserProfile(RESPONSE)

    expect(profile.avatarUrl).toBe("/api/media/avatars/7/me.png")
    expect(profile.avatarPath).toBe(RESPONSE.pathProfilePicture)
  })

  it("turns nulls into empty strings so inputs stay controlled", () => {
    const profile = toUserProfile({
      ...RESPONSE,
      email: null,
      phone: null,
      firstName: null,
      lastName: null,
      gender: null,
      country: null,
      birthDate: null,
      pathProfilePicture: null,
    })

    expect(profile.firstName).toBe("")
    expect(profile.country).toBe("")
    expect(profile.birthDate).toBeNull()
    expect(profile.avatarUrl).toBeNull()
  })
})

describe("toUserProfileUpdateRequest", () => {
  const values = {
    firstName: " Alex ",
    lastName: "Ruiz",
    birthDate: "1990-04-23",
    gender: "male",
    country: "España",
    avatarPath: "http://localhost:8080/api/files/avatars/7/me.png",
  }

  it("converts birthDate to dd-MM-yyyy", () => {
    // `UserProfileUpdateRequestDTO.birthDate` carries
    // @JsonFormat(pattern = "dd-MM-yyyy"); sending ISO is a 400.
    expect(toUserProfileUpdateRequest(values).birthDate).toBe("23-04-1990")
  })

  it("writes back the raw avatar path", () => {
    expect(toUserProfileUpdateRequest(values).pathProfilePicture).toBe(values.avatarPath)
  })

  it("trims names and nulls out blank optionals", () => {
    const request = toUserProfileUpdateRequest({ ...values, country: "  ", gender: "" })

    expect(request.firstName).toBe("Alex")
    expect(request.country).toBeNull()
    expect(request.gender).toBeNull()
  })

  it("nulls an unset birth date instead of sending an empty string", () => {
    expect(toUserProfileUpdateRequest({ ...values, birthDate: null }).birthDate).toBeNull()
  })
})
