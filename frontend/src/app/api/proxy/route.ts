import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    // El backend hace el fetch a Google Cloud (esto NO tiene problemas de CORS)
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch external resource: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/svg+xml';
    const arrayBuffer = await response.arrayBuffer();

    // Devolvemos la imagen al frontend como si fuera nuestra
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        // Cacheamos la respuesta por 1 hora para mejorar rendimiento
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch SVG' }, { status: 500 });
  }
}
