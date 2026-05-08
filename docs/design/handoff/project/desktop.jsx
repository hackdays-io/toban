// Toban — Desktop layout
const { useState, useMemo, Fragment: F } = React;
const D = window.TOBAN_DATA;
const Q = window.TOBAN_QUESTS_DATA;
const T = {
  font: '"Inter", "Noto Sans JP", -apple-system, system-ui, sans-serif',
  fontDisplay: '"Inter", "Noto Sans JP", -apple-system, system-ui, sans-serif',
  color: {
    primary: '#F5B82E', primarySoft: '#FFF2CF',
    background: '#FAF7F0', surface: '#FFFFFF',
    textPrimary: '#1F1F1F', textSecondary: '#68645D',
    border: '#E7E1D7',
    contrib: '#65C98A', split: '#5DADEC', role: '#D6B995', danger: '#E45C4F',
  },
};
const C = T.color;

// ── Avatar (re-implemented locally, simpler) ─────────────────
const palettes = ['#F5B82E', '#65C98A', '#5DADEC', '#D6B995', '#E48F4F', '#B696E0', '#E48ABF'];
const avColor = (s = '') => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return palettes[h % palettes.length]; };
const Avatar = ({ name = '', size = 32 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: avColor(name) + 'cc', color: '#fff',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.42, fontWeight: 700, fontFamily: T.font, flex: 'none',
  }}>{name[0]?.toUpperCase() || '?'}</div>
);

// ── Generic icon (line-based, simple) ────────────────────────
const Icon = ({ name, size = 18, color = 'currentColor' }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'home': return <svg {...p}><path d="M3 12l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>;
    case 'duty': return <svg {...p}><path d="M9 11l2 2 4-4" /><circle cx="12" cy="12" r="9" /></svg>;
    case 'split': return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 3v9l7 4" /></svg>;
    case 'members': return <svg {...p}><circle cx="9" cy="8" r="3.5" /><circle cx="17" cy="9.5" r="2.5" /><path d="M3 19c0-3 3-5 6-5s6 2 6 5" /><path d="M15 19c0-2 2-3.5 4-3.5s2 1 2 3.5" /></svg>;
    case 'wallet': return <svg {...p}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M16 13h2" /></svg>;
    case 'send': return <svg {...p}><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>;
    case 'plus': return <svg {...p}><path d="M12 5v14M5 12h14" /></svg>;
    case 'search': return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-5-5" /></svg>;
    case 'bell': return <svg {...p}><path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9z" /><path d="M10 21a2 2 0 004 0" /></svg>;
    case 'settings': return <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 00-2-1.2L14 3h-4l-.5 2.6a7 7 0 00-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 005 12a7 7 0 00.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 002 1.2L10 21h4l.5-2.6a7 7 0 002-1.2l2.4 1 2-3.4-2-1.6c0-.4.1-.8.1-1.2z" /></svg>;
    case 'chevron': return <svg {...p}><path d="M9 6l6 6-6 6" /></svg>;
    case 'chevron-down': return <svg {...p}><path d="M6 9l6 6 6-6" /></svg>;
    case 'check': return <svg {...p}><path d="M5 12l5 5L20 7" /></svg>;
    case 'edit': return <svg {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 113 3L7 19l-4 1 1-4z" /></svg>;
    case 'flame': return <svg {...p}><path d="M12 3s5 5 5 10a5 5 0 11-10 0c0-3 2-4 2-7 2 1 3 4 3 4z" /></svg>;
    case 'sparkle': return <svg {...p}><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" /><path d="M19 16l.7 1.8L22 19l-2.3.8L19 22l-.7-2.2L16 19l2.3-1.2z" /></svg>;
    case 'arrow-right': return <svg {...p}><path d="M5 12h14M13 5l7 7-7 7" /></svg>;
    default: return null;
  }
};

// ── Layout pieces ────────────────────────────────────────────
const Sidebar = ({ route, setRoute, ws }) => {
  const items = [
    { key: 'home', label: 'ホーム', icon: 'home' },
    { key: 'duties', label: '当番', icon: 'duty' },
    { key: 'splits', label: '分配', icon: 'split' },
    { key: 'members', label: 'メンバー', icon: 'members' },
    { key: 'wallet', label: 'ウォレット', icon: 'wallet' },
  ];
  return (
    <aside style={{
      width: 260, flex: 'none', borderRight: `1px solid ${C.border}`,
      background: '#FBF8F1', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '20px 18px 14px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#1F1F1F', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#FFD668', fontSize: 16, fontWeight: 800, fontFamily: T.font }}>と</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Toban</div>
            <div style={{ fontSize: 11, color: C.textSecondary }}>あたたかい当番帳</div>
          </div>
        </div>
      </div>

      <button onClick={() => alert('ワークスペース切替（プロトタイプ）')} style={{
        margin: '14px 12px 6px', padding: '10px 12px', borderRadius: 12,
        background: '#fff', border: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
        textAlign: 'left',
      }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: ws.color || C.primary, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, fontFamily: T.font }}>{ws.name[0]}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: C.textSecondary }}>WORKSPACE</div>
          <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ws.name}</div>
        </div>
        <Icon name="chevron-down" size={14} color={C.textSecondary} />
      </button>

      <nav style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map(it => {
          const active = route.name === it.key || route.name?.startsWith(it.key + '-') || (it.key === 'duties' && route.name === 'quest-detail');
          return (
            <button key={it.key} onClick={() => setRoute({ name: it.key })}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px',
                borderRadius: 10, border: 'none', cursor: 'pointer',
                background: active ? C.primarySoft : 'transparent',
                color: active ? '#7A5A2E' : C.textPrimary,
                fontSize: 14, fontWeight: active ? 700 : 500, textAlign: 'left',
                fontFamily: T.font,
              }}>
              <Icon name={it.icon} size={18} color={active ? C.primary : C.textSecondary} />
              <span>{it.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', padding: 12, borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={D.user.name} size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{D.user.name}</div>
            <div style={{ fontSize: 11, color: C.textSecondary, fontFamily: 'ui-monospace, monospace' }}>{D.user.address}</div>
          </div>
          <button style={iconBtn}><Icon name="settings" size={16} color={C.textSecondary} /></button>
        </div>
      </div>
    </aside>
  );
};

const iconBtn = {
  width: 32, height: 32, borderRadius: 10,
  background: 'transparent', border: 'none', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};

// ── Top bar ──────────────────────────────────────────────────
const TopBar = ({ title, subtitle, right, onSendThanks }) => (
  <header style={{
    height: 72, padding: '0 28px', borderBottom: `1px solid ${C.border}`,
    display: 'flex', alignItems: 'center', gap: 16, background: '#fff',
  }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{subtitle}</div>}
    </div>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: C.background, borderRadius: 999, padding: '8px 14px',
      width: 280,
    }}>
      <Icon name="search" size={16} color={C.textSecondary} />
      <input placeholder="検索..." style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: 13, fontFamily: T.font }} />
    </div>
    <button style={iconBtn}><Icon name="bell" size={18} color={C.textSecondary} /></button>
    {right}
    <button onClick={onSendThanks} style={primaryBtn}><Icon name="send" size={14} color="#fff" /> サンクスを送る</button>
  </header>
);

const primaryBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '10px 16px', borderRadius: 999,
  background: C.primary, color: '#fff', border: 'none',
  fontSize: 13, fontWeight: 700, fontFamily: T.font, cursor: 'pointer',
};
const secondaryBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '10px 16px', borderRadius: 999,
  background: '#fff', color: C.textPrimary, border: `1px solid ${C.border}`,
  fontSize: 13, fontWeight: 600, fontFamily: T.font, cursor: 'pointer',
};

const Card = ({ children, padding = 20, style }) => (
  <div style={{
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 16, padding, ...style,
  }}>{children}</div>
);

const SectionTitle = ({ children, action }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
    <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.2 }}>{children}</div>
    {action}
  </div>
);

const StateBadge = ({ state }) => {
  const map = {
    open: { label: '募集中', bg: '#FFF2CF', fg: '#7A5A2E' },
    inprogress: { label: '進行中', bg: '#E5F1FB', fg: '#2D6FA8' },
    review: { label: '確認待ち', bg: '#F2EBF8', fg: '#6E4DAA' },
    done: { label: '完了', bg: '#E5F5EC', fg: '#2F8B58' },
  };
  const s = map[state] || map.open;
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 999, background: s.bg, color: s.fg, fontSize: 11, fontWeight: 700 }}>{s.label}</span>;
};

const Pill = ({ children, kind }) => {
  const colors = {
    Member: { bg: '#E5F5EC', fg: '#2F8B58' },
    lead: { bg: '#FFF2CF', fg: '#7A5A2E' },
    supporter: { bg: '#F2EBF8', fg: '#6E4DAA' },
  };
  const c = colors[kind] || colors.Member;
  return <span style={{ padding: '2px 9px', borderRadius: 999, background: c.bg, color: c.fg, fontSize: 11, fontWeight: 700 }}>{children}</span>;
};

// ── HOME ─────────────────────────────────────────────────────
const HomeView = ({ setRoute }) => {
  const recent = [
    { from: 'homma', to: 'me', amount: 100, msg: 'EXPOにお誘いいただきありがとうございました！', time: '12時間前' },
    { from: 'shinya', to: 'me', amount: 20, msg: 'Tobanの仕様補足ありがとうございます！', time: '1日前' },
    { from: 'me', to: 'sg', amount: 50, msg: '準備手伝ってくれて助かりました', time: '2日前' },
  ];
  return (
    <div style={{ padding: 28, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
      {/* Left column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <StatCard label="送れるサンクス" value="120" unit="THX" accent={C.primary} delta="+15%" />
          <StatCard label="受け取ったサンクス" value="80" unit="THX" accent="#65C98A" />
          <StatCard label="今週の貢献" value="3" unit="件" accent="#5DADEC" />
        </div>

        <Card>
          <SectionTitle action={<button style={linkBtn} onClick={() => setRoute({ name: 'duties' })}>すべて見る →</button>}>あなたの当番</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {D.duties.slice(0, 4).map(d => (
              <button key={d.id} onClick={() => setRoute({ name: 'duty-detail', dutyId: d.id })} style={{
                background: '#FBF8F1', border: `1px solid ${C.border}`, borderRadius: 12,
                padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12, fontFamily: T.font,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: (d.accent || '#D6B995') + '33', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="duty" size={18} color="#7A5A2E" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: C.textSecondary }}>担当: {d.assignee || '未設定'} ・ 次回 {d.next}</div>
                </div>
                <Icon name="chevron" size={14} color={C.textSecondary} />
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle action={<button style={linkBtn}>すべて見る →</button>}>最近のアクティビティ</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recent.map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                borderTop: i === 0 ? 'none' : `1px solid ${C.border}`,
              }}>
                <Avatar name={r.from === 'me' ? 'ryoma' : r.from} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, marginBottom: 2 }}>
                    <strong>{r.from === 'me' ? 'あなた' : r.from}</strong>
                    <span style={{ color: C.textSecondary }}> から </span>
                    <strong>{r.to === 'me' ? 'あなた' : r.to}</strong>
                    <span style={{ color: C.textSecondary }}> へ</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.msg}</div>
                </div>
                <div style={{ textAlign: 'right', flex: 'none' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>{r.amount} <span style={{ fontSize: 10, color: C.textSecondary }}>THX</span></div>
                  <div style={{ fontSize: 10, color: C.textSecondary }}>{r.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Right column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Card style={{ background: 'linear-gradient(160deg, #FFD668, #F5B82E)', border: 'none', color: '#3D2D14' }}>
          <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.7 }}>今週の残高</div>
          <div style={{ fontSize: 56, fontWeight: 700, fontFamily: T.fontDisplay || T.font, letterSpacing: -2, lineHeight: 1, margin: '10px 0 4px' }}>120<span style={{ fontSize: 18, marginLeft: 6, opacity: 0.8 }}>THX</span></div>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 16 }}>送付可能量 ・ 先週 +15%</div>
          <button style={{ ...secondaryBtn, background: '#3D2D14', color: '#FFD668', border: 'none', width: '100%', justifyContent: 'center' }}>
            <Icon name="send" size={14} color="#FFD668" /> サンクスを送る
          </button>
        </Card>

        <Card>
          <SectionTitle>進行中のクエスト</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Q.quests.filter(q => q.state === 'review' || q.state === 'inprogress').slice(0, 3).map(q => (
              <button key={q.id} onClick={() => setRoute({ name: 'quest-detail', questId: q.id })} style={{
                background: '#FBF8F1', border: `1px solid ${C.border}`, borderRadius: 12,
                padding: '12px 14px', textAlign: 'left', cursor: 'pointer', fontFamily: T.font,
                display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.title}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>+{q.share}%</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StateBadge state={q.state} />
                  <span style={{ fontSize: 11, color: C.textSecondary }}>{q.applicant}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>原則</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '♡', label: 'Warm', desc: 'やさしい人のつながり' },
              { icon: '✺', label: 'Clear', desc: '迷わないシンプルさ' },
              { icon: '◍', label: 'Community', desc: 'みんなで育てる仕組み' },
            ].map(p => (
              <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: C.primarySoft, color: '#7A5A2E', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{p.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: C.textSecondary }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, unit, accent, delta }) => (
  <Card padding={18}>
    <div style={{ fontSize: 12, color: C.textSecondary, fontWeight: 600 }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
      <div style={{ fontSize: 32, fontWeight: 700, fontFamily: T.fontDisplay || T.font, letterSpacing: -1, color: accent }}>{value}</div>
      <div style={{ fontSize: 12, color: C.textSecondary }}>{unit}</div>
      {delta && <div style={{ marginLeft: 'auto', fontSize: 11, color: '#2F8B58', fontWeight: 700, background: '#E5F5EC', padding: '2px 8px', borderRadius: 999 }}>{delta}</div>}
    </div>
  </Card>
);

const linkBtn = {
  background: 'transparent', border: 'none', color: C.textSecondary,
  fontSize: 12, cursor: 'pointer', fontFamily: T.font, fontWeight: 600,
};

// ── DUTIES (master-detail) ───────────────────────────────────
const DutiesView = ({ route, setRoute }) => {
  const [view, setView] = useState('duties'); // duties | quests
  const [selected, setSelected] = useState(route.dutyId || D.duties[0].id);
  const duty = D.duties.find(d => d.id === selected) || D.duties[0];
  const palette = ['#D6B995', '#65C98A', '#5DADEC', '#F5B82E', '#B696E0'];
  const shares = Q.shares[selected] || [];
  const dutyQuests = Q.quests.filter(q => q.dutyId === selected);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: 'calc(100vh - 72px)' }}>
      {/* List */}
      <aside style={{ borderRight: `1px solid ${C.border}`, background: '#FBF8F1', overflow: 'auto' }}>
        <div style={{ padding: '16px 16px 8px', display: 'flex', gap: 6 }}>
          {[{ k: 'duties', l: '当番' }, { k: 'quests', l: 'クエスト' }].map(t => (
            <button key={t.k} onClick={() => setView(t.k)} style={{
              flex: 1, padding: '8px 0', borderRadius: 10,
              background: view === t.k ? '#fff' : 'transparent',
              border: view === t.k ? `1px solid ${C.border}` : '1px solid transparent',
              fontSize: 12, fontWeight: 700, fontFamily: T.font, cursor: 'pointer',
              color: view === t.k ? C.textPrimary : C.textSecondary,
            }}>{t.l}</button>
          ))}
        </div>

        {view === 'duties' && (
          <div style={{ padding: '4px 8px 16px' }}>
            {D.duties.map(d => {
              const active = d.id === selected;
              return (
                <button key={d.id} onClick={() => setSelected(d.id)} style={{
                  width: '100%', textAlign: 'left', padding: '12px 12px', borderRadius: 12,
                  border: 'none', background: active ? '#fff' : 'transparent',
                  boxShadow: active ? '0 1px 0 rgba(0,0,0,0.04)' : 'none',
                  cursor: 'pointer', fontFamily: T.font,
                  display: 'flex', alignItems: 'center', gap: 10,
                  marginBottom: 2,
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: (d.accent || '#D6B995') + '33', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="duty" size={18} color="#7A5A2E" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                    <div style={{ fontSize: 11, color: C.textSecondary }}>{d.assignee || '担当者を募集中'}</div>
                  </div>
                </button>
              );
            })}
            <button style={{ ...secondaryBtn, width: '100%', justifyContent: 'center', marginTop: 8 }}>
              <Icon name="plus" size={14} color={C.textPrimary} /> 当番を作成
            </button>
          </div>
        )}

        {view === 'quests' && (
          <div style={{ padding: '4px 12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Q.quests.map(q => (
              <button key={q.id} onClick={() => setRoute({ name: 'quest-detail', questId: q.id })} style={{
                background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10,
                padding: '10px 12px', textAlign: 'left', cursor: 'pointer', fontFamily: T.font,
              }}>
                <div style={{ fontSize: 10, color: C.textSecondary, fontWeight: 700, marginBottom: 2 }}>{D.duties.find(d => d.id === q.dutyId)?.name}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{q.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <StateBadge state={q.state} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>+{q.share}%</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* Detail */}
      <div style={{ overflow: 'auto', padding: 28 }}>
        {view === 'duties' && (
          <DutyDetail duty={duty} shares={shares} dutyQuests={dutyQuests} palette={palette} setRoute={setRoute} />
        )}
        {view === 'quests' && <QuestsBoard setRoute={setRoute} />}
      </div>
    </div>
  );
};

const DutyDetail = ({ duty, shares, dutyQuests, palette, setRoute }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: (duty.accent || '#D6B995') + '33', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="duty" size={32} color="#7A5A2E" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>{duty.name}</div>
            <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 4 }}>担当: <strong style={{ color: C.textPrimary }}>{duty.assignee || '—'}</strong> ・ 次回 {duty.next}</div>
          </div>
          <button style={secondaryBtn}><Icon name="edit" size={14} color={C.textPrimary} /> 編集</button>
          <button style={primaryBtn}><Icon name="plus" size={14} color="#fff" /> クエストを作成</button>
        </div>
      </div>

      <Card>
        <SectionTitle>説明</SectionTitle>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {duty.desc.map((line, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, lineHeight: 1.5 }}>
              <div style={{ width: 6, height: 6, borderRadius: 999, background: C.primary, marginTop: 8, flex: 'none' }} />{line}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <SectionTitle action={<button style={linkBtn}>すべて見る →</button>}>クエスト</SectionTitle>
        {dutyQuests.length === 0 && <div style={{ padding: 20, color: C.textSecondary, fontSize: 13, textAlign: 'center' }}>このダッジにはまだクエストがありません</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {dutyQuests.map(q => (
            <button key={q.id} onClick={() => setRoute({ name: 'quest-detail', questId: q.id })} style={{
              background: '#FBF8F1', border: `1px solid ${C.border}`, borderRadius: 12,
              padding: 14, textAlign: 'left', cursor: 'pointer', fontFamily: T.font,
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <StateBadge state={q.state} />
              <div style={{ fontSize: 14, fontWeight: 700 }}>{q.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, color: C.textSecondary }}>
                  {q.state === 'open' && `作成者 ${q.creator}・残り${q.count}件`}
                  {q.state === 'inprogress' && `参加 ${q.applicant}`}
                  {q.state === 'review' && `${q.applicant}・承認 ${q.approvals || 0}/2`}
                  {q.state === 'done' && `${q.applicant} 完了`}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>+{q.share}%</div>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>

    {/* Side */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <SectionTitle>当番シェア分布</SectionTitle>
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', height: 12, marginBottom: 14 }}>
          {shares.map((s, i) => <div key={s.name} style={{ width: `${s.pct}%`, background: palette[i % palette.length] }} />)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shares.map((s, i) => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: palette[i % palette.length] }} />
              <Avatar name={s.name} size={24} />
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{s.name}</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{s.pct}<span style={{ fontSize: 10, color: C.textSecondary, marginLeft: 2 }}>%</span></div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>サポーター（{duty.supporters.length}）</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {duty.supporters.map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={s} size={32} />
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{s}</div>
              <Pill kind="supporter">サポーター</Pill>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);

const QuestsBoard = ({ setRoute }) => {
  const groups = [
    { state: 'open', title: '募集中' },
    { state: 'inprogress', title: '進行中' },
    { state: 'review', title: '確認待ち' },
    { state: 'done', title: '完了' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
      {groups.map(g => {
        const items = Q.quests.filter(q => q.state === g.state);
        return (
          <div key={g.state} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <StateBadge state={g.state} />
              <div style={{ fontSize: 12, color: C.textSecondary, fontWeight: 700 }}>{items.length}</div>
            </div>
            {items.map(q => (
              <button key={q.id} onClick={() => setRoute({ name: 'quest-detail', questId: q.id })} style={{
                background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12,
                padding: 14, textAlign: 'left', cursor: 'pointer', fontFamily: T.font,
              }}>
                <div style={{ fontSize: 10, color: C.textSecondary, fontWeight: 700, marginBottom: 4 }}>{D.duties.find(d => d.id === q.dutyId)?.name}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, lineHeight: 1.4 }}>{q.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Avatar name={q.applicant || q.creator} size={22} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>+{q.share}%</div>
                </div>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
};

// ── QUEST DETAIL ─────────────────────────────────────────────
const QuestDetailView = ({ route, setRoute }) => {
  const q = Q.quests.find(x => x.id === route.questId);
  if (!q) return null;
  const duty = D.duties.find(d => d.id === q.dutyId);
  const isMine = q.creator === D.user.name;
  return (
    <div style={{ padding: 28, display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <button onClick={() => setRoute({ name: 'duties', dutyId: q.dutyId })} style={{ ...linkBtn, padding: 0, alignSelf: 'flex-start' }}>← {duty?.name}</button>
        <Card padding={28}>
          <StateBadge state={q.state} />
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.6, margin: '14px 0 10px', lineHeight: 1.3 }}>{q.title}</div>
          <div style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.7 }}>{q.desc}</div>

          <div style={{ display: 'flex', gap: 16, margin: '24px 0', padding: '16px 0', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.textSecondary, fontWeight: 700 }}>紐づく当番</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{duty?.name}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.textSecondary, fontWeight: 700 }}>もらえる当番シェア</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.primary, fontFamily: T.fontDisplay || T.font, letterSpacing: -0.5, marginTop: 2 }}>+{q.share}%</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.textSecondary, fontWeight: 700 }}>状態</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                {q.state === 'open' && `募集中（残り ${q.count}件）`}
                {q.state === 'inprogress' && `${q.applicant} が進行中`}
                {q.state === 'review' && `承認 ${q.approvals || 0}/2`}
                {q.state === 'done' && `${q.applicant} が完了`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar name={q.creator} size={44} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.textSecondary }}>作成者</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{q.creator}</div>
            </div>
            {q.applicant && <>
              <Icon name="arrow-right" size={18} color={C.textSecondary} />
              <Avatar name={q.applicant} size={44} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: C.textSecondary }}>{q.state === 'review' ? '申請者' : '参加者'}</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{q.applicant}</div>
              </div>
            </>}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            {q.state === 'open' && !isMine && <button style={{ ...primaryBtn, flex: 1, justifyContent: 'center', padding: '12px 20px' }}><Icon name="check" size={14} color="#fff" /> 申請する</button>}
            {q.state === 'open' && isMine && <button style={{ ...secondaryBtn, flex: 1, justifyContent: 'center', padding: '12px 20px' }}>キャンセル</button>}
            {q.state === 'inprogress' && <button style={{ ...primaryBtn, flex: 1, justifyContent: 'center', padding: '12px 20px' }}><Icon name="send" size={14} color="#fff" /> 完了申請する</button>}
            {q.state === 'review' && <button style={{ ...primaryBtn, flex: 1, justifyContent: 'center', padding: '12px 20px' }}><Icon name="check" size={14} color="#fff" /> 承認する</button>}
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle>シェアの動き</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: C.textSecondary, fontWeight: 600 }}>作成前のシェア</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: T.fontDisplay || T.font }}>40%</div>
          </div>
          <div style={{ borderTop: `1px dashed ${C.border}` }} />
          <div>
            <div style={{ fontSize: 11, color: C.textSecondary, fontWeight: 600 }}>このクエストで動くシェア</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: C.primary, fontFamily: T.fontDisplay || T.font, letterSpacing: -0.5 }}>{q.share}%</div>
          </div>
          <div style={{ borderTop: `1px dashed ${C.border}` }} />
          <div>
            <div style={{ fontSize: 11, color: C.textSecondary, fontWeight: 600 }}>完了後のシェア（参加者へ）</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#2F8B58', fontFamily: T.fontDisplay || T.font }}>+{q.share}%</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ── SPLITS ───────────────────────────────────────────────────
const SplitsView = ({ setRoute }) => {
  const splits = [
    { id: 's1', name: 'kuu village day 7', count: 7, top: [{ n: 'atsu', p: 2.34 }, { n: 'ryoma', p: 2.21 }, { n: 'yumaito', p: 1.64 }, { n: 'takerun', p: 1.18 }, { n: 'koichi', p: 1.21 }], date: '2025/10/07' },
    { id: 's2', name: 'kuu village day 5', count: 9, top: [{ n: 'eri', p: 1.92 }, { n: 'sg', p: 1.71 }, { n: 'homma', p: 1.5 }], date: '2025/10/05' },
  ];
  const [sel, setSel] = useState('s1');
  const split = splits.find(s => s.id === sel);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: 'calc(100vh - 72px)' }}>
      <aside style={{ borderRight: `1px solid ${C.border}`, background: '#FBF8F1', overflow: 'auto', padding: 12 }}>
        <button style={{ ...primaryBtn, width: '100%', justifyContent: 'center', marginBottom: 12 }}><Icon name="plus" size={14} color="#fff" /> 新規作成</button>
        {splits.map(s => (
          <button key={s.id} onClick={() => setSel(s.id)} style={{
            width: '100%', textAlign: 'left', padding: 14, borderRadius: 12,
            border: 'none', background: sel === s.id ? '#fff' : 'transparent',
            cursor: 'pointer', fontFamily: T.font, marginBottom: 4,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E5F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="split" size={18} color={C.split} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
              <div style={{ fontSize: 11, color: C.textSecondary }}>{s.count}人に分配 ・ {s.date}</div>
            </div>
          </button>
        ))}
      </aside>
      <div style={{ overflow: 'auto', padding: 28, display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>{split.name}</div>
            <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 4 }}>合計 100% ・ 対象 {split.count}人 ・ 作成日 {split.date}</div>
          </div>
          <Card>
            <SectionTitle>分配結果</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {split.top.map((t, i) => (
                <div key={t.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i === 0 ? 'none' : `1px solid ${C.border}` }}>
                  <div style={{ width: 24, fontSize: 12, color: C.textSecondary, fontWeight: 700 }}>{i + 1}.</div>
                  <Avatar name={t.n} size={32} />
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{t.n}</div>
                  <div style={{ width: 200, height: 6, background: C.border, borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${(t.p / 2.5) * 100}%`, height: '100%', background: C.split }} />
                  </div>
                  <div style={{ width: 60, textAlign: 'right', fontSize: 14, fontWeight: 700, fontFamily: T.fontDisplay || T.font }}>{t.p.toFixed(2)}%</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SectionTitle>技術情報</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.textSecondary }}>ENS</span><span>kuuvillageday7.split.toban.eth</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.textSecondary }}>Contract</span><span>0xD8EF...5B18e</span></div>
            </div>
          </Card>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <SectionTitle>分配ルール</SectionTitle>
            <RuleBar label="当番ベース" pct={82} color={C.role} />
            <RuleBar label="サンクスベース" pct={18} color={C.split} />
            <div style={{ height: 12 }} />
            <div style={{ fontSize: 11, color: C.textSecondary, fontWeight: 700, marginBottom: 6 }}>サンクスの内訳</div>
            <RuleBar label="送付" pct={75} color={C.primary} />
            <RuleBar label="受け取り" pct={25} color="#65C98A" />
          </Card>
        </div>
      </div>
    </div>
  );
};

const RuleBar = ({ label, pct, color }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
      <span>{label}</span><span>{pct}%</span>
    </div>
    <div style={{ height: 6, background: C.border, borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color }} />
    </div>
  </div>
);

// ── MEMBERS ─────────────────────────────────────────────────
const MembersView = () => {
  const [sel, setSel] = useState(D.members[0].id);
  const m = D.members.find(x => x.id === sel) || D.members[0];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: 'calc(100vh - 72px)' }}>
      <aside style={{ borderRight: `1px solid ${C.border}`, background: '#FBF8F1', overflow: 'auto', padding: 12 }}>
        {D.members.map(mem => (
          <button key={mem.id} onClick={() => setSel(mem.id)} style={{
            width: '100%', textAlign: 'left', padding: 12, borderRadius: 12,
            border: 'none', background: sel === mem.id ? '#fff' : 'transparent',
            cursor: 'pointer', fontFamily: T.font, marginBottom: 2,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <Avatar name={mem.name} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{mem.name}</div>
              <div style={{ fontSize: 11, color: C.textSecondary, fontFamily: 'ui-monospace, monospace' }}>{mem.addr}</div>
            </div>
            <Pill kind={mem.role === 'lead' ? 'lead' : mem.role === 'supporter' ? 'supporter' : 'Member'}>{mem.role === 'lead' ? '当番リード' : mem.role === 'supporter' ? 'サポーター' : 'Member'}</Pill>
          </button>
        ))}
      </aside>
      <div style={{ overflow: 'auto', padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <Avatar name={m.name} size={88} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.5 }}>{m.name}</div>
            <div style={{ fontSize: 13, color: C.textSecondary, fontFamily: 'ui-monospace, monospace', marginTop: 4 }}>{m.addr}</div>
            <div style={{ marginTop: 10 }}><Pill kind={m.role === 'lead' ? 'lead' : m.role === 'supporter' ? 'supporter' : 'Member'}>{m.role === 'lead' ? '当番リード' : m.role === 'supporter' ? 'サポーター' : 'Member'}</Pill></div>
          </div>
          <button style={primaryBtn}><Icon name="send" size={14} color="#fff" /> サンクスを送る</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
          <StatCard label="今週の貢献" value={m.contribs} unit="件" accent={C.contrib} />
          <StatCard label="受け取ったサンクス" value={m.received} unit="THX" accent={C.primary} />
          <StatCard label="当番シェア合計" value="35" unit="%" accent={C.split} />
        </div>

        <Card>
          <SectionTitle>関わっている当番</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {D.duties.filter(d => d.assignee === m.id || d.supporters.includes(m.name)).map(d => (
              <div key={d.id} style={{ background: '#FBF8F1', border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: (d.accent || '#D6B995') + '33', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="duty" size={16} color="#7A5A2E" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: C.textSecondary }}>{d.assignee === m.id ? '担当' : 'サポーター'}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ── WALLET ──────────────────────────────────────────────────
const WalletView = () => (
  <div style={{ padding: 32, maxWidth: 720 }}>
    <Card padding={28}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
        <Avatar name={D.user.name} size={88} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>{D.user.name}</div>
          <div style={{ fontSize: 13, color: C.textSecondary, fontFamily: 'ui-monospace, monospace', marginTop: 4 }}>{D.user.address}</div>
        </div>
        <button style={secondaryBtn}><Icon name="edit" size={14} color={C.textPrimary} /> プロフィール編集</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="送れるサンクス" value="120" unit="THX" accent={C.primary} />
        <StatCard label="受け取ったサンクス" value="80" unit="THX" accent={C.contrib} />
      </div>
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
        <SectionTitle>所属ワークスペース</SectionTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: C.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>k</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>kuu village #1</div>
            <div style={{ fontSize: 11, color: C.textSecondary }}>24 members ・ 2時間前</div>
          </div>
        </div>
      </div>
    </Card>
  </div>
);

// ── App root ─────────────────────────────────────────────────
const App = () => {
  const [route, setRoute] = useState({ name: 'home' });
  const ws = { name: 'kuu village #1', color: '#F5B82E' };

  const titles = {
    home: { title: 'ホーム', subtitle: '今日もおつかれさまです！' },
    duties: { title: '当番', subtitle: 'コミュニティの役割と関わり' },
    splits: { title: '分配', subtitle: '貢献記録から作る分配ルール' },
    members: { title: 'メンバー', subtitle: 'ワークスペース参加者' },
    wallet: { title: 'ウォレット', subtitle: 'プロフィールと残高' },
    'duty-detail': { title: '当番', subtitle: 'コミュニティの役割と関わり' },
    'quest-detail': { title: 'クエスト', subtitle: '当番シェアの動き' },
  };
  const tt = titles[route.name] || titles.home;

  return (
    <div style={{ height: '100vh', display: 'flex', background: C.background, fontFamily: T.font, color: C.textPrimary }}>
      <Sidebar route={route} setRoute={setRoute} ws={ws} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title={tt.title} subtitle={tt.subtitle} onSendThanks={() => alert('サンクス送信モーダル（プロトタイプ）')} />
        <main style={{ flex: 1, overflow: 'auto' }}>
          {route.name === 'home' && <HomeView setRoute={setRoute} />}
          {(route.name === 'duties' || route.name === 'duty-detail') && <DutiesView route={route} setRoute={setRoute} />}
          {route.name === 'splits' && <SplitsView setRoute={setRoute} />}
          {route.name === 'members' && <MembersView />}
          {route.name === 'wallet' && <WalletView />}
          {route.name === 'quest-detail' && <QuestDetailView route={route} setRoute={setRoute} />}
        </main>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
