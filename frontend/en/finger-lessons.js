/* ============================================================
   键位指法练习 - 数据：标准指法映射 + 渐进课程 + 键盘布局
   键盘键宽数据来源：原型图/键盘数据.md（Figma 精确尺寸）
   ============================================================ */

// ---------- 标准指法映射 ----------
const KEY_FINGER = {
  '`': 0, '1': 0, q: 0, a: 0, z: 0,
  '2': 1, w: 1, s: 1, x: 1,
  '3': 2, e: 2, d: 2, c: 2,
  '4': 3, '5': 3, r: 3, f: 3, v: 3, t: 3, g: 3, b: 3,
  '6': 4, '7': 4, y: 4, h: 4, n: 4, u: 4, j: 4, m: 4,
  '8': 5, i: 5, k: 5, ',': 5,
  '9': 6, o: 6, l: 6, '.': 6,
  '0': 7, p: 7, '-': 7, '=': 7, ';': 7, "'": 7, '[': 7, ']': 7, '\\': 7, '/': 7,
  ' ': 8
};

const FINGER_NAME = ['左小指', '左无名指', '左中指', '左食指', '右食指', '右中指', '右无名指', '右小指', '右手拇指'];
const FINGER_HINT = [
  '左小指落基准键 A', '左无名指落基准键 S', '左中指落基准键 D',
  '左手食指落基准键 F', '右手食指落基准键 J', '右中指落基准键 K',
  '右无名指落基准键 L', '右小指落基准键 ;', '大拇指负责空格键'
];
const FINGER_COLOR = ['lf-pinky', 'lf-ring', 'lf-mid', 'lf-index', 'rf-index', 'rf-mid', 'rf-ring', 'rf-pinky', 'thumb'];

// ---------- 渐进课程 ----------
const LESSONS = [
  { id: 1, name: '课程1 基准键', desc: 'A S D F J K L ; 定位基准键',
    keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'], length: 40,
    words: ['add', 'ask', 'dad', 'fad', 'lads', 'sad', 'salad', 'fall', 'laks', 'as', 'all', 'flak'] },
  { id: 2, name: '课程2 上排 E R U I', desc: '加入 E R 与 U I',
    keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';', 'e', 'r', 'u', 'i'], length: 40,
    words: ['are', 'ride', 'side', 'fire', 'idea', 'user', 'rise', 'sure', 'dear', 'fair', 'read', 'raise'] },
  { id: 3, name: '课程3 扩展 G H', desc: '加入食指扩展键 G H',
    keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';', 'e', 'r', 'u', 'i', 'g', 'h'], length: 45,
    words: ['age', 'huge', 'high', 'head', 'guide', 'fight', 'half', 'gift', 'file', 'hide', 'flag', 'held'] },
  { id: 4, name: '课程4 上排 T Y W O Q P', desc: '补齐上排字母',
    keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';', 'e', 'r', 'u', 'i', 'g', 'h', 't', 'y', 'w', 'o', 'q', 'p'], length: 50,
    words: ['type', 'quick', 'word', 'youth', 'point', 'quiet', 'world', 'write', 'power', 'party', 'total', 'prayer'] },
  { id: 5, name: '课程5 下排 Z X C V B N M', desc: '加入下排 7 键',
    keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';', 'e', 'r', 'u', 'i', 'g', 'h', 't', 'y', 'w', 'o', 'q', 'p', 'z', 'x', 'c', 'v', 'b', 'n', 'm'], length: 50,
    words: ['brown', 'music', 'voice', 'quick', 'zebra', 'bench', 'mixer', 'very', 'cabin', 'number', 'brain', 'machine'] },
  { id: 6, name: '课程6 全键热身', desc: '全部字母 + 常用符号 + 空格',
    keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';', 'e', 'r', 'u', 'i', 'g', 'h', 't', 'y', 'w', 'o', 'q', 'p', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', ' '], length: 60,
    words: ['quick brown fox', 'jumps over lazy', 'the quick', 'zip code', 'back to work', 'mix and mingle', 'very good job', 'see you soon'] },
  { id: 7, name: '课程7 大小写热身', desc: '首字母大写的句子输入（配合 Shift）',
    keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';', 'e', 'r', 'u', 'i', 'g', 'h', 't', 'y', 'w', 'o', 'q', 'p', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ' '], length: 60,
    words: ['The Quick', 'Brown Fox', 'Jumps Over', 'Lazy Dog', 'My Friend', 'Great Day', 'Smart Phone', 'Small World', 'Never Give', 'Up And Go', 'Rise And', 'Shine Bright'] }
];

// ---------- 完整键盘布局（Figma 精确尺寸，画布 774px） ----------
// 键高 60px，间隙 6px，行 Y 间隔 66px
// widthPx 为精确像素宽，不依赖 U 换算
const KBD = [
  { // 第1行 数字行 Y=0
    row: [
      kbd('`', '`', { sub: '~', w: 45.89 }),
      kbd('1', '1', { sub: '!', w: 45.89 }), kbd('2', '2', { sub: '@', w: 45.89 }),
      kbd('3', '3', { sub: '#', w: 45.89 }), kbd('4', '4', { sub: '$', w: 45.89 }),
      kbd('5', '5', { sub: '%', w: 45.89 }), kbd('6', '6', { sub: '^', w: 45.89 }),
      kbd('7', '7', { sub: '&', w: 45.89 }), kbd('8', '8', { sub: '*', w: 45.89 }),
      kbd('9', '9', { sub: '(', w: 45.89 }), kbd('0', '0', { sub: ')', w: 45.89 }),
      kbd('-', '-', { sub: '_', w: 45.89 }), kbd('=', '=', { sub: '+', w: 45.89 }),
      kbdKey('Backspace', 'backspace', 99.42, '功能键')
    ]
  },
  { // 第2行 Tab 行 Y=66
    row: [
      kbdKey('Tab', 'tab', 75, '功能键'),
      kbd('Q', 'q', { w: 43.93 }), kbd('W', 'w', { w: 43.93 }), kbd('E', 'e', { w: 43.93 }),
      kbd('R', 'r', { w: 43.93 }), kbd('T', 't', { w: 43.93 }), kbd('Y', 'y', { w: 43.93 }),
      kbd('U', 'u', { w: 43.93 }), kbd('I', 'i', { w: 43.93 }), kbd('O', 'o', { w: 43.93 }),
      kbd('P', 'p', { w: 43.93 }), kbd('[', '[', { sub: '{', w: 43.93 }),
      kbd(']', ']', { sub: '}', w: 43.93 }), kbd('\\', '\\', { sub: '|', w: 93.84 })
    ]
  },
  { // 第3行 CapsLock 行 Y=132
    row: [
      kbdKey('Caps Lock', 'capslock', 88, '状态键'),
      kbd('A', 'a', { w: 43.55 }), kbd('S', 's', { w: 43.55 }), kbd('D', 'd', { w: 43.55 }),
      kbd('F', 'f', { w: 43.55 }), kbd('G', 'g', { w: 43.55 }), kbd('H', 'h', { w: 43.55 }),
      kbd('J', 'j', { w: 43.55 }), kbd('K', 'k', { w: 43.55 }), kbd('L', 'l', { w: 43.55 }),
      kbd(';', ';', { sub: ':', w: 43.55 }), kbd("'", "'", { sub: '"', w: 43.55 }),
      kbdKey('Enter', 'enter', 135, '功能键')
    ]
  },
  { // 第4行 Shift 行 Y=198
    row: [
      kbdKey('Shift', 'shift', 105, '状态键'),
      kbd('Z', 'z', { w: 44.30 }), kbd('X', 'x', { w: 44.30 }), kbd('C', 'c', { w: 44.30 }),
      kbd('V', 'v', { w: 44.30 }), kbd('B', 'b', { w: 44.30 }), kbd('N', 'n', { w: 44.30 }),
      kbd('M', 'm', { w: 44.30 }), kbd(',', ',', { sub: '<', w: 44.30 }),
      kbd('.', '.', { sub: '>', w: 44.30 }), kbd('/', '/', { sub: '?', w: 44.30 }),
      kbdKey('Shift', 'shift', 160, '状态键')
    ]
  },
  { // 第5行 底行 Y=264
    row: [
      kbdKey('Ctrl', 'ctrl', 70, '状态键'), kbdKey('Fn', 'fn', 42, '状态键'),
      kbdKey('Win', 'win', 70, '状态键'), kbdKey('Alt', 'alt', 70, '状态键'),
      kbdKey('␣', ' ', 298, 'thumb'),
      kbdKey('Alt', 'alt', 70, '状态键'), kbdKey('Mn', 'menu', 42, '状态键'),
      kbdKey('Ctrl', 'ctrl', 70, '状态键')
    ]
  }
];

// 每行错位类名（阶梯，用 padding 实现）
const KBD_CLASSES = ['num-row', 'row-q', 'row-a', 'row-z', 'row-space'];

// ---------- 工具函数 ----------
function kbd(label, key, opts = {}) {
  const o = typeof opts === 'object' ? opts : {};
  return { type: 'char', label, key, sub: o.sub || '', w: o.w || 44 };
}
function kbdKey(label, key, w, kind) {
  return { type: kind, label, key, w };
}

// ---------- 课程目标生成 ----------
function buildTarget(lesson) {
  const words = lesson.words;
  const out = [];
  let rest = lesson.length;
  const upper = lesson.id === 7;
  while (rest > 0) {
    let w = words[Math.floor(Math.random() * words.length)];
    if (upper) w = w.charAt(0).toUpperCase() + w.slice(1);
    if (out.length > 0) { out.push(' '); rest -= 1; }
    const chars = w.split('');
    if (rest >= chars.length) { out.push(...chars); rest -= chars.length; }
    else { out.push(...chars.slice(0, rest)); rest = 0; }
  }
  return out.join('');
}

window.LESSONS = LESSONS; window.KEY_FINGER = KEY_FINGER; window.FINGER_NAME = FINGER_NAME;
window.FINGER_HINT = FINGER_HINT; window.FINGER_COLOR = FINGER_COLOR;
window.KBD = KBD; window.KBD_CLASSES = KBD_CLASSES; window.buildTarget = buildTarget;