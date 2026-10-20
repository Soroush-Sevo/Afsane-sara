'use client'

import { Check, Sparkles, X } from 'lucide-react'
import { motion } from 'framer-motion'

type Props = { question: string; options: string[]; correct: string; selected: string | null; onPick: (option: string) => void }

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }

/**
 * دکمه‌های تصمیم‌گیری. فقط opacity/transform انیمیت می‌شوند (نه ارتفاع/عرض) و فضای پیام بازخورد
 * از ابتدا رزرو شده است، پس انتخاب یک گزینه هیچ المانی را جابه‌جا نمی‌کند.
 */
export function StoryChoices({ question, options, correct, selected, onPick }: Props) {
  const isCorrect = selected === correct
  return (
    <motion.section className="reader-choices" variants={container} initial="hidden" animate="show" aria-labelledby="story-question">
      <h2 id="story-question"><Sparkles size={18} aria-hidden="true" /> {question}</h2>
      <div className="reader-choice-list" role="group" aria-labelledby="story-question">
        {options.map((option) => {
          const state = selected === option ? (option === correct ? 'correct' : 'wrong') : 'idle'
          return (
            <motion.button key={option} type="button" variants={item} whileTap={{ scale: 0.98 }} data-state={state} aria-pressed={selected === option} onClick={() => onPick(option)} className="reader-choice">
              <span className="reader-choice-icon" aria-hidden="true">{state === 'correct' ? <Check size={18} /> : state === 'wrong' ? <X size={18} /> : null}</span>
              {option}
            </motion.button>
          )
        })}
      </div>
      <p role="status" aria-live="polite" className="reader-feedback" data-state={selected ? (isCorrect ? 'correct' : 'wrong') : 'idle'}>
        {selected ? (isCorrect ? 'آفرین! پاسخ درست بود.' : 'این‌طور نبود؛ دوباره امتحان کن.') : '\u00A0'}
      </p>
    </motion.section>
  )
}
