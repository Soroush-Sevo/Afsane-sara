import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'ورود مدیر لازم است.' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
  if (!profile?.is_admin) return NextResponse.json({ error: 'دسترسی مدیر لازم است.' }, { status: 403 })

  const body = await request.json().catch(() => null) as { text?: string; slug?: string; index?: number } | null
  const text = body?.text?.trim()
  if (!text) return NextResponse.json({ error: 'متن روایت خالی است.' }, { status: 400 })
  if (text.length > 5000) return NextResponse.json({ error: 'متن هر فصل نباید بیشتر از ۵۰۰۰ نویسه باشد.' }, { status: 400 })

  const url = new URL('https://translate.google.com/translate_tts')
  url.searchParams.set('ie', 'UTF-8')
  url.searchParams.set('client', 'tw-ob')
  url.searchParams.set('tl', 'fa')
  url.searchParams.set('total', '1')
  url.searchParams.set('idx', '0')
  url.searchParams.set('text', text)

  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store' })
    if (!response.ok || !response.body) return NextResponse.json({ error: 'تبدیل متن به صدا ناموفق بود.' }, { status: 502 })
    const filename = `narration/${body?.slug || 'story'}-${body?.index ?? Date.now()}.mp3`
    const blob = await put(filename, response.body, { access: 'public', contentType: 'audio/mpeg', addRandomSuffix: true })
    return NextResponse.json({ url: blob.url })
  } catch {
    return NextResponse.json({ error: 'ذخیره صدای روایت ناموفق بود.' }, { status: 502 })
  }
}
