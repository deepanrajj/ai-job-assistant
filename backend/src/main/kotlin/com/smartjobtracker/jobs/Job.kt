package com.smartjobtracker.jobs

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "jobs")
@Suppress("LongParameterList")
class Job(
    @Id
    val id: UUID,
    @Column(name = "user_id")
    val userId: UUID?,
    @Column(nullable = false)
    val company: String,
    @Column(name = "role_title", nullable = false)
    val roleTitle: String,
    val location: String?,
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val status: JobStatus,
    @Column(name = "job_url")
    val jobUrl: String?,
    @Column(name = "salary_min")
    val salaryMin: BigDecimal?,
    @Column(name = "salary_max")
    val salaryMax: BigDecimal?,
    val description: String?,
    @Column(name = "created_at", nullable = false)
    val createdAt: OffsetDateTime,
    @Column(name = "updated_at", nullable = false)
    val updatedAt: OffsetDateTime,
)

enum class JobStatus {
    WISHLIST,
    APPLIED,
    INTERVIEW,
    OFFER,
    REJECTED,
    WITHDRAWN,
}
