"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function IntroFooterLottie() {
  return (
    <div className="intro-banner--lottie" aria-hidden="true">
      <DotLottieReact
        src="/animations/intro-footer-flow.json"
        backgroundColor="transparent"
        loop
        autoplay
      />
    </div>
  );
}
