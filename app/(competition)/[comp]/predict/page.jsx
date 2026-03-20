import { getPredictionsData } from "@/src/lib/predictions";
import PredictClient from "./PredictClient";

export default async function PredictPage() {
  const predData = await getPredictionsData();

  // Load WC2026 participants directly from the JSON file on the server
  let participants = [];
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const filePath = path.join(process.cwd(), "public/data/wc2026-participants.json");
    const raw = await fs.readFile(filePath, "utf-8");
    const json = JSON.parse(raw);
    participants = json.participants || [];
  } catch {}

  return <PredictClient predData={predData} participants={participants} />;
}
