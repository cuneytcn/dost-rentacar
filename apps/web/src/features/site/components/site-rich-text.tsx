import { RichText } from '@payloadcms/richtext-lexical/react'

import type { PublicSettings } from '@rent/shared'

type Node = { text?: string; children?: Node[] } & Record<string, unknown>

/**
 * Values staff can put into CMS texts as `{{name}}`, so legal pages always match the settings
 * (company details, cancellation deadline, grace period …).
 */
export function contentTokens(settings: PublicSettings): Record<string, string> {
  return {
    company: settings.companyName,
    legalName: settings.legalName ?? settings.companyName,
    address: settings.address?.replace(/\s*\n\s*/g, ', ') ?? '—',
    email: settings.email ?? '—',
    phone: settings.phone ?? '—',
    authorizationNumber: settings.authorizationNumber ?? '—',
    mersisNumber: settings.mersisNumber ?? '—',
    taxOffice: settings.taxOffice ?? '—',
    taxNumber: settings.taxNumber ?? '—',
    cancelHours: String(settings.reservationRules.selfCancelCutoffHours),
    graceMinutes: String(settings.reservationRules.graceMinutes),
    minLeadHours: String(settings.reservationRules.minLeadTimeHours),
  }
}

export const CONTENT_TOKEN_NAMES = [
  'company',
  'legalName',
  'address',
  'email',
  'phone',
  'authorizationNumber',
  'mersisNumber',
  'taxOffice',
  'taxNumber',
  'cancelHours',
  'graceMinutes',
  'minLeadHours',
] as const

function fill(node: Node, tokens: Record<string, string>): Node {
  const text = typeof node.text === 'string' ? node.text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => tokens[key] ?? match) : node.text
  return { ...node, ...(text !== undefined ? { text } : {}), ...(node.children ? { children: node.children.map((child) => fill(child, tokens)) } : {}) }
}

export function SiteRichText({ data, tokens }: { data: unknown; tokens: Record<string, string> }) {
  const root = (data as { root?: Node } | null)?.root
  if (!root) return null
  return <RichText data={{ root: fill(root, tokens) } as never} />
}
