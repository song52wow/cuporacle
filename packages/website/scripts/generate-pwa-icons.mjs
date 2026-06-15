// 把 public/icon.svg 光栅化成 5 个 PWA 需要的 PNG 尺寸。
// 用法: npm run icons:gen
// 一次性脚本；可重复跑,产物会被覆盖。

import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dirname, "../public");

// 徽章必须是单色 + 透明背景,不能有渐变
async function makeBadge(svg, size) {
  return sharp(Buffer.from(svg))
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .grayscale() // 转灰度,Android 会再着色
    .png()
    .toBuffer();
}

async function main() {
  const svgRaw = await readFile(resolve(PUBLIC, "icon.svg"), "utf8");
  const buf = Buffer.from(svgRaw);

  // 标准 PWA icon
  await sharp(buf).resize(192, 192).png().toFile(resolve(PUBLIC, "icon-192.png"));
  await sharp(buf).resize(512, 512).png().toFile(resolve(PUBLIC, "icon-512.png"));
  // maskable: 周围留 12.5% safe zone,中间 80% 是可见区域
  // 做法:包一层 viewBox 0 0 100 100,把内部最外层 <svg> 缩小到 80% 并居中(x=y=10)
  // 注意:替换 width/height 必须只匹配根 <svg> 标签,不能误中内部 <rect> 等元素
  // 原始 icon.svg 根 <svg> 没有显式 width/height,所以原 .replace(/width="[^"]*"/) 会
  // 匹配到内部 <rect width="32">,导致根 <svg> 仍然保持默认 100% 尺寸、x/y hint 失效。
  // 修复:在原 SVG 前面注入一段新的 <svg viewBox="0 0 100 100">,把原内容整体缩小到 80%。
  const inner = svgRaw.match(/<svg[^>]*>([\s\S]*)<\/svg>/)[1];
  const wrapperOpen = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><svg width="80" x="10" y="10" height="80">`;
  const wrapperClose = `</svg></svg>`;
  const maskable = wrapperOpen + inner + wrapperClose;
  await sharp(Buffer.from(maskable)).resize(512, 512).png().toFile(resolve(PUBLIC, "icon-maskable-512.png"));

  // iOS apple-touch-icon (180x180, 不带 alpha,白底)
  await sharp(buf).resize(180, 180).flatten({ background: "#0a0a14" }).png().toFile(resolve(PUBLIC, "apple-touch-icon.png"));

  // 通知 badge
  await makeBadge(svgRaw, 72).then((b) => sharp(b).toFile(resolve(PUBLIC, "badge-72.png")));

  console.log("✅ Generated 5 PWA icons in public/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
