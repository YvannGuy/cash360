import { NextResponse } from 'next/server'
import { getVerseOfTheDay } from '@/lib/verses'

export async function GET() {
  const verse = getVerseOfTheDay()
  return NextResponse.json(verse, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  })
}

