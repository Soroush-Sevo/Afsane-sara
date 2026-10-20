'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, Volume2 } from 'lucide-react'

type TimedParagraph = { text: string; start: number; end: number }

type StoryAudioPlayerProps = {
  src: string
  paragraphs: TimedParagraph[]
  title?: string
}

export function StoryAudioPlayer({ src, paragraphs, title = 'روایت داستان' }: StoryAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  const activeParagraph = useMemo(() => paragraphs[activeIndex], [paragraphs, activeIndex])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const update = () => {
      const time = audio.currentTime
      const nextIndex = paragraphs.findIndex((paragraph) => time >= paragraph.start && time < paragraph.end)
      setActiveIndex(nextIndex)
      setProgress(audio.duration ? (time / audio.duration) * 100 : 0)
    }
    const ready = () => setDuration(audio.duration || 0)
    audio.addEventListener('timeupdate', update)
    audio.addEventListener('loadedmetadata', ready)
    audio.addEventListener('ended', () => setPlaying(false))
    return () => {
      audio.removeEventListener('timeupdate', update)
      audio.removeEventListener('loadedmetadata', ready)
    }
  }, [paragraphs])

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      await audio.play()
      setPlaying(true)
    } else {
      audio.pause()
      setPlaying(false)
    }
  }

  const seekToParagraph = (index: number) => {
    const audio = audioRef.current
    const paragraph = paragraphs[index]
    if (!audio || !paragraph) return
    audio.currentTime = paragraph.start
    setActiveIndex(index)
    void audio.play()
    setPlaying(true)
  }

  return (
    <div className="rounded-3xl border border-[#eadfce] bg-[#fffaf2] p-5 shadow-sm" dir="rtl">
      <audio ref={audioRef} src={src} preload="metadata" aria-label={title} />
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => void toggle()} aria-label={playing ? 'توقف روایت' : 'پخش روایت'} className="grid size-12 shrink-0 place-items-center rounded-full bg-[#c17d3a] text-white">
          {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[#183b53]">{title}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eadfce]">
            <div className="h-full rounded-full bg-[#d09a4b] transition-[width]" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-[#879098]">{activeParagraph ? 'همراه با متن بخوان' : duration ? `${Math.round(duration)} ثانیه` : 'در حال آماده‌سازی صدا'}</p>
        </div>
        <Volume2 className="text-[#b27632]" size={20} aria-hidden="true" />
      </div>
      <div className="mt-5 space-y-2">
        {paragraphs.map((paragraph, index) => (
          <button key={`${paragraph.start}-${index}`} type="button" onClick={() => seekToParagraph(index)} className={`block w-full rounded-2xl p-3 text-right leading-8 transition ${index === activeIndex ? 'bg-[#f0dfbb] font-bold text-[#183b53]' : 'text-[#4d5961] hover:bg-[#f7eedf]'}`}>
            {paragraph.text}
          </button>
        ))}
      </div>
      <button type="button" onClick={() => { if (audioRef.current) audioRef.current.currentTime = 0 }} className="mt-3 flex items-center gap-2 text-xs text-[#879098] hover:text-[#b27632]"><RotateCcw size={14} /> از ابتدا</button>
    </div>
  )
}
