"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const res = await fetch("/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setStatus("sent");
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "送信に失敗しました");
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-md py-12">
      <h1 className="text-3xl font-bold mb-2">B-Dash</h1>
      <p className="text-muted mb-6">あなた専用の読書記録ダッシュボード</p>
      <Card>
        {status === "sent" ? (
          <div>
            <p className="font-medium mb-2">メールを送信しました</p>
            <p className="text-sm text-muted">
              メールに記載されたマジックリンクをタップしてログインしてください。
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <label className="text-sm font-medium">メールアドレス</label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <Button type="submit" disabled={status === "sending"}>
              {status === "sending" ? "送信中..." : "マジックリンクを送る"}
            </Button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        )}
      </Card>
    </div>
  );
}
