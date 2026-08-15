import { apiFetch } from "@/core/http/client"
import { mapPage, type PageResponse, type SpringPage } from "@/core/http/pagination"

import type { StudentSearchResultDTO } from "../dto/student-search.dto"
import { toStudentCandidate } from "../mappers/student-search.mapper"
import { STUDENT_SEARCH_PAGE_SIZE, type StudentCandidate } from "../model/student-search.model"

export const studentSearchRepository = {
  /**
   * `GET /api/users/students/search?q=&page=&size=`.
   *
   * `q` matches name or email upstream. Only users with the STUDENT role are
   * returned — a trainer must not be able to enumerate other trainers through
   * this, and the backend, not the caller, decides that.
   */
  async search(
    query: string,
    page: number,
    size: number = STUDENT_SEARCH_PAGE_SIZE,
  ): Promise<PageResponse<StudentCandidate>> {
    const dto = await apiFetch<SpringPage<StudentSearchResultDTO>>(
      "/api/users/students/search",
      { query: { q: query.trim(), page, size } },
    )

    return mapPage(dto, toStudentCandidate)
  },
}
