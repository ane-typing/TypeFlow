// 打字练习软件 - 回归测试 v5
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'typing-harness4-'));
app.setPath('userData', TMP);
const ROOT = path.resolve(__dirname, '..');
require(path.join(ROOT, 'backend', 'main.js'));

let win = null;
const consoleErrors = [];
let step = 0;
const results = [];
function pass(name, extra) { results.push(['PASS', name, extra || '']); console.log('[PASS]', name, extra || ''); }
function fail(name, extra) { results.push(['FAIL', name, extra || '']); console.log('[FAIL]', name, extra || ''); }
function info(name, extra) { results.push(['INFO', name, extra || '']); console.log('[INFO]', name, extra || ''); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function js(code) { return win.webContents.executeJavaScript(code); }
function keyInit(ch) { return (ch >= 'A' && ch <= 'Z') ? { key: ch, shiftKey: true } : { key: ch }; }
async function typeText(text, yieldEvery = 0) {
  const arr = [...text];
  for (let i = 0; i < arr.length; i++) {
    await js(`window.dispatchEvent(new KeyboardEvent('keydown', ${JSON.stringify(keyInit(arr[i]))})); true`);
    if (yieldEvery > 0 && (i + 1) % yieldEvery === 0) await sleep(2);
  }
}
async function zhCommit(ch) {
  if (ch === ' ') {
    await js(`(() => { const i = document.querySelector('input.zh-hidden-input'); if(!i) return false;
      i.value = ' '; i.dispatchEvent(new InputEvent('input', {bubbles:true})); i.value=''; return true; })()`);
  } else {
    await js(`(() => { const i = document.querySelector('input.zh-hidden-input'); if(!i) return false;
      i.dispatchEvent(new CompositionEvent('compositionstart', {bubbles:true, data:''}));
      i.value = ${JSON.stringify(ch)};
      i.dispatchEvent(new CompositionEvent('compositionend', {bubbles:true, data:${JSON.stringify(ch)}}));
      return true; })()`);
  }
}
async function typeZh(text) { for (const ch of text) await zhCommit(ch); }
async function readTarget(sel) { return js(`document.querySelector(${JSON.stringify(sel)}).textContent`); }

app.whenReady().then(async () => {
  try {
    await sleep(1500);
    win = BrowserWindow.getAllWindows()[0];
    if (!win) throw new Error('no window');
    win.hide();
    win.webContents.on('console-message', (e, level, message) => {
      const lvl = (typeof level === 'object' && level !== null) ? (level.level ?? 0) : level;
      const msg = (typeof level === 'object' && level !== null) ? (level.message ?? '') : String(message ?? '');
      if (lvl >= 2) consoleErrors.push(String(msg));
    });
    await sleep(500);

    // 种子数据：一条英文弱项记录（指法错误）
    step = 0;
    await js(`document.querySelector('#finger-training .lesson-btn').click()`); await sleep(200);
    const ft = await readTarget('#ft-target');
    await typeText([...ft][0] === 'a' ? 'x' : 'a'); // 制造错误 q 或 a
    await typeText([...ft].join(''), 10);
    await sleep(400);

    // ============ 1. 英文弱项训练通关 ============
    step = 1; info('场景1: 英文弱项训练');
    await js(`window.app.Router.switch('weak-point')`); await sleep(800);
    const ranks = await js(`[...document.querySelectorAll('.wp-rank-char')].map(e => e.textContent).join(',')`);
    info('弱项 排行字符', ranks);
    const isZhRank = /[\u4e00-\u9fff]/.test(ranks);
    if (isZhRank) { info('弱项 含中文(跳过英文场景)'); }
    else {
      await js(`document.querySelector('#wp-start').click()`); await sleep(400);
      const wpTarget = await readTarget('#wp-text');
      info('弱项 英文训练目标样例', [...wpTarget].slice(0, 20).join(''));
      await typeText(wpTarget, 8);
      await sleep(500);
      const wpDone = await js(`!document.querySelector('#wp-result').hidden`);
      if (wpDone) pass('弱项: 英文训练通关', `${wpTarget.length} 字符`);
      else fail('弱项: 英文训练通关', '结果弹层未出现');
      await js(`document.querySelector('#wp-back').click()`); await sleep(200);
    }

    // ============ 2. 五笔课程6（含标点） ============
    step = 2; info('场景2: 五笔课程6标点');
    await js(`window.app.Router.switch('zh')`); await sleep(200);
    await js(`document.querySelector('#zh-to-wubi').click()`); await sleep(200);
    await js(`[...document.querySelectorAll('#wb-lessons .lesson-btn')].find(b => b.textContent.includes('课程6')).click()`); await sleep(300);
    const wb6 = await readTarget('#wb-target');
    const wb6Chars = [...wb6];
    const wubiDict = await js(`window.WUBI_DICT`);
    let skipped = 0;
    for (const ch of wb6Chars) {
      const code = wubiDict[ch];
      if (!code) { skipped++; continue; }
      await typeText(code);
    }
    await sleep(500);
    const wb6Done = await js(`!document.querySelector('#wb-result').hidden`);
    if (wb6Done) pass('五笔: 课程6通关(标点自动跳过)', `${wb6Chars.length} 字, 跳过标点 ${skipped}`);
    else fail('五笔: 课程6通关', '结果弹层未出现');
    await js(`document.querySelector('#wb-back').click()`); await sleep(200);

    // ============ 3. 拼音课程5（含句号） ============
    step = 3; info('场景3: 拼音课程5标点');
    await js(`document.querySelector('#zh-to-pinyin').click()`); await sleep(200);
    await js(`[...document.querySelectorAll('#py-lessons .lesson-btn')].find(b => b.textContent.includes('课程5')).click()`); await sleep(300);
    const py5 = await readTarget('#py-target');
    info('拼音 课程5 长度', String(py5.length));
    await typeZh(py5);
    await sleep(500);
    const py5Done = await js(`!document.querySelector('#py-result').hidden`);
    if (py5Done) pass('拼音: 课程5通关(含句号)', `${py5.length} 字`);
    else fail('拼音: 课程5通关', '结果弹层未出现');
    await js(`document.querySelector('#py-back').click()`); await sleep(200);

    // ============ 4. 程序员课程1（免Shift符号） ============
    step = 4; info('场景4: 程序员课程1');
    await js(`window.app.Router.switch('coder')`); await sleep(200);
    await js(`[...document.querySelectorAll('#coder-training .lesson-btn')].find(b => b.textContent.includes('课程1')).click()`); await sleep(300);
    const c1 = await readTarget('#ct-target');
    info('程序员 课程1 目标样例', JSON.stringify([...c1].slice(0, 24).join('')));
    await typeText(c1, 8);
    await sleep(400);
    const c1Done = await js(`!document.querySelector('#ct-result').hidden`);
    if (c1Done) pass('程序员: 课程1通关(符号键)', `${c1.length} 字符`);
    else fail('程序员: 课程1通关', '结果弹层未出现');

    // ============ 5. 弱项记录入库检查 ============
    step = 5; info('场景5: 弱项记录');
    await js(`window.app.Router.switch('records')`); await sleep(500);
    const types = await js(`[...new Set([...document.querySelectorAll('.rec-type-badge')].map(e => e.textContent))].join(',')`);
    info('记录 类型汇总', types);

  } catch (e) {
    fail('HARNESS CRASH at step ' + step, e.message + ' || ' + (e.stack || '').split('\n').slice(0, 4).join(' | '));
  }

  console.log('\n===== CONSOLE ERRORS =====');
  console.log(consoleErrors.length ? [...new Set(consoleErrors)].join('\n') : '(none)');
  console.log('\n===== SUMMARY =====');
  let npass = 0, nfail = 0;
  for (const r of results) { if (r[0] === 'PASS') npass++; if (r[0] === 'FAIL') nfail++; }
  console.log('pass:', npass, 'fail:', nfail);
  app.exit(0);
}).catch(e => { console.error('FATAL', e); app.exit(1); });
