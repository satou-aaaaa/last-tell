// 検査そのもの（CI）の揺れ止めのテスト（2026-11-03 CI の失敗を減らす）。ゲームではなく検査の仕組みを見る
//   1. Lighthouse は何回か測った真ん中の値で見る（qa/lib/lighthouse.js）：1回だけ外れた回があっても「5点下がった」にならない
//   2. 入れる段階のやり直し（qa/tools/retry.sh）：一時的な失敗はやり直して通り、ずっと失敗なら失敗のまま・止まったら上限で打ち切る
//   3. CI で Playwright・npm の部品を入れる行は、全部 retry.sh を通している（新しいワークフローで入れ忘れない）
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const { medianScores, RUNS } = require('../../lib/lighthouse');
const ROOT = path.join(__dirname, '../../..'), RETRY = path.join(__dirname, '../../tools/retry.sh');

module.exports = () => {
  const items = [];
  { // 1. Lighthouse の真ん中の値
    const bad = [], prev = 90, down = s => s.performance < prev - 5;
    const runs = [{ performance: 90, seo: 100 }, { performance: 62, seo: 100 }, { performance: 91, seo: 92 }];
    if (!down(runs[1])) bad.push('前提：外れた1回（62）だけで見ると「5点下がった」になるはず');
    const m = medianScores(runs);
    if (m.performance !== 90 || down(m)) bad.push(`外れた1回があっても真ん中は 90（実際 ${m.performance}）`);
    if (m.seo !== 100) bad.push(`seo の真ん中は 100（実際 ${m.seo}）`);
    const real = medianScores([{ performance: 70 }, { performance: 72 }, { performance: 95 }]);
    if (!down(real)) bad.push(`本当に下がった版（2回が 70・72）は「下がった」のまま（実際 ${real.performance}）`);
    const two = medianScores([{ performance: 80 }, { performance: 85 }]);
    if (two.performance !== 83) bad.push(`測れたのが2回なら2つの平均を丸める（期待 83、実際 ${two.performance}）`);
    if (Object.keys(medianScores([])).length) bad.push('1回も測れなければ点なし');
    if (RUNS < 3) bad.push(`測る回数は3回以上（実際 ${RUNS}）`);
    items.push({ id: 'unit:ci-lighthouse-median', title: 'Lighthouse の点は何回か測った真ん中の値で見る（揺れの1回で ⚠️ にしない・本当の低下は見逃さない）', ok: !bad.length, detail: bad.length ? bad.join(' / ') : `${RUNS}回の真ん中、5場面すべて期待どおり` });
  }
  { // 2. retry.sh
    const bad = [], env = { ...process.env, QA_RETRY_WAIT: '0' }, dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-retry-')), cnt = path.join(dir, 'n');
    const sh = (...a) => spawnSync('bash', [RETRY, ...a], { env, encoding: 'utf8', timeout: 20000 });
    const probe = spawnSync('bash', ['-c', 'command -v timeout'], { encoding: 'utf8' });
    if (probe.error || probe.status !== 0) items.push({ id: 'unit:ci-retry', title: '入れる段階のやり直し（qa/tools/retry.sh）', ok: null, detail: 'bash か timeout が無いので見られない（CI では見る）' });
    else {
      // 2回失敗して3回目に通るコマンド
      const flaky = `n=$(cat '${cnt}' 2>/dev/null || echo 0); n=$((n+1)); echo $n > '${cnt}'; [ $n -ge 3 ]`;
      let r = sh('3', '10', 'bash', '-c', flaky);
      if (r.status !== 0) bad.push(`2回失敗して3回目に通るものは通る（終了コード ${r.status}）`);
      fs.writeFileSync(cnt, '0'); r = sh('2', '10', 'bash', '-c', flaky);
      if (r.status === 0) bad.push('やり直しの回数を使い切ったら失敗のまま');
      r = sh('2', '10', 'bash', '-c', 'exit 7');
      if (r.status !== 7) bad.push(`ずっと失敗するものは、その終了コードで失敗（期待 7、実際 ${r.status}）`);
      const t0 = Date.now(); r = sh('2', '1', 'sleep', '30');
      if (r.status === 0 || Date.now() - t0 > 10000) bad.push(`止まったものは1回の上限で打ち切る（${Date.now() - t0}ms、終了コード ${r.status}）`);
      try { fs.rmSync(dir, { recursive: true, force: true }) } catch (e) {}
      items.push({ id: 'unit:ci-retry', title: '入れる段階のやり直し（qa/tools/retry.sh）：一時的な失敗は通り、続く失敗・止まりは失敗のまま', ok: !bad.length, detail: bad.length ? bad.join(' / ') : '4場面すべて期待どおり' });
    }
  }
  { // 3. ワークフローの入れる行
    const wf = path.join(ROOT, '.github/workflows'), bad = [];
    if (fs.existsSync(wf)) for (const f of fs.readdirSync(wf).filter(f => /\.ya?ml$/.test(f)))
      fs.readFileSync(path.join(wf, f), 'utf8').split('\n').forEach((line, i) => {
        if (/^\s*#/.test(line)) return;
        for (const seg of line.split(/&&|;/)) if (/\b(npm ci|playwright install)\b/.test(seg) && !/retry\.sh/.test(seg)) bad.push(`${f}:${i + 1}「${seg.trim().slice(0, 60)}」`);
      });
    items.push({ id: 'unit:ci-install-retry', title: 'CI で npm ci・playwright install をする行は qa/tools/retry.sh を通す（外の配り元の一時的な不調で組ごと ❌ にしない）', ok: fs.existsSync(wf) ? !bad.length : null,
      detail: !fs.existsSync(wf) ? '.github/workflows が無い（共有フォルダの qa/ から回したとき）' : bad.length ? 'retry.sh を通していない：' + bad.join('、') : '全部 retry.sh を通している' });
  }
  return items;
};
