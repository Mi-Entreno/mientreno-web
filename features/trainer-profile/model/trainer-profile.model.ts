export interface Certification {
  /** Absent for rows the user just added and has not saved yet. */
  id: number | null
  name: string
  issuedBy: string
  /** ISO `yyyy-MM-dd`. */
  issuedAt: string | null
  expiresAt: string | null
  certificateUrl: string | null
}

export interface TrainerProfile {
  id: number
  fullName: string
  bio: string
  basePrice: number | null
  experienceYears: number | null
  location: string
  /** Display URL through the media proxy. Never written back. */
  avatarUrl: string | null
  /** Raw backend value, used for writes. */
  avatarPath: string | null
  rating: {
    average: number | null
    total: number
  }
  activeStudents: number
  /** Names, as the read endpoint returns them. */
  specialtyNames: string[]
  certifications: Certification[]
}

/** What both the create and the edit form bind to. */
export interface TrainerProfileFormValues {
  bio: string
  basePrice: string
  experienceYears: string
  location: string
  avatarPath: string
  /**
   * Free text, not ids.
   *
   * The profile is read and written in the same currency now — names — so
   * there is no catalogue to look anything up in and nothing a trainer can
   * want to say that the form cannot carry. The backend resolves each name to
   * a row, creating it when it is new.
   */
  specialties: string[]
  certifications: Certification[]
}

/** Extra identity fields that only `POST /complete` accepts. */
export interface CompleteProfileIdentityValues {
  firstName: string
  lastName: string
  birthDate: string
  gender: string
  country: string
}

export function emptyCertification(): Certification {
  return {
    id: null,
    name: "",
    issuedBy: "",
    issuedAt: null,
    expiresAt: null,
    certificateUrl: null,
  }
}
