// 打字练习软件 - 针对性测试 v4（中文弱项 + 代码换行绕过）
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'typing-harness3-'));
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
    win.webContents.on('console-message', (e, level, message) => {
      const lvl = (typeof level === 'object' && level !== null) ? (level.level ?? 0) : level;
      const msg = (typeof level === 'object' && level !== null) ? (level.message ?? '') : String(message ?? '');
      if (lvl >= 2) consoleErrors.push(String(msg));
    });
    await sleep(500);

    // 先做一次带中文错误的速度测试，生成中文弱项
    step = 0;
    await js(`window.app.Router.switch('speed')`); await sleep(200);
    await js(`[...document.querySelectorAll('#speed-tabs .speed-tab')].find(t => t.dataset.tab === 'zh').click()`); await sleep(200);
    await js(`document.querySelector('#speed-cards .article-card').click()`); await sleep(200);
    const zh = [...(await readTarget('#speed-text'))];
    // 第一个字符打错（中文）
    await js(`(() => { const i = document.querySelector('input.zh-hidden-input'); i.dispatchEvent(new CompositionEvent('compositionstart', {bubbles:true, data:''})); i.value = '错'; i.dispatchEvent(new CompositionEvent('compositionend', {bubbles:true, data:'错'})); return true; })()`);
    await sleep(100);
    for (let i = 1; i < zh.length; i++) {
      const ch = zh[i];
      await js(`(() => { const i = document.querySelector('input.zh-hidden-input'); i.dispatchEvent(new CompositionEvent('compositionstart', {bubbles:true, data:''})); i.value = ${JSON.stringify(ch)}; i.dispatchEvent(new CompositionEvent('compositionend', {bubbles:true, data:${JSON.stringify(ch)}})); return true; })()`);
      if (i % 30 === 0) await sleep(5);
    }
    await sleep(400);

    // ============ 1. 中文弱项特训 ============
    step = 1; info('场景1: 中文弱项特训');
    await js(`window.app.Router.switch('weak-point')`); await sleep(800);
    const ranks = await js(`[...document.querySelectorAll('.wp-rank-char')].map(e => e.textContent).join(',')`);
    info('弱项 排行字符', ranks);
    const isZhRank = /[\u4e00-\u9fff]/.test(ranks);
    if (!isZhRank) {
      info('弱项 无中文弱项(跳过)');
    } else {
      await js(`document.querySelector('#wp-start').click()`); await sleep(400);
      const wpTarget = await readTarget('#wp-text');
      const wpChars = [...wpTarget];
      info('弱项 中文训练目标', wpChars.slice(0, 15).join('') + '... 长度 ' + wpChars.length);
      // 中文弱项通过隐藏输入框的 IME 合成输入
      const inputShown = await js(`!document.getElementById('wp-input-area').hidden`);
      const firstZh = wpChars.find(c => /[\u4e00-\u9fff]/.test(c)) || wpChars[0];
      await js(`(() => { const i = document.querySelector('#wp-zh-input'); i.dispatchEvent(new CompositionEvent('compositionstart', {bubbles:true, data:''})); i.value = ${JSON.stringify(firstZh)}; i.dispatchEvent(new CompositionEvent('compositionend', {bubbles:true, data:${JSON.stringify(firstZh)}})); return true; })()`);
      await sleep(150);
      const doneAfter = await js(`document.querySelectorAll('#wp-text .speed-char.done').length`);
      info('弱项 中文IME合成', `inputShown=${inputShown} done=${doneAfter}`);
      if (inputShown && doneAfter > 0) {
        pass('弱项: 中文训练IME输入', `推进 ${doneAfter}`);
      } else {
        fail('弱项: 中文训练IME输入', `inputShown=${inputShown} done=${doneAfter}`);
      }
      await js(`document.querySelector('#wp-quit')?.click()`); await sleep(200);
    }

    // ============ 2. 代码速度测试：换行可直接按 Enter ============
    step = 2; info('场景2: 代码速度测试换行');
    await js(`window.app.Router.switch('speed')`); await sleep(200);
    await js(`[...document.querySelectorAll('#speed-tabs .speed-tab')].find(t => t.dataset.tab === 'code').click()`); await sleep(200);
    await js(`document.querySelector('#speed-cards .article-card').click()`); await sleep(300);
    const cd = [...(await readTarget('#speed-text'))];
    const nlPositions = cd.map((c, i) => c === '\n' ? i : -1).filter(i => i >= 0);
    info('代码 片段换行位置数', String(nlPositions.length));
    let errsAtNl = 0;
    for (let i = 0; i < cd.length; i++) {
      if (cd[i] === '\n') {
        // 换行直接按 Enter 正确输入
        await js(`window.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter'})); true`);
      } else {
        await js(`window.dispatchEvent(new KeyboardEvent('keydown', ${JSON.stringify(keyInit(cd[i]))})); true`);
      }
      if (i % 40 === 0) await sleep(2);
    }
    await sleep(500);
    const done = await js(`!document.querySelector('#speed-result').hidden`);
    const shownErrs = await js(`document.querySelector('#sp-acc').textContent`);
    info('代码 用错字跳过换行后', `完成=${done} 准确率=${shownErrs}`);
    if (done) {
      if (errsAtNl > 0) {
        fail('代码速度测试: 换行处理', `必须打 ${errsAtNl} 个错字才能通过（按Enter无效），准确率被拉低`);
      } else {
        pass('代码速度测试: 换行处理', '无需错字');
      }
    } else {
      fail('代码速度测试: 换行处理', '无法完成');
    }

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
