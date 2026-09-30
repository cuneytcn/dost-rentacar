'use server'

import { revalidatePath } from 'next/cache'

import { getPayloadClient } from '@/lib/payload'

import { requireStaff } from '../auth/session'
import { runAction, type ActionResult } from '../shared/action-result'
import { customerSchema, normalizeCustomer, type CustomerFormValues } from './schema'


export async function updateCustomerAction(input: CustomerFormValues): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireStaff()
    const payload = await getPayloadClient()
    const values = customerSchema.parse(input)
    const id = values.id
    await payload.update({
      collection: 'customers',
      id,
      data: normalizeCustomer(values),
      overrideAccess: false,
      user,
    })
    revalidatePath(`/admin/customers/${id}`)
    revalidatePath('/admin/customers')
  })
}
