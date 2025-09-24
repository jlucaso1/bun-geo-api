import { serve } from "bun";
import maxmind, { type CityResponse, type Reader } from "maxmind";

// @ts-expect-error Bun's import assertion for files
import geoDbPath from "../db/GeoLite2-City.mmdb" with { type: "file" };

console.log("Initializing MaxMind reader with embedded database...");

const reader: Reader<CityResponse> = await maxmind.open(geoDbPath);

console.log("✅ GeoLite2 database loaded successfully from embedded asset.");

const server = serve({
  port: 3000,
  reusePort: true,
  fetch(request, server) {
    try {
      const url = new URL(request.url);
      let ipToLookup = url.searchParams.get("ip");

      if (!ipToLookup) {
        ipToLookup = server.requestIP(request)?.address ?? null;
      }

      if (!ipToLookup) {
        return new Response(
          JSON.stringify({
            error:
              "IP address not provided and could not be determined from the request.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const lookup = reader.get(ipToLookup);

      if (lookup) {
        return new Response(JSON.stringify(lookup, null, 2), {
          headers: { "Content-Type": "application/json" },
        });
      } else {
        return new Response(
          JSON.stringify({ error: `IP address not found: ${ipToLookup}` }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }
    } catch (error) {
      console.error("An unexpected error occurred:", error);
      return new Response(
        JSON.stringify({ error: "An internal server error occurred." }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
});

console.log(`🚀 Server listening on http://localhost:${server.port}`);

function shutdown() {
  console.log("\n🛑 Server shutting down gracefully...");
  server.stop();
  process.exit(0);
}

process.on("SIGINT", shutdown);

process.on("SIGTERM", shutdown);
