export interface CharacterStats {
  speed: number;       // Horizontal run speed
  airSpeed: number;    // Air movement speed
  jumpPower: number;   // Jump vertical velocity
  weight: number;      // Knockback resistance (higher = heavier)
  attackPower: number; // Damage multiplier (e.g. 1.0 = normal)
}

export interface CharacterData {
  id: string;
  name: string;
  title: string;
  texture: string;
  portrait: string;
  themeColor: number;
  themeHex: string;
  stats: CharacterStats;
  description: string;
}

export const CHARACTERS: CharacterData[] = [
  {
    id: 'char1',
    name: 'シェフ・ポコ',
    title: '万能テクニシャン',
    texture: 'char1',
    portrait: 'char1_portrait',
    themeColor: 0xeab308,
    themeHex: '//eab308',
    stats: { speed: 330, airSpeed: 280, jumpPower: 520, weight: 100, attackPower: 1.05 },
    description: '素早い身軽さと扱いやすいスタンダードな性能を持つ料理人。'
  },
  {
    id: 'char2',
    name: 'ライムライダー',
    title: '超高速スピードスター',
    texture: 'char2',
    portrait: 'char2_portrait',
    themeColor: 0x22c55e,
    themeHex: '//22c55e',
    stats: { speed: 410, airSpeed: 340, jumpPower: 500, weight: 85, attackPower: 0.9 },
    description: '圧巻の移動速度で敵を撹乱するスピード重視ファイター。'
  },
  {
    id: 'char3',
    name: 'ヴォルカ・ベア',
    title: '超重量パワー重戦車',
    texture: 'char3',
    portrait: 'char3_portrait',
    themeColor: 0xef4444,
    themeHex: '//ef4444',
    stats: { speed: 260, airSpeed: 210, jumpPower: 470, weight: 140, attackPower: 1.35 },
    description: '吹き飛びにくい圧倒的な重さと一撃必殺の一発を持つ豪腕。'
  },
  {
    id: 'char4',
    name: 'シアン・モコ',
    title: '天空のハイジャンパー',
    texture: 'char4',
    portrait: 'char4_portrait',
    themeColor: 0x06b6d4,
    themeHex: '//06b6d4',
    stats: { speed: 300, airSpeed: 320, jumpPower: 610, weight: 80, attackPower: 0.95 },
    description: '圧倒的な跳躍力を持ち、空中戦で相手を圧倒するマスコット。'
  },
  {
    id: 'char5',
    name: 'ルビー・ハンター',
    title: 'クリティカルストライカー',
    texture: 'char5',
    portrait: 'char5_portrait',
    themeColor: 0xec4899,
    themeHex: '//ec4899',
    stats: { speed: 350, airSpeed: 290, jumpPower: 530, weight: 95, attackPower: 1.15 },
    description: '攻撃力と機動力をハイレベルで兼ねそなえた鋭いハンター。'
  },
  {
    id: 'char6',
    name: 'タイタン・メカ',
    title: '鉄壁のサイバーゴーレム',
    texture: 'char6',
    portrait: 'char6_portrait',
    themeColor: 0x64748b,
    themeHex: '//64748b',
    stats: { speed: 250, airSpeed: 200, jumpPower: 460, weight: 155, attackPower: 1.25 },
    description: '重装甲で相手の反撃を寄せ付けない機械仕掛けの要塞。'
  },
  {
    id: 'char7',
    name: 'シャドウ・ニンジャ',
    title: '神出鬼没の暗殺者',
    texture: 'char7',
    portrait: 'char7_portrait',
    themeColor: 0xa855f7,
    themeHex: '//a855f7',
    stats: { speed: 390, airSpeed: 330, jumpPower: 560, weight: 75, attackPower: 1.0 },
    description: '驚異的な復帰力とダッシュ力で闇から攻める隠密ファイター。'
  },
  {
    id: 'char8',
    name: 'フレア・フェニックス',
    title: '紅蓮の空中覇者',
    texture: 'char8',
    portrait: 'char8_portrait',
    themeColor: 0xf97316,
    themeHex: '//f97316',
    stats: { speed: 320, airSpeed: 350, jumpPower: 580, weight: 90, attackPower: 1.1 },
    description: '炎を纏った空中技で上空から敵を焼き尽くす不滅の不死鳥。'
  }
];
