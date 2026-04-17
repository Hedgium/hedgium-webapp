"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Legacy /login URL: redirect to / preserving query string (e.g. ?next=).
 */
function LoginRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.toString();
    router.replace(q ? `/?${q}` : "/");
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-base-content/60">
      Redirecting…
    </div>
  );
}

export default function LoginRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-base-content/60">
          Loading…
        </div>
      }
    >
      <LoginRedirectInner />
    </Suspense>
  );
}
