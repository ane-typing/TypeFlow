// 最终验证 - 检查所有课程编码完整性
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'zh', 'wubiDict.js'), 'utf-8');
const start = src.indexOf('{');
const end = src.lastIndexOf('};');
const dictStr = src.slice(start, end + 1);

const DICT = {};
const regex = /'([^']+)'\s*:\s*'([^']*)'/g;
let match;
while ((match = regex.exec(dictStr)) !== null) {
  DICT[match[1]] = match[2];
}
function getWubi(ch) { return DICT[ch] || null; }

const lessons = [
  { id: 1, name: '一级简码', text: '一地在要工上是中国同和的有人我主产不为这民了发以经' },
  { id: 2, name: '键名字', text: '金木水火土日月口田山王土大木工目日口田山又女子白手立言耳刀弓禾竹' },
  { id: 3, name: '高频单字', text: '的了我你有他在不们和就对都可也这那上会为来以人要个到能生时地子中国年得说下出过家学天里小好自长大工作己经发' },
  { id: 4, name: '二字词组', text: '我们可以没有这个进行工作学习电脑生活快乐朋友老师学校阅读音乐电影美丽阳光幸福知道应该所以因为如果而且虽然但是非常' },
  { id: 5, name: '综合词组', text: '现代化高科技越来越计算机互联网人工智能生产力世界观人生观价值观环境保护可持续发展技术革命创新驱动改革开放' },
  { id: 6, name: '文章练习', text: '知识就是力量。读书使人进步。实践出真知。团结就是力量。一寸光阴一寸金。少壮不努力老大徒伤悲。世上无难事只怕有心人。' }
];

let allOk = true;
for (const lesson of lessons) {
  const chars = [...lesson.text];
  const unique = [...new Set(chars)];
  const noCode = chars.filter(ch => !getWubi(ch));
  const uniqueMissing = [...new Set(noCode)];
  if (uniqueMissing.length > 0) {
    console.log(`❌ 课程${lesson.id}(${lesson.name}) 缺少编码: ${uniqueMissing.join(' ')}`);
    allOk = false;
  } else {
    console.log(`✅ 课程${lesson.id}(${lesson.name}) 全部 ${chars.length} 字都有编码`);
  }
}

if (allOk) {
  console.log('\n🎉 所有课程编码完整！');
} else {
  console.log('\n⚠️ 还有缺失，需要补充');
}