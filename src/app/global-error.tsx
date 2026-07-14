"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function GlobalError({ error, unstable_retry }: GlobalErrorProps) {
  useEffect(() => {
    console.error("global-render-error", error.digest ?? error.name);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <main role="alert">
          <h1>문제가 발생했어요</h1>
          <p>잠시 후 다시 시도해주세요.</p>
          <button type="button" onClick={unstable_retry}>
            다시 시도
          </button>
        </main>
      </body>
    </html>
  );
}
