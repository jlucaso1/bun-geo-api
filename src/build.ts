import { existsSync, mkdirSync, copyFileSync } from "fs";
import { join } from "path";
import * as geolite2 from "geolite2-redist";

const DB_DOWNLOAD_DIR = "./db_temp";
const DB_ASSET_DIR = "./db";
const TARGET_DB_PATH = join(DB_ASSET_DIR, "GeoLite2-City.mmdb");
const DIST_DIR = "./dist";
const OUTFILE_PATH = join(DIST_DIR, "geo-api");

console.log("--- Geo API Build Process Started ---");

try {
  console.log(
    `STEP 1: Downloading GeoLite2 database to '${DB_DOWNLOAD_DIR}'...`,
  );

  if (!existsSync(DB_DOWNLOAD_DIR)) {
    mkdirSync(DB_DOWNLOAD_DIR, { recursive: true });
  }

  await geolite2.downloadDbs({
    path: DB_DOWNLOAD_DIR,
    dbList: [geolite2.GeoIpDbName.City],
  });

  const downloadedDbPath = join(DB_DOWNLOAD_DIR, "GeoLite2-City.mmdb");

  if (!existsSync(downloadedDbPath)) {
    throw new Error(
      `Database file not found at expected path: ${downloadedDbPath}`,
    );
  }

  if (!existsSync(DB_ASSET_DIR)) {
    mkdirSync(DB_ASSET_DIR, { recursive: true });
  }

  copyFileSync(downloadedDbPath, TARGET_DB_PATH);

  console.log(`✅ Database successfully prepared at '${TARGET_DB_PATH}'`);

  console.log("\nSTEP 2: Compiling application into a standalone binary...");
  const result = await Bun.build({
    entrypoints: ["./src/index.ts"],
    target: "bun",
    minify: true,
    compile: {
      outfile: OUTFILE_PATH,
    },
  });

  if (!result.success) {
    console.error("❌ Build failed with the following errors:");
    console.error(result.logs);
    process.exit(1);
  }

  console.log("\n--- Geo API Build Process Finished ---");
  console.log(`✅ Executable created at '${OUTFILE_PATH}'`);
  console.log("You can now run your API with no other dependencies!");
} catch (error) {
  console.error("❌ An error occurred during the build process:", error);
  process.exit(1);
}
