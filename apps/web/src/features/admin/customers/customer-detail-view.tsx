'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { AlertOctagon, ArrowLeft, Loader2, Mail, Phone } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { ID_DOCUMENT_TYPES } from '@rent/shared'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { optionLabels, text, type AdminText } from '@/i18n/admin'

import { formatDate, formatDateTime, formatMoney } from '../format'
import { useAdminLang, useT } from '../lang-context'
import { BIRTH_YEARS, DatePicker, PAST_YEARS } from '../shared/date-picker'
import { PageHeader } from '../shell/page-header'
import { DeskStatusCell, PaymentSummaryText } from '../reservations/desk-status'
import { updateCustomerAction } from './actions'
import type { CustomerDetail } from './data'
import { customerSchema, type CustomerFormValues } from './schema'

const copy = {
  back: text('Customers', 'Müşteriler'),
  save: text('Save changes', 'Değişiklikleri kaydet'),
  saved: text('Customer saved', 'Müşteri kaydedildi'),
  contact: text('Contact', 'İletişim'),
  identity: text('Identity & driving license', 'Kimlik ve ehliyet'),
  firstName: text('First name', 'Ad'),
  lastName: text('Last name', 'Soyad'),
  email: text('Email', 'E-posta'),
  phone: text('Phone', 'Telefon'),
  country: text('Country code', 'Ülke kodu'),
  birthDate: text('Birth date', 'Doğum tarihi'),
  address: text('Address', 'Adres'),
  idType: text('ID type', 'Kimlik türü'),
  idNumber: text('ID / passport number', 'Kimlik / pasaport no'),
  licenseNumber: text('License number', 'Ehliyet no'),
  licenseCountry: text('License country', 'Ehliyet ülkesi'),
  licenseIssuedAt: text('License issued', 'Ehliyet veriliş tarihi'),
  none: text('Not set', 'Belirtilmedi'),
  internal: text('Internal', 'İç bilgiler'),
  notes: text('Notes', 'Notlar'),
  blacklist: text('Blacklist', 'Kara liste'),
  blacklistHint: text('Website bookings from this customer are rejected.', 'Bu müşterinin web sitesinden yaptığı rezervasyonlar reddedilir.'),
  blacklistReason: text('Reason', 'Sebep'),
  blacklistedTitle: text('This customer is blacklisted', 'Bu müşteri kara listede'),
  rentals: text('Rentals', 'Kiralamalar'),
  completed: text('Completed', 'Tamamlanan'),
  cancelled: text('Cancelled / no-show', 'İptal / gelmedi'),
  revenue: text('Revenue', 'Ciro'),
  history: text('Rental history', 'Kiralama geçmişi'),
  noRentals: text('No rentals yet.', 'Henüz kiralama yok.'),
  code: text('Reservation', 'Rezervasyon'),
  vehicle: text('Vehicle', 'Araç'),
  dates: text('Dates', 'Tarihler'),
  total: text('Total', 'Tutar'),
  payment: text('Payment', 'Ödeme'),
  status: text('Status', 'Durum'),
  consents: text('Consents', 'Onaylar'),
  privacy: text('Privacy notice accepted', 'Aydınlatma metni onayı'),
  marketing: text('Marketing messages', 'Ticari ileti izni'),
  yes: text('Yes', 'Evet'),
  no: text('No', 'Hayır'),
  since: text('Customer since', 'Kayıt tarihi'),
}

export function CustomerDetailView({ detail }: { detail: CustomerDetail }) {
  const t = useT()
  const lang = useAdminLang()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const { customer } = detail

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      country: customer.country ?? '',
      birthDate: customer.birthDate ?? '',
      idDocumentType: customer.idDocumentType ?? null,
      idDocumentNumber: customer.idDocumentNumber ?? '',
      licenseNumber: customer.licenseNumber ?? '',
      licenseCountry: customer.licenseCountry ?? '',
      licenseIssuedAt: customer.licenseIssuedAt ?? '',
      address: customer.address ?? '',
      notes: customer.notes ?? '',
      isBlacklisted: Boolean(customer.isBlacklisted),
      blacklistReason: customer.blacklistReason ?? '',
    },
  })
  const blacklisted = useWatch({ control: form.control, name: 'isBlacklisted' })

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await updateCustomerAction(values)
      if (!result.ok) {
        for (const [path, message] of Object.entries(result.fieldErrors ?? {})) {
          form.setError(path as keyof CustomerFormValues, { message })
        }
        toast.error(result.message)
        return
      }
      toast.success(t(copy.saved))
      form.reset(values)
      router.refresh()
    }),
  )

  const textField = (name: keyof CustomerFormValues, label: AdminText, props: React.ComponentProps<typeof Input> = {}) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t(label)}</FormLabel>
          <FormControl>
            <Input {...props} {...field} value={(field.value as string | null) ?? ''} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
  const dateField = (name: keyof CustomerFormValues, label: AdminText, years: { from: number; to: number }) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t(label)}</FormLabel>
          <FormControl>
            <DatePicker years={years} clearable value={field.value as string | null} onChange={field.onChange} onBlur={field.onBlur} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <PageHeader
          title={`${customer.firstName} ${customer.lastName}`}
          actions={
            <Button type="submit" disabled={pending || !form.formState.isDirty}>
              {pending && <Loader2 className="animate-spin" />}
              {t(copy.save)}
            </Button>
          }
        />
        <div className="flex flex-col gap-6 p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" className="-ml-2" asChild>
              <Link href="/admin/customers">
                <ArrowLeft />
                {t(copy.back)}
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${customer.phone}`}>
                <Phone />
                {customer.phone}
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${customer.email}`}>
                <Mail />
                {customer.email}
              </a>
            </Button>
          </div>

          {customer.isBlacklisted && (
            <Alert variant="destructive">
              <AlertOctagon />
              <AlertTitle>{t(copy.blacklistedTitle)}</AlertTitle>
              {customer.blacklistReason && <AlertDescription>{customer.blacklistReason}</AlertDescription>}
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: copy.rentals, value: String(detail.stats.rentals) },
              { label: copy.completed, value: String(detail.stats.completed) },
              { label: copy.cancelled, value: String(detail.stats.cancelled) },
              { label: copy.revenue, value: formatMoney(detail.stats.revenue, detail.stats.currency, lang) },
            ].map((stat) => (
              <Card key={stat.label.en} className="gap-1 py-4">
                <CardHeader className="px-5">
                  <CardDescription>{t(stat.label)}</CardDescription>
                  <CardTitle className="text-2xl tabular-nums">{stat.value}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="flex flex-col gap-6 xl:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t(copy.contact)}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  {textField('firstName', copy.firstName)}
                  {textField('lastName', copy.lastName)}
                  {textField('phone', copy.phone, { type: 'tel' })}
                  {textField('email', copy.email, { type: 'email' })}
                  {textField('country', copy.country, { maxLength: 2, className: 'uppercase' })}
                  {dateField('birthDate', copy.birthDate, BIRTH_YEARS)}
                  <div className="sm:col-span-2">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t(copy.address)}</FormLabel>
                          <FormControl>
                            <Textarea rows={2} {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t(copy.identity)}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="idDocumentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t(copy.idType)}</FormLabel>
                        <Select value={field.value ?? 'none'} onValueChange={(value) => field.onChange(value === 'none' ? null : value)}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">{t(copy.none)}</SelectItem>
                            {ID_DOCUMENT_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {t(optionLabels.idDocumentType[type])}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {textField('idDocumentNumber', copy.idNumber)}
                  {textField('licenseNumber', copy.licenseNumber)}
                  {textField('licenseCountry', copy.licenseCountry, { maxLength: 2, className: 'uppercase' })}
                  {dateField('licenseIssuedAt', copy.licenseIssuedAt, PAST_YEARS)}
                </CardContent>
              </Card>

              <Card className="gap-0 pb-0">
                <CardHeader className="pb-4">
                  <CardTitle>{t(copy.history)}</CardTitle>
                </CardHeader>
                {detail.reservations.length === 0 ? (
                  <CardContent className="text-muted-foreground pb-6 text-sm">{t(copy.noRentals)}</CardContent>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="pl-6">{t(copy.code)}</TableHead>
                        <TableHead>{t(copy.vehicle)}</TableHead>
                        <TableHead>{t(copy.dates)}</TableHead>
                        <TableHead className="text-right">{t(copy.total)}</TableHead>
                        <TableHead className="pr-6 pl-8">{t(copy.status)}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.reservations.map((reservation) => (
                        <TableRow key={reservation.id} className="cursor-pointer" onClick={() => router.push(`/admin/reservations/${reservation.id}`)}>
                          <TableCell className="pl-6 font-mono text-sm font-semibold">{reservation.code}</TableCell>
                          <TableCell>{reservation.vehicleModel}</TableCell>
                          <TableCell className="tabular-nums">
                            {formatDate(reservation.pickupAt, lang)} → {formatDate(reservation.returnAt, lang)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="tabular-nums">{formatMoney(reservation.total, reservation.currency, lang)}</div>
                            <PaymentSummaryText summary={reservation.payment} currency={reservation.currency} className="tabular-nums" />
                          </TableCell>
                          <TableCell className="pr-6 pl-8">
                            <DeskStatusCell status={reservation.desk} now={detail.now} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </div>

            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t(copy.blacklist)}</CardTitle>
                  <CardDescription>{t(copy.blacklistHint)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isBlacklisted"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <FormLabel>{t(copy.blacklist)}</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {blacklisted && (
                    <FormField
                      control={form.control}
                      name="blacklistReason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t(copy.blacklistReason)}</FormLabel>
                          <FormControl>
                            <Textarea rows={3} {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t(copy.internal)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t(copy.notes)}</FormLabel>
                        <FormControl>
                          <Textarea rows={4} {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormDescription />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t(copy.consents)}</CardTitle>
                </CardHeader>
                <CardContent className="divide-y text-sm">
                  <div className="flex justify-between gap-4 py-2">
                    <span className="text-muted-foreground">{t(copy.privacy)}</span>
                    <span>{formatDateTime(customer.privacyAcceptedAt, lang)}</span>
                  </div>
                  <div className="flex justify-between gap-4 py-2">
                    <span className="text-muted-foreground">{t(copy.marketing)}</span>
                    <span>
                      {t(customer.marketingConsent ? copy.yes : copy.no)}
                      {customer.marketingConsentAt && <span className="text-muted-foreground"> · {formatDate(customer.marketingConsentAt, lang)}</span>}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 py-2">
                    <span className="text-muted-foreground">{t(copy.since)}</span>
                    <span>{formatDate(customer.createdAt, lang)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </Form>
  )
}
