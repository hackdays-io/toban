// Quest / 当番シェア (RoleShare) screens

window.TOBAN_QUESTS_DATA = {
  // shares per duty: array of { name, pct } summing to 100
  shares: {
    dishes: [
      { name: 'ryu', pct: 40 }, { name: 'sg', pct: 30 },
      { name: 'eri', pct: 20 }, { name: 'homma', pct: 10 },
    ],
    breakfast: [
      { name: 'atsu', pct: 50 }, { name: 'homma', pct: 30 }, { name: 'ryoma', pct: 20 },
    ],
    onoono: [
      { name: 'koichi', pct: 45 }, { name: 'ryu', pct: 25 },
      { name: 'sg', pct: 20 }, { name: 'eri', pct: 10 },
    ],
    food: [
      { name: 'ryoma', pct: 100 },
    ],
  },
  // quests
  quests: [
    { id: 'q1', dutyId: 'dishes', title: '夕食後の食器洗いを手伝う',
      desc: '食器を洗って、棚に戻してください。', creator: 'ryu', share: 10,
      state: 'open', count: 3, applicant: null },
    { id: 'q2', dutyId: 'dishes', title: '洗剤を補充する',
      desc: '台所の洗剤を新しく買って補充。レシートはあとで共有OK。',
      creator: 'ryu', share: 5, state: 'inprogress', applicant: 'sg' },
    { id: 'q3', dutyId: 'dishes', title: '食器棚を整理する',
      desc: '食器棚の中を片付けて、きれいに並べる。',
      creator: 'sg', share: 5, state: 'review', applicant: 'eri', approvals: 1 },
    { id: 'q4', dutyId: 'breakfast', title: '朝のコーヒーを淹れる',
      desc: '朝7時頃にコーヒーを淹れる。', creator: 'atsu', share: 8,
      state: 'open', count: 1, applicant: null },
    { id: 'q5', dutyId: 'dishes', title: 'ふきんを洗う', desc: 'ふきんを洗濯。',
      creator: 'ryu', share: 3, state: 'done', applicant: 'homma' },
  ],
};

const STATE_LABELS = {
  open: { label: '募集中', bg: '#FFF2CF', fg: '#7A5A2E' },
  inprogress: { label: '進行中', bg: '#E5F1FB', fg: '#2D6FA8' },
  review: { label: '確認待ち', bg: '#F2EBF8', fg: '#6E4DAA' },
  done: { label: '完了', bg: '#E5F5EC', fg: '#2F8B58' },
  cancelled: { label: 'キャンセル', bg: '#F0EBE0', fg: T.color.textSecondary },
};

const QStateBadge = ({ state }) => {
  const s = STATE_LABELS[state] || STATE_LABELS.open;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 999,
      background: s.bg, color: s.fg,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.2,
    }}>{s.label}</span>
  );
};

function userShareInDuty(dutyId, userName = 'ryoma') {
  const arr = (window.TOBAN_QUESTS_DATA.shares[dutyId] || []);
  return arr.find(x => x.name === userName)?.pct || 0;
}

// ─── Share distribution bar ─────────────────────────────────
function ShareDistribution({ dutyId, accent = '#D6B995' }) {
  const shares = window.TOBAN_QUESTS_DATA.shares[dutyId] || [];
  const palette = ['#D6B995', '#65C98A', '#5DADEC', '#F5B82E', '#B696E0', '#E48F4F', '#E48ABF'];
  return (
    <Card padding={16}>
      <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', height: 12, marginBottom: 12 }}>
        {shares.map((s, i) => (
          <div key={s.name} style={{ width: `${s.pct}%`, background: palette[i % palette.length] }} title={`${s.name}: ${s.pct}%`} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {shares.map((s, i) => (
          <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: 999, background: palette[i % palette.length] }} />
            <Avatar name={s.name} size={24} />
            <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{s.name}</div>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: T.fontDisplay || T.font, letterSpacing: -0.3 }}>{s.pct}<span style={{ fontSize: 10, color: T.color.textSecondary, marginLeft: 2 }}>%</span></div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Quest list section (in duty detail) ────────────────────
function QuestSections({ dutyId, goto }) {
  const all = window.TOBAN_QUESTS_DATA.quests.filter(q => q.dutyId === dutyId);
  const groups = [
    { state: 'open', title: '募集中のクエスト' },
    { state: 'inprogress', title: '進行中' },
    { state: 'review', title: '確認待ち' },
    { state: 'done', title: '完了' },
  ];
  return (
    <>
      {groups.map(g => {
        const items = all.filter(q => q.state === g.state);
        if (items.length === 0) return null;
        return (
          <F key={g.state}>
            <SectionLabel>{g.title}（{items.length}）</SectionLabel>
            <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map(q => <QuestCard key={q.id} q={q} onClick={() => goto({ name: 'quest-detail', questId: q.id })} />)}
            </div>
          </F>
        );
      })}
    </>
  );
}

function AllQuestSections({ goto }) {
  const all = window.TOBAN_QUESTS_DATA.quests;
  const groups = [
    { state: 'open', title: '募集中のクエスト' },
    { state: 'review', title: '確認待ち' },
    { state: 'inprogress', title: '進行中' },
    { state: 'done', title: '完了' },
  ];
  return (
    <>
      {groups.map(g => {
        const items = all.filter(q => q.state === g.state);
        if (items.length === 0) return null;
        return (
          <F key={g.state}>
            <SectionLabel>{g.title}（{items.length}）</SectionLabel>
            <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map(q => <QuestCard key={q.id} q={q} showDuty onClick={() => goto({ name: 'quest-detail', questId: q.id })} />)}
            </div>
          </F>
        );
      })}
    </>
  );
}

function QuestCard({ q, onClick, showDuty }) {
  const duty = showDuty ? window.TOBAN_DATA.duties.find(d => d.id === q.dutyId) : null;
  return (
    <Card padding={14} onClick={onClick} style={{ cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {duty && <div style={{ fontSize: 10, fontWeight: 700, color: T.color.textSecondary, marginBottom: 3, letterSpacing: 0.3 }}>{duty.name}</div>}
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{q.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <QStateBadge state={q.state} />
            <span style={{ fontSize: 11, color: T.color.textSecondary }}>
              {q.state === 'open' && `作成者: ${q.creator}・残り${q.count}件`}
              {q.state === 'inprogress' && `参加者: ${q.applicant}`}
              {q.state === 'review' && `申請者: ${q.applicant}・承認 ${q.approvals || 0}/2`}
              {q.state === 'done' && `${q.applicant} が完了`}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flex: 'none' }}>
          <div style={{ fontSize: 11, color: T.color.textSecondary }}>当番シェア</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.color.primary, fontFamily: T.fontDisplay || T.font, letterSpacing: -0.5 }}>+{q.share}<span style={{ fontSize: 10, color: T.color.textSecondary, marginLeft: 1 }}>%</span></div>
        </div>
      </div>
    </Card>
  );
}

// ─── Quest create ────────────────────────────────────────────
function QuestCreateScreen({ goto, dutyId, onCreated }) {
  const duty = window.TOBAN_DATA.duties.find(d => d.id === dutyId);
  const myShare = userShareInDuty(dutyId);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [share, setShare] = useState(Math.min(10, myShare));

  const after = myShare - share;
  const valid = title.trim() && share > 0 && share <= myShare;

  return (
    <div style={{ paddingBottom: 32 }}>
      <ScreenHeader title="クエストを作成" onBack={() => goto({ name: 'duty-detail', dutyId })} />

      <div style={{ padding: '0 16px 12px' }}>
        <Card padding={16} style={{ background: T.color.primarySoft, borderColor: T.color.primary + '55' }}>
          <div style={{ fontSize: 11, color: '#7A5A2E', fontWeight: 700, marginBottom: 8 }}>紐づく当番</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>{duty?.name || '—'}</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18 }}>
            <ShareNumber label="あなたのシェア" value={myShare} />
            <span style={{ fontSize: 18, color: '#7A5A2E', paddingBottom: 4 }}>−</span>
            <ShareNumber label="渡すシェア" value={share} highlight />
            <span style={{ fontSize: 18, color: '#7A5A2E', paddingBottom: 4 }}>=</span>
            <ShareNumber label="作成後" value={after} dim />
          </div>
        </Card>
      </div>

      <div style={{ padding: '8px 20px 0' }}>
        <FieldLabel>渡す当番シェア <span style={{ color: T.color.danger }}>*</span></FieldLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setShare(Math.max(1, share - 1))} style={stepBtn}>−</button>
          <div style={{ flex: 1, textAlign: 'center', fontSize: 28, fontWeight: 700, fontFamily: T.fontDisplay || T.font, letterSpacing: -0.5 }}>
            {share}<span style={{ fontSize: 14, color: T.color.textSecondary, marginLeft: 3 }}>%</span>
          </div>
          <button onClick={() => setShare(Math.min(myShare, share + 1))} style={stepBtn}>+</button>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {[5, 10, 15, 20].filter(n => n <= myShare).map(n => (
            <button key={n} onClick={() => setShare(n)} style={{
              flex: 1, padding: '8px 0', borderRadius: T.radius.full,
              background: share === n ? T.color.primary : T.color.surface,
              color: share === n ? '#fff' : T.color.textPrimary,
              border: `1px solid ${share === n ? T.color.primary : T.color.border}`,
              fontFamily: T.font, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>{n}%</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <FieldLabel>クエスト名 <span style={{ color: T.color.danger }}>*</span></FieldLabel>
        <Input value={title} onChange={setTitle} placeholder="例：夕食後の食器洗いを手伝う" />
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <FieldLabel>説明</FieldLabel>
        <Input value={desc} onChange={setDesc} multiline rows={4} placeholder="どんなお願いか、自由に書いてください" />
      </div>

      <div style={{ padding: '24px 16px 0', display: 'flex', gap: 10 }}>
        <Button variant="secondary" onClick={() => goto({ name: 'duty-detail', dutyId })}>キャンセル</Button>
        <Button variant="primary" full disabled={!valid} icon="plus"
          onClick={() => { onCreated?.({ title, share }); goto({ name: 'duty-detail', dutyId }); }}>
          作成する
        </Button>
      </div>
    </div>
  );
}

const stepBtn = {
  width: 48, height: 48, borderRadius: 999,
  background: T.color.surface, border: `1px solid ${T.color.border}`,
  fontSize: 20, fontWeight: 700, fontFamily: T.font, cursor: 'pointer',
  color: T.color.textPrimary,
};

const ShareNumber = ({ label, value, highlight, dim }) => (
  <div style={{ flex: 1, textAlign: 'center', opacity: dim ? 0.7 : 1 }}>
    <div style={{ fontSize: 10, color: '#7A5A2E', fontWeight: 600, marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: highlight ? 30 : 24, fontWeight: 700,
      color: highlight ? T.color.primary : '#3D2D14',
      fontFamily: T.fontDisplay || T.font, letterSpacing: -0.5,
      lineHeight: 1,
    }}>{value}<span style={{ fontSize: 11, color: '#7A5A2E', marginLeft: 2 }}>%</span></div>
  </div>
);

// ─── Quest detail ────────────────────────────────────────────
function QuestDetailScreen({ goto, questId, onAction }) {
  const q = window.TOBAN_QUESTS_DATA.quests.find(x => x.id === questId);
  if (!q) return <div style={{ padding: 40 }}>クエストが見つかりません</div>;
  const duty = window.TOBAN_DATA.duties.find(d => d.id === q.dutyId);
  const isMine = q.creator === 'ryoma';

  return (
    <div style={{ paddingBottom: 32 }}>
      <ScreenHeader title="クエスト" onBack={() => goto({ name: 'duty-detail', dutyId: q.dutyId })} />

      <div style={{ padding: '0 16px 12px' }}>
        <Card padding={20}>
          <QStateBadge state={q.state} />
          <div style={{ fontSize: 22, fontWeight: 700, margin: '12px 0 8px', lineHeight: 1.3 }}>{q.title}</div>
          <div style={{ fontSize: 13, color: T.color.textSecondary, lineHeight: 1.6, marginBottom: 16 }}>{q.desc}</div>

          <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: `1px solid ${T.color.border}`, borderBottom: `1px solid ${T.color.border}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: T.color.textSecondary, fontWeight: 600 }}>紐づく当番</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{duty?.name || '—'}</div>
            </div>
            <div style={{ width: 1, background: T.color.border }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: T.color.textSecondary, fontWeight: 600 }}>もらえるシェア</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.color.primary, fontFamily: T.fontDisplay || T.font, letterSpacing: -0.3, marginTop: 2 }}>+{q.share}%</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
            <Avatar name={q.creator} size={32} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: T.color.textSecondary }}>作成者</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{q.creator}</div>
            </div>
            {q.applicant && (
              <>
                <Icon name="arrow-right" size={16} color={T.color.textSecondary} />
                <Avatar name={q.applicant} size={32} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: T.color.textSecondary }}>{q.state === 'review' ? '申請者' : '参加者'}</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{q.applicant}</div>
                </div>
              </>
            )}
          </div>

          {q.state === 'review' && (
            <Card padding={12} style={{ marginTop: 14, background: T.color.primarySoft, borderColor: T.color.primary + '55' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#7A5A2E', marginBottom: 6 }}>承認状況</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 6, background: '#fff', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${(q.approvals || 0) / 2 * 100}%`, height: '100%', background: T.color.primary }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#7A5A2E' }}>{q.approvals || 0} / 2</div>
              </div>
              <div style={{ fontSize: 11, color: '#7A5A2E', marginTop: 8, lineHeight: 1.5 }}>
                作成者の承認、または当番シェア保有者2人の承認で完了します。
              </div>
            </Card>
          )}
        </Card>
      </div>

      {/* CTAs by state */}
      <div style={{ padding: '8px 16px 0' }}>
        {q.state === 'open' && !isMine && (
          <Button variant="primary" full icon="check" onClick={() => { onAction?.({ kind: 'apply', q }); goto({ name: 'duty-detail', dutyId: q.dutyId }); }}>申請する</Button>
        )}
        {q.state === 'open' && isMine && (
          <Button variant="secondary" full onClick={() => { onAction?.({ kind: 'cancel', q }); goto({ name: 'duty-detail', dutyId: q.dutyId }); }}>キャンセル</Button>
        )}
        {q.state === 'inprogress' && q.applicant === 'me-or-not' && (
          <Button variant="primary" full icon="send" onClick={() => onAction?.({ kind: 'request', q })}>完了申請する</Button>
        )}
        {q.state === 'inprogress' && (
          <Button variant="primary" full icon="send" onClick={() => { onAction?.({ kind: 'request', q }); goto({ name: 'duty-detail', dutyId: q.dutyId }); }}>完了申請する</Button>
        )}
        {q.state === 'review' && (
          <Button variant="primary" full icon="check" onClick={() => goto({ name: 'quest-approve', questId: q.id })}>承認画面を開く</Button>
        )}
        {q.state === 'done' && (
          <Card padding={14} style={{ background: '#E5F5EC', borderColor: T.color.contrib + '55' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#2F8B58', marginBottom: 4 }}>
              {q.applicant} が完了しました
            </div>
            <div style={{ fontSize: 12, color: '#2F8B58' }}>
              {duty?.name} の当番シェア +{q.share}%
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Quest approve ───────────────────────────────────────────
function QuestApproveScreen({ goto, questId, onApproved }) {
  const q = window.TOBAN_QUESTS_DATA.quests.find(x => x.id === questId);
  if (!q) return <div style={{ padding: 40 }}>—</div>;
  const duty = window.TOBAN_DATA.duties.find(d => d.id === q.dutyId);

  return (
    <div style={{ paddingBottom: 32 }}>
      <ScreenHeader title="完了申請の確認" onBack={() => goto({ name: 'quest-detail', questId })} />

      <div style={{ padding: '0 16px 12px' }}>
        <Card padding={20}>
          <div style={{ fontSize: 11, color: T.color.textSecondary, fontWeight: 600, marginBottom: 4 }}>クエスト</div>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>{q.title}</div>

          <Row left={<Avatar name={q.applicant} size={40} />}
            title={q.applicant} subtitle="完了申請" />
          <Divider />

          <div style={{ padding: '14px 0 4px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: T.color.textSecondary, fontWeight: 600 }}>付与される当番シェア</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: T.color.primary, fontFamily: T.fontDisplay || T.font, letterSpacing: -1, lineHeight: 1, margin: '8px 0' }}>+{q.share}<span style={{ fontSize: 16, color: '#7A5A2E', marginLeft: 2 }}>%</span></div>
            <div style={{ fontSize: 13, color: T.color.textSecondary }}>{duty?.name}</div>
          </div>

          <Divider />
          <div style={{ padding: '14px 0 0' }}>
            <div style={{ fontSize: 11, color: T.color.textSecondary, fontWeight: 600, marginBottom: 6 }}>承認状況</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 6, background: T.color.border, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${(q.approvals || 0) / 2 * 100}%`, height: '100%', background: T.color.primary }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{q.approvals || 0} / 2</div>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ padding: '8px 20px 16px', fontSize: 12, color: T.color.textSecondary, lineHeight: 1.6 }}>
        作成者の承認、または当番シェア保有者2人の承認で完了します。
      </div>

      <div style={{ padding: '0 16px', display: 'flex', gap: 10 }}>
        <Button variant="secondary" onClick={() => goto({ name: 'quest-detail', questId })}>戻る</Button>
        <Button variant="primary" full icon="check" onClick={() => { onApproved?.({ q }); goto({ name: 'duty-detail', dutyId: q.dutyId }); }}>承認する</Button>
      </div>
    </div>
  );
}

Object.assign(window, {
  ShareDistribution, QuestSections, AllQuestSections, QuestCard, QStateBadge,
  QuestCreateScreen, QuestDetailScreen, QuestApproveScreen,
  userShareInDuty,
});
