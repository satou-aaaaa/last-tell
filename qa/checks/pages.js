// ゲームが開くページがそろっているかの検査（ブラウザを使わない）：テスト公開のリポジトリ（index.html のとなりに sw.js がある所）でだけ回す
//   1. 「その他」から開くページ：index.html の LINKS（privacy・terms・support）と、英語のとき開く -en.html がある
//   2. クレジットから開くフォントのライセンス全文（licenses/*.txt）がある
//   3. 1と2を sw.js が最初に保存する（CORE に入っている）。入っていないとオフラインで開けない
'use strict';
const fs = require('fs');
const path = require('path');

async function run({ file }) {
  const root = path.dirname(path.resolve(file)), items = [];
  if (!fs.existsSync(path.join(root, 'sw.js')))
    return { name: 'ゲームが開くページ', items: [{ id: 'pages:skip', title: 'ゲームが開くページの検査', status: 'warn', detail: 'となりに sw.js が無いので飛ばした（テスト公開のリポジトリの CI で回る）' }] };
  const src = fs.readFileSync(file, 'utf8');
  const has = f => { try { return fs.statSync(path.join(root, f)).size > 0 } catch (e) { return false } };

  // 1. LINKS と英語版
  const links = [...(((src.match(/const LINKS=\{([^}]*)\}/) || [])[1] || '').matchAll(/(\w+)\s*:\s*'([^']+)'/g))].map(m => m[2]);
  const en = /const linkFor=[^\n]*-en\.html/.test(src);
  const pages = links.flatMap(u => /^https?:/.test(u) ? [] : en ? [u, u.replace(/\.html$/, '-en.html')] : [u]);
  if (!links.length) items.push({ id: 'pages:links', title: '「その他」から開くページ（プライバシー・利用規約・サポート）がある', status: 'fail', detail: 'index.html に const LINKS={...} が見つからない（書き方が変わったら qa/checks/pages.js も直す）' });
  else {
    const miss = pages.filter(f => !has(f));
    items.push({ id: 'pages:links', title: '「その他」から開くページ（プライバシー・利用規約・サポート）がある', status: miss.length ? 'fail' : 'ok',
      detail: miss.length ? '無い: ' + miss.join('、') : `${pages.length}ページ（${en ? '日本語と英語' : '日本語だけ'}）` + (links.some(u => /^https?:/.test(u)) ? '、外のサイトへのリンクは見ていない' : '') });
  }

  // 2. ライセンス全文
  const lic = [...new Set([...src.matchAll(/\['[^'\]]+','[^'\]]+','([^'\]]+\.txt)'\]/g)].map(m => 'licenses/' + m[1])
    .concat([...src.matchAll(/["'](licenses\/[^"'$]+)["']/g)].map(m => m[1])))];
  if (!/licenses\//.test(src)) items.push({ id: 'pages:licenses', title: 'フォントのライセンス全文（licenses/）がある', status: 'ok', detail: 'ゲームから licenses/ を開いていない' });
  else if (!lic.length) items.push({ id: 'pages:licenses', title: 'フォントのライセンス全文（licenses/）がある', status: 'fail', detail: 'index.html のクレジットからライセンスのファイル名が読み取れない（書き方が変わったら qa/checks/pages.js も直す）' });
  else {
    const miss = lic.filter(f => !has(f));
    items.push({ id: 'pages:licenses', title: 'フォントのライセンス全文（licenses/）がある', status: miss.length ? 'fail' : 'ok', detail: miss.length ? '無い: ' + miss.join('、') : `${lic.length}件` });
  }

  // 3. sw.js がオフライン用に保存するか
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const core = new Set((((sw.match(/const CORE = \[([^\]]*)\]/) || [])[1] || '').match(/'[^']+'/g) || []).map(x => x.slice(1, -1).replace(/^\.\//, '')));
  const want = pages.concat(lic);
  if (pages.some(f => /\.html$/.test(f) && /href="style\.css"/.test(fs.existsSync(path.join(root, f)) ? fs.readFileSync(path.join(root, f), 'utf8') : ''))) want.push('style.css');
  const notCached = want.filter(f => !core.has(f));
  const coreMiss = [...core].filter(f => f && !has(f));
  items.push({ id: 'pages:offline', title: 'ゲームが開くページを sw.js が保存する（オフラインでも開ける）', status: notCached.length || coreMiss.length || !core.size ? 'fail' : 'ok',
    detail: !core.size ? 'sw.js に const CORE = [...] が見つからない'
      : [notCached.length && 'sw.js の CORE に無い: ' + notCached.join('、'), coreMiss.length && 'CORE にあるのにファイルが無い（入れると sw.js が動かない）: ' + coreMiss.join('、')].filter(Boolean).join('／') || `${want.length}件とも CORE に入っている` });

  // 4. 応援（Ko-fi）は support ページのただのリンク。外のスクリプトを読まない（2026-10-31 satouさんが Ko-fi に決めた）
  const sup = ['support.html', 'support-en.html'].filter(has).map(f => [f, fs.readFileSync(path.join(root, f), 'utf8')]);
  const bad = sup.filter(([, s]) => !/<a id="kofi" href="https:\/\/ko-fi\.com\/satouaaaaa"[^>]*rel="noopener/.test(s) || /<script[^>]+src=/.test(s)).map(([f]) => f);
  items.push({ id: 'pages:kofi', title: 'サポートのページに Ko-fi の応援リンクがある（ただのリンク・外のスクリプトなし）', status: bad.length || !sup.length ? 'fail' : 'ok',
    detail: bad.length ? '無い・形が違う: ' + bad.join('、') : `${sup.length}ページ` });

  return { name: 'ゲームが開くページ', items };
}
module.exports = { run };
