'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import { BookOpen, ChevronLeft, ChevronRight, Info, Pause, Settings2, Trophy, Volume2 } from 'lucide-react'
import { glossary } from '@/lib/glossary'
import { buildGlossaryMatcher, parseContent, unitWeights } from '@/lib/reader-content'
import { useReaderSettings } from '@/lib/reader-settings'
import { useAudioSync } from '@/hooks/use-audio-sync'
import { usePrefersDark } from '@/hooks/use-prefers-dark'
import { useReadingProgress } from '@/hooks/use-reading-progress'
import { GlossaryPopover } from './reader/glossary-popover'
import { ReaderText, type WordAnchor } from './reader/reader-text'
import { SettingsPanel } from './reader/settings-panel'
import { StoryChoices } from './reader/story-choices'

type Chapter = {
  title: string
  text: string
  image: string
  question: string
  options: string[]
  answer: string
  audio?: string
  /** زمان شروع هر جمله/بیت به ثانیه (اختیاری). اگر نباشد، هم‌زمان‌سازی تخمینی است. */
  sentenceTimes?: number[]
}

type StoryReaderProps = {
  chapter: number
  chapters: Chapter[]
  setChapter: (value: number) => void
  current: Chapter
  playing: boolean
  speak: () => void
  narrationError: boolean
  answer: string | null
  setAnswer: (value: string) => void
  points: number
  setPoints: (value: number) => void
  /** المان صوتی‌ای که page.tsx می‌سازد؛ برای هایلایت هم‌زمان متن. */
  audioRef?: { current: HTMLAudioElement | null }
}

const fa = new Intl.NumberFormat('fa-IR')
const glossaryMatcher = buildGlossaryMatcher(Object.keys(glossary))

export function StoryReader({ chapter, chapters, setChapter, current, playing, speak, narrationError, answer, setAnswer, points, setPoints, audioRef }: StoryReaderProps) {
  const { fontSize, lineHeight, font, theme } = useReaderSettings()
  const prefersDark = usePrefersDark()
  const resolvedTheme = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme

  const articleRef = useRef<HTMLElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const settingsButtonRef = useRef<HTMLButtonElement>(null)
  const previousChapter = useRef(chapter)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [word, setWord] = useState<WordAnchor | null>(null)
  const [awarded, setAwarded] = useState<Set<number>>(() => new Set())

  const blocks = useMemo(() => parseContent(current.text), [current.text])
  const weights = useMemo(() => unitWeights(blocks), [blocks])
  const activeUnit = useAudioSync(audioRef, playing, weights, current.sentenceTimes, chapter)
  const progress = useReadingProgress(articleRef, chapter, chapters.length)

  const closeWord = useCallback(() => setWord(null), [])
  const closeSettings = useCallback(() => setSettingsOpen(false), [])

  // با تغییر اندازه/فونت/فاصله، موقعیت تولتیپ نامعتبر می‌شود.
  useEffect(() => { setWord(null) }, [fontSize, lineHeight, font])

  // رفتن به بخش دیگر: اسکرول نرم به ابتدای متن (با احترام به prefers-reduced-motion).
  useEffect(() => {
    if (previousChapter.current === chapter) return
    previousChapter.current = chapter
    setWord(null)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    articleRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }, [chapter])

  const goTo = (index: number) => { setChapter(index); setAnswer('') }

  const pick = (option: string) => {
    setAnswer(option)
    // امتیاز هر بخش فقط یک بار داده می‌شود (قبلاً با تغییر پاسخ می‌شد چند بار امتیاز گرفت).
    if (option === current.answer && !awarded.has(chapter)) {
      setAwarded(new Set(awarded).add(chapter))
      setPoints(points + 10)
    }
  }

  const isLast = chapter === chapters.length - 1

  return (
    <MotionConfig reducedMotion="user">
      <section dir="rtl" className="reader" data-theme={resolvedTheme} data-size={fontSize} data-leading={lineHeight} data-font={font}>
        <div className="reader-progress" role="progressbar" aria-label="پیشرفت مطالعه" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <div className="reader-progress-fill" style={{ transform: `scaleX(${progress / 100})` }} />
        </div>

        <div className="mx-auto max-w-4xl px-5 py-8 sm:px-10">
          <div className="mb-4 flex items-center justify-between gap-3 text-sm reader-accent">
            <button type="button" disabled={!chapter} onClick={() => goTo(chapter - 1)} className="reader-link"><ChevronRight size={18} aria-hidden="true" /> قبلی</button>
            <span className="text-center">رستم و سهراب · بخش {fa.format(chapter + 1)} از {fa.format(chapters.length)}</span>
            <span className="flex shrink-0 items-center gap-1"><Trophy size={16} aria-hidden="true" /> {fa.format(points)}</span>
          </div>

          <div className="relative mb-5">
            <div className="reader-bar">
              <span className="flex items-center gap-2"><BookOpen size={17} aria-hidden="true" /> {fa.format(progress)}٪ خوانده‌ای</span>
              <button ref={settingsButtonRef} type="button" aria-expanded={settingsOpen} aria-controls="reader-settings" onClick={() => setSettingsOpen((v) => !v)} className="reader-link font-bold"><Settings2 size={17} aria-hidden="true" /> تنظیمات متن</button>
            </div>
            {/* پنل روی محتوا شناور است؛ باز شدنش متن را پایین نمی‌اندازد. */}
            <AnimatePresence>{settingsOpen && <SettingsPanel onClose={closeSettings} triggerRef={settingsButtonRef} />}</AnimatePresence>
          </div>

          <article ref={articleRef} className="reader-card">
            <img src={current.image || '/rustam-sohrab-reader.png'} alt={`تصویر ${current.title}`} className="h-56 w-full object-cover sm:h-72" />
            <div className="p-6 sm:p-10">
              <div className="flex items-center justify-between gap-4">
                <h1 className="reader-title">{current.title}</h1>
                <button type="button" aria-label={playing ? 'توقف روایت' : 'پخش روایت فارسی'} aria-pressed={playing} onClick={speak} className="reader-icon-btn">{playing ? <Pause aria-hidden="true" /> : <Volume2 aria-hidden="true" />}</button>
              </div>

              <div ref={textRef} className="relative mt-6">
                <ReaderText blocks={blocks} activeUnit={activeUnit} matcher={glossaryMatcher} glossary={glossary} openTerm={word?.term ?? null} onOpen={setWord} />
                <AnimatePresence>{word && <GlossaryPopover key={word.term} anchor={word} container={textRef.current} onClose={closeWord} />}</AnimatePresence>
              </div>

              {narrationError && <p role="status" className="reader-error">پخش صدا انجام نشد؛ دوباره روی دکمه‌ی پخش بزنید.</p>}

              {isLast && <StoryChoices key={chapter} question={current.question} options={current.options} correct={current.answer} selected={answer || null} onPick={pick} />}

              <div className="reader-footer">
                <button type="button" disabled={!chapter} onClick={() => goTo(chapter - 1)} className="reader-btn">قبلی</button>
                <button type="button" disabled={isLast} onClick={() => goTo(chapter + 1)} className="reader-btn reader-btn-primary">بخش بعدی <ChevronLeft size={18} aria-hidden="true" /></button>
              </div>
            </div>
          </article>

          <p className="reader-hint"><Info size={14} aria-hidden="true" /> روی واژه‌های خط‌چین بزن (یا نگه دار) تا معنی‌شان را ببینی.</p>
        </div>
      </section>
    </MotionConfig>
  )
}
