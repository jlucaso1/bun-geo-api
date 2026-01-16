import type { CityResponse } from "maxmind";

export type IpApiResponse =
  | { status: "success"; countryCode: string; region: string; city: string }
  | { status: "fail"; message: string };

export function toIpApiFormat(
  lookup: CityResponse | null,
  ip: string
): IpApiResponse {
  if (!lookup) {
    return { status: "fail", message: `IP not found: ${ip}` };
  }

  return {
    status: "success",
    countryCode: lookup.country?.iso_code ?? "",
    region: lookup.subdivisions?.[0]?.iso_code ?? "",
    city: lookup.city?.names?.en ?? "",
  };
}
