import { getFixturesData } from "@/src/lib/worldcup-data";
import FixturesClient from "./FixturesClient";

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function FixturesPage() {
  const data = await getFixturesData();
  return <FixturesClient fixturesData={data} />;
}
