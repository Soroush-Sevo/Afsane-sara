import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export const FONT_SIZES = ['small', 'medium', 'large'] as const
export const LINE_HEIGHTS = ['compact', 'comfortable', 'airy'] as const
export const FONTS = ['vazir', 'naskh'] as const
export const THEMES = ['system', 'light', 'dark'] as const

export type FontSize = (typeof FONT_SIZES)[number]
export type LineHeight = (typeof LINE_HEIGHTS)[number]
export type ReaderFont = (typeof FONTS)[number]
export type ReaderTheme = (typeof THEMES)[number]

export type ReaderSettings = { fontSize: FontSize; lineHeight: LineHeight; font: ReaderFont; theme: ReaderTheme }
type Store = ReaderSettings & { set: <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => void; reset: () => void }

export const defaultSettings: ReaderSettings = { fontSize: 'medium', lineHeight: 'comfortable', font: 'vazir', theme: 'system' }

const allowed: { [K in keyof ReaderSettings]: readonly string[] } = { fontSize: FONT_SIZES, lineHeight: LINE_HEIGHTS, font: FONTS, theme: THEMES }

export const useReaderSettings = create<Store>()(
  persist(
    (set) => ({
      ...defaultSettings,
      set: (key, value) => set({ [key]: value } as Partial<ReaderSettings>),
      reset: () => set(defaultSettings),
    }),
    {
      name: 'afsanesara-reader',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ fontSize, lineHeight, font, theme }) => ({ fontSize, lineHeight, font, theme }),
      // مقدارهای خراب یا قدیمی در localStorage هرگز نباید باعث کلاس/ویژگی نامعتبر شوند.
      merge: (persisted, current) => {
        const next = { ...current }
        const saved = (persisted ?? {}) as Partial<Record<keyof ReaderSettings, string>>
        for (const key of Object.keys(allowed) as (keyof ReaderSettings)[]) {
          const value = saved[key]
          if (typeof value === 'string' && allowed[key].includes(value)) (next as Record<string, unknown>)[key] = value
        }
        return next
      },
    },
  ),
)
