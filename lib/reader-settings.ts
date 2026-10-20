import { create } from 'zustand'

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

export const useReaderSettings = create<Store>((set) => ({
  ...defaultSettings,
  set: (key, value) => set({ [key]: value } as Partial<ReaderSettings>),
  reset: () => set(defaultSettings),
}))
