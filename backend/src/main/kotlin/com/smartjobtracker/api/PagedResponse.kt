package com.smartjobtracker.api

/**
 * A page of results this project's own API returns, independent of
 * Spring Data's `Page`. Spring Data's own serialization exposes
 * internal fields (`pageable`, `sort`, `numberOfElements`, `empty`,
 * ...) that are an implementation detail, not a contract worth
 * freezing into the public API.
 */
data class PagedResponse<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
)
