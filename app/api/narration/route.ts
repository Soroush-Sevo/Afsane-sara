import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get('text')
  if (!text?.trim()) return NextResponse.json({ error: 'Missing text' }, { status: 400 })

  const url = new URL('https://translate.google.com/translate_tts')
  url.searchParams.set('ie', 'UTF-8')
  url.searchParams.set('client', 'tw-ob')
  url.searchParams.set('tl', 'fa')
  url.searchParams.set('total', '1')
  url.searchParams.set('idx', '0')
  url.searchParams.set('text', text)

  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8' }, cache: 'no-store' })
    if (!response.ok) return NextResponse.json({ error: 'Narration unavailable' }, { status: 502 })
    const audio = await response.arrayBuffer()
    return new NextResponse(audio, {
      headers: {
        'Content-Type': response.headers.get('content-type') || 'audio/mpeg',
        'Content-Length': String(audio.byteLength),
        'Content-Disposition': 'inline',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Narration unavailable' }, { status: 502 })
  }
}
