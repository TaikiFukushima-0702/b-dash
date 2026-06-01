"use client";

import { useActionState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { login } from "@/app/actions/auth";
import { fieldClass } from "@/components/SubmitButton";

function LoginForm() {
  const params = useSearchParams();
  const from = params.get("from") ?? "/dashboard";
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form action={formAction} className="w-full max-w-xs space-y-4">
      <input type="hidden" name="from" value={from} />
      <div>
        <input
          type="password"
          name="passphrase"
          placeholder="パスフレーズ"
          autoFocus
          className={fieldClass}
        />
      </div>
      {state?.error && <p className="text-sm text-[var(--danger)]">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-[var(--primary-fg)] disabled:opacity-60"
      >
        {pending ? "確認中…" : "ログイン"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="mb-6">
        <div className="text-5xl">🎮📘</div>
        <h1 className="mt-3 text-2xl font-bold">FE道場</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">基本情報技術者試験を、楽しく続ける</p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
