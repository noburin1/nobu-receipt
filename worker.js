export default {
  async fetch(request, env) {
    const allowedOrigin = "https://noburin1.github.io";
    const origin = request.headers.get("Origin") || "";

    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return json({ ok: false, error: "POST only" }, 405, corsHeaders);
    }

    if (origin && origin !== allowedOrigin) {
      return json({ ok: false, error: "Origin not allowed" }, 403, corsHeaders);
    }

    if (!env.GOOGLE_VISION_API_KEY) {
      return json(
        { ok: false, error: "Google Vision API key is not configured" },
        500,
        corsHeaders
      );
    }

    try {
      const body = await request.json();

      if (!body.image || typeof body.image !== "string") {
        return json({ ok: false, error: "画像データがありません" }, 400, corsHeaders);
      }

      const base64Image = body.image.replace(
        /^data:image\/[a-zA-Z0-9.+-]+;base64,/,
        ""
      );

      if (base64Image.length > 12000000) {
        return json({ ok: false, error: "画像サイズが大きすぎます" }, 413, corsHeaders);
      }

      const visionResponse = await fetch(
        "https://vision.googleapis.com/v1/images:annotate?key=" +
          encodeURIComponent(env.GOOGLE_VISION_API_KEY),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: [
              {
                image: { content: base64Image },
                features: [{ type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 }],
                imageContext: { languageHints: ["ja"] },
              },
            ],
          }),
        }
      );

      const data = await visionResponse.json();

      if (!visionResponse.ok) {
        return json(
          {
            ok: false,
            error: "Google Vision API error",
            details: data?.error?.message || "",
          },
          visionResponse.status,
          corsHeaders
        );
      }

      const response = data.responses?.[0];

      if (response?.error) {
        return json(
          { ok: false, error: response.error.message || "OCR error" },
          500,
          corsHeaders
        );
      }

      const text =
        response?.fullTextAnnotation?.text ||
        response?.textAnnotations?.[0]?.description ||
        "";

      return json({ ok: true, text }, 200, corsHeaders);
    } catch (error) {
      return json(
        { ok: false, error: String(error?.message || error) },
        500,
        corsHeaders
      );
    }
  },
};

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...headers,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
