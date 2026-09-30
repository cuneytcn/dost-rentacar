/**
 * Creates (or resets) a demo admin account for showing the panel to the client. The password is
 * generated and written to `.demo-credentials` (git-ignored) instead of being printed.
 * Email defaults to demo@dostrentacar.com (override with DEMO_EMAIL). Run with `pnpm demo-user`.
 */
import { randomBytes } from 'crypto'
import { writeFile } from 'fs/promises'
import path from 'path'

import config from '@payload-config'
import { getPayload } from 'payload'

const email = (process.env.DEMO_EMAIL || 'demo@dostrentacar.com').toLowerCase()
const password = process.env.DEMO_PASSWORD || randomBytes(9).toString('base64url')

const payload = await getPayload({ config })
const { docs } = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, depth: 0 })
if (docs[0]) {
  await payload.update({ collection: 'users', id: docs[0].id, data: { password, role: 'admin', name: 'Demo' } })
} else {
  await payload.create({ collection: 'users', data: { email, password, role: 'admin', name: 'Demo' } })
}

const target = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3050'
const file = path.resolve(process.cwd(), '.demo-credentials')
await writeFile(file, `${target}/admin\nemail: ${email}\npassword: ${password}\n`, { mode: 0o600 })
payload.logger.info(`Demo user ${docs[0] ? 'reset' : 'created'}: ${email} — password written to ${file}`)
process.exit(0)
