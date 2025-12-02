export type SubscriptionRecord = {
  status?: string | null
  grace_until?: string | null
  current_period_end?: string | null
  current_period_start?: string | null
  cancel_at_period_end?: boolean | null
}

const PREMIUM_STATUSES = new Set(['active', 'trialing'])

export function hasActiveSubscription(record?: SubscriptionRecord | null): boolean {
  if (!record || !record.status) {
    return false
  }

  if (PREMIUM_STATUSES.has(record.status)) {
    return true
  }

  if (record.status === 'past_due' && record.grace_until) {
    return new Date(record.grace_until).getTime() > Date.now()
  }

  return false
}

export function computeGraceUntil(
  currentPeriodEnd: number | string | Date,
  graceDays = 3
): string | null {
  if (!currentPeriodEnd) {
    return null
  }

  const endDate =
    typeof currentPeriodEnd === 'number'
      ? new Date(currentPeriodEnd * 1000)
      : currentPeriodEnd instanceof Date
        ? currentPeriodEnd
        : new Date(currentPeriodEnd)

  if (Number.isNaN(endDate.getTime())) {
    return null
  }

  const grace = new Date(endDate.getTime() + graceDays * 24 * 60 * 60 * 1000)
  return grace.toISOString()
}

