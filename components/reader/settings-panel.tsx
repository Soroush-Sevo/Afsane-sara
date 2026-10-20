'use client'

import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, X } from 'lucide-react'
import { FONT_SIZES, FONTS, LINE_HEIGHTS, THEMES, useReaderSettings, type ReaderSettings } from '@/lib/reader-settings'

type Option<T extends string> = { value: T; label: ReactNode; aria: string; style?: CSSProperties }

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Option<T>[]; onChange: (v: T) => void }) {
  return (
    <div>
      <p className="reader-panel-label">{label}</p>
      <div className="seg" role="group" aria-label={label}>
        {options.map((o) => (
          <button key={o.value} type="button" aria-pressed={value === o.value} aria-label={o.aria} style={o.style} onClick={() => onChange(o.value)}>{o.label}</button>
        ))}
      </div>
    </div>
  )
}

const sizeLabels: Record<(typeof FONT_SIZES)[number], [string, string]> = { small: ['کوچک', '0.95rem'], medium: ['متوسط', '1.2rem'], large: ['بزرگ', '1.5rem'] }

export function SettingsPanel({ onClose, triggerRef }: { onClose: () => void; triggerRef: RefObject<HTMLButtonElement | null> }) {
  const { fontSize, lineHeight, font, theme, set, reset } = useReaderSettings()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { onClose(); triggerRef.current?.focus() } }
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return
      onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onPointer) }
  }, [onClose, triggerRef])

  const pick = <K extends keyof ReaderSettings>(key: K) => (v: ReaderSettings[K]) => set(key, v)

  return (
    <motion.div ref={panelRef} id="reader-settings" role="dialog" aria-label="تنظیمات مطالعه" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} className="reader-panel">
      <div className="reader-panel-head">
        <strong>تنظیمات مطالعه</strong>
        <button type="button" aria-label="بستن تنظیمات" onClick={onClose} className="reader-panel-x"><X size={18} /></button>
      </div>
      <div className="reader-panel-body">
        <Segmented label="اندازه فونت" value={fontSize} onChange={pick('fontSize')} options={FONT_SIZES.map((v) => ({ value: v, aria: sizeLabels[v][0], label: <span style={{ fontSize: sizeLabels[v][1] }}>آ</span> }))} />
        <Segmented label="فاصله خطوط" value={lineHeight} onChange={pick('lineHeight')} options={LINE_HEIGHTS.map((v) => ({ value: v, aria: { compact: 'فشرده', comfortable: 'راحت', airy: 'باز' }[v], label: { compact: 'فشرده', comfortable: 'راحت', airy: 'باز' }[v] }))} />
        <Segmented label="فونت متن" value={font} onChange={pick('font')} options={FONTS.map((v) => ({ value: v, aria: v === 'vazir' ? 'وزیرمتن' : 'نسخ کلاسیک', label: v === 'vazir' ? 'وزیرمتن' : 'نسخ کلاسیک', style: { fontFamily: v === 'vazir' ? 'var(--font-vazir), Tahoma, sans-serif' : 'var(--font-naskh), serif' } }))} />
        <Segmented label="پوسته" value={theme} onChange={pick('theme')} options={THEMES.map((v) => ({ value: v, aria: { system: 'مطابق دستگاه', light: 'روشن', dark: 'تاریک' }[v], label: { system: 'خودکار', light: 'روشن', dark: 'تاریک' }[v] }))} />
      </div>
      <button type="button" onClick={reset} className="reader-panel-reset"><RotateCcw size={15} /> بازنشانی تنظیمات</button>
    </motion.div>
  )
}
