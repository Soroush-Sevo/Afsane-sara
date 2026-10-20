import { useEffect, useState, type RefObject } from 'react'

/**
 * اندیس «واحد» (جمله یا بیت) در حال خوانده شدن را برمی‌گرداند؛ در غیر این صورت ۱-.
 *  - اگر `times` (زمان شروع هر واحد به ثانیه) داده شود، دقیق است.
 *  - در غیر این صورت زمان بر اساس نسبت تعداد نویسه‌ها تخمین زده می‌شود.
 */
export function useAudioSync(
  audioRef: RefObject<HTMLAudioElement | null> | undefined,
  playing: boolean,
  weights: number[],
  times: number[] | undefined,
  resetKey: unknown,
) {
  const [active, setActive] = useState(-1)

  useEffect(() => { setActive(-1) }, [resetKey])

  useEffect(() => {
    if (!playing) {
      const audio = audioRef?.current
      if (!audio || audio.ended) setActive(-1) // با توقف دستی، هایلایت سر جایش می‌ماند
      return
    }
    let raf = 0
    const total = weights.reduce((a, b) => a + b, 0)
    const tick = () => {
      const audio = audioRef?.current
      if (audio && Number.isFinite(audio.duration) && audio.duration > 0 && total > 0) {
        const t = audio.currentTime
        let index = 0
        if (times && times.length === weights.length) {
          for (let i = 0; i < times.length; i++) if (times[i] <= t) index = i
        } else {
          const target = (t / audio.duration) * total
          let acc = 0
          index = weights.length - 1
          for (let i = 0; i < weights.length; i++) {
            acc += weights[i]
            if (target < acc) { index = i; break }
          }
        }
        setActive((prev) => (prev === index ? prev : index))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [audioRef, playing, weights, times])

  return active
}
