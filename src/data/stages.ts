export interface StagePlatform {
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
  strokeColor: number;
  isMoving?: boolean;
  moveRangeX?: number;
  moveRangeY?: number;
  moveSpeed?: number;
}

export interface StageData {
  id: string;
  name: string;
  title: string;
  bgGradTop: string;
  bgGradBottom: string;
  gridColor: number;
  mainPlatform: {
    x: number;
    y: number;
    width: number;
    height: number;
    color: number;
    strokeColor: number;
  };
  softPlatforms: StagePlatform[];
  particleType: 'stars' | 'lava' | 'clouds' | 'matrix';
  themeColor: number;
  description: string;
}

export const STAGES: StageData[] = [
  {
    id: 'cyber_battlefield',
    name: 'Cyber Battlefield',
    title: '近未来ネオン戦場',
    bgGradTop: '#090d16',
    bgGradBottom: '#020617',
    gridColor: 0x38bdf8,
    mainPlatform: {
      x: 480,
      y: 460,
      width: 580,
      height: 28,
      color: 0x2563eb,
      strokeColor: 0x60a5fa
    },
    softPlatforms: [
      { x: 310, y: 340, width: 150, height: 12, color: 0x38bdf8, strokeColor: 0x7dd3fc },
      { x: 650, y: 340, width: 150, height: 12, color: 0x38bdf8, strokeColor: 0x7dd3fc },
      { x: 480, y: 220, width: 150, height: 12, color: 0x38bdf8, strokeColor: 0x7dd3fc }
    ],
    particleType: 'stars',
    themeColor: 0x38bdf8,
    description: 'サイバースペースの中心に浮かぶ王道バトルフィールド。'
  },
  {
    id: 'lava_volcano',
    name: 'Lava Volcano',
    title: '灼熱の溶岩火口',
    bgGradTop: '#2a0808',
    bgGradBottom: '#450a0a',
    gridColor: 0xef4444,
    mainPlatform: {
      x: 480,
      y: 460,
      width: 520,
      height: 28,
      color: 0x991b1b,
      strokeColor: 0xf87171
    },
    softPlatforms: [
      { x: 300, y: 340, width: 140, height: 12, color: 0xf97316, strokeColor: 0xfde047, isMoving: true, moveRangeX: 60, moveSpeed: 0.0015 },
      { x: 660, y: 340, width: 140, height: 12, color: 0xf97316, strokeColor: 0xfde047, isMoving: true, moveRangeX: -60, moveSpeed: 0.0015 },
      { x: 480, y: 210, width: 160, height: 12, color: 0xfacc15, strokeColor: 0xffffff }
    ],
    particleType: 'lava',
    themeColor: 0xef4444,
    description: '熱気立ち込めるマグマステージ。左右の足場が横に移動する！'
  },
  {
    id: 'sky_castle',
    name: 'Sky Castle',
    title: '天空の雲上神殿',
    bgGradTop: '#0c4a6e',
    bgGradBottom: '#0284c7',
    gridColor: 0xe0f2fe,
    mainPlatform: {
      x: 480,
      y: 470,
      width: 620,
      height: 28,
      color: 0x0284c7,
      strokeColor: 0xbae6fd
    },
    softPlatforms: [
      { x: 260, y: 330, width: 130, height: 12, color: 0x38bdf8, strokeColor: 0xffffff },
      { x: 700, y: 330, width: 130, height: 12, color: 0x38bdf8, strokeColor: 0xffffff },
      { x: 480, y: 230, width: 170, height: 12, color: 0x7dd3fc, strokeColor: 0xffffff, isMoving: true, moveRangeY: 40, moveSpeed: 0.002 }
    ],
    particleType: 'clouds',
    themeColor: 0x38bdf8,
    description: '雲海を見下ろす広大な神殿。中央足場が上下にゆっくり昇降！'
  },
  {
    id: 'neon_matrix',
    name: 'Neon Matrix',
    title: '電脳マトリクス',
    bgGradTop: '#052e16',
    bgGradBottom: '#022c22',
    gridColor: 0x22c55e,
    mainPlatform: {
      x: 480,
      y: 460,
      width: 560,
      height: 28,
      color: 0x15803d,
      strokeColor: 0x4ade80
    },
    softPlatforms: [
      { x: 330, y: 350, width: 140, height: 12, color: 0x22c55e, strokeColor: 0x86efac },
      { x: 630, y: 350, width: 140, height: 12, color: 0x22c55e, strokeColor: 0x86efac },
      { x: 480, y: 220, width: 180, height: 12, color: 0x4ade80, strokeColor: 0xdcfce7, isMoving: true, moveRangeX: 80, moveSpeed: 0.0025 }
    ],
    particleType: 'matrix',
    themeColor: 0x22c55e,
    description: 'デジタルな雨が降り注ぐサイバー空間。トリッキーな動く足場。'
  }
];
