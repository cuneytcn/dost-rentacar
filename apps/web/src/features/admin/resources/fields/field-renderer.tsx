'use client'

import { Check, ChevronsUpDown, FileText, ImagePlus, Loader2, Paperclip, Plus, Trash2, X } from 'lucide-react'
import { createContext, useContext, useRef, useState } from 'react'
import { Controller, useFieldArray, useFormContext, useWatch, type FieldError } from 'react-hook-form'
import { toast } from 'sonner'

import { DEFAULT_LOCALE, type Locale } from '@rent/shared'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { text, type AdminText } from '@/i18n/admin'
import { resizeImage } from '@/lib/resize-image'
import { cn } from '@/lib/utils'

import { useT } from '../../lang-context'
import { DatePicker, DateTimePicker, TimeSelect } from '../../shared/date-picker'
import { MoneyInput } from '../../shared/money-input'
import { uploadFileAction } from '../actions'
import type { RelationOptions } from '../data'
import type { FieldDef, FieldWidth } from '../types'
import type { UploadPreview } from '../values'
import { OpeningHoursField } from './opening-hours-field'
import { RichTextEditor } from './rich-text-editor'

export type FieldContextValue = { locale: Locale; relationOptions: RelationOptions; currency: string; readOnly: boolean; hideLabel?: boolean; isNew?: boolean }
export const FieldContext = createContext<FieldContextValue>({ locale: DEFAULT_LOCALE, relationOptions: {}, currency: 'TRY', readOnly: false })

const copy = {
  select: text('Select…', 'Seçin…'),
  none: text('None', 'Yok'),
  search: text('Search…', 'Ara…'),
  noResults: text('No results.', 'Sonuç yok.'),
  required: text('Required', 'Zorunlu'),
  upload: text('Add photos', 'Görsel ekle'),
  uploadFile: text('Attach file', 'Dosya ekle'),
  cover: text('Cover', 'Kapak'),
  remove: text('Remove', 'Kaldır'),
  uploading: text('Uploading…', 'Yükleniyor…'),
  empty: text('Nothing added yet.', 'Henüz eklenmedi.'),
}

const widthClass: Record<FieldWidth, string> = {
  full: 'col-span-12',
  half: 'col-span-12 sm:col-span-6',
  third: 'col-span-12 sm:col-span-4',
  quarter: 'col-span-12 sm:col-span-6 lg:col-span-3',
}

function labelText(label: AdminText | string, t: (value: AdminText) => string): string {
  return typeof label === 'string' ? label : t(label)
}

function errorAt(errors: unknown, path: string): FieldError | undefined {
  return path.split('.').reduce<unknown>((value, key) => (value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined), errors) as
    | FieldError
    | undefined
}

/** Shared label / description / error layout, so every field lines up the same way. */
function FieldShell({
  field,
  path,
  localized,
  children,
  inline,
}: {
  field: FieldDef
  path: string
  localized?: boolean
  children: React.ReactNode
  inline?: boolean
}) {
  const { hideLabel } = useContext(FieldContext)
  const t = useT()
  const { locale } = useContext(FieldContext)
  const { formState } = useFormContext()
  const error = errorAt(formState.errors, path)
  const required = field.required && (!localized || locale === DEFAULT_LOCALE)
  const id = `field-${path.replace(/\./g, '-')}`

  if (inline) {
    return (
      <div className={cn('flex items-center justify-between gap-4 rounded-lg border p-3', error && 'border-destructive')}>
        <div className="space-y-0.5">
          <Label htmlFor={id}>{labelText(field.label, t)}</Label>
          {field.description && <p className="text-muted-foreground text-xs">{t(field.description)}</p>}
        </div>
        {children}
      </div>
    )
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className={cn('flex items-center gap-1.5', hideLabel && 'sr-only')}>
        {labelText(field.label, t)}
        {required && <span className="text-destructive">*</span>}
        {localized && (
          <Badge variant="secondary" className="h-4 px-1 font-mono text-[10px] uppercase">
            {locale}
          </Badge>
        )}
      </Label>
      {children}
      {error?.message ? (
        <p className="text-destructive text-xs">{String(error.message)}</p>
      ) : field.description ? (
        <p className="text-muted-foreground text-xs">{t(field.description)}</p>
      ) : null}
    </div>
  )
}

function RelationPicker({
  options,
  value,
  onChange,
  hasMany,
  allowEmpty,
  disabled,
  id,
  invalid,
}: {
  options: { value: number; label: string }[]
  value: number | number[] | null
  onChange: (value: number | number[] | null) => void
  hasMany?: boolean
  allowEmpty?: boolean
  disabled?: boolean
  id: string
  invalid?: boolean
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const selected = hasMany ? (Array.isArray(value) ? value : []) : value != null ? [value as number] : []
  const labelFor = (id: number) => options.find((option) => option.value === id)?.label ?? `#${id}`

  const toggle = (optionValue: number) => {
    if (hasMany) {
      onChange(selected.includes(optionValue) ? selected.filter((item) => item !== optionValue) : [...selected, optionValue])
    } else {
      onChange(optionValue)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          aria-invalid={invalid}
          className={cn('h-auto min-h-9 w-full justify-between px-3 py-1.5 font-normal', invalid && 'border-destructive')}
        >
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{t(copy.select)}</span>
          ) : hasMany ? (
            <span className="flex flex-wrap gap-1">
              {selected.map((item) => (
                <Badge key={item} variant="secondary" className="gap-1 font-normal">
                  {labelFor(item)}
                  <span
                    role="button"
                    tabIndex={-1}
                    className="hover:text-foreground text-muted-foreground"
                    onClick={(event) => {
                      event.stopPropagation()
                      toggle(item)
                    }}
                  >
                    <X className="size-3" />
                  </span>
                </Badge>
              ))}
            </span>
          ) : (
            <span className="truncate">{labelFor(selected[0]!)}</span>
          )}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={t(copy.search)} />
          <CommandList>
            <CommandEmpty>{t(copy.noResults)}</CommandEmpty>
            <CommandGroup>
              {allowEmpty && !hasMany && (
                <CommandItem
                  value="__none__"
                  onSelect={() => {
                    onChange(null)
                    setOpen(false)
                  }}
                >
                  <Check className={cn('size-4', selected.length === 0 ? 'opacity-100' : 'opacity-0')} />
                  <span className="text-muted-foreground">{t(copy.none)}</span>
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem key={option.value} value={`${option.label} ${option.value}`} onSelect={() => toggle(option.value)}>
                  <Check className={cn('size-4', selected.includes(option.value) ? 'opacity-100' : 'opacity-0')} />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function ImagesField({ value, onChange, disabled }: { value: UploadPreview[]; onChange: (value: UploadPreview[]) => void; disabled?: boolean }) {
  const t = useT()
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(0)
  const dragIndex = useRef<number | null>(null)

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    const list = [...files]
    setUploading(list.length)
    const added: UploadPreview[] = []
    for (const file of list) {
      const formData = new FormData()
      formData.set('collection', 'media')
      formData.set('file', await resizeImage(file, 2000, 0.85))
      formData.set('label', file.name.replace(/\.\w+$/, ''))
      const result = await uploadFileAction(formData)
      if (result.ok) added.push(result.data)
      else toast.error(result.message)
      setUploading((count) => count - 1)
    }
    onChange([...value, ...added])
  }

  const move = (from: number, to: number) => {
    if (from === to) return
    const next = [...value]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item!)
    onChange(next)
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {value.map((image, index) => (
        <div
          key={image.id}
          draggable={!disabled}
          onDragStart={() => (dragIndex.current = index)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => dragIndex.current !== null && move(dragIndex.current, index)}
          className="group bg-muted relative aspect-[4/3] cursor-grab overflow-hidden rounded-lg border active:cursor-grabbing"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
          <img src={image.thumbnailUrl} alt="" className="size-full object-cover" />
          {index === 0 && (
            <Badge className="absolute top-1.5 left-1.5 h-5 px-1.5 text-[10px]">{t(copy.cover)}</Badge>
          )}
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange(value.filter((item) => item.id !== image.id))}
              className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label={t(copy.remove)}
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      ))}
      {Array.from({ length: uploading }, (_, index) => (
        <div key={`uploading-${index}`} className="bg-muted flex aspect-[4/3] items-center justify-center rounded-lg border">
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="text-muted-foreground hover:bg-muted/50 hover:text-foreground flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed text-xs transition-colors"
        >
          <ImagePlus className="size-5" />
          {t(copy.upload)}
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          void upload(event.target.files)
          event.target.value = ''
        }}
      />
    </div>
  )
}

function FileField({ value, onChange, disabled }: { value: UploadPreview | null; onChange: (value: UploadPreview | null) => void; disabled?: boolean }) {
  const t = useT()
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const upload = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.set('collection', 'documents')
    formData.set('file', file.type.startsWith('image/') ? await resizeImage(file) : file)
    formData.set('label', file.name)
    const result = await uploadFileAction(formData)
    setUploading(false)
    if (result.ok) onChange(result.data)
    else toast.error(result.message)
  }
  return (
    <div className="flex h-9 items-center gap-2">
      {value ? (
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
          <FileText className="text-muted-foreground size-4 shrink-0" />
          <a href={value.url} target="_blank" rel="noreferrer" className="truncate hover:underline">
            {value.filename}
          </a>
          {!disabled && (
            <button type="button" className="text-muted-foreground hover:text-foreground ml-auto" onClick={() => onChange(null)} aria-label={t(copy.remove)}>
              <X className="size-4" />
            </button>
          )}
        </div>
      ) : (
        <Button type="button" variant="outline" disabled={disabled || uploading} onClick={() => input.current?.click()} className="w-full justify-start font-normal">
          {uploading ? <Loader2 className="animate-spin" /> : <Paperclip />}
          {t(uploading ? copy.uploading : copy.uploadFile)}
        </Button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*,application/pdf"
        hidden
        onChange={(event) => {
          void upload(event.target.files?.[0])
          event.target.value = ''
        }}
      />
    </div>
  )
}

function ArrayField({ field, path }: { field: Extract<FieldDef, { kind: 'array' }>; path: string }) {
  const t = useT()
  const context = useContext(FieldContext)
  const { readOnly } = context
  const { control } = useFormContext()
  const { fields: rows, append, remove } = useFieldArray({ control, name: path, keyName: '_key' })
  // A single-column list (e.g. emails) doesn't repeat the column label on every row.
  const single = field.fields.length === 1
  const blank = () =>
    Object.fromEntries(field.fields.map((sub) => [sub.name, sub.kind === 'number' || sub.kind === 'money' ? null : sub.kind === 'select' ? (sub.options[0]?.value ?? '') : '']))

  return (
    <div className="space-y-2">
      {rows.length === 0 && <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center text-sm">{t(copy.empty)}</p>}
      {rows.map((row, index) => (
        <div key={row._key} className={cn('grid grid-cols-[1fr_auto] items-start gap-2', single ? '' : 'bg-muted/30 rounded-lg border p-3')}>
          <FieldContext.Provider value={{ ...context, hideLabel: single }}>
            <div className="grid grid-cols-12 gap-3">
              {field.fields.map((sub) => (
                <div key={sub.name} className={widthClass[sub.width ?? 'full']}>
                  <FieldRenderer field={sub} path={`${path}.${index}.${sub.name}`} />
                </div>
              ))}
            </div>
          </FieldContext.Provider>
          {!readOnly && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn('size-8', single ? 'mt-0.5' : 'mt-6')}
              disabled={field.minRows !== undefined && rows.length <= field.minRows}
              onClick={() => remove(index)}
              aria-label={t(copy.remove)}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      ))}
      {!readOnly && (
        <Button type="button" variant="outline" size="sm" onClick={() => append(blank())}>
          <Plus />
          {t(field.addLabel)}
        </Button>
      )}
    </div>
  )
}

/** Renders one field of a resource form, bound to react-hook-form at `path`. */
export function FieldRenderer({ field, path }: { field: FieldDef; path: string }) {
  const t = useT()
  const context = useContext(FieldContext)
  const { control } = useFormContext()
  const conditionValue = useWatch({ control, name: field.condition?.field ?? '__none__', disabled: !field.condition })
  if (field.condition && !field.condition.in.includes(conditionValue as string | boolean)) return null

  const localized = 'localized' in field && Boolean(field.localized)
  const name = localized ? `${path}.${context.locale}` : path
  const disabled = context.readOnly || field.readOnly
  const id = `field-${path.replace(/\./g, '-')}`
  // A password is only required when the account is created; later it's an optional change.
  const effective: FieldDef =
    field.kind === 'password' && context.isNew ? { ...field, required: true, description: text('At least 8 characters.', 'En az 8 karakter.') } : field
  const requiredRule = effective.required && (!localized || context.locale === DEFAULT_LOCALE) ? t(copy.required) : false

  if (field.kind === 'array') {
    return (
      <FieldShell field={field} path={path}>
        <ArrayField field={field} path={path} />
      </FieldShell>
    )
  }
  if (field.kind === 'openingHours') {
    return (
      <Controller
        control={control}
        name={path}
        render={({ field: input }) => <OpeningHoursField value={(input.value as never) ?? []} onChange={input.onChange} disabled={disabled} />}
      />
    )
  }

  return (
    <Controller
      control={control}
      name={name}
      rules={{
        required: requiredRule,
        ...(field.kind === 'password' ? { validate: (value: unknown) => !value || String(value).length >= 8 || t(text('At least 8 characters.', 'En az 8 karakter.')) } : {}),
      }}
      render={({ field: input, fieldState }) => {
        const invalid = Boolean(fieldState.error)
        switch (field.kind) {
          case 'switch':
            return (
              <FieldShell field={field} path={name} inline>
                <Switch id={id} checked={Boolean(input.value)} onCheckedChange={input.onChange} disabled={disabled} />
              </FieldShell>
            )
          case 'textarea':
            return (
              <FieldShell field={field} path={name} localized={localized}>
                <Textarea
                  id={id}
                  rows={field.rows ?? 3}
                  maxLength={field.maxLength}
                  disabled={disabled}
                  aria-invalid={invalid}
                  value={(input.value as string) ?? ''}
                  onChange={input.onChange}
                  onBlur={input.onBlur}
                />
              </FieldShell>
            )
          case 'richText':
            return (
              <FieldShell field={field} path={name} localized={localized}>
                <RichTextEditor key={`${path}-${context.locale}`} value={input.value} onChange={input.onChange} invalid={invalid} />
              </FieldShell>
            )
          case 'number':
            return (
              <FieldShell field={field} path={name}>
                <div className="relative">
                  <Input
                    id={id}
                    type="number"
                    inputMode="decimal"
                    min={field.min}
                    max={field.max}
                    step={field.step ?? 1}
                    placeholder={field.placeholder}
                    disabled={disabled}
                    aria-invalid={invalid}
                    className={cn('tabular-nums', field.suffix && 'pr-14')}
                    value={input.value === null || input.value === undefined ? '' : String(input.value)}
                    onChange={(event) => input.onChange(event.target.value === '' ? null : Number(event.target.value))}
                    onBlur={input.onBlur}
                  />
                  {field.suffix && <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">{field.suffix}</span>}
                </div>
              </FieldShell>
            )
          case 'money':
            return (
              <FieldShell field={field} path={name}>
                <MoneyInput id={id} value={(input.value as number | null) ?? null} onChange={input.onChange} currency={context.currency} />
              </FieldShell>
            )
          case 'select':
            return (
              <FieldShell field={field} path={name}>
                <Select value={(input.value as string) || '__empty__'} onValueChange={(value) => input.onChange(value === '__empty__' ? '' : value)} disabled={disabled}>
                  <SelectTrigger id={id} className="w-full" aria-invalid={invalid}>
                    <SelectValue placeholder={t(copy.select)} />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.allowEmpty || !input.value) && (
                      <SelectItem value="__empty__">
                        <span className="text-muted-foreground">{field.allowEmpty ? t(copy.none) : t(copy.select)}</span>
                      </SelectItem>
                    )}
                    {field.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldShell>
            )
          case 'multiSelect': {
            const current = Array.isArray(input.value) ? (input.value as string[]) : []
            return (
              <FieldShell field={field} path={name}>
                <div className="flex flex-wrap gap-2">
                  {field.options.map((option) => {
                    const active = current.includes(option.value)
                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={disabled}
                        onClick={() => input.onChange(active ? current.filter((value) => value !== option.value) : [...current, option.value])}
                        className={cn(
                          'inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm transition-colors',
                          active ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted/60',
                        )}
                      >
                        {active && <Check className="size-3.5" />}
                        {t(option.label)}
                      </button>
                    )
                  })}
                </div>
              </FieldShell>
            )
          }
          case 'date':
            return (
              <FieldShell field={field} path={name}>
                <DatePicker id={id} disabled={disabled} invalid={invalid} value={input.value as string} onChange={input.onChange} onBlur={input.onBlur} clearable={!field.required} />
              </FieldShell>
            )
          case 'datetime':
            return (
              <FieldShell field={field} path={name}>
                <DateTimePicker id={id} disabled={disabled} invalid={invalid} value={input.value as string} onChange={input.onChange} onBlur={input.onBlur} />
              </FieldShell>
            )
          case 'time':
            return (
              <FieldShell field={field} path={name}>
                <TimeSelect id={id} disabled={disabled} invalid={invalid} value={input.value as string} onChange={input.onChange} />
              </FieldShell>
            )
          case 'relation':
            return (
              <FieldShell field={field} path={name}>
                <RelationPicker
                  id={id}
                  options={context.relationOptions[field.relationTo] ?? []}
                  value={input.value as number | number[] | null}
                  onChange={input.onChange}
                  hasMany={field.hasMany}
                  allowEmpty={field.allowEmpty ?? !field.required}
                  disabled={disabled}
                  invalid={invalid}
                />
              </FieldShell>
            )
          case 'images':
            return (
              <FieldShell field={field} path={name}>
                <ImagesField value={(input.value as UploadPreview[]) ?? []} onChange={input.onChange} disabled={disabled} />
              </FieldShell>
            )
          case 'file':
            return (
              <FieldShell field={field} path={name}>
                <FileField value={(input.value as UploadPreview | null) ?? null} onChange={input.onChange} disabled={disabled} />
              </FieldShell>
            )
          case 'password':
            return (
              <FieldShell field={effective} path={name}>
                <Input
                  id={id}
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  disabled={disabled}
                  aria-invalid={invalid}
                  value={(input.value as string) ?? ''}
                  onChange={input.onChange}
                />
              </FieldShell>
            )
          case 'email':
          case 'text':
          default: {
            const isText = field.kind === 'text'
            return (
              <FieldShell field={field} path={name} localized={localized}>
                <Input
                  id={id}
                  type={field.kind === 'email' ? 'email' : 'text'}
                  disabled={disabled}
                  aria-invalid={invalid}
                  maxLength={isText ? field.maxLength : undefined}
                  placeholder={isText ? field.placeholder : undefined}
                  className={cn(isText && field.mono && 'font-mono', isText && field.uppercase && 'uppercase')}
                  value={(input.value as string) ?? ''}
                  onChange={input.onChange}
                  onBlur={input.onBlur}
                />
              </FieldShell>
            )
          }
        }
      }}
    />
  )
}

export { widthClass }
