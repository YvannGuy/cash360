import versesData from '@/data/verses.json'

type VerseEntry = {
  id: number
  reference: string
  summary: string
}

const verseTexts: Record<string, string> = {
  'Proverbes 24:3': "C'est par la sagesse qu'une maison s'élève, Et par l'intelligence qu'elle s'affermit."
}

function getDayIndex(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  const day = Math.floor(diff / (1000 * 60 * 60 * 24))
  return day
}

export function getVerseOfTheDay(options?: { date?: Date }) {
  const list = versesData as VerseEntry[]
  if (list.length === 0) {
    return {
      reference: 'Proverbes 24:3',
      text: "C'est par la sagesse qu'une maison s'élève, Et par l'intelligence qu'elle s'affermit.",
      theme: 'Sagesse construit'
    }
  }
  const index = getDayIndex(options?.date) % list.length
  const entry = list[index]
  return {
    reference: entry.reference,
    text: verseTexts[entry.reference] || entry.summary,
    summary: entry.summary
  }
}

