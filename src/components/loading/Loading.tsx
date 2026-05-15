"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

type LoadingProps = {
  message?: string;
  variant?: "page" | "overlay";
};

export default function Loading({
  message = "불러오는 중입니다",
  variant = "page",
}: LoadingProps) {
  return (
    <div
      className={`app-loading app-loading--${variant}`}
      role="status"
      aria-live="polite"
    >
      <div className="app-loading__lottie" aria-hidden="true">
        <DotLottieReact
          src="https://lottie.host/4353d8c4-a6dc-4797-a046-6acbbac9febe/xfsOUMfOK4.lottie"
          loop
          autoplay
        />
      </div>
      <p className="app-loading__text">{message}</p>
    </div>
  );
}
