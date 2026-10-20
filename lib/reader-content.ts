/**
 * قالب متن داستان (فیلد text هر فصل):
 *  - پاراگراف‌ها با یک خط خالی از هم جدا می‌شوند.
 *  - اگر همهٔ خطوط یک بلوک علامت «|» داشته باشند، آن بلوک شعر است و هر خط یک بیت است:
 *        چو رستم بدید آن گرانمایه را | بدو گفت کای نامور پایه را
 *    سمت راست «|» مصرع اول و سمت چپ آن مصرع دوم است.
 */
export type Block =
  | { type: 'prose'; sentences: string[] }
  | { type: 'verse'; couplets: [string, string][] }

export function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!؟?…]+[.!؟?…]*\s*/g)
  return parts ? parts.map((s) => s.trim()).filter(Boolean) : [text]
}

export function parseContent(text: string): Block[] {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block): Block => {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
      if (lines.every((l) => l.includes('|'))) {
        return {
          type: 'verse',
          couplets: lines.map((line) => {
            const [first, ...rest] = line.split('|')
            return [first.trim(), rest.join('|').trim()] as [string, string]
          }),
        }
      }
      return { type: 'prose', sentences: splitSentences(lines.join(' ')) }
    })
}

/** وزن (تعداد نویسه) هر «واحد هم‌زمان‌سازی»: هر جمله در نثر و هر بیت در شعر. */
export function unitWeights(blocks: Block[]): number[] {
  const weights: number[] = []
  for (const block of blocks) {
    if (block.type === 'prose') block.sentences.forEach((s) => weights.push(Math.max(1, s.length)))
    else block.couplets.forEach(([a, b]) => weights.push(Math.max(1, a.length + b.length)))
  }
  return weights
}

// فقط حروف فارسی/عربی (نه نشانه‌گذاری مثل «،» «؛» «؟») و نیم‌فاصله.
const LETTERS = '\\u0621-\\u064A\\u0671-\\u06D3\\u06FA-\\u06FC\\u200C'
const SUFFIXES = 'ها|های|ی|ای|ام|ات|اش|مان|تان|شان|م|ت|ش'

/** ساخت یک regex برای واژه‌های واژه‌نامه (بدون lookbehind تا در Safari قدیمی هم کار کند). */
export function buildGlossaryMatcher(terms: string[]): RegExp | null {
  if (!terms.length) return null
  const escaped = [...terms].sort((a, b) => b.length - a.length).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return new RegExp(`(^|[^${LETTERS}])(${escaped.join('|')})(?:\\u200C?(?:${SUFFIXES}))?(?![${LETTERS}])`, 'g')
}

export type Segment = { text: string; term?: string }

export function segmentText(text: string, matcher: RegExp | null): Segment[] {
  if (!matcher) return [{ text }]
  const out: Segment[] = []
  let cursor = 0
  for (const m of text.matchAll(matcher)) {
    const index = m.index ?? 0
    const start = index + m[1].length
    const end = index + m[0].length
    if (start > cursor) out.push({ text: text.slice(cursor, start) })
    out.push({ text: text.slice(start, end), term: m[2] })
    cursor = end
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor) })
  return out
}
