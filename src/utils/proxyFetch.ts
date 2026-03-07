type SerializableInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

function headersToObject(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    const out: Record<string, string> = {};
    headers.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return headers as Record<string, string>;
}

function toSerializableInit(init?: RequestInit): SerializableInit {
  if (!init) return {};
  return {
    method: init.method,
    headers: headersToObject(init.headers),
    body: typeof init.body === 'string' ? init.body : undefined,
  };
}

export function proxyFetch(url: string, init?: RequestInit): Promise<Response> {
  return fetch('/.netlify/functions/http-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      init: toSerializableInit(init),
    }),
  });
}
