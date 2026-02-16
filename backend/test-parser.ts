/// <reference types="node" />
// Quick test for svgParser
import { parseSvg } from "./src/services/svgParser";
import fs from "fs";
import path from "path";

const svgDir = path.join(__dirname, "..", "frontend", "public", "svg");
const files = ["seatmap_simple.svg", "seatmap1.svg"];

for (const file of files) {
  const fp = path.join(svgDir, file);
  if (!fs.existsSync(fp)) {
    console.log(`SKIP: ${file}`);
    continue;
  }
  const r = parseSvg(fs.readFileSync(fp, "utf-8"));
  console.log(`\n=== ${file} ===`);
  console.log("  Total seats:", r.totalSeats);
  console.log(
    "  Zones:",
    r.zones.map((z: any) => `${z.zoneName}(${z.seatCount})`).join(", "),
  );
  console.log("  Without zone:", r.seatsWithoutZone.length);
  console.log("  Warnings:", r.warnings.length);
  console.log("  Dims:", JSON.stringify(r.dimensions));
  if (r.seats.length > 0) {
    console.log("  Sample:", JSON.stringify(r.seats[0]));
  }
}
