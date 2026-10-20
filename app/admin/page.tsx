'use client'

import { FormEvent, useEffect, useState } from 'react'
import { ImagePlus, LockKeyhole, Pencil, Plus, Save, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

type Chapter = { title: string; text: string; image?: string; question?: string; options?: string[]; answer?: string }
type Story = {
  id: string
  slug: string
  title: string
  source: string
  age_range: string
  duration: string
  cover_image_url: string
  description: string
  chapters: Chapter[]
  published: boolean
}

type FormState = Omit<Story, 'id' | 'chapters'> & { chaptersText: string; chapterImagesText: string }
const emptyForm: FormState = { slug: '', title: '', source: 'شاهنامه فردوسی', age_range: '۷ تا ۱۲ سال', duration: '۸ دقیقه', cover_image_url: '', description: '', chaptersText: '', chapterImagesText: '', published: false }

export default function AdminPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [stories, setStories] = useState<Story[]>([])
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [loadError, setLoadError] = useState('')

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    setUserId(user.id)
    const { data: profile, error: profileError } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
    if (profileError) { setLoadError(`خطا در بررسی دسترسی: ${profileError.message}`); setLoading(false); return }
    if (!profile?.is_admin) { setLoading(false); return }
    setAllowed(true)
    const { data, error: storiesError } = await supabase.from('stories').select('id,slug,title,source,age_range,duration,cover_image_url,description,chapters,published').order('created_at', { ascending: false })
    if (storiesError) setLoadError(`خطا در بارگذاری داستان‌ها: ${storiesError.message}`)
    setStories((data ?? []) as Story[])
    setLoading(false)
  }
  useEffect(() => { void load() }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!userId) return
    let chapters: Story['chapters']
    try {
      chapters = JSON.parse(form.chaptersText || '[]')
      const chapterImages = JSON.parse(form.chapterImagesText || '[]')
      if (!Array.isArray(chapters) || !Array.isArray(chapterImages)) throw new Error()
      chapters = chapters.map((chapter, index) => ({ ...chapter, image: chapterImages[index] || chapter.image || undefined }))
    } catch { setMessage('ساختار فصل‌ها و تصاویر باید JSON معتبر باشد.'); return }
    const payload = { slug: form.slug.trim(), title: form.title.trim(), source: form.source.trim(), age_range: form.age_range.trim(), duration: form.duration.trim(), cover_image_url: form.cover_image_url.trim(), description: form.description.trim(), chapters, published: form.published, created_by: userId, updated_at: new Date().toISOString() }
    const result = editingId ? await supabase.from('stories').update(payload).eq('id', editingId) : await supabase.from('stories').insert(payload)
    if (result.error) { setMessage(result.error.message); return }
    setMessage('داستان ذخیره شد.')
    setForm(emptyForm); setEditingId(null); await load()
  }

  const edit = (story: Story) => { setEditingId(story.id); setForm({ ...story, chaptersText: JSON.stringify(story.chapters, null, 2), chapterImagesText: JSON.stringify(story.chapters.map((chapter) => chapter.image || ''), null, 2) }); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const remove = async (id: string) => { if (!window.confirm('این داستان حذف شود؟')) return; await supabase.from('stories').delete().eq('id', id); await load() }
  const update = (key: keyof FormState, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }))
  const uploadImage = async (file: File) => {
    const body = new FormData()
    body.append('file', file)
    const response = await fetch('/api/admin/upload', { method: 'POST', body })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'آپلود تصویر ناموفق بود.')
    return result.url as string
  }
  const handleCoverUpload = async (file?: File) => {
    if (!file) return
    try { update('cover_image_url', await uploadImage(file)); setMessage('تصویر جلد آپلود شد.') } catch (error) { setMessage(error instanceof Error ? error.message : 'آپلود تصویر ناموفق بود.') }
  }

  if (loading) return <main dir="rtl" className="grid min-h-screen place-items-center bg-[#f8f3e9]">در حال بررسی دسترسی...</main>
  if (!allowed) return <main dir="rtl" className="grid min-h-screen place-items-center bg-[#f8f3e9] px-5"><div className="max-w-md rounded-3xl bg-[#183b53] p-8 text-center text-white"><LockKeyhole className="mx-auto mb-4 text-[#e7b65b]" size={42} /><h1 className="font-serif text-3xl font-bold">دسترسی مدیر لازم است</h1><p className="mt-3 leading-8 text-[#d8c9b5]">این بخش فقط برای مدیران افسانه‌سراست.</p><a className="mt-6 inline-block rounded-full bg-[#c17d3a] px-6 py-3 font-bold" href="/">بازگشت به سایت</a></div></main>
  return <main dir="rtl" className="min-h-screen bg-[#f8f3e9] px-4 py-6 text-[#1f2933] sm:px-8"><div className="mx-auto max-w-6xl"><header className="mb-6 flex items-center justify-between"><div><p className="font-bold text-[#b27632]">افسانه‌سرا</p><h1 className="font-serif text-3xl font-black text-[#183b53]">مدیریت داستان‌ها</h1></div><a href="/" className="rounded-full border border-[#ddcdb7] px-4 py-3 text-sm font-bold">مشاهده سایت</a></header><section className="rounded-3xl border border-[#eadfce] bg-[#fffaf2] p-5 shadow-sm sm:p-8"><div className="mb-5 flex items-center gap-3"><ImagePlus className="text-[#b27632]" /><h2 className="font-serif text-2xl font-bold text-[#183b53]">{editingId ? 'ویرایش داستان' : 'افزودن داستان جدید'}</h2></div><form onSubmit={submit} className="grid gap-4 md:grid-cols-2"><label>عنوان<input required value={form.title} onChange={(e) => update('title', e.target.value)} /></label><label>شناسه انگلیسی<input required pattern="[a-z0-9-]+" value={form.slug} onChange={(e) => update('slug', e.target.value)} placeholder="story-name" /></label><label>منبع<input value={form.source} onChange={(e) => update('source', e.target.value)} /></label><label>گروه سنی<input value={form.age_range} onChange={(e) => update('age_range', e.target.value)} /></label><label>مدت<input value={form.duration} onChange={(e) => update('duration', e.target.value)} /></label><label>تصویر جلد<div className="flex gap-2"><input required value={form.cover_image_url} onChange={(e) => update('cover_image_url', e.target.value)} placeholder="آد��س تصویر یا آپلود فایل" /><label className="grid min-w-12 cursor-pointer place-items-center rounded-xl bg-[#e7d6b9] text-[#183b53]" aria-label="آپلود تصویر جلد"><ImagePlus size={18} /><input type="file" accept="image/*" className="sr-only" onChange={(e) => void handleCoverUpload(e.target.files?.[0])} /></label></div>{form.cover_image_url && <img src={form.cover_image_url} alt="پیش‌نمایش جلد" className="mt-2 h-24 w-40 rounded-xl object-cover" />}</label><label className="md:col-span-2">توضیح کوتاه<textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={3} /></label><label className="md:col-span-2">فصل‌ها به JSON<textarea required value={form.chaptersText} onChange={(e) => update('chaptersText', e.target.value)} rows={10} placeholder={'[{"title":"فصل اول","text":"متن داستان...","question":"...","options":["..."],"answer":"..."}]'} /></label><label className="md:col-span-2">تصاویر فصل‌ها به ت��تیب<textarea value={form.chapterImagesText} onChange={(e) => update('chapterImagesText', e.target.value)} rows={5} placeholder={'["https://.../chapter-1.jpg", "https://.../chapter-2.jpg"]'} /><span className="mt-1 block text-xs text-[#879098]">برای هر فصل یک آدرس تصویر وارد کن؛ یا از دکمه آپلود چندتصویری استفاده کن.</span><label className="mt-2 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-[#e7d6b9] px-4 font-bold text-[#183b53]"><ImagePlus size={18} /> آپلود تصاویر فصل‌ها<input type="file" accept="image/*" multiple className="sr-only" onChange={async (e) => { const files = Array.from(e.target.files || []); try { const urls = await Promise.all(files.map(uploadImage)); update('chapterImagesText', JSON.stringify(urls, null, 2)); setMessage(`${urls.length} تصویر فصل آپلود شد.`) } catch (error) { setMessage(error instanceof Error ? error.message : 'آپلود تصاویر ناموفق بود.') } }} /></label></label><label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={form.published} onChange={(e) => update('published', e.target.checked)} /> انتشار در کتابخانه</label><div className="flex flex-wrap gap-3 md:col-span-2"><Button type="submit" className="min-h-11 rounded-full bg-[#183b53]"><Save data-icon="inline-start" /> ذخیره داستان</Button>{editingId && <Button type="button" variant="outline" className="min-h-11 rounded-full" onClick={() => { setEditingId(null); setForm(emptyForm) }}>انصراف</Button>}</div>{message && <p className="md:col-span-2 font-bold text-[#b27632]">{message}</p>}</form></section><section className="mt-6 grid gap-4 md:grid-cols-2">{stories.map((story) => <article key={story.id} className="flex gap-4 rounded-3xl border border-[#eadfce] bg-[#fffaf2] p-4"><img src={story.cover_image_url} alt={`جلد ${story.title}`} className="size-24 rounded-2xl object-cover" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h2 className="font-serif text-xl font-bold text-[#183b53]">{story.title}</h2><p className="text-sm text-[#64707a]">{story.published ? 'منتشر شده' : 'پیش‌نویس'} · {story.chapters.length} فصل</p></div><button aria-label="حذف داستان" onClick={() => remove(story.id)} className="rounded-full p-2 text-red-700"><Trash2 size={18} /></button></div><button onClick={() => edit(story)} className="mt-3 flex min-h-11 items-center gap-2 rounded-full border border-[#ddcdb7] px-4 text-sm font-bold"><Pencil size={16} /> ویرایش</button></div></article>)}{stories.length === 0 && <p className="rounded-3xl border border-dashed border-[#ddcdb7] p-8 text-center text-[#64707a] md:col-span-2">هنوز داستانی در پنل ثبت نشده است.</p>}</section></div><style jsx>{`label{display:flex;flex-direction:column;gap:.5rem;font-weight:700;color:#183b53}input,textarea{border:1px solid #ddcdb7;border-radius:1rem;background:white;padding:.75rem;font:inherit;font-weight:400;min-height:44px}textarea{line-height:1.8}`}</style></main>
}
