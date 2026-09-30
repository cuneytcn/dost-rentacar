'use client'

import { createContext, useContext } from 'react'

import type { AdminText } from '@/i18n/admin'

import type { AdminLang } from './lang'
import { toLocalizedAdminPath } from './routes'

const LangContext = createContext<AdminLang>('tr')

export function AdminLangProvider({ lang, children }: { lang: AdminLang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>
}

export function useAdminLang(): AdminLang {
  return useContext(LangContext)
}

export function useT(): (value: AdminText) => string {
  const lang = useContext(LangContext)
  return (value) => value[lang]
}

/** Link builder for panel paths in the current UI language (`/admin/reservations` → `/admin/rezervasyonlar`). */
export function useAdminHref(): (path: string) => string {
  const lang = useContext(LangContext)
  return (path) => toLocalizedAdminPath(path, lang)
}
