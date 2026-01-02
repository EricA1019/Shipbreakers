export const CORP_NAMES = [
  { en: "Kintsugi Logistics", zh: "金継ぎ物流" },
  { en: "Nova Harbor Co.", zh: "新星港务" },
  { en: "Qingdao Foundry", zh: "青岛铸造" },
  { en: "Tian Systems", zh: "天系统" },
  { en: "Huang Group", zh: "黄氏集团" },
];

export const HUB_GRAFFITI = [
  "Keep your license active.",
  "Cargo runs pay the bills.",
  "Watch for corporate cops.",
  "不要靠近危险区。",
  "有人在监视。",
];

export const STATUS_MESSAGES = {
  hull: {
    ok: "Hull stable",
    warn: "Minor breaches",
    danger: "Critical hull breach",
  },
  engines: {
    ok: "Engines nominal",
    warn: "Engine strain",
    danger: "Engine failure",
  },
  life: {
    ok: "Life systems online",
    warn: "O2 low",
    danger: "Life support failing",
  },
};

export function pickCorp(seed: number) {
  return CORP_NAMES[seed % CORP_NAMES.length];
}
