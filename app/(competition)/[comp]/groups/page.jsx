import { getFixturesData } from "@/src/lib/worldcup-data";
import GroupsClient from "./GroupsClient";

export const revalidate = 60;

export default async function GroupsPage() {
  const data = await getFixturesData();
  return <GroupsClient fixturesData={data} />;
}
