import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 },
    );
  }

  try {
    // El backend hace el fetch a Google Cloud (esto NO tiene problemas de CORS)
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch external resource: ${response.statusText}`,
      );
    }

    const contentType = response.headers.get("content-type") || "image/svg+xml";
    const arrayBuffer = await response.arrayBuffer();

    // Devolvemos la imagen al frontend como si fuera nuestra
    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        // No cacheamos para que los SVGs actualizados se muestren inmediatamente
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json({ error: "Failed to fetch SVG" }, { status: 500 });
  }
}
