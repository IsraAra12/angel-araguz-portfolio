const CONTACT_PATH = '/api/v1/public/contact';
const MAX_BODY_BYTES = 8192;

function reply(status, ok = false) {
  return Response.json({ ok }, { status, headers: { 'Cache-Control': 'no-store' } });
}

function upstreamUrl() {
  const url = new URL(process.env.SALESCC_CONTACT_URL);
  if (url.protocol !== 'https:' || url.pathname !== CONTACT_PATH ||
      url.username || url.password || url.search || url.hash) {
    throw new Error('Invalid contact endpoint');
  }
  return url;
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') return reply(405);
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin) return reply(403);
    if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json' || !request.body) {
      return reply(400);
    }

    const secret = process.env.LANDING_CONTACT_SECRET;
    if (!secret) return reply(503);

    try {
      const endpoint = upstreamUrl();
      const reader = request.body.getReader();
      const chunks = [];
      let length = 0;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > MAX_BODY_BYTES) {
          await reader.cancel();
          return reply(413);
        }
        chunks.push(value);
      }
      if (!length) return reply(400);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SalesCC-Landing-Token': secret,
        },
        body: Buffer.concat(chunks, length),
        redirect: 'error',
        signal: AbortSignal.timeout(10000),
      });
      if (response.status === 201 && (await response.json()).ok === true) return reply(201, true);
      if ([400, 409, 413, 422, 429].includes(response.status)) return reply(response.status);
      return reply(503);
    } catch {
      return reply(503);
    }
  },
};
