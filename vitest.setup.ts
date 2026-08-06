import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// `globals: false` 설정에서는 Testing Library의 자동 cleanup이 등록되지 않는다.
// 직접 등록하지 않으면 한 파일에서 render()를 두 번 이상 호출할 때
// 이전 테스트의 DOM이 남아 조회가 중복으로 실패한다.
afterEach(() => {
  cleanup();
});
