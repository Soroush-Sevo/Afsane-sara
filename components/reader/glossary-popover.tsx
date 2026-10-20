'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { WordAnchor } from './reader-text'

type Position = { left: number; width: number; arrow: number; above: boolean; offset: number }

/**
 * تولتیپ معنی واژه. به‌صورت absolute داخل ظرف متن قرار می‌گیرد (نه داخل جریان متن)،
 * پس باز و بسته شدنش هیچ پرش یا Layout Shift ای ایجاد نمی‌کند.
 */
export function GlossaryPopover({ anchor, container, onClose }: { anchor: WordAnchor; container: HTMLElement | null; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<Position | null>(null)

  useLayoutEffect(() => {
    if (!container) return
    const c = container.getBoundingClientRect()
    const width = Math.min(288, c.width - 16)
    const center = anchor.rect.left + anchor.rect.width / 2 - c.left
    const left = Math.min(Math.max(center - width / 2, 8), c.width - width - 8)
    const above = anchor.rect.bottom + 180 > window.innerHeight && anchor.rect.top > 200
    const offset = above ? c.height - (anchor.rect.top - c.top) + 10 : anchor.rect.bottom - c.top + 10
    setPos({ left, width, above, offset, arrow: Math.min(Math.max(center - left, 18), width - 18) })
  }, [anchor, container])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const onPointer = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      if (ref.current?.contains(target) || target.closest('.glossary-word')) return
      onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    window.addEventListener('resize', onClose)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('resize', onClose)
    }
  }, [onClose])

  if (!pos) return null
  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-label={`معنی ${anchor.term}`}
      aria-live="polite"
      initial={{ opacity: 0, y: pos.above ? 4 : -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="reader-popover"
      style={{ left: pos.left, width: pos.width, ...(pos.above ? { bottom: pos.offset } : { top: pos.offset }) }}
    >
      <span className="reader-popover-arrow" data-above={pos.above} style={{ left: pos.arrow }} aria-hidden="true" />
      <button type="button" aria-label="بستن معنی" onClick={onClose} className="reader-popover-close"><X size={16} /></button>
      <strong className="reader-popover-term">{anchor.term}</strong>
      <p>{anchor.definition}</p>
    </motion.div>
  )
}
