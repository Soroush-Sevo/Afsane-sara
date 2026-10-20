'use client'

import { Fragment, memo, type KeyboardEvent, type MouseEvent } from 'react'
import { segmentText, type Block } from '@/lib/reader-content'

export type WordAnchor = { term: string; definition: string; rect: DOMRect }

type Props = {
  blocks: Block[]
  activeUnit: number
  matcher: RegExp | null
  glossary: Record<string, string>
  openTerm: string | null
  onOpen: (anchor: WordAnchor) => void
}

// اگر واژه در دو خط شکسته شده باشد، مستطیل همان خطی را برمی‌گردانیم که لمس شده است.
function pickRect(el: HTMLElement, point?: { x: number; y: number }) {
  const rects = Array.from(el.getClientRects())
  if (point) {
    const hit = rects.find((r) => point.x >= r.left && point.x <= r.right && point.y >= r.top && point.y <= r.bottom)
    if (hit) return hit as DOMRect
  }
  return (rects[0] ?? el.getBoundingClientRect()) as DOMRect
}

function ReaderTextImpl({ blocks, activeUnit, matcher, glossary, openTerm, onOpen }: Props) {
  let unit = 0

  const renderSegments = (text: string) =>
    segmentText(text, matcher).map((seg, i) => {
      const term = seg.term
      if (!term || !Object.prototype.hasOwnProperty.call(glossary, term)) return <Fragment key={i}>{seg.text}</Fragment>
      const open = (el: HTMLElement, point?: { x: number; y: number }) => onOpen({ term, definition: glossary[term], rect: pickRect(el, point) })
      return (
        <span
          key={i}
          role="button"
          tabIndex={0}
          aria-haspopup="dialog"
          aria-expanded={openTerm === term}
          className="glossary-word"
          onClick={(e: MouseEvent<HTMLElement>) => open(e.currentTarget, { x: e.clientX, y: e.clientY })}
          // لمس طولانی در اندروید رویداد contextmenu می‌فرستد؛ به‌جای منوی سیستم، معنی را نشان می‌دهیم.
          onContextMenu={(e: MouseEvent<HTMLElement>) => { e.preventDefault(); open(e.currentTarget, { x: e.clientX, y: e.clientY }) }}
          onKeyDown={(e: KeyboardEvent<HTMLElement>) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e.currentTarget) }
          }}
        >
          {seg.text}
        </span>
      )
    })

  return (
    <div className="reader-prose">
      {blocks.map((block, b) => {
        if (block.type === 'verse') {
          return (
            <div key={b} className="reader-block reader-verse" role="group" aria-label="ابیات">
              {block.couplets.map(([first, second], c) => {
                const index = unit++
                return (
                  <div key={c} className="reader-unit reader-couplet" data-unit={index} data-active={index === activeUnit}>
                    <span className="hemistich">{renderSegments(first)}</span>
                    <span className="hemistich">{renderSegments(second)}</span>
                  </div>
                )
              })}
            </div>
          )
        }
        return (
          <p key={b} className="reader-block">
            {block.sentences.map((sentence, s) => {
              const index = unit++
              return (
                <Fragment key={s}>
                  <span className="reader-unit" data-unit={index} data-active={index === activeUnit}>{renderSegments(sentence)}</span>{' '}
                </Fragment>
              )
            })}
          </p>
        )
      })}
    </div>
  )
}

export const ReaderText = memo(ReaderTextImpl)
