'use client'

import { ArrowLeft, Languages, Loader2, Lock, MoreHorizontal, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { DEFAULT_LOCALE, LOCALES, type Locale } from '@rent/shared'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { text, type AdminText } from '@/i18n/admin'
import { cn } from '@/lib/utils'

import { formatDateTime } from '../format'
import { useAdminLang, useT } from '../lang-context'
import { PageHeader } from '../shell/page-header'
import { deleteResourceAction, saveResourceAction } from './actions'
import type { ResourceFormData } from './data'
import { FieldContext, FieldRenderer, widthClass } from './fields/field-renderer'
import { getResource } from './registry'
import type { SectionDef } from './types'
import { allFields, hasLocalizedFields, type FormValues } from './values'

const copy = {
  new: text('New', 'Yeni'),
  save: text('Save', 'Kaydet'),
  create: text('Create', 'Oluştur'),
  saved: text('Saved', 'Kaydedildi'),
  created: text('Created', 'Oluşturuldu'),
  delete: text('Delete', 'Sil'),
  deleteTitle: text('Delete this record?', 'Bu kayıt silinsin mi?'),
  deleteText: text('This cannot be undone.', 'Bu işlem geri alınamaz.'),
  deleted: text('Deleted', 'Silindi'),
  cancel: text('Cancel', 'Vazgeç'),
  fixErrors: text('Please check the highlighted fields.', 'Lütfen işaretli alanları kontrol edin.'),
  translations: text('Language', 'Dil'),
  translationsHint: text('Empty translations fall back to Turkish on the website.', 'Boş bırakılan çeviriler sitede Türkçe gösterilir.'),
  updated: text('Last saved', 'Son kayıt'),
  unsaved: text('You have unsaved changes. Leave anyway?', 'Kaydedilmemiş değişiklikler var. Yine de çıkılsın mı?'),
  readOnly: text('View only', 'Sadece görüntüleme'),
}

const localeNames: Record<Locale, string> = { tr: 'Türkçe', en: 'English', de: 'Deutsch', ru: 'Русский' }

function SectionCard({ section }: { section: SectionDef }) {
  const t = useT()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(section.title)}</CardTitle>
        {section.description && <CardDescription>{t(section.description)}</CardDescription>}
      </CardHeader>
      <CardContent className="grid grid-cols-12 gap-x-4 gap-y-5">
        {section.fields.map((field) => (
          <div key={field.name} className={widthClass[section.aside ? 'full' : (field.width ?? 'full')]}>
            <FieldRenderer field={field} path={field.name} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function ResourceFormView({ path, data, backHref, backLabel }: { path: string; data: ResourceFormData; backHref?: string; backLabel?: AdminText }) {
  const resource = getResource(path)!
  const t = useT()
  const lang = useAdminLang()
  const router = useRouter()
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pending, startTransition] = useTransition()
  const form = useForm<FormValues>({ defaultValues: data.values, mode: 'onSubmit' })
  const fields = allFields(resource.form.sections)
  const localized = hasLocalizedFields(fields)
  const isNew = resource.type === 'collection' && data.id === null
  const isDirty = form.formState.isDirty
  const main = resource.form.sections.filter((section) => !section.aside)
  const aside = resource.form.sections.filter((section) => section.aside)
  const canDelete = data.permissions.delete && !isNew
  const readOnly = isNew ? !data.permissions.create : !data.permissions.update

  useEffect(() => {
    if (!isDirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isDirty])

  const onSubmit = form.handleSubmit(
    (values) =>
      startTransition(async () => {
        const result = await saveResourceAction({ path, id: data.id as number | null, values })
        if (!result.ok) {
          for (const [errorPath, message] of Object.entries(result.fieldErrors ?? {})) {
            const field = fields.find((candidate) => candidate.name === errorPath.split('.')[0])
            const target = field && 'localized' in field && field.localized ? `${errorPath}.${DEFAULT_LOCALE}` : errorPath
            form.setError(target, { message })
          }
          toast.error(result.message)
          return
        }
        toast.success(t(isNew ? copy.created : copy.saved))
        form.reset(values)
        if (isNew && result.data.id) router.replace(`/admin/${path}/${result.data.id}`)
        else router.refresh()
      }),
    () => {
      setLocale(DEFAULT_LOCALE)
      toast.error(t(copy.fixErrors))
    },
  )

  const remove = () =>
    startTransition(async () => {
      const result = await deleteResourceAction({ path, id: data.id as number })
      if (!result.ok) {
        toast.error(result.message)
        setConfirmDelete(false)
        return
      }
      toast.success(t(copy.deleted))
      form.reset(data.values)
      router.push(`/admin/${path}`)
    })

  const title = isNew ? `${t(copy.new)} ${t(resource.labels.singular).toLocaleLowerCase(lang === 'tr' ? 'tr' : 'en')}` : data.title || t(resource.labels.singular)
  const list = backHref ?? (resource.type === 'collection' ? `/admin/${path}` : null)

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} noValidate>
        <PageHeader
          title={title}
          description={resource.type === 'global' && resource.description ? t(resource.description) : undefined}
          actions={
            <>
              {readOnly ? (
                <Badge variant="secondary" className="gap-1.5">
                  <Lock className="size-3" />
                  {t(copy.readOnly)}
                </Badge>
              ) : (
                <Button type="submit" disabled={pending || (!isNew && !isDirty)}>
                  {pending && <Loader2 className="animate-spin" />}
                  {t(isNew ? copy.create : copy.save)}
                </Button>
              )}
              {canDelete && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="icon">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
                      <Trash2 />
                      {t(copy.delete)}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          }
        />

        <div className="flex flex-col gap-6 p-4 md:p-6">
          {(list || localized) && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              {list ? (
                <Button variant="ghost" size="sm" className="-ml-2" asChild>
                  <Link href={list}>
                    <ArrowLeft />
                    {t(backLabel ?? resource.labels.plural)}
                  </Link>
                </Button>
              ) : (
                <span />
              )}
              {localized && (
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground hidden items-center gap-1.5 text-xs lg:flex">
                    <Languages className="size-3.5" />
                    {t(copy.translationsHint)}
                  </span>
                  <Tabs value={locale} onValueChange={(value) => setLocale(value as Locale)}>
                    <TabsList>
                      {LOCALES.map((code) => (
                        <TabsTrigger key={code} value={code} title={localeNames[code]} className="px-3 font-mono text-xs uppercase">
                          {code}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              )}
            </div>
          )}

          <FieldContext.Provider value={{ locale, relationOptions: data.relationOptions, currency: data.currency, readOnly, isNew }}>
            <div className={cn('grid gap-6', aside.length > 0 ? 'xl:grid-cols-3' : 'mx-auto w-full max-w-4xl')}>
              <div className={cn('flex flex-col gap-6', aside.length > 0 && 'xl:col-span-2')}>
                {main.map((section) => (
                  <SectionCard key={section.title.en} section={section} />
                ))}
              </div>
              {aside.length > 0 && (
                <div className="flex flex-col gap-6">
                  {aside.map((section) => (
                    <SectionCard key={section.title.en} section={section} />
                  ))}
                  {data.updatedAt && (
                    <p className="text-muted-foreground px-1 text-xs">
                      {t(copy.updated)}: {formatDateTime(data.updatedAt, lang)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </FieldContext.Provider>
        </div>
      </form>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(copy.deleteTitle)}</AlertDialogTitle>
            <AlertDialogDescription>{t(copy.deleteText)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{t(copy.cancel)}</AlertDialogCancel>
            <Button variant="destructive" disabled={pending} onClick={remove}>
              {pending && <Loader2 className="animate-spin" />}
              {t(copy.delete)}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FormProvider>
  )
}
