package com.smartjobtracker.contacts

import com.smartjobtracker.persistence.AssignedIdEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.time.LocalDate
import java.time.OffsetDateTime
import java.util.UUID

/**
 * A person connected to a saved job: a recruiter, hiring manager,
 * referral, or anyone else. Everything the user can edit is `var` so an
 * update mutates the managed instance and lets Hibernate's dirty
 * checking write it; it must not rebuild the entity. See
 * [AssignedIdEntity]. `jobId` and `createdAt` stay `val` because nothing
 * moves a contact to another job or rewrites when it was created.
 *
 * `email`, `phone`, `profileUrl`, `lastContactedAt`, and `notes` are
 * optional; `null` means "not set", and `lastContactedAt == null` means
 * the contact has not been reached yet.
 */
@Entity
@Table(name = "contacts")
@Suppress("LongParameterList")
class Contact(
    id: UUID,
    @Column(name = "job_id", nullable = false)
    val jobId: UUID,
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    var type: ContactType,
    @Column(nullable = false)
    var name: String,
    var email: String?,
    var phone: String?,
    @Column(name = "profile_url")
    var profileUrl: String?,
    @Column(name = "last_contacted_at")
    var lastContactedAt: LocalDate?,
    var notes: String?,
    @Column(name = "created_at", nullable = false)
    val createdAt: OffsetDateTime,
    @Column(name = "updated_at", nullable = false)
    var updatedAt: OffsetDateTime,
) : AssignedIdEntity(id)

/**
 * The role a contact plays for a job. Stored by name, so reordering or
 * renaming a value changes what existing rows mean.
 */
enum class ContactType {
    RECRUITER,
    HIRING_MANAGER,
    REFERRAL,
    OTHER,
}
