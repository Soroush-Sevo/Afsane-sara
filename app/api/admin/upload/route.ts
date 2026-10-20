import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'ورود لازم است.' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
  if (!profile?.is_admin) return NextResponse.json({ error: 'دسترسی مدیر لازم است.' }, { status: 403 })

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'فایلی انتخاب نشده است.' }, { status: 400 })
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'فقط فایل تصویری مجاز است.' }, { status: 400 })
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'حجم تصویر باید کمتر از ۸ مگابایت باشد.' }, { status: 400 })

  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, '-').replace(/-+/g, '-')
  const blob = await put(`stories/${user.id}/${Date.now()}-${safeName || 'image.jpg'}`, file, { access: 'public', addRandomSuffix: false })
  return NextResponse.json({ url: blob.url })
}
