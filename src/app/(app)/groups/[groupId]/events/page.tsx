import { redirect } from "next/navigation";

type RouteParams = {
  params: Promise<{ groupId: string }>;
};

export default async function GroupEventsPage({ params }: RouteParams) {
  const { groupId } = await params;
  redirect(`/groups/${groupId}`);
}
