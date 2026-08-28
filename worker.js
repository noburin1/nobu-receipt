export default {
  async fetch(request) {
    return Response.json({
      ok: true,
      service: "nobu-receipt-v9-free-final",
      note: "OCR runs client-side in the browser. No API key, no billing."
    });
  }
};
