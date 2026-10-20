'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) setError('ایمیل یا رمز عبور نادرست است.')
    else window.location.href = '/'
    setLoading(false)
  }

  return <main dir="rtl" className="grid min-h-screen place-items-center bg-[#f8f3e9] px-5 py-10 text-[#183b53]"><form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-[#eadfce] bg-[#fffaf2] p-7 shadow-xl"><a href="/" className="font-serif text-2xl font-black">افسانه‌سرا</a><h1 className="mt-8 font-serif text-3xl font-black">ورود به قصه‌ها</h1><p className="mt-2 text-[#64707a]">پیشرفت و نوشته‌هایت را ذخیره کن.</p><label className="mt-7 block font-bold" htmlFor="email">ایمیل</label><input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#ddcdb7] bg-white px-4 text-base" /><label className="mt-4 block font-bold" htmlFor="password">رمز عبور</label><input id="password" type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#ddcdb7] bg-white px-4 text-base" />{error && <p className="mt-4 text-sm font-bold text-red-700">{error}</p>}<button disabled={loading} className="mt-6 min-h-12 w-full rounded-full bg-[#c17d3a] font-bold text-white disabled:opacity-60">{loading ? 'در حال ورود...' : 'ورود'}</button><p className="mt-5 text-center text-sm text-[#64707a]">حساب نداری؟ <a className="font-bold text-[#b27632]" href="/auth/sign-up">ثبت‌نام کن</a></p></form></main>
}
