import { serve } from "bun";
import maxmind, { type CityResponse, type Reader } from "maxmind";

// @ts-expect-error Bun's import assertion for files
import geoDbPath from "../db/GeoLite2-City.mmdb" with { type: "file" };
import { toIpApiFormat } from "./ip-api-compat";
import { isLocalIp, jsonResponse, errorResponse } from "./helpers";

console.log("Initializing MaxMind reader with embedded database...");

const reader: Reader<CityResponse> = await maxmind.open(geoDbPath);

console.log("GeoLite2 database loaded successfully.");

const server = serve({
  port: 3000,
  reusePort: true,
  fetch(request, server) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response("ok");
    }

    // ip-api compatible route: /json/{ip}
    const jsonMatch = url.pathname.match(/^\/json\/(.+)$/);
    if (jsonMatch?.[1]) {
      const ip = jsonMatch[1];
      const lookup = reader.get(ip);
      return jsonResponse(toIpApiFormat(lookup, ip));
    }

    // MaxMind native route: /?ip={ip} or auto-detect from request
    const ip = url.searchParams.get("ip") ?? server.requestIP(request)?.address;

    if (!ip) {
      return errorResponse("IP address not provided.", 400);
    }

    if (isLocalIp(ip)) {
      return errorResponse("Cannot geolocate local IP address.", 404);
    }

    const lookup = reader.get(ip);

    if (!lookup) {
      return errorResponse(`IP address not found: ${ip}`, 404);
    }

    return jsonResponse(lookup);
  },
  error(error) {
    console.error("Unexpected error:", error);
    return errorResponse("Internal server error.", 500);
  },
});

console.log(`Server listening on http://localhost:${server.port}`);

function shutdown() {
  console.log("Server shutting down...");
  server.stop();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
