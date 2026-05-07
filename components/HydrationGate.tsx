"use client";

import { useEffect, useState, type ReactNode } from "react";

export default function HydrationGate({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  if (!ready)
    return (
      <>
        {fallback ?? (
          <div className="flex h-64 items-center justify-center text-frame-mid">
            よみこみちゅう…
          </div>
        )}
      </>
    );
  return <>{children}</>;
}
