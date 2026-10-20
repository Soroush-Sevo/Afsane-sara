'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const supabase = createClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`, data: { display_name: name || 'کاربر' } } })
    setMessage(error ? 'ثبت‌نام انجام نشد. اطلاعات را بررسی کن.' : 'لینک تأیید به ایمیلت فرستاده شد.')
    setLoading(false)
  }

  return <main dir="rtl" className="grid min-h-screen place-items-center bg-[#f8f3e9] px-5 py-10 text-[#183b53]"><form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-[#eadfce] bg-[#fffaf2] p-7 shadow-xl"><a href="/" className="font-serif text-2xl font-black">افسانه‌سرا</a><h1 className="mt-8 font-serif text-3xl font-black">شروع ماجرا</h1><p className="mt-2 text-[#64707a]">یک پروفایل بساز و قصه‌ات را ادامه بده.</p><label className="mt-7 block font-bold" htmlFor="name">نام نمایشی</label><input id="name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#ddcdb7] bg-white px-4 text-base" /><label className="mt-4 block font-bold" htmlFor="email">ایمیل</label><input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#ddcdb7] bg-white px-4 text-base" /><label className="mt-4 block font-bold" htmlFor="password">رمز عبور</label><input id="password" type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#ddcdb7] bg-white px-4 text-base" />{message && <p className="mt-4 text-sm font-bold text-[#b27632]">{message}</p>}<button disabled={loading} className="mt-6 min-h-12 w-full rounded-full bg-[#183b53] font-bold text-white disabled:opacity-60">{loading ? 'در حال ساخت حساب...' : 'ثبت‌نام'}</button><p className="mt-5 text-center text-sm text-[#64707a]">حساب داری؟ <a className="font-bold text-[#b27632]" href="/auth/login">وارد شو</a></p></form></main>
}
