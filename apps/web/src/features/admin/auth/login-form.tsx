'use client'

import { Loader2 } from 'lucide-react'
import { useActionState } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { text } from '@/i18n/admin'

import { useT } from '../lang-context'
import { loginAction, type LoginState } from './actions'

const copy = {
  title: text('Sign in to the panel', 'Panele giriş yap'),
  subtitle: text('Enter your email and password.', 'E-posta ve şifrenizi girin.'),
  email: text('Email', 'E-posta'),
  password: text('Password', 'Şifre'),
  submit: text('Sign in', 'Giriş yap'),
  errors: {
    invalid: text('Email or password is incorrect.', 'E-posta veya şifre hatalı.'),
    locked: text('Too many attempts. The account is locked for 15 minutes.', 'Çok fazla deneme. Hesap 15 dakika kilitlendi.'),
    forbidden: text('This account cannot access the panel.', 'Bu hesap panele erişemez.'),
  },
}

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const t = useT()
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, undefined)

  return (
    <form action={action} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t(copy.title)}</h1>
        <p className="text-muted-foreground text-sm">{t(copy.subtitle)}</p>
      </div>
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{t(copy.errors[state.error])}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">{t(copy.email)}</Label>
          <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">{t(copy.password)}</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {t(copy.submit)}
        </Button>
      </div>
    </form>
  )
}
