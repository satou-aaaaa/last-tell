// アクセシビリティの残り（uiux.js が見ていない所）：色だけに頼らないカード、「動きを減らす」設定（レビューの仕組み 案1、2026-10-10）
//   明るさの差・押す大きさ・ボタンの名前は uiux.js が見る。ここでは重ねない
'use strict';
const H = require('../lib/harness');

async function run({ browser, file, baseline }) {
  const items = [];
  // 1. カード：マークが字で出ている、読み上げの名前がある、♥と♦・♠と♣が色でも分かれる（4色デッキ）
  {
    const { ctx, page } = await H.openGame(browser, file, { fast: 25 });
    try {
      await page.evaluate(`($('freeSize').value='6',$('freeRule').value='',startFree())`);
      await H.startBot(page, { policy: 'call', maxHands: 3 });
      await page.waitForFunction(() => S && S.board && S.board.length >= 3, null, { timeout: 60000 }).catch(() => {});
      await page.evaluate(() => { __bot.done = true });
      const r = await page.evaluate(() => {
        const faces = [...document.querySelectorAll('.card:not(.back):not(.slot)')].filter(e => e.offsetParent !== null);
        const noMark = faces.filter(e => !/[♠♥♦♣]/.test(e.textContent)).length, noName = faces.filter(e => !e.getAttribute('aria-label')).length;
        // 4つのマークを並べて色を測る
        const box = document.createElement('div'); box.style.cssText = 'position:fixed;left:0;top:0;opacity:0';
        box.innerHTML = [0, 1, 2, 3].map(s => cardHTML({ r: 10, s })).join(''); document.body.appendChild(box);
        const col = [...box.children].map(c => getComputedStyle(c.querySelector('.s') || c).color); box.remove();
        return { faces: faces.length, noMark, noName, col, suits: SUITS, opt: /4色/.test(document.body.innerHTML) };
      });
      const four = new Set(r.col).size;
      items.push({ id: 'a11y:mark', title: 'カードのマークが字で出ていて、読み上げの名前がある（色だけに頼らない）', status: !r.faces ? 'warn' : r.noMark || r.noName ? 'fail' : 'ok',
        detail: !r.faces ? '表のカードが見つからなかった' : r.noMark || r.noName ? `マークなし ${r.noMark}枚、名前なし ${r.noName}枚（${r.faces}枚中）` : `表のカード ${r.faces}枚、全部マークと名前あり` });
      // 4色は設定で選ぶ形（プロ目線 B4、初期値は今の2色）。設定に「4色」があれば合格
      items.push({ id: 'a11y:4color', title: '4つのマークを4色にできる（色の見分けにくい人向けの4色デッキ、設定）', status: four >= 4 || r.opt ? 'ok' : 'fail',
        detail: `今の色 ${r.suits.map((s, i) => s + ' ' + r.col[i]).join('、')}（${four}色）、設定に4色の選択肢${r.opt ? 'あり' : 'なし'}` });
    } finally { await ctx.close() }
  }
  // 2. 「動きを減らす」設定：ずっと動き続けるアニメーションが止まっているか（タイトルと対戦中）
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block', reducedMotion: 'reduce' });
    await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    await ctx.addInitScript(`try{localStorage.setItem('shisho-settings',JSON.stringify({v:1,talk:'on',speed:'fast',sound:false,quiz:false,lang:'ja'}))}catch(e){}`);
    const page = await ctx.newPage();
    const loops = () => document.getAnimations().filter(a => a.playState === 'running' && a.effect && a.effect.getTiming().iterations === Infinity && a.effect.target && a.effect.target.offsetParent !== null)
      .map(a => { const t = a.effect.target; return (t.id ? '#' + t.id : t.tagName.toLowerCase() + (t.classList.length ? '.' + [...t.classList].slice(0, 2).join('.') : '')) + ' ' + (a.animationName || '') });
    try {
      await page.goto('file://' + require('path').resolve(file), { waitUntil: 'load' });
      await page.waitForTimeout(800);
      const title = await page.evaluate(loops);
      await page.evaluate(`($('freeSize').value='6',$('freeRule').value='',startFree())`);
      await page.waitForTimeout(500);
      await page.evaluate(() => { const b = document.getElementById('vsGo'); if (b) b.click() });
      await page.waitForTimeout(1500);
      await page.evaluate(() => { const b = document.querySelector('#vs:not([hidden]) .seatbtn'); if (b) b.click() });
      await page.waitForTimeout(2500);
      const game = await page.evaluate(loops);
      const list = [...new Set([...title.map(x => 'タイトル ' + x), ...game.map(x => '対戦中 ' + x)])];
      const old = new Set(((baseline && baseline.a11y) || {}).loops || []), fresh = list.filter(x => !old.has(x));
      items.push({ id: 'a11y:reduce-motion', title: '「動きを減らす」設定のとき、ずっと動き続けるものがない', status: fresh.length ? 'warn' : list.length ? 'known' : 'ok',
        detail: fresh.length ? `新しく ${fresh.length}件: ${fresh.slice(0, 5).join('、')}` : list.length ? `前からある ${list.length}件: ${list.slice(0, 3).join('、')}` : 'タイトルと対戦中で0件', list });
      return { name: 'アクセシビリティ（uiux の残り）', items, baselineOut: { a11y: { loops: list } } };
    } finally { await ctx.close() }
  }
}
module.exports = { run };
