import { useEffect, useState, type RefObject } from 'react'

/**
 * درصد پیشرفت کل داستان (۰ تا ۱۰۰). فصل‌های گذشته کامل حساب می‌شوند و فصل جاری
 * بر اساس «خط خوانش» (۶۰٪ ارتفاع صفحه) محاسبه می‌شود. محاسبه با rAF محدود شده تا اسکرول روان بماند
 * و با ResizeObserver با تغییر اندازهٔ فونت/فاصله خطوط خودکار به‌روز می‌شود.
 */
export function useReadingProgress(articleRef: RefObject<HTMLElement | null>, chapter: number, chapterCount: number) {
  const [local, setLocal] = useState(0)

  useEffect(() => {
    const el = articleRef.current
    if (!el) return
    let raf = 0
    const compute = () => {
      raf = 0
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      const atEnd = window.scrollY + vh >= document.documentElement.scrollHeight - 2
      const value = atEnd ? 1 : Math.min(1, Math.max(0, (vh * 0.6 - rect.top) / Math.max(rect.height, 1)))
      setLocal((prev) => (Math.abs(prev - value) < 0.002 ? prev : value))
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(compute) }
    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    const observer = new ResizeObserver(schedule)
    observer.observe(el)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      observer.disconnect()
    }
  }, [articleRef, chapter])

  return Math.min(100, Math.round(((chapter + local) / chapterCount) * 100))
}
