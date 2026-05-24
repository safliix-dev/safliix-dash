import { NextRequest, NextResponse } from 'next/server';

const CDN_BASE = 'https://cdn.safliix.com';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
  }

  // N'autoriser que les URLs du CDN Safliix
  if (!url.startsWith(CDN_BASE)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cfNames = ['CloudFront-Policy', 'CloudFront-Signature', 'CloudFront-Key-Pair-Id'];
  const cookieStr = cfNames
    .flatMap(name => {
      const val = req.cookies.get(name)?.value;
      return val ? [`${name}=${val}`] : [];
    })
    .join('; ');

  const upstream = await fetch(url, {
    headers: {
      Range: req.headers.get('Range') ?? '',
      ...(cookieStr && { Cookie: cookieStr }),
    },
  });

  if (!upstream.ok) {
    return new NextResponse(null, { status: upstream.status });
  }

  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';
  const body = await upstream.arrayBuffer();

  // Réécrire les URLs relatives dans le manifeste m3u8 pour passer par ce proxy
  if (contentType.includes('mpegurl') || url.endsWith('.m3u8')) {
    const base = url.substring(0, url.lastIndexOf('/') + 1);
    const text = new TextDecoder().decode(body);
    const rewritten = text.replace(/^(?!#)(.+\.(?:m3u8|ts|aac|mp4|fmp4))$/gm, (match) => {
      const absolute = match.startsWith('http') ? match : base + match;
      return `/api/hls-proxy?url=${encodeURIComponent(absolute)}`;
    });
    return new NextResponse(rewritten, {
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    });
  }

  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=31536000',
    },
  });
}
