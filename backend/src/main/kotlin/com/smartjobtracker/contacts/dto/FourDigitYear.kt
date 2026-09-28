package com.smartjobtracker.contacts.dto

import jakarta.validation.Constraint
import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import jakarta.validation.Payload
import java.time.LocalDate
import kotlin.reflect.KClass

private const val MIN_FOUR_DIGIT_YEAR = 0

private const val MAX_FOUR_DIGIT_YEAR = 9999

/**
 * Requires a date's year to have at most four digits (0 to 9999).
 * `LocalDate` and the `DATE` column both accept years outside that range,
 * but Jackson then writes them with a sign (`"+10000-01-01"`), which the
 * frontend's `new Date(...)` cannot parse; a single stored value like that
 * made the whole contacts panel fail to render. A null value is valid.
 */
@Target(AnnotationTarget.FIELD)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [FourDigitYearValidator::class])
annotation class FourDigitYear(
    val message: String = "Year must be between 0 and 9999",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = [],
)

class FourDigitYearValidator : ConstraintValidator<FourDigitYear, LocalDate> {
    override fun isValid(
        value: LocalDate?,
        context: ConstraintValidatorContext,
    ): Boolean = value == null || value.year in MIN_FOUR_DIGIT_YEAR..MAX_FOUR_DIGIT_YEAR
}
