import { readFile } from "fs/promises";
import path from "path";

const PREDICTIONS_PATH = path.join(process.cwd(), "public/data/predictions.json");

let predictionsCache = null;

async function readPredictionsSnapshot() {
  if (predictionsCache) {
    return predictionsCache;
  }

  const raw = await readFile(PREDICTIONS_PATH, "utf8");
  predictionsCache = JSON.parse(raw);
  return predictionsCache;
}

export async function getPredictionsData() {
  const snapshot = await readPredictionsSnapshot();

  return {
    updatedAt: snapshot.updatedAt || new Date().toISOString(),
    simulationCount: snapshot.simulationCount || 0,
    method: snapshot.method || "暂无可用夺冠概率预计算数据。",
    teams: Array.isArray(snapshot.teams) ? snapshot.teams : [],
  };
}
