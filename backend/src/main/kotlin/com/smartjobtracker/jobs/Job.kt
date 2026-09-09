package com.smartjobtracker.jobs

import com.smartjobtracker.persistence.AssignedIdEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.OffsetDateTime
import java.util.UUID

/**
 * Editable columns are `var` so an update mutates the managed instance
 * and lets Hibernate's dirty checking write it. Rebuilding the entity to
 * change a field is what made every save take the `merge` path; see
 * [AssignedIdEntity]. `userId` and `createdAt` stay `val` because
 * nothing may change them.
 */
@Entity
@Table(name = "jobs")
@Suppress("LongParameterList")
class Job(
    id: UUID,
    @Column(name = "user_id")
    val userId: UUID?,
    @Column(nullable = false)
    var company: String,
    @Column(name = "role_title", nullable = false)
    var roleTitle: String,
    var location: String?,
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: JobStatus,
    @Column(name = "job_url")
    var jobUrl: String?,
    @Column(name = "salary_min")
    var salaryMin: BigDecimal?,
    @Column(name = "salary_max")
    var salaryMax: BigDecimal?,
    var description: String?,
    @Column(name = "created_at", nullable = false)
    val createdAt: OffsetDateTime,
    @Column(name = "updated_at", nullable = false)
    var updatedAt: OffsetDateTime,
) : AssignedIdEntity(id)

enum class JobStatus {
    WISHLIST,
    APPLIED,
    INTERVIEW,
    OFFER,
    REJECTED,
    WITHDRAWN,
}
