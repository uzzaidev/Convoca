type Props = { params: Promise<{ groupId: string }> };

export default async function GroupPage({ params }: Props) {
  const { groupId } = await params;
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Grupo {groupId}</h1>
      <p>Overview do grupo e próximos eventos (placeholder).</p>
    </main>
  );
}
