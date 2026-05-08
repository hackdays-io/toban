// Thanks insights — list / treemap / friendship rankings

(() => {
  const NAMES_EXTRA = ['ひらやま', 'james', 'unosaya', 'taro', '中田柚葉', '前田陽太', '濱田太陽', 'はたしょう', '秋山淳', 'irohas', 'まつお', 'genks', 'ゴロー', 'スケン', '村上', '大久保', '日向', '東大介'];
  const allNames = [
    ...window.TOBAN_DATA.members.map(m => m.name),
    'me-ryoma', ...NAMES_EXTRA,
  ].map(n => n === 'me-ryoma' ? 'ryoma' : n);

  // Deterministic PRNG so re-renders match
  function mulberry(seed) {
    return function() {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const messages = [
    '手伝ってくれてありがとう！', '準備してくれて助かりました', '今日の対応ありがとう',
    'EXPOにお誘いいただきありがとうございます', '運動会おつかれさまでした',
    'いつも気にかけてくれてありがとう', 'Tobanの仕様確認ありがとう！',
    'ご飯作ってくれてありがとう', '送迎ありがとうございました',
  ];
  const rand = mulberry(42);
  const TXS = [];
  const NOW = new Date('2026-05-08T22:30:00');
  // 80 transactions across 60 days
  for (let i = 0; i < 80; i++) {
    let from = allNames[Math.floor(rand() * allNames.length)];
    let to = allNames[Math.floor(rand() * allNames.length)];
    if (from === to) to = allNames[(allNames.indexOf(to) + 1) % allNames.length];
    const amounts = [10, 14, 20, 25, 30, 50, 100];
    // bias popular pairs
    const popularPairs = [['ひらやま', 'homma'], ['前田陽太', 'genks'], ['前田陽太', 'はたしょう'], ['sg', 'genks'], ['sg', '濱田太陽'], ['atsu', 'taro']];
    if (rand() < 0.35) {
      const pp = popularPairs[Math.floor(rand() * popularPairs.length)];
      from = pp[Math.floor(rand() * 2)];
      to = pp[1 - pp.indexOf(from)];
    }
    const amt = amounts[Math.floor(rand() * amounts.length)];
    const daysAgo = Math.floor(rand() * 60);
    const hoursAgo = Math.floor(rand() * 24);
    const t = new Date(NOW.getTime() - (daysAgo * 24 + hoursAgo) * 3600 * 1000);
    TXS.push({
      id: 'tx' + i, from, to, amount: amt, time: t,
      msg: rand() < 0.6 ? messages[Math.floor(rand() * messages.length)] : '',
    });
  }
  TXS.sort((a, b) => b.time - a.time);
  window.TOBAN_TXS = TXS;
})();

function ThanksInsightsScreen({ goto }) {
  const [tab, setTab] = useState('list');
  const [period, setPeriod] = useState('month'); // week | month | all
  const [sort, setSort] = useState('amount'); // amount | count

  const NOW = new Date('2026-05-08T22:30:00');
  const cutoff = period === 'week' ? new Date(NOW - 7 * 86400000)
    : period === 'month' ? new Date(NOW - 30 * 86400000)
      : new Date(0);

  const txs = window.TOBAN_TXS.filter(t => t.time >= cutoff);

  return (
    <div style={{ paddingBottom: 24 }}>
      <ScreenHeader title="サンクスのデータ" subtitle={`${txs.length}件の送付`} onBack={() => goto({ name: 'home' })} />

      {/* Period chips */}
      <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8, overflowX: 'auto' }}>
        {[
          { v: 'week', label: '今週' },
          { v: 'month', label: '30日' },
          { v: 'all', label: '全期間' },
        ].map(p => {
          const active = period === p.v;
          return (
            <button key={p.v} onClick={() => setPeriod(p.v)} style={{
              padding: '6px 14px', borderRadius: 999,
              background: active ? T.color.textPrimary : T.color.surface,
              color: active ? '#fff' : T.color.textPrimary,
              border: `1px solid ${active ? T.color.textPrimary : T.color.border}`,
              fontFamily: T.font, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap', flex: 'none',
            }}>{p.label}</button>
          );
        })}
        <div style={{ flex: 1 }} />
        <button style={{
          padding: '6px 12px', borderRadius: 999,
          background: T.color.surface, color: T.color.textSecondary,
          border: `1px solid ${T.color.border}`,
          fontFamily: T.font, fontSize: 12, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: 4,
          cursor: 'pointer', flex: 'none',
        }}>
          <Icon name="search" size={12} /> カスタム
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', borderBottom: `1px solid ${T.color.border}`,
        margin: '0 16px', gap: 24,
      }}>
        {[
          { v: 'list', label: 'リスト' },
          { v: 'graph', label: 'グラフ' },
          { v: 'friends', label: 'フレンドシップ' },
        ].map(o => {
          const active = tab === o.v;
          return (
            <button key={o.v} onClick={() => setTab(o.v)} style={{
              padding: '10px 0', background: 'transparent', border: 'none',
              borderBottom: `2px solid ${active ? T.color.textPrimary : 'transparent'}`,
              fontFamily: T.font, fontSize: 14,
              fontWeight: active ? 700 : 500,
              color: active ? T.color.textPrimary : T.color.textSecondary,
              cursor: 'pointer', marginBottom: -1,
            }}>{o.label}</button>
          );
        })}
      </div>

      {/* Summary */}
      <div style={{ padding: '12px 16px' }}>
        <Card padding={14}>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <SummaryStat label="送付件数" value={txs.length} unit="件" />
            <Splitter />
            <SummaryStat label="合計" value={txs.reduce((s, t) => s + t.amount, 0)} unit="THX" tone="green" />
            <Splitter />
            <SummaryStat label="参加者" value={new Set(txs.flatMap(t => [t.from, t.to])).size} unit="人" />
          </div>
        </Card>
      </div>

      {tab === 'list' && <TxList txs={txs} />}
      {tab === 'graph' && <TxGraph txs={txs} />}
      {tab === 'friends' && <TxFriends txs={txs} sort={sort} setSort={setSort} />}
    </div>
  );
}

const Splitter = () => <div style={{ width: 1, background: T.color.border }} />;

const SummaryStat = ({ label, value, unit, tone }) => (
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: 11, color: T.color.textSecondary, fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: tone === 'green' ? T.color.contrib : T.color.textPrimary, marginTop: 2, letterSpacing: -0.5, fontFamily: T.fontDisplay || T.font }}>
      {value.toLocaleString()}<span style={{ fontSize: 11, color: T.color.textSecondary, fontWeight: 600, marginLeft: 3 }}>{unit}</span>
    </div>
  </div>
);

// ─── List view ───────────────────────────────────────────────
function TxList({ txs }) {
  const fmt = (d) => {
    const m = d.getMonth() + 1, day = d.getDate();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${m}/${day} ${hh}:${mm}`;
  };
  return (
    <div style={{ padding: '0 16px' }}>
      {txs.slice(0, 30).map(t => (
        <div key={t.id} style={{
          background: '#E8F6EE',
          border: `1px solid ${T.color.contrib}33`,
          borderRadius: T.radius.md,
          padding: 12, marginBottom: 8,
          position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: t.msg ? 6 : 0 }}>
            <Avatar name={t.from} size={28} />
            <div style={{ fontSize: 13, fontWeight: 700, flex: 'none' }}>{t.from}</div>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 6,
              padding: '0 4px', minWidth: 0,
            }}>
              <div style={{ flex: 1, height: 1, background: T.color.contrib + '66' }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#2F8B58', whiteSpace: 'nowrap', flex: 'none' }}>
                {t.amount}<span style={{ fontSize: 10, marginLeft: 2 }}>THX</span>
              </div>
              <div style={{ flex: 1, height: 1, background: T.color.contrib + '66' }} />
              <Icon name="chevron-right" size={12} color={T.color.contrib} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, flex: 'none' }}>{t.to}</div>
            <Avatar name={t.to} size={28} />
          </div>
          {t.msg && (
            <div style={{ fontSize: 12, color: T.color.textPrimary, lineHeight: 1.5,
              paddingLeft: 36, paddingRight: 36 }}>{t.msg}</div>
          )}
          <div style={{ fontSize: 10, color: T.color.textSecondary, marginTop: 6, paddingLeft: 36 }}>{fmt(t.time)}</div>
        </div>
      ))}
      {txs.length > 30 && (
        <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: T.color.textSecondary }}>
          残り {txs.length - 30} 件
        </div>
      )}
    </div>
  );
}

// ─── Treemap (squarified) ────────────────────────────────────
function squarify(values, x, y, w, h) {
  const total = values.reduce((s, v) => s + v.value, 0);
  if (total <= 0 || values.length === 0) return [];
  const items = values.map(v => ({ ...v, area: v.value / total * w * h }));
  const result = [];
  let remaining = items.slice();
  let rect = { x, y, w, h };

  function worst(row, length) {
    const sum = row.reduce((s, r) => s + r.area, 0);
    let max = 0, min = Infinity;
    row.forEach(r => { max = Math.max(max, r.area); min = Math.min(min, r.area); });
    return Math.max((length * length * max) / (sum * sum), (sum * sum) / (length * length * min));
  }
  function layoutRow(row, length, rect) {
    const sum = row.reduce((s, r) => s + r.area, 0);
    const isHoriz = rect.w >= rect.h;
    const sideLen = sum / length;
    let off = 0;
    for (const r of row) {
      const sz = r.area / sideLen;
      if (isHoriz) {
        result.push({ ...r, x: rect.x, y: rect.y + off, w: sideLen, h: sz });
        off += sz;
      } else {
        result.push({ ...r, x: rect.x + off, y: rect.y, w: sz, h: sideLen });
        off += sz;
      }
    }
    if (isHoriz) return { x: rect.x + sideLen, y: rect.y, w: rect.w - sideLen, h: rect.h };
    return { x: rect.x, y: rect.y + sideLen, w: rect.w, h: rect.h - sideLen };
  }

  while (remaining.length > 0) {
    const length = Math.min(rect.w, rect.h);
    if (length <= 0) break;
    let row = [];
    let bestRatio = Infinity;
    while (remaining.length > 0) {
      const next = [...row, remaining[0]];
      const r = worst(next, length);
      if (row.length === 0 || r < bestRatio) {
        row = next; bestRatio = r;
        remaining = remaining.slice(1);
      } else break;
    }
    rect = layoutRow(row, length, rect);
  }
  return result;
}

function TxGraph({ txs }) {
  const W = 360, H = 240;

  const heldMap = {}, sentMap = {};
  for (const t of txs) {
    heldMap[t.to] = (heldMap[t.to] || 0) + t.amount;
    sentMap[t.from] = (sentMap[t.from] || 0) + t.amount;
  }
  const heldArr = Object.entries(heldMap).map(([name, v]) => ({ name, value: v })).sort((a, b) => b.value - a.value);
  const sentArr = Object.entries(sentMap).map(([name, v]) => ({ name, value: v })).sort((a, b) => b.value - a.value);

  return (
    <div style={{ padding: '0 16px' }}>
      <Treemap title="保有しているサンクストークン" data={heldArr} W={W} H={H} fill="#5DADEC" />
      <div style={{ height: 16 }} />
      <Treemap title="送ったサンクストークン" data={sentArr} W={W} H={H} fill="#F5B82E" />

      <Card padding={14} style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12, color: T.color.textSecondary, fontWeight: 600, marginBottom: 8 }}>読みかた</div>
        <div style={{ fontSize: 12, lineHeight: 1.6 }}>
          四角の<strong>面積</strong>が、その人の保有量・送付量の大きさを表しています。
          上段は受け取った合計、下段は送った合計です。
        </div>
      </Card>
    </div>
  );
}

function Treemap({ title, data, W, H, fill }) {
  const rects = useMemo(() => squarify(data, 0, 0, W, H), [data, W, H]);
  return (
    <Card padding={14}>
      <div style={{ fontSize: 13, color: T.color.textSecondary, fontWeight: 600, marginBottom: 10, textAlign: 'center' }}>{title}</div>
      <div style={{ position: 'relative', width: W, height: H, margin: '0 auto' }}>
        {rects.map((r, i) => {
          const small = r.w < 36 || r.h < 26;
          const fontSize = Math.min(Math.max(Math.min(r.w, r.h) * 0.22, 8), 14);
          return (
            <div key={r.name} style={{
              position: 'absolute',
              left: r.x + 1, top: r.y + 1,
              width: Math.max(r.w - 2, 0), height: Math.max(r.h - 2, 0),
              background: fill,
              borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
              fontSize, fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              padding: 2,
              opacity: 0.7 + 0.3 * (1 - i / Math.max(rects.length - 1, 1)),
            }} title={`${r.name}: ${r.value} THX`}>
              {!small && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Friendship rankings ─────────────────────────────────────
function TxFriends({ txs, sort, setSort }) {
  const pairs = useMemo(() => {
    const m = {};
    for (const t of txs) {
      const k = [t.from, t.to].sort().join('|');
      if (!m[k]) m[k] = { a: k.split('|')[0], b: k.split('|')[1], total: 0, count: 0 };
      m[k].total += t.amount;
      m[k].count += 1;
    }
    const arr = Object.values(m);
    arr.sort((x, y) => sort === 'amount' ? y.total - x.total : y.count - x.count);
    return arr;
  }, [txs, sort]);

  const top = pairs.slice(0, 24);

  const palettes = [
    { bg: '#FFF2CF', fg: '#7A5A2E', dot: '#F5B82E' },                  // gold
    { bg: '#EEEEEE', fg: '#5A5A5A', dot: '#A0A0A0' },                  // silver
    { bg: '#FCE4D8', fg: '#A33C18', dot: '#D9531D' },                  // bronze
  ];
  const lavender = { bg: '#F2EBF8', fg: '#6E4DAA', dot: '#9B7AD8' };

  return (
    <div style={{ padding: '0 16px' }}>
      <Segmented value={sort} onChange={setSort} options={[
        { value: 'amount', label: '総交換量順' },
        { value: 'count', label: '取引回数順' },
      ]} />
      <div style={{ height: 12 }} />
      {top.map((p, i) => {
        const pal = palettes[i] || lavender;
        return (
          <div key={p.a + '|' + p.b} style={{
            background: pal.bg, borderRadius: T.radius.md,
            padding: '12px 14px', marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 999, background: pal.dot,
              color: '#fff', fontWeight: 700, fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flex: 'none',
            }}>{i + 1}</div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <PairAvatar name={p.a} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: pal.fg }}>
                <Icon name="arrow-right" size={14} color={pal.fg} />
                <Icon name="arrow-right" size={14} color={pal.fg} style={{ transform: 'scaleX(-1)' }} />
              </div>
              <PairAvatar name={p.b} />
            </div>
            <div style={{ textAlign: 'right', flex: 'none' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: pal.fg, fontFamily: T.fontDisplay || T.font, letterSpacing: -0.5 }}>{p.total}</div>
              <div style={{ fontSize: 10, color: pal.fg, opacity: 0.85 }}>{p.count}回</div>
            </div>
          </div>
        );
      })}
      {top.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: T.color.textSecondary, fontSize: 13 }}>
          この期間にはサンクスの送付がありません
        </div>
      )}
    </div>
  );
}

const PairAvatar = ({ name }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
    <Avatar name={name} size={32} />
    <div style={{ fontSize: 10, fontWeight: 600, color: T.color.textPrimary, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
  </div>
);

Object.assign(window, { ThanksInsightsScreen });
