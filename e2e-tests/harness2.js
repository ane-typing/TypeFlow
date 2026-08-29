// 打字练习软件 - 针对性测试 v3
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'typing-harness2-'));
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
async function readTarget(sel) { return js(`document.querySelector(${JSON.stringify(sel)}).textContent`); }

app.whenReady().then(async () => {
  try {
    await sleep(1500);
    win = BrowserWindow.getAllWindows()[0];
    if (!win) throw new Error('no window');
    win.hide();
    // 兼容新旧 console-message 签名
    win.webContents.on('console-message', (e, level, message, line, sourceId) => {
      const lvl = (typeof level === 'object' && level !== null) ? (level.level ?? e.level) : level;
      const msg = (typeof level === 'object' && level !== null) ? (level.message ?? '') : String(message ?? '');
      if (lvl >= 2) consoleErrors.push(String(msg));
    });
    await sleep(500);

    // 准备数据：先完成一次指法（带错误）和一次英文速度（通关），供记录页测试
    step = 0;
    await js(`document.querySelector('#finger-training .lesson-btn').click()`); await sleep(200);
    const ft = await readTarget('#ft-target');
    await typeText([...ft][0] === 'a' ? 'x' : 'a'); // 制造错误
    await typeText([...ft].join(''), 10);
    await sleep(400);
    await js(`window.app.Router.switch('speed')`); await sleep(200);
    await js(`document.querySelector('#speed-cards .article-card').click()`); await sleep(200);
    const sp = await readTarget('#speed-text');
    await typeText(sp, 15);
    await sleep(400);
    await js(`window.app.Router.switch('records')`); await sleep(500);

    // ============ 1. 记录删除（修正 confirm 序列化） ============
    step = 1; info('场景1: 记录删除');
    const before = await js(`document.querySelectorAll('#rec-tbody tr').length`);
    await js(`((window.confirm = () => true, void 0), void 0)`);
    await js(`document.querySelector('#rec-tbody .rec-del').click()`);
    await sleep(500);
    const after = await js(`document.querySelectorAll('#rec-tbody tr').length`);
    if (after < before) pass('记录: 删除一条', `${before} -> ${after}`);
    else fail('记录: 删除一条', `${before} -> ${after}`);

    // ============ 2. 记录清空 ============
    step = 2; info('场景2: 记录清空');
    const hasClearBtn = await js(`!!document.querySelector('#rec-clear')`);
    await js(`document.querySelector('#rec-clear').click()`);
    await sleep(500);
    const rowsAfterClear = await js(`document.querySelectorAll('#rec-tbody tr').length`);
    const emptyShown = await js(`document.getElementById('rec-empty') ? !document.getElementById('rec-empty').hidden : false`);
    if (rowsAfterClear === 0 && emptyShown) pass('记录: 清空全部', '空态显示');
    else fail('记录: 清空全部', 'rows=' + rowsAfterClear + ' emptyShown=' + emptyShown);

    // ============ 3. 指法大写课程7 ============
    step = 3; info('场景3: 指法大写课程');
    await js(`window.app.Router.switch('practice')`); await sleep(200);
    await js(`[...document.querySelectorAll('#finger-training .lesson-btn')].find(b => b.textContent.includes('课程7')).click()`); await sleep(300);
    const ft7 = await readTarget('#ft-target');
    const hasUpper = [...ft7].some(c => c >= 'A' && c <= 'Z');
    info('指法 课程7 含大写', String(hasUpper));
    await typeText(ft7, 8);
    await sleep(400);
    const ft7Done = await js(`!document.querySelector('#ft-result').hidden`);
    if (ft7Done) pass('指法: 大写课程通关', `${ft7.length} 字符`);
    else fail('指法: 大写课程通关', '结果弹层未出现');

    // ============ 4. 程序员括号/引号课程 ============
    step = 4; info('场景4: 程序员括号课程');
    await js(`window.app.Router.switch('coder')`); await sleep(200);
    await js(`[...document.querySelectorAll('#coder-training .lesson-btn')].find(b => b.textContent.includes('括号')).click()`); await sleep(300);
    const c3 = await readTarget('#ct-target');
    info('程序员 课程3 目标样例', JSON.stringify([...c3].slice(0, 24).join('')));
    await typeText(c3, 8);
    await sleep(400);
    const c3Done = await js(`!document.querySelector('#ct-result').hidden`);
    if (c3Done) pass('程序员: 括号课通关', `${c3.length} 字符`);
    else fail('程序员: 括号课通关', '结果弹层未出现');
    // Java 代码段（含引号/分号/花括号）
    await js(`[...document.querySelectorAll('#coder-training .lang-btn')].find(b => b.dataset.lang === 'java').click()`); await sleep(200);
    await js(`[...document.querySelectorAll('#coder-training .lesson-btn')].find(b => b.textContent.includes('课程6')).click()`); await sleep(300);
    const c6 = await readTarget('#ct-target');
    info('程序员 Java课程6 目标样例', JSON.stringify([...c6].slice(0, 30).join('')));
    await typeText(c6, 10);
    await sleep(500);
    const c6Done = await js(`!document.querySelector('#ct-result').hidden`);
    if (c6Done) pass('程序员: Java代码段通关', `${c6.length} 字符`);
    else fail('程序员: Java代码段通关', '结果弹层未出现');

    // ============ 5. 代码片段特殊字符（制表符等） ============
    step = 5; info('场景5: 代码片段特殊字符');
    const special = await js(`(() => {
      const tabs = window.CODE_SNIPPETS.filter(s => s.text.includes(String.fromCharCode(9))).length;
      const nl = window.CODE_SNIPPETS.filter(s => s.text.includes(String.fromCharCode(10))).length;
      return { tabs, nl, total: window.CODE_SNIPPETS.length };
    })()`);
    info('代码片段', JSON.stringify(special));
    if (special.nl === special.total && special.tabs === 0) info('代码片段 全部含换行', '无制表符');
    else info('代码片段 换行/制表符分布', JSON.stringify(special));

    // ============ 6. 拼音僵尸计时器（onerror 钩子） ============
    step = 6; info('场景6: 拼音僵尸计时器');
    await js(`window.__pageErrors = []; window.addEventListener('error', e => window.__pageErrors.push(e.message)); void 0`);
    await js(`window.app.Router.switch('zh')`); await sleep(200);
    await js(`document.querySelector('#zh-to-pinyin').click()`); await sleep(200);
    await js(`[...document.querySelectorAll('#py-lessons .lesson-btn')].find(b => b.textContent.includes('课程1')).click()`); await sleep(200);
    await js(`(window.app.Router.switch('zh'), void 0)`); // 同视图重复点击
    await sleep(2000);
    const pageErrCount = await js(`window.__pageErrors.length`);
    const pageErrSamples = await js(`window.__pageErrors.slice(0, 3).join(' || ')`);
    info('拼音 重复点击后页面错误', pageErrCount + ' 条 ' + pageErrSamples);
    if (pageErrCount > 0) fail('拼音: 同视图重复点击无僵尸错误', pageErrCount + ' 条');
    else pass('拼音: 同视图重复点击无僵尸错误', '0 条');

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

