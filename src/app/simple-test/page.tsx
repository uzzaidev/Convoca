import React from "react";

export const metadata = {
  title: "Simple Test - Peladeiros",
};

export default function SimpleTestPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Hello World</h1>
        <p className="text-muted-foreground mt-2">This is a simple DB-free test page.</p>
      </div>
    </main>
  );
}
