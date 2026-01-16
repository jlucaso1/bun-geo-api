const LOCAL_IPS = new Set(["::1", "127.0.0.1", "::ffff:127.0.0.1"]);

export function isLocalIp(ip: string): boolean {
  return LOCAL_IPS.has(ip);
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}
