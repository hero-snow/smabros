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
    name: 'エビフライドラゴン',
    title: '黄金のサクサク龍',
    texture: 'char1',
    portrait: 'char1_portrait',
    themeColor: 0xf59e0b,
    themeHex: '#f59e0b',
    stats: { speed: 330, airSpeed: 280, jumpPower: 520, weight: 100, attackPower: 1.05 },
    description: 'サクサクの衣を纏った伝説の龍。バランスの取れた軽快な身のこなしを誇る。'
  },
  {
    id: 'char2',
    name: 'クロームベア',
    title: '四色の韋駄天ベア',
    texture: 'char2',
    portrait: 'char2_portrait',
    themeColor: 0x10b981,
    themeHex: '#10b981',
    stats: { speed: 410, airSpeed: 340, jumpPower: 500, weight: 85, attackPower: 0.9 },
    description: '鮮やかなカラーを身にまとう謎のクマ。圧巻のダッシュ力で敵を撹乱する。'
  },
  {
    id: 'char3',
    name: 'ハンバーガーマン',
    title: 'ジューシー重戦車',
    texture: 'char3',
    portrait: 'char3_portrait',
    themeColor: 0xe11d48,
    themeHex: '#e11d48',
    stats: { speed: 260, airSpeed: 210, jumpPower: 470, weight: 140, attackPower: 1.35 },
    description: 'ジューシーな具材が詰まった超重量ファイター。豪快な一撃と高い耐久力を持つ。'
  },
  {
    id: 'char4',
    name: 'ペガサス',
    title: '天空のハイジャンパー',
    texture: 'char4',
    portrait: 'char4_portrait',
    themeColor: 0x38bdf8,
    themeHex: '#38bdf8',
    stats: { speed: 300, airSpeed: 330, jumpPower: 620, weight: 80, attackPower: 0.95 },
    description: '翼をパタパタさせて大空を舞う天馬。抜群の跳躍力と空中戦の強さが自慢。'
  },
  {
    id: 'char5',
    name: 'アヒルマン',
    title: '水陸両用ダックロボ',
    texture: 'char5',
    portrait: 'char5_portrait',
    themeColor: 0xfb923c,
    themeHex: '#fb923c',
    stats: { speed: 350, airSpeed: 290, jumpPower: 530, weight: 95, attackPower: 1.15 },
    description: '浮き輪を装備したアヒル型の万能ファイター。機動力と攻撃力を高水準で兼ね備える。'
  },
  {
    id: 'char6',
    name: 'スシドラゴン',
    title: '極上ネタの海鮮龍',
    texture: 'char6',
    portrait: 'char6_portrait',
    themeColor: 0xef4444,
    themeHex: '#ef4444',
    stats: { speed: 270, airSpeed: 230, jumpPower: 480, weight: 145, attackPower: 1.3 },
    description: 'シャリと新鮮な海の幸が合体した神聖な龍。重厚な一撃と圧倒的なふっとばし耐性を誇る。'
  },
  {
    id: 'char7',
    name: 'シャドウ・ニンジャ',
    title: '神出鬼没の暗殺者',
    texture: 'char7',
    portrait: 'char7_portrait',
    themeColor: 0xa855f7,
    themeHex: '#a855f7',
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
    themeHex: '#f97316',
    stats: { speed: 320, airSpeed: 350, jumpPower: 580, weight: 90, attackPower: 1.1 },
    description: '炎を纏った空中技で上空から敵を焼き尽くす不滅の不死鳥。'
  }
];
