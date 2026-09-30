import { sql, type PostgresAdapter } from '@payloadcms/db-postgres'
import type { Payload, PayloadRequest } from 'payload'

export type TransactionReq = Partial<PayloadRequest> & { transactionID: string | number }

/** Runs `fn` in one database transaction; pass the given `req` to every Local API call inside. */
export async function withTransaction<T>(payload: Payload, fn: (req: TransactionReq) => Promise<T>): Promise<T> {
  const transactionID = await payload.db.beginTransaction()
  if (transactionID == null) throw new Error('Database adapter does not support transactions')
  const req = { transactionID } as TransactionReq
  try {
    const result = await fn(req)
    await payload.db.commitTransaction(transactionID)
    return result
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}

/** Serializes concurrent transactions on the same key until the current transaction ends. */
export async function acquireTransactionLock(payload: Payload, req: TransactionReq, key: string): Promise<void> {
  const adapter = payload.db as unknown as PostgresAdapter
  const session = adapter.sessions[String(await req.transactionID)]
  if (!session) throw new Error('No open transaction for lock')
  await session.db.execute(sql`select pg_advisory_xact_lock(hashtext(${key}))`)
}

/** True for PostgreSQL exclusion-constraint violations (e.g. double-booked vehicle). */
export function isExclusionViolation(error: unknown): boolean {
  let current: unknown = error
  for (let depth = 0; current && depth < 5; depth++) {
    if (typeof current === 'object' && 'code' in current && (current as { code: unknown }).code === '23P01') return true
    current = typeof current === 'object' && 'cause' in current ? (current as { cause: unknown }).cause : undefined
  }
  return false
}
