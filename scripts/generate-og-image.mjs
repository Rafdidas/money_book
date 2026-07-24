import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const outputPath = fileURLToPath(new URL("../src/app/opengraph-image.png", import.meta.url));
const altTextPath = new URL("../src/app/opengraph-image.alt.txt", import.meta.url);
const logoPath = new URL("../src/assets/img/monibuk-logo.svg", import.meta.url);
const logo = await readFile(logoPath, "utf8");
const logoDataUrl = `data:image/svg+xml;base64,${Buffer.from(logo).toString("base64")}`;
const cards = [
  ["수입", "#1555c0", '<path d="M20 34V7"/><path d="m10 17 10-10 10 10"/><path d="M8 34h24"/>'],
  ["지출", "#ef5e72", '<path d="M20 6v27"/><path d="m10 23 10 10 10-10"/><path d="M8 6h24"/>'],
  ["저축", "#16a37a", '<path d="M8 18h24v16H8z"/><path d="M13 18v-5h14v5"/><path d="M20 23v6"/>'],
  ["투자", "#8d5ce8", '<path d="M7 31 16 21l6 6 11-14"/><path d="M26 13h7v7"/><path d="M7 35h27"/>'],
];
const cardMarkup = cards.map(([label, color, glyph]) => `
  <div style="box-sizing:border-box;width:191px;height:170px;border-radius:24px;background:#fff;color:${color};display:flex;flex-direction:column;justify-content:space-between;padding:24px;box-shadow:0 18px 34px rgba(18,76,174,.18)">
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${glyph}</svg>
    <span style="font-size:27px;font-weight:800;letter-spacing:-2px">${label}</span>
  </div>`).join("");

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(`<!doctype html><html lang="ko"><body style="margin:0">
    <main style="box-sizing:border-box;width:1200px;height:630px;overflow:hidden;background:linear-gradient(135deg,#226cff 0%,#3182f6 55%,#5c9cff 100%);color:#fff;display:flex;padding:72px;font-family:'Malgun Gothic',Arial,sans-serif">
      <section style="width:58%;display:flex;flex-direction:column;justify-content:center">
        <img src="${logoDataUrl}" width="232" height="52" alt="머니북가계부" style="display:block;background:#fff;border-radius:13px;padding:8px;box-sizing:content-box" />
        <div style="font-size:76px;font-weight:800;letter-spacing:-5px;line-height:1.16;margin-top:34px">돈의 흐름을<br />한눈에</div>
        <div style="font-size:30px;font-weight:600;letter-spacing:-1px;line-height:1.4;margin-top:26px;opacity:.92">수입 · 지출 · 저축 · 투자</div>
      </section>
      <aside aria-hidden="true" style="width:42%;display:flex;align-items:center;justify-content:flex-end">
        <div style="width:400px;display:flex;flex-wrap:wrap;gap:18px">${cardMarkup}</div>
      </aside>
    </main></body></html>`);
  await page.screenshot({ path: outputPath });
  await writeFile(altTextPath, "머니북가계부: 돈의 흐름을 한눈에, 수입·지출·저축·투자 관리");
} finally {
  await browser.close();
}
