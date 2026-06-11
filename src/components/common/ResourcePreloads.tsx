"use client";

import ReactDOM from "react-dom";
import visualBackground from "@/assets/img/visual_bg.png";

export default function ResourcePreloads() {
  ReactDOM.preload(visualBackground.src, {
    as: "image",
    fetchPriority: "high",
  });

  return null;
}
