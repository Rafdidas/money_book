"use client";

import Link from "next/link";
import { useEffect } from "react";

type AppErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function AppError({ error, unstable_retry }: AppErrorProps) {
  useEffect(() => {
    console.error("app-render-error", error.digest ?? error.name);
  }, [error]);

  return (
    <main className="main column-group column-group--center" role="alert">
      <h1 className="headline--sm">문제가 발생했어요</h1>
      <p className="body--sm color-gray">잠시 후 다시 시도해주세요.</p>
      <div className="row-group row-group--center">
        <button className="button button--primary button--md" onClick={unstable_retry}>
          다시 시도
        </button>
        <Link className="button button--secondary button--md" href="/">
          홈으로
        </Link>
      </div>
    </main>
  );
}
