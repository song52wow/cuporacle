import { cn } from "@/lib/utils";

// 国家/地区 → 国旗 emoji 映射
// 简单覆盖：基于 admin mock 数据中出现的球队名
const FLAGS: Record<string, string> = {
  "墨西哥": "🇲🇽",
  "瑞典": "🇸🇪",
  "韩国": "🇰🇷",
  "乌拉圭": "🇺🇾",
  "加拿大": "🇨🇦",
  "比利时": "🇧🇪",
  "卡塔尔": "🇶🇦",
  "瑞士": "🇨🇭",
  "巴西": "🇧🇷",
  "摩洛哥": "🇲🇦",
  "海地": "🇭🇹",
  "苏格兰": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "美国": "🇺🇸",
  "巴拉圭": "🇵🇾",
  "澳大利亚": "🇦🇺",
  "土耳其": "🇹🇷",
  "德国": "🇩🇪",
  "库拉索": "🇨🇼",
  "科特迪瓦": "🇨🇮",
  "厄瓜多尔": "🇪🇨",
  "荷兰": "🇳🇱",
  "日本": "🇯🇵",
  "突尼斯": "🇹🇳",
  "加纳": "🇬🇭",
  "埃及": "🇪🇬",
  "伊朗": "🇮🇷",
  "新西兰": "🇳🇿",
  "西班牙": "🇪🇸",
  "佛得角": "🇨🇻",
  "沙特": "🇸🇦",
  "乌兹别克斯坦": "🇺🇿",
  "法国": "🇫🇷",
  "塞内加尔": "🇸🇳",
  "挪威": "🇳🇴",
  "阿根廷": "🇦🇷",
  "阿尔及利亚": "🇩🇿",
  "奥地利": "🇦🇹",
  "约旦": "🇯🇴",
  "葡萄牙": "🇵🇹",
  "巴拿马": "🇵🇦",
  "哥伦比亚": "🇨🇴",
  "英格兰": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "克罗地亚": "🇭🇷",
};

export function TeamFlag({ name, className }: { name: string; className?: string }) {
  const flag = FLAGS[name] ?? "🏳️";
  return (
    <span
      className={cn(
        "inline-grid place-items-center rounded-md bg-white/[0.04] border border-white/10 select-none",
        className
      )}
      aria-label={name}
    >
      <span className="leading-none">{flag}</span>
    </span>
  );
}
