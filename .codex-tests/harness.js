// 打字练习软件 - 自动化冒烟测试 v2
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'typing-harness-'));
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

function keyInit(ch) {
  if (ch >= 'A' && ch <= 'Z') return { key: ch, shiftKey: true };
  return { key: ch };
}
async function typeText(text, yieldEvery = 0) {
  const arr = [...text];
  for (let i = 0; i < arr.length; i++) {
    await js(`window.dispatchEvent(new KeyboardEvent('keydown', ${JSON.stringify(keyInit(arr[i]))})); true`);
    if (yieldEvery > 0 && (i + 1) % yieldEvery === 0) await sleep(2);
  }
}
async function pressEnter() { await js(`window.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter'})); true`); }
async function pressBackspace() { await js(`window.dispatchEvent(new KeyboardEvent('keydown', {key:'Backspace'})); true`); }
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
function readRecordsTail() {
  try {
    const file = path.join(TMP, 'records.json');
    if (!fs.existsSync(file)) return null;
    const list = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return list[list.length - 1] || null;
  } catch (e) { return null; }
}

app.whenReady().then(async () => {
  try {
    await sleep(1500);
    win = BrowserWindow.getAllWindows()[0];
    if (!win) throw new Error('no window');
    win.hide();
    win.webContents.on('console-message', (e, level, m) => { if (level >= 2) consoleErrors.push(String(m)); });
    await sleep(500);

    // ============ 1. 指法练习 ============
    step = 1; info('场景1: 指法练习');
    await js(`document.querySelector('#finger-training .lesson-btn').click()`); await sleep(300);
    const ftTarget = await readTarget('#ft-target');
    info('指法 课程1 目标长度', String(ftTarget.length));
    // 故意打错一个字符
    const first = [...ftTarget][0];
    await typeText(first === 'a' ? 'b' : 'a');
    await sleep(200);
    const errCount = await js(`document.querySelector('#ft-errors').textContent`);
    if (errCount === '1') pass('指法: 错误计数', '错误键计入');
    else fail('指法: 错误计数', '期望1实际' + errCount);
    // 打一个正确字符，验证进度
    await typeText(first);
    await sleep(150);
    const prog1 = await js(`document.querySelector('#ft-progress').textContent`);
    if (prog1.startsWith('1/')) pass('指法: 单次挂载进度正常', prog1);
    else fail('指法: 单次挂载进度正常', prog1);
    // 模拟重复点击当前导航按钮（同视图重复 mount）
    await js(`window.app.Router.switch('practice')`); await sleep(300);
    const progBefore = parseInt(await js(`document.querySelector('#ft-progress').textContent`), 10);
    const nextChar = [...ftTarget][progBefore] || 'a';
    await typeText(nextChar);
    await sleep(150);
    const progAfter = parseInt(await js(`document.querySelector('#ft-progress').textContent`), 10);
    const delta = progAfter - progBefore;
    if (delta === 1) pass('指法: 重复切换同视图无重复监听', `进度 +${delta}`);
    else fail('指法: 重复切换同视图无重复监听', `进度 +${delta}（出现重复 keydown 监听）`);
    // 补齐剩余字符通关
    const cur = await js(`parseInt(document.querySelector('#ft-progress').textContent,10)`);
    await typeText([...ftTarget.slice(cur)].join(''), 5);
    await sleep(400);
    const ftDone = await js(`!document.querySelector('#ft-result').hidden`);
    if (ftDone) pass('指法: 完整通关', `${ftTarget.length} 字符`);
    else fail('指法: 完整通关', '结果弹层未出现');

    // ============ 2. 程序员练习 ============
    step = 2; info('场景2: 程序员练习');
    await js(`window.app.Router.switch('coder')`); await sleep(300);
    await js(`[...document.querySelectorAll('#coder-training .lesson-btn')].find(b => b.textContent.includes('上档符号')).click()`); await sleep(300);
    const cTarget = await readTarget('#ct-target');
    info('程序员 课程2 目标样例', JSON.stringify([...cTarget].slice(0, 20).join('')));
    await typeText(cTarget, 8);
    await sleep(400);
    const cDone = await js(`!document.querySelector('#ct-result').hidden`);
    if (cDone) pass('程序员: 上档符号课通关', `${cTarget.length} 字符`);
    else fail('程序员: 上档符号课通关', '结果弹层未出现');
    await js(`[...document.querySelectorAll('#coder-training .lang-btn')].find(b => b.dataset.lang === 'java').click()`); await sleep(300);
    const javaLessons = await js(`[...document.querySelectorAll('#coder-training .lesson-bar:not(.lang-bar) .lesson-btn')].length`);
    if (javaLessons === 6) pass('程序员: 切换Java语言', '6门课');
    else fail('程序员: 切换Java语言', '数量' + javaLessons);

    // ============ 3. 英文速度测试 ============
    step = 3; info('场景3: 英文速度测试');
    await js(`window.app.Router.switch('speed')`); await sleep(300);
    await js(`document.querySelector('#speed-cards .article-card').click()`); await sleep(300);
    const spTarget = await readTarget('#speed-text');
    info('速度(EN) 文章长度', String(spTarget.length));
    await typeText([...spTarget][0]); await sleep(100);
    await pressBackspace(); await sleep(100);
    const spIdx = await js(`document.querySelector('#sp-progress').textContent`);
    info('速度(EN) 退格后进度', spIdx);
    await typeText(spTarget, 10);
    await sleep(500);
    const spDone = await js(`!document.querySelector('#speed-result').hidden`);
    if (spDone) pass('速度(EN): 完整通关', `${spTarget.length} 字符`);
    else fail('速度(EN): 完整通关', '结果弹层未出现');

    // ============ 4. 代码速度测试（换行符） ============
    step = 4; info('场景4: 代码速度测试');
    await js(`document.querySelector('#sp-back').click()`); await sleep(200);
    await js(`[...document.querySelectorAll('#speed-tabs .speed-tab')].find(t => t.dataset.tab === 'code').click()`); await sleep(200);
    await js(`document.querySelector('#speed-cards .article-card').click()`); await sleep(300);
    const cdTarget = await readTarget('#speed-text');
    const nlIdx = [...cdTarget].findIndex(c => c === '\n');
    info('代码 片段', `${cdTarget.length} 字符, 首个换行位置 ${nlIdx}`);
    if (nlIdx > 0) {
      await typeText([...cdTarget.slice(0, nlIdx)].join(''));
      await sleep(200);
      const beforeDone = await js(`document.querySelectorAll('.speed-char.done').length`);
      await pressEnter(); await sleep(250);
      const afterDone = await js(`document.querySelectorAll('.speed-char.done').length`);
      info('代码 按Enter前后', beforeDone + ' -> ' + afterDone);
      if (afterDone === beforeDone) {
        fail('代码速度测试: 换行符无法输入', `按Enter无效，卡在 ${afterDone}`);
      } else {
        pass('代码速度测试: 换行符可输入', `推进到 ${afterDone}`);
      }
    }
    await js(`document.querySelector('#speed-quit').click()`); await sleep(200);

    // ============ 5. 中文速度测试 ============
    step = 5; info('场景5: 中文速度测试');
    await js(`[...document.querySelectorAll('#speed-tabs .speed-tab')].find(t => t.dataset.tab === 'zh').click()`); await sleep(200);
    await js(`document.querySelector('#speed-cards .article-card').click()`); await sleep(300);
    const zhSpTarget = await readTarget('#speed-text');
    const zsChars = [...zhSpTarget];
    info('速度(ZH) 文章长度', String(zsChars.length));
    // 第0个位置故意打错，制造 status 错误
    const zhWrong = zsChars[0] === '今' ? '天' : '今';
    await zhCommit(zhWrong); await sleep(100);
    // 从第1位起依次输入
    let zhOk = true;
    for (let i = 1; i < zsChars.length; i++) {
      await zhCommit(zsChars[i]);
      if (i % 30 === 0) await sleep(5);
    }
    await sleep(500);
    const zhDone = await js(`!document.querySelector('#speed-result').hidden`);
    if (zhDone) pass('速度(ZH): 完整通关', `${zsChars.length} 字符`);
    else fail('速度(ZH): 完整通关', '结果弹层未出现');

    // ============ 6. 拼音练习 ============
    step = 6; info('场景6: 拼音练习');
    await js(`window.app.Router.switch('zh')`); await sleep(300);
    await js(`document.querySelector('#zh-to-pinyin').click()`); await sleep(300);
    await js(`[...document.querySelectorAll('#py-lessons .lesson-btn')].find(b => b.textContent.includes('课程2')).click()`); await sleep(300);
    const pyTarget = await readTarget('#py-target');
    info('拼音 课程2 长度', String(pyTarget.length));
    await typeZh(pyTarget);
    await sleep(500);
    const pyDone = await js(`!document.querySelector('#py-result').hidden`);
    if (pyDone) pass('拼音: 完整通关', `${pyTarget.length} 字`);
    else fail('拼音: 完整通关', '结果弹层未出现');
    // 课程1 含空格
    await js(`document.querySelector('#py-close').click()`); await sleep(150);
    await js(`[...document.querySelectorAll('#py-lessons .lesson-btn')].find(b => b.textContent.includes('课程1')).click()`); await sleep(300);
    const py1 = await readTarget('#py-target');
    const py1Chars = [...py1];
    const hasSpace = py1Chars.includes(' ');
    info('拼音 课程1 含空格', String(hasSpace));
    if (hasSpace) {
      let spaceOk = true;
      for (let i = 0; i < 12 && i < py1Chars.length; i++) await zhCommit(py1Chars[i]);
      const pyProg = await js(`document.querySelector('#py-progress').textContent`);
      spaceOk = pyProg.split('/')[0] === String(Math.min(12, py1Chars.length));
      if (spaceOk) pass('拼音: 空格可输入', pyProg); else fail('拼音: 空格可输入', pyProg);
    }
    // 验证同视图重复点击导致僵尸计时器（切到zh再点zh）
    await js(`window.app.Router.switch('zh')`); await sleep(300);
    const zhMenuShown = await js(`!!document.querySelector('#zh-to-pinyin')`);
    info('拼音 重复点击后菜单', String(zhMenuShown));
    await sleep(1200);
    const newErrors = consoleErrors.length;
    await js(`window.app.Router.switch('zh')`); await sleep(100);
    const zhMenu2 = await js(`!!document.querySelector('#zh-to-pinyin')`);
    info('拼音 再次点击菜单', String(zhMenu2));
    await sleep(1600);
    const newErrors2 = consoleErrors.length;
    if (newErrors2 > newErrors) info('拼音 僵尸计时器错误', '重复点击产生控制台错误 ' + (newErrors2 - newErrors) + ' 条');
    else info('拼音 僵尸计时器', '无额外错误');
    await js(`window.app.Router.switch('zh')`); await sleep(100);

    // ============ 7. 五笔练习 ============
    step = 7; info('场景7: 五笔练习');
    await js(`document.querySelector('#zh-to-wubi').click()`); await sleep(300);
    await js(`[...document.querySelectorAll('#wb-lessons .lesson-btn')].find(b => b.textContent.includes('课程1')).click()`); await sleep(300);
    const wbTarget = await readTarget('#wb-target');
    const wbChars = [...wbTarget];
    const wubiDict = await js(`window.WUBI_DICT`);
    info('五笔 课程1 长度', String(wbChars.length));
    for (const ch of wbChars) {
      const code = wubiDict[ch];
      if (!code) { info('五笔 无编码字符(自动跳过)', ch); continue; }
      await typeText(code);
    }
    await sleep(500);
    const wbDone = await js(`!document.querySelector('#wb-result').hidden`);
    if (wbDone) pass('五笔: 完整通关', `${wbChars.length} 字`);
    else fail('五笔: 完整通关', '结果弹层未出现');
    const wbRecord = readRecordsTail();
    if (wbRecord && wbRecord.time > 0) {
      const totalLetters = wbChars.reduce((s, c) => s + ((wubiDict[c] || '').length), 0);
      const charCount = wbChars.length;
      info('五笔 cpm语义', `字=${charCount} 编码字母=${totalLetters} 记录cpm=${wbRecord.cpm}`);
      if (wbRecord.cpm > 0 && charCount > 0) {
        const ratio = wbRecord.cpm / (charCount * 60 / (wbRecord.time * 60));
        info('五笔 cpm/字速 比值', ratio.toFixed(2));
      }
    }
    await js(`document.querySelector('#wb-back').click()`); await sleep(200);

    // ============ 8. 成绩记录 ============
    step = 8; info('场景8: 成绩记录');
    await js(`window.app.Router.switch('records')`); await sleep(600);
    const rowCnt = await js(`document.querySelectorAll('#rec-tbody tr').length`);
    info('记录 行数(含详情行)', String(rowCnt));
    if (rowCnt > 0) pass('记录: 表格渲染', rowCnt + ' 行');
    else fail('记录: 表格渲染', '0 行');
    const chartHidden = await js(`document.getElementById('rec-chart').hidden`);
    if (!chartHidden) pass('记录: 图表渲染', '可见');
    else fail('记录: 图表渲染', 'hidden');
    // 展开「中文速度」记录，检查错误统计
    const zhRowFound = await js(`(() => {
      const tr = [...document.querySelectorAll('#rec-tbody tr')].find(r => r.textContent.includes('中文速度'));
      if (!tr) return false;
      const btn = tr.querySelector('.rec-expand'); if (btn) btn.click(); return true;
    })()`);
    await sleep(400);
    if (zhRowFound) {
      const saErr = await js(`document.querySelector('.rec-detail-row:not(.hidden) .sa-err-count')?.textContent || ''`);
      const errCharCnt = await js(`document.querySelectorAll('.rec-detail-row:not(.hidden) .sa-err').length`);
      info('中文速度 详情', `sa-err计数文本="${saErr}" 红色错误字符=${errCharCnt}`);
      if (errCharCnt > 0 && /0\s*次/.test(saErr)) {
        fail('记录: 速度详情错误统计', '有红色错误字符但累计错误显示0次');
      } else if (errCharCnt > 0) {
        pass('记录: 速度详情错误统计', errCharCnt + ' 个错误字符');
      } else {
        info('记录: 速度详情错误统计', '未找到错误字符');
      }
    }
    // 删除一条
    await js(`(window.confirm = () => true, void 0)`);
    const before = await js(`document.querySelectorAll('#rec-tbody tr').length`);
    await js(`document.querySelector('#rec-tbody .rec-del').click()`); await sleep(400);
    const after = await js(`document.querySelectorAll('#rec-tbody tr').length`);
    if (after < before) pass('记录: 删除一条', `${before} -> ${after}`);
    else fail('记录: 删除一条', `${before} -> ${after}`);

    // ============ 9. 弱项特训 ============
    step = 9; info('场景9: 弱项特训');
    await js(`window.app.Router.switch('weak-point')`); await sleep(800);
    const wpRows = await js(`document.querySelectorAll('.wp-rank-item').length`);
    info('弱项 排行榜数量', String(wpRows));
    if (wpRows > 0) {
      pass('弱项: 排行渲染', wpRows + ' 项');
      await js(`document.querySelector('#wp-start').click()`); await sleep(400);
      const wpTarget = await readTarget('#wp-text');
      const wpChars = [...wpTarget];
      const isZh = wpChars.some(c => c.charCodeAt(0) > 0x2e7f);
      info('弱项 训练目标', wpChars.length + ' 字符, 含中文=' + isZh + ', 样例=' + wpChars.slice(0, 12).join(''));
      if (isZh) {
        // 中文弱项：真实 IME keydown 是 Process，尝试输入并观察
        await js(`window.dispatchEvent(new KeyboardEvent('keydown', {key:'Process'})); true`);
        await sleep(150);
        const wpProg = await js(`document.querySelector('#wp-progress').textContent`);
        info('弱项 中文 IME keydown 后进度', wpProg);
        if (wpProg.startsWith('0/')) fail('弱项: 中文训练可输入', 'IME 无法输入中文，卡在 ' + wpProg);
        else info('弱项: 中文训练可输入', wpProg);
      } else {
        await typeText(wpTarget, 8);
        await sleep(500);
        const wpDone = await js(`!document.querySelector('#wp-result').hidden`);
        if (wpDone) pass('弱项: 训练通关', `${wpChars.length} 字符`);
        else fail('弱项: 训练通关', '结果弹层未出现');
      }
      await js(`document.querySelector('#wp-quit')?.click()`); await sleep(200);
    } else {
      info('弱项 无排行数据(跳过)');
    }

    // ============ 10. 主题切换 ============
    step = 10; info('场景10: 主题切换');
    await js(`document.getElementById('theme-toggle').click()`); await sleep(200);
    const theme = await js(`document.documentElement.getAttribute('data-theme')`);
    const stored = await js(`localStorage.getItem('typing_theme')`);
    if (theme === stored) pass('主题: 切换生效', theme);
    else fail('主题: 切换生效', theme + ' vs ' + stored);

  } catch (e) {
    fail('HARNESS CRASH at step ' + step, e.message + ' || ' + (e.stack || '').split('\n').slice(0, 4).join(' | '));
  }

  console.log('\n===== CONSOLE ERRORS =====');
  console.log(consoleErrors.length ? [...new Set(consoleErrors)].join('\n') : '(none)');
  console.log('\n===== SUMMARY =====');
  let npass = 0, nfail = 0;
  for (const r of results) {
    if (r[0] === 'PASS') npass++;
    if (r[0] === 'FAIL') nfail++;
  }
  console.log('pass:', npass, 'fail:', nfail);
  app.exit(0);
}).catch(e => { console.error('FATAL', e); app.exit(1); });
