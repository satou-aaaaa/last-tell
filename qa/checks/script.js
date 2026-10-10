// 台本：キャラの話し方がそろっているか、同じセリフの使い回し、英語に訳せない行（レビューの仕組み 案1、2026-10-10）
//   話し方の決まり: story/キャラクター作りこみ案.md「7. 話し方の早見表」
//   機械で見つけられるのは「候補」まで。新しく増えたものは ⚠️ にして、交代レビュー（物語・台本）で目で見る
'use strict';
const fs = require('fs');
const H = require('../lib/harness');

// 一人称（話し方の早見表）。ここに無いキャラは一人称を見ない
const FIRST = { 'ジン': '俺', 'ハヤト': '俺', 'クロウ': '私', 'ゲン': '俺', 'ロク': '俺', 'セキ': '私', 'レイカ': 'わたし', 'ソウ': '僕', '店主': 'あたし' };
const FP = ['俺', '僕', '私', 'わたし', 'あたし', 'わし'];
// 呼び方の決まり（言ってはいけない言い方）
const NEVER = [
  ['ハヤト', /師匠/, 'ハヤトはジンを「師匠」と呼ばない'],
  ['クロウ', /俺|お前|だろ[！!]?$/, 'クロウは丁寧語を崩さない'],
  ['ジン', /〈主〉/, 'ジンは主人公の名前を呼ばない（第7章の「一人前だ」のあとだけ）'],
];
const LONG = 70; // 吹き出しで3行を超えそうな長さ

async function run({ browser, file, baseline }) {
  const src = fs.readFileSync(file, 'utf8'), items = [];
  const { ctx, page } = await H.openGame(browser, file, { storage: H.UNLOCKED, lang: 'en' });
  let speakers, lines;
  try {
    speakers = await page.evaluate(() => [...new Set([...Object.keys(typeof INTRO !== 'undefined' ? INTRO : {}), 'ジン', '師匠', '店主', 'ディーラー', 'アオ'])]);
    const set = new Set(speakers);
    const re = /\[\s*(['"])([^'"\]\n]{1,8})\1\s*,\s*(['"])((?:(?!\3)[^\n]){2,400})\3\s*\]/g;
    const raw = []; let m;
    while ((m = re.exec(src))) if (set.has(m[2])) raw.push([m[2], m[4].replace(/\\(['"])/g, '$1')]);
    // 英語にしたとき、日本語が残る行
    lines = await page.evaluate(raw => raw.map(([who, t]) => { let en = ''; try { en = I18N.tr(t.split('〈主〉').join('Ao').split('〈呼〉').join('Ao')) } catch (e) { en = '' } return [who, t, /[぀-ヿ㐀-鿿]/.test(en)] }), raw);
  } finally { await ctx.close() }

  const strip = t => t.replace(/「[^」]*」/g, ''); // かぎかっこの中は、誰かの言葉の引用なので見ない
  const voice = [], never = [], long = [], enMiss = [];
  for (const [who, t, jp] of lines) {
    const own = FIRST[who];
    if (own) { const s = strip(t), other = FP.filter(w => w !== own && s.includes(w) && !(own === 'わたし' && w === 'わし') && !(own === 'あたし' && w === 'わし')); if (other.length) voice.push(`${who}「${t.slice(0, 40)}」（${other.join('・')}）`) }
    for (const [w, re, why] of NEVER) if (who === w && re.test(strip(t))) never.push(`${who}「${t.slice(0, 40)}」（${why}）`);
    if (t.length > LONG) long.push(`${who}「${t.slice(0, 30)}…」${t.length}字`);
    if (jp) enMiss.push(`${who}「${t.slice(0, 40)}」`);
  }
  const cnt = {}; lines.forEach(([w, t]) => { const k = `${w}「${t.slice(0, 40)}」`; cnt[k] = (cnt[k] || 0) + 1 });
  const dupes = Object.keys(cnt).filter(k => cnt[k] >= 3).map(k => `${k}×${cnt[k]}`);

  const B = (baseline && baseline.script) || {};
  const row = (id, title, list, key, okText) => {
    const old = new Set(B[key] || []), fresh = list.filter(x => !old.has(x)), kept = list.filter(x => old.has(x));
    items.push({ id, title, status: fresh.length ? 'warn' : kept.length ? 'known' : 'ok',
      detail: fresh.length ? `新しく ${fresh.length}件: ` + fresh.slice(0, 5).join('、') : kept.length ? `前からある ${kept.length}件（交代レビューで中身を見る）: ` + kept.slice(0, 2).join('、') : okText, list });
  };
  row('script:first-person', '一人称が話し方の早見表どおり（ジン・ゲン・ロク・ハヤト「俺」、クロウ・セキ「私」、レイカ「わたし」、ソウ「僕」）', voice, 'voice', `${lines.length}行を確認、ずれ0`);
  row('script:never', '言ってはいけない言い方がない（ハヤトの「師匠」、クロウの崩れた言葉、ジンが名前を呼ぶ）', never, 'never', 'なし');
  row('script:dupes', '同じセリフを3回以上使い回していない', dupes, 'dupes', 'なし');
  row('script:long', `長すぎるセリフがない（${LONG}字まで）`, long, 'long', 'なし');
  row('script:en', 'セリフが全部英語に訳せる（訳したあとに日本語が残らない）', enMiss, 'enMiss', `${lines.length}行、全部訳せる`);
  return { name: '台本', items, baselineOut: { script: { voice, never, dupes, long, enMiss } } };
}
module.exports = { run };
