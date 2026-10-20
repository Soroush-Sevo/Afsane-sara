'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowLeft, BookOpen, Check, ChevronLeft, Clock3, Headphones, Heart, Home as HomeIcon, Library as LibraryIcon, Menu, Pause, Play, Search, Send, Sparkles, Trophy, UserRound, Volume2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StoryReader } from '@/components/story-reader'
import { createClient } from '@/lib/supabase/client'

type View = 'خانه' | 'کتابخانه' | 'داستان' | 'گالری' | 'کارگاه' | 'پروفایل'
type StoryCard = { title: string; source: string; age: string; progress: number; duration: string; image: string; key?: string }

const stories: StoryCard[] = [
  { title: 'رستم و سهراب', source: 'شاهنامه فردوسی', age: '۷ تا ۱۲ سال', progress: 0, duration: '۱۲ دقیقه', image: '/rustam-sohrab-reader.png' },
  { title: 'ضحاک ماردوش', source: 'شاهنامه فردوسی', age: '۱۳ تا ۱۷ سال', progress: 0, duration: '۸ دقیقه', image: '/zahhak-mardosh.png' },
  { title: 'طوطی و بازرگان', source: 'مثنوی معنوی', age: '۷ تا ۱۲ سال', progress: 0, duration: '۸ دقیقه', image: '/tuti-bazergan.png' },
]
const chapters = [
  { title: 'دیدار در دشت', text: 'در روزگاری دور، رستم برای شکار به دشتی دوردست رفت. در آنجا جوانی دلیر را دید که زره‌ای درخشان بر تن داشت و با شجاعت اسب می‌راند.', image: '/rustam-dasht.png', audio: '/api/narration?text=' + encodeURIComponent('در روزگاری دور، رستم برای شکار به دشتی دوردست رفت. در آنجا جوانی دلیر را دید که زره‌ای درخشان بر تن داشت و با شجاعت اسب می‌راند.'), question: 'رستم جوان را کجا دید؟', options: ['در دشت', 'در قصر', 'کنار دریا'], answer: 'در دشت' },
  { title: 'نشانه‌ای آشنا', text: 'جوان خود را سهراب نامید. رستم به بازوبند او نگریست؛ همان نشانه‌ای که سال‌ها پیش به تهمینه سپرده بود. دلش لرزید، اما هنوز حقیقت را نمی‌دانست.', image: '/rustam-armband.png', audio: '/api/narration?text=' + encodeURIComponent('جوان خود را سهراب نامید. رستم به بازوبند او نگریست؛ همان نشانه‌ای که سال‌ها پیش به تهمینه سپرده بود. دلش لرزید، اما هنوز حقیقت را نمی‌دانست.'), question: 'سهراب چه نشانه‌ای داشت؟', options: ['یک شمشیر', 'یک بازوبند', 'یک کلاه'], answer: 'یک بازوبند' },
  { title: 'پایان یک راز', text: 'پس از نبرد، راز بزرگ آشکار شد. رستم دریافت که سهراب پسر خودش است. این داستان به ما می‌آموزد که گفت‌وگو و شناختن یکدیگر، از هر نبردی مهم‌تر است.', image: '/rustam-revelation.png', audio: '/api/narration?text=' + encodeURIComponent('پس از نبرد، راز بزرگ آشکار شد. رستم دریافت که سهراب پسر خودش است. این داستان به ما می‌آموزد که گفت‌وگو و شناختن یکدیگر، از هر نبردی مهم‌تر است.'), question: 'پیام داستان چیست؟', options: ['گفت‌وگو مهم است', 'نبرد بهترین راه است', 'رازها را پنهان کنیم'], answer: 'گفت‌وگو مهم است' },
]

export default function Page() {
  const [view, setView] = useState<View>('خانه')
  const [menu, setMenu] = useState(false)
  const [chapter, setChapter] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)
  const [points, setPoints] = useState(120)
  const [saved, setSaved] = useState<string[]>([])
  const [catalogStories, setCatalogStories] = useState(stories)
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)
  const [narrationError, setNarrationError] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('کاربر')
  const [isAdmin, setIsAdmin] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const supabase = createClient()
  const current = chapters[chapter]
  const go = (next: View) => { setView(next); setMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  useEffect(() => {
    let active = true
    supabase.auth.getUser().then(async ({ data }) => {
      const { data: publishedStories } = await supabase.from('stories').select('title,source,age_range,duration,cover_image_url').eq('published', true).order('created_at', { ascending: false })
      if (publishedStories?.length) setCatalogStories(publishedStories.map((story, index) => ({ title: story.title, source: story.source, age: story.age_range, progress: 0, duration: story.duration, image: story.cover_image_url, key: `catalog-${index}` })))
      if (!active) return
      setAuthReady(true)
      if (!data.user) return
      setUserId(data.user.id)
      const [{ data: profile }, { data: progress }, { data: bookmarks }] = await Promise.all([
        supabase.from('profiles').select('display_name, points, is_admin').eq('id', data.user.id).maybeSingle(),
        supabase.from('story_progress').select('chapter').eq('user_id', data.user.id).maybeSingle(),
        supabase.from('saved_stories').select('story_key').eq('user_id', data.user.id),
      ])
      if (profile) { setDisplayName(profile.display_name?.trim() || data.user.user_metadata?.display_name?.trim() || data.user.email?.split('@')[0] || 'کاربر'); setPoints(profile.points); setIsAdmin(profile.is_admin === true) } else { setDisplayName(data.user.user_metadata?.display_name?.trim() || data.user.email?.split('@')[0] || 'کاربر') }
      if (progress) setChapter(Math.min(progress.chapter, chapters.length - 1))
      if (bookmarks) setSaved(bookmarks.map((item) => item.story_key))
    })
    return () => { active = false }
  }, [])
  useEffect(() => {
    if (!userId) return
    void supabase.from('story_progress').upsert({ user_id: userId, story_key: 'rustam-sohrab', chapter, updated_at: new Date().toISOString() })
  }, [chapter, userId])
  const toggleSaved = async (story: string) => {
    const next = saved.includes(story) ? saved.filter((item) => item !== story) : [...saved, story]
    setSaved(next)
    if (!userId) return
    if (next.includes(story)) await supabase.from('saved_stories').upsert({ user_id: userId, story_key: story })
    else await supabase.from('saved_stories').delete().eq('user_id', userId).eq('story_key', story)
  }
  const saveWorkshop = async () => {
    if (!userId || !note.trim()) return false
    const { error } = await supabase.from('workshop_entries').insert({ user_id: userId, story_key: 'rustam-sohrab', content: note.trim() })
    return !error
  }
  useEffect(() => () => {
    audioRef.current?.pause()
  }, [])
  // با رفتن به بخش دیگر یا خروج از صفحه داستان، روایت قبلی قطع شود.
  useEffect(() => {
    audioRef.current?.pause()
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    setPlaying(false)
  }, [chapter, view])
  const speak = async () => {
    if (playing) {
      audioRef.current?.pause()
      window.speechSynthesis.cancel()
      setPlaying(false)
      return
    }

    setNarrationError(false)
    audioRef.current?.pause()
    window.speechSynthesis.cancel()

    // Use the server-side Persian narration first. Browser speech synthesis is
    // only a fallback because it can select an unsuitable voice or read punctuation.
    if (current.audio) {
      const audio = new Audio()
      audio.src = current.audio
      audio.preload = 'auto'
      audio.setAttribute('playsinline', 'true')
      audio.onended = () => setPlaying(false)
      audio.onerror = () => setNarrationError(true)
      audioRef.current = audio
      try {
        audio.load()
        await audio.play()
        setPlaying(true)
        return
      } catch {
        audio.pause()
        audioRef.current = null
      }
    }

    if (!('speechSynthesis' in window)) {
      setNarrationError(true)
      return
    }
    const text = `${current.title} ${current.text}`
      .replace(/[.،؛:!?؟…,"'()\[\]{}<>/\\|-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const voices = await new Promise<SpeechSynthesisVoice[]>((resolve) => {
      const available = window.speechSynthesis.getVoices()
      if (available.length) { resolve(available); return }
      const timer = window.setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1200)
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        window.clearTimeout(timer)
        resolve(window.speechSynthesis.getVoices())
      }, { once: true })
    })
    const utterance = new SpeechSynthesisUtterance(text)
    const voice = voices.find((item) => item.lang.toLowerCase().startsWith('fa'))
    utterance.lang = voice?.lang || 'fa-IR'
    if (voice) utterance.voice = voice
    utterance.rate = 0.9
    utterance.onend = () => setPlaying(false)
    utterance.onerror = () => { setPlaying(false); setNarrationError(true) }
    window.speechSynthesis.speak(utterance)
    setPlaying(true)
  }
  return <main dir="rtl" className="min-h-screen bg-[#f8f3e9] pb-20 text-[#1f2933] lg:pb-0">
    <header className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-10 lg:px-16"><div className="flex items-center gap-5"><button aria-label="منو" onClick={() => setMenu(!menu)} className="rounded-full p-2 lg:hidden">{menu ? <X /> : <Menu />}</button><button onClick={() => go('خانه')} className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#183b53] text-[#e7b65b]"><Sparkles /></span><span><strong className="block font-serif text-xl text-[#183b53]">افسانه‌سرا</strong><small className="text-[10px] text-[#b17b3d]">قصه‌های سرزمین ما</small></span></button><nav className={`${menu ? 'absolute right-5 top-20 z-20 flex' : 'hidden'} flex-col gap-2 rounded-2xl border bg-[#fffaf2] p-3 shadow-xl lg:static lg:flex lg:flex-row lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}>{(['خانه', 'کتابخانه', 'گالری', 'کارگاه'] as View[]).map((item) => <button key={item} onClick={() => go(item)} className="rounded-full px-3 py-2 text-sm text-[#64707a] hover:text-[#b27632]">{item}</button>)}</nav></div><div className="flex items-center gap-2"><button aria-label="کتابخانه" onClick={() => go('کتابخانه')} className="rounded-full p-3"><Search /></button><button onClick={() => go('پروفایل')} className="flex items-center gap-2 rounded-full bg-[#efe3d0] px-2 py-2 font-bold text-[#183b53]"><span className="grid size-8 place-items-center rounded-full bg-[#d6a856] text-white"><UserRound size={16} /></span><span className="hidden sm:inline">{displayName}</span></button></div></header>
    {view === 'خانه' && <Home go={go} saved={saved} onSave={toggleSaved} stories={catalogStories} progress={Math.round((chapter / chapters.length) * 100)} />}
    {view === 'کتابخانه' && <Library go={go} saved={saved} onSave={toggleSaved} stories={catalogStories} />}
    {view === 'داستان' && <StoryReader chapter={chapter} chapters={chapters} setChapter={setChapter} current={current} playing={playing} speak={speak} narrationError={narrationError} answer={answer} setAnswer={setAnswer} points={points} setPoints={setPoints} audioRef={audioRef} />}
    {view === 'گالری' && <Gallery />}
    {view === 'کارگاه' && <Workshop note={note} setNote={setNote} sent={sent} setSent={setSent} saveWorkshop={saveWorkshop} />}
    {view === 'پروفایل' && <Profile points={points} saved={saved} go={go} displayName={displayName} userId={userId} authReady={authReady} isAdmin={isAdmin} />}
    <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-[#eadfce] bg-[#fffaf2]/95 px-4 py-2 backdrop-blur lg:hidden">{([[HomeIcon, 'خانه'], [LibraryIcon, 'کتابخانه'], [Sparkles, 'گالری'], [UserRound, 'پروفایل']] as const).map(([Icon, label]) => <button key={label} onClick={() => go(label as View)} className="flex min-h-11 flex-col items-center gap-1 text-[10px] text-[#64707a]"><Icon size={18} />{label}</button>)}</nav>
  </main>
}

function Home({ go, saved, onSave, stories, progress }: { go: (v: View) => void, saved: string[], onSave: (story: string) => void, stories: StoryCard[], progress: number }) { const visibleStories = stories.map((story, index) => index === 0 ? { ...story, progress } : story); return <><section className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 py-8 sm:px-10 lg:grid-cols-2 lg:px-16 lg:py-16"><div className="order-2 lg:order-1"><p className="font-bold text-[#b27632]">امروز در افسانه‌سرا</p><h1 className="mt-4 font-serif text-4xl font-black leading-tight text-[#183b53] sm:text-6xl">داستانی کهن،<br /><span className="text-[#bd7937]">ماجرایی تازه</span></h1><p className="mt-5 max-w-lg text-lg leading-8 text-[#64707a]">قصه‌های شیرین سرزمین‌مان را بخوان، بشنو و خودت ادامه‌شان را بساز.</p><div className="mt-8 flex flex-wrap gap-3"><Button onClick={() => go('داستان')} className="min-h-12 rounded-full bg-[#c17d3a] px-7"><Play data-icon="inline-start" fill="currentColor" /> ادامه‌ی داستان</Button><button onClick={() => go('داستان')} className="flex min-h-12 items-center gap-2 px-3 font-bold text-[#183b53]"><Headphones size={19} /> شنیدن قصه</button></div><div className="mt-8 flex gap-5 text-xs text-[#879098]"><span><Clock3 className="ml-1 inline" size={15} />۱۲ دقیقه مطالعه</span><span><Trophy className="ml-1 inline text-[#c89743]" size={15} />۲ نشان</span></div></div><div className="relative order-1 lg:order-2"><div className="overflow-hidden rounded-[30px] border-[7px] border-white shadow-2xl"><img src="/rustam-sohrab.png" alt="تصویر رستم و سهراب" className="aspect-[4/3] w-full object-cover" /></div><div className="absolute -bottom-5 left-2 rounded-2xl bg-[#fffaf2] px-4 py-3 shadow-lg"><span className="text-xs text-[#879098]">پیشرفت شما</span><strong className="block text-[#183b53]">{new Intl.NumberFormat('fa-IR').format(progress)}٪ کامل شده</strong></div></div></section><section className="border-t border-[#eadfce] bg-[#fffaf2]/70 px-5 py-12 sm:px-10 lg:px-16"><div className="mx-auto max-w-[1440px]"><div className="mb-7 flex items-end justify-between"><div><p className="font-bold text-[#b27632]">برای تو انتخاب کردیم</p><h2 className="font-serif text-3xl font-bold text-[#183b53]">قصه‌های پیشنهادی</h2></div><button onClick={() => go('کتابخانه')} className="font-bold text-[#b27632]">دیدن همه <ArrowLeft className="inline" size={16} /></button></div><div className="grid gap-5 md:grid-cols-3">{visibleStories.map((story, i) => <Card key={story.title} story={story} saved={saved.includes(story.title)} onSave={() => onSave(story.title)} onOpen={() => go('داستان')} index={i} />)}</div></div></section></> }

function Card({ story, saved, onSave, onOpen, index }: { story: typeof stories[number], saved: boolean, onSave: () => void, onOpen: () => void, index: number }) { return <article onClick={onOpen} className="cursor-pointer overflow-hidden rounded-3xl border border-[#eadfce] bg-[#fffdf9] shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className={`relative h-44 bg-gradient-to-br ${index === 0 ? 'from-[#d67b46] to-[#8d3e48]' : index === 1 ? 'from-[#31485f] to-[#182436]' : 'from-[#d6a348] to-[#7e5f34]'}`}><img src={story.image} alt={`تصویر داستان ${story.title}`} className="h-full w-full object-cover opacity-80" /><button aria-label="ذخیره داستان" onClick={(e) => { e.stopPropagation(); onSave() }} className="absolute left-3 top-3 rounded-full bg-white/90 p-2 text-[#b27632]"><Heart size={16} fill={saved ? 'currentColor' : 'none'} /></button><div className="absolute bottom-3 right-4 text-white"><small>{story.source}</small><h3 className="font-serif text-xl font-bold">{story.title}</h3></div></div><div className="p-4 text-sm text-[#879098]"><span>{story.age}</span><span className="float-left"><Clock3 className="inline" size={14} /> {story.duration}</span><div className="mt-4 h-1.5 rounded-full bg-[#ede4d8]"><div className="h-full rounded-full bg-[#d09a4b]" style={{ width: `${story.progress}%` }} /></div></div></article> }

function Library({ go, saved, onSave, stories }: { go: (v: View) => void, saved: string[], onSave: (story: string) => void, stories: StoryCard[] }) { const visibleStories = stories; return <section className="mx-auto max-w-[1200px] px-5 py-10 sm:px-10"><p className="font-bold text-[#b27632]">کتابخانه‌ی قصه‌ها</p><h1 className="mt-2 font-serif text-4xl font-black text-[#183b53]">قصه‌ای برای هر حال</h1><p className="mt-3 text-[#64707a]">داستانت را انتخاب کن و وارد ماجرا شو.</p><div className="my-8 flex flex-wrap gap-2">{['همه��ی قصه‌ها', 'شاهنامه', 'مثنوی', 'افسانه‌های محلی'].map((x, i) => <button key={x} className={`rounded-full px-5 py-3 text-sm ${i === 0 ? 'bg-[#183b53] text-white' : 'border border-[#ddcdb7] text-[#64707a]'}`}>{x}</button>)}</div><div className="grid gap-5 md:grid-cols-3">{visibleStories.map((story, i) => <Card key={story.title} story={story} saved={saved.includes(story.title)} onSave={() => onSave(story.title)} onOpen={() => go('داستان')} index={i} />)}</div></section> }

function Reader({ chapter, setChapter, current, playing, speak, narrationError, answer, setAnswer, points, setPoints }: { chapter: number, setChapter: (v: number) => void, current: typeof chapters[number], playing: boolean, speak: () => void, narrationError: boolean, answer: string | null, setAnswer: (v: string) => void, points: number, setPoints: (v: number) => void }) { return <section className="mx-auto max-w-4xl px-5 py-8 sm:px-10"><div className="mb-5 flex items-center justify-between text-sm text-[#b27632]"><button disabled={!chapter} onClick={() => { setChapter(chapter - 1); setAnswer('') }}><ChevronLeft className="inline rotate-180" /> قبلی</button><span>رستم و سهراب · بخش {chapter + 1} از {chapters.length}</span><span><Trophy className="inline" size={16} /> {points}</span></div><div className="mb-7 h-2 rounded-full bg-[#e8ddce]"><div className="h-full rounded-full bg-[#c17d3a]" style={{ width: `${((chapter + 1) / chapters.length) * 100}%` }} /></div><article className="overflow-hidden rounded-[30px] border border-[#eadfce] bg-[#fffaf2] shadow-xl"><img src={current.image || '/rustam-sohrab-reader.png'} alt={`تصویر ${current.title}`} className="h-56 w-full object-cover sm:h-72" /><div className="p-6 sm:p-10"><div className="flex items-center justify-between"><h1 className="font-serif text-3xl font-black text-[#183b53]">{current.title}</h1><button aria-label={playing ? 'توقف روایت' : 'پخش روایت فارسی'} title="پخش با صدای فارسی Google Translate" onClick={speak} className="grid size-12 place-items-center rounded-full bg-[#f0dfbb] text-[#a96e2f] disabled:cursor-not-allowed disabled:opacity-40">{playing ? <Pause /> : <Volume2 />}</button></div><p className="mt-5 text-lg leading-10 text-[#4d5961]">{current.text}</p>{narrationError && <p role="status" className="mt-3 text-sm font-bold text-[#b24b3f]">پخش صدا انجام نشد؛ دوباره روی دکمه‌ی پخش بزنید.</p>}<div className={`mt-8 rounded-2xl bg-[#f7eedf] p-5 ${chapter === chapters.length - 1 ? '' : 'hidden'}`}><h2 className="mb-3 font-bold text-[#183b53]"><Sparkles className="ml-1 inline" size={18} /> یک پرسش کوچک</h2><p className="mb-4 text-[#64707a]">{current.question}</p><div className="grid gap-2 sm:grid-cols-3">{current.options.map((option) => <button key={option} onClick={() => { setAnswer(option); if (option === current.answer) setPoints(points + 10) }} className={`min-h-11 rounded-xl border px-3 ${answer === option ? option === current.answer ? 'border-green-600 bg-green-50' : 'border-red-400 bg-red-50' : 'border-[#ddcdb7] bg-[#fffaf2]'}`}>{answer === option && option === current.answer && <Check className="ml-1 inline" size={16} />}{option}</button>)}</div>{answer && <p className="mt-3 text-sm font-bold text-[#b27632]">{answer === current.answer ? 'آفرین! پاسخ درست بود.' : `پاسخ درست: ${current.answer}`}</p>}</div><div className="mt-8 flex justify-between"><Button disabled={chapter === chapters.length - 1} onClick={() => { setChapter(chapter + 1); setAnswer('') }} className="min-h-11 rounded-full bg-[#c17d3a]">بخش بعدی <ArrowLeft data-icon="inline-end" /></Button><button onClick={speak} className="font-bold text-[#183b53]"><Headphones className="inline" size={18} /> {playing ? 'توقف' : 'شنیدن'}</button></div></div></article></section> }

function Gallery() { return <section className="mx-auto max-w-4xl px-5 py-10 sm:px-10"><p className="font-bold text-[#b27632]">گالری اسطوره‌ها</p><h1 className="mt-2 font-serif text-4xl font-black text-[#183b53]">قهرمانان قصه‌ها</h1><div className="mt-8 grid gap-5 sm:grid-cols-2">{[['ر', 'رستم', 'پهلوان ایران'], ['س', 'سهراب', 'جوان دلاور'], ['س', 'سیمرغ', 'پرنده‌ی دانا'], ['ت', 'تهمینه', 'بانوی خردمند']].map(([letter, name, role]) => <article key={name} className="rounded-3xl border border-[#eadfce] bg-[#fffaf2] p-6"><div className="grid size-16 place-items-center rounded-2xl bg-[#e6d5b9] font-serif text-2xl font-bold text-[#b27632]">{letter}</div><p className="mt-5 text-sm text-[#b27632]">{role}</p><h2 className="font-serif text-2xl font-bold text-[#183b53]">{name}</h2><p className="mt-2 leading-8 text-[#64707a]">شخصیتی ماندگار از داستان‌های کهن ایران.</p></article>)}</div></section> }

function Workshop({ note, setNote, sent, setSent, saveWorkshop }: { note: string, setNote: (v: string) => void, sent: boolean, setSent: (v: boolean) => void, saveWorkshop: () => Promise<boolean> }) { return <section className="mx-auto max-w-3xl px-5 py-10 sm:px-10"><p className="font-bold text-[#b27632]">کارگاه داستان</p><h1 className="mt-2 font-serif text-4xl font-black text-[#183b53]">ادامه‌ی قصه را تو بنویس</h1><div className="mt-8 rounded-3xl border border-[#eadfce] bg-[#fffaf2] p-6 sm:p-8"><p className="rounded-2xl bg-[#f7eedf] p-5 text-lg leading-9">«رستم بازوبند را دید و فهمید که این جوان، فرزند خودش است. او یک قدم جلو رفت و گفت...»</p><label htmlFor="note" className="mt-6 block font-bold">ادامه‌ی تو</label><textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} className="mt-2 min-h-48 w-full rounded-2xl border border-[#ddcdb7] bg-white p-4 text-base leading-8" placeholder="اینجا بنویس..." /><Button disabled={!note.trim()} onClick={async () => { if (await saveWorkshop()) setSent(true) }} className="mt-4 min-h-11 rounded-full bg-[#183b53]"><Send data-icon="inline-start" /> ذخیره‌ی نوشته</Button>{sent && <p className="mt-4 font-bold text-green-700"><Check className="inline" size={18} /> نوشته‌ات ذخیره شد.</p>}</div></section> }

function Profile({ points, saved, go, displayName, userId, authReady, isAdmin }: { points: number, saved: string[], go: (v: View) => void, displayName: string, userId: string | null, authReady: boolean, isAdmin: boolean }) { if (!authReady) return <section className="mx-auto max-w-3xl px-5 py-10"><p className="text-[#64707a]">در حال بارگذاری پروفایل...</p></section>; if (!userId) return <section className="mx-auto max-w-3xl px-5 py-10"><div className="rounded-3xl bg-[#183b53] p-8 text-white"><UserRound size={40} className="mb-4 text-[#e7b65b]" /><h1 className="font-serif text-3xl font-bold">پروفایل قصه‌خوان</h1><p className="mt-3 leading-8 text-[#d8c9b5]">برای ذخیره‌ی پیشرفت، نشان‌ها و نوشته‌ها وارد حساب شو.</p><div className="mt-6 flex flex-wrap gap-3"><a href="/auth/login" className="rounded-full bg-[#c17d3a] px-6 py-3 font-bold text-white">ورود</a><a href="/auth/sign-up" className="rounded-full border border-white/30 px-6 py-3 font-bold text-white">ثبت‌نام</a></div></div></section>; return <section className="mx-auto max-w-3xl px-5 py-10 sm:px-10"><div className="rounded-3xl bg-[#183b53] p-8 text-white"><UserRound size={40} className="mb-4 text-[#e7b65b]" /><p className="text-[#d8c9b5]">سلام {displayName}</p><h1 className="font-serif text-3xl font-bold">ماجراجوی قصه‌ها</h1><div className="mt-8 grid grid-cols-3 text-center"><div><b className="block text-2xl text-[#e7b65b]">{points}</b><small>امتیاز</small></div><div><b className="block text-2xl text-[#e7b65b]">۲</b><small>نشان</small></div><div><b className="block text-2xl text-[#e7b65b]">{saved.length}</b><small>ذخیره‌شده</small></div></div></div><div className="mt-6 rounded-3xl border border-[#eadfce] bg-[#fffaf2] p-6"><h2 className="font-serif text-2xl font-bold text-[#183b53]">ادامه‌ی ماجرا</h2><p className="my-4 text-[#64707a]">رستم و سهراب را دنبال کن و امتیاز بگیر.</p><div className="flex flex-wrap gap-3"><Button onClick={() => go('داستان')} className="rounded-full bg-[#c17d3a]">ادامه‌ی خواندن</Button>{isAdmin && <a href="/admin" className="rounded-full border border-[#ddcdb7] px-5 py-3 font-bold text-[#183b53]">پنل مدیریت</a>}</div></div></section> }
