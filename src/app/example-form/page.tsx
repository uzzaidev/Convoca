import { getDb } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function ExampleFormPage() {
  // Server Action para criar comentário
  async function createComment(formData: FormData) {
    "use server";
    
    const sql = getDb();
    const comment = formData.get("comment") as string;
    
    if (comment) {
      await sql`
        INSERT INTO comments (comment, created_at)
        VALUES (${comment}, NOW())
      `;
    }
    
    redirect("/example-form");
  }
  
  // Buscar comentários existentes
  const sql = getDb();
  const comments = await sql`
    SELECT id, comment, created_at
    FROM comments
    ORDER BY created_at DESC
    LIMIT 10
  ` as Array<{ id: number; comment: string; created_at: string }>;

  return (
    <main className="container max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Exemplo de Server Actions com Neon</h1>
      
      {/* Formulário */}
      <form action={createComment} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Escreva um comentário"
            name="comment"
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Enviar
        </button>
      </form>

      {/* Lista de comentários */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Comentários recentes</h2>
        {comments.length === 0 ? (
          <p className="text-muted-foreground">Nenhum comentário ainda.</p>
        ) : (
          <ul className="space-y-2">
            {comments.map((c) => (
              <li key={c.id} className="p-4 border rounded-lg">
                <p>{c.comment}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(c.created_at).toLocaleString("pt-BR")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
