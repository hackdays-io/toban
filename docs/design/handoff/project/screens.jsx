// Toban screens — home, thanks, duties, splits, members, wallet
const D = window.TOBAN_DATA;
const memberById = (id) => D.members.find(m => m.id === id) || { name: id, addr: '' };

// ─── HOME ─────────────────────────────────────────────────────
function HomeScreen({ goto, openThanks, ws, openWsMenu }) {
  const myDuty = D.duties.find(d => d.assignee === 'ryu'); // pretend ryu is "me" sometimes
  return (
    <div style={{ paddingBottom: 24 }}>
      <AppHeader ws={ws} openWsMenu={openWsMenu} />

      {/* greeting */}
      <div style={{ padding: '4px 20px 16px' }}>
        <div style={{ fontSize: 13, color: T.color.textSecondary }}>こんにちは、ryoma さん</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, letterSpacing: -0.3 }}>今日もおつかれさまです！</div>
      </div>

      {/* sendable balance card */}
      <div style={{ padding: '0 16px 12px' }}>
        <Card padding={0} style={{ overflow: 'hidden' }}>
          <div style={{ background: T.color.primarySoft, padding: 18, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, color: '#7A5A2E', fontWeight: 600 }}>送れるサンクス</div>
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1, color: T.color.textPrimary, lineHeight: 1 }}>120</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#7A5A2E' }}>THX</span>
                </div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: T.radius.full, background: T.color.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="sparkle" size={22} color="#fff" />
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: '#7A5A2E', display: 'flex', justifyContent: 'space-between' }}>
              <span>受け取った: <strong style={{ color: T.color.textPrimary }}>80 THX</strong></span>
              <span>+15% 今週</span>
            </div>
          </div>
          <div style={{ padding: 14 }}>
            <Button variant="primary" full icon="send" onClick={openThanks}>サンクスを送る</Button>
          </div>
        </Card>
      </div>

      {/* my duty */}
      <SectionLabel>あなたの当番</SectionLabel>
      <div style={{ padding: '0 16px 16px' }}>
        {myDuty ? (
          <Card onClick={() => goto({ name: 'duty-detail', dutyId: myDuty.id })} padding={14}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: T.radius.sm,
                background: '#F2EAD9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="duty" size={22} color="#7A5A2E" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{myDuty.name}</div>
                <div style={{ fontSize: 12, color: T.color.textSecondary, marginTop: 3 }}>
                  次回: {myDuty.next} ・ サポーター {myDuty.supporters.length}人
                </div>
              </div>
              <Badge kind="lead">担当中</Badge>
            </div>
          </Card>
        ) : null}
      </div>

      {/* recent activity */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 20px 8px' }}>
        <div style={{ fontSize: 12, color: T.color.textSecondary, fontWeight: 700, letterSpacing: 0.4 }}>最近のアクティビティ</div>
        <button onClick={() => goto({ name: 'thanks-insights' })} style={{ background: 'none', border: 'none', fontSize: 12, color: T.color.textSecondary, fontFamily: T.font, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 2 }}>すべて見る<Icon name="chevron-right" size={12} color={T.color.textSecondary} /></button>
      </div>
      <div style={{ padding: '0 16px' }}>
        <Card padding={0}>
          {D.activity.slice(0, 4).map((a, i) => (
            <div key={a.id} style={{display:"contents"}}>
              <ActivityRow a={a} />
              {i < 3 && <Divider inset={64} />}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

const SectionLabel = ({ children }) => (
  <div style={{ padding: '4px 20px 8px', fontSize: 12, color: T.color.textSecondary, fontWeight: 700, letterSpacing: 0.4 }}>{children}</div>
);

const AppHeader = ({ ws, openWsMenu }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 8px' }}>
    <button onClick={openWsMenu} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: T.color.surface, border: `1px solid ${T.color.border}`,
      borderRadius: T.radius.full, padding: '6px 10px 6px 6px',
      cursor: 'pointer', fontFamily: T.font, flex: 1, minWidth: 0,
    }}>
      <div style={{ width: 28, height: 28, borderRadius: T.radius.full, background: ws.color, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flex: 'none' }}>
        {ws.icon}
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color: T.color.textPrimary, flex: 1, textAlign: 'left',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.name}</span>
      <Icon name="chevron-down" size={16} color={T.color.textSecondary} />
    </button>
    <button style={iconBtn}><Icon name="bell" size={20} /><span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 999, background: T.color.danger, border: '2px solid #fff' }} /></button>
  </div>
);

const iconBtn = {
  position: 'relative',
  width: 40, height: 40, borderRadius: T.radius.full,
  background: T.color.surface, border: `1px solid ${T.color.border}`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', flex: 'none',
};

const ActivityRow = ({ a }) => {
  let icon, label, color = T.color.contrib, suffix;
  if (a.kind === 'thanks-recv') {
    icon = 'heart'; color = T.color.contrib;
    label = <><strong>{a.from}</strong> さんから</>;
    suffix = <span style={{ color: T.color.contrib, fontWeight: 700, fontSize: 13 }}>+{a.amount} THX</span>;
  } else if (a.kind === 'thanks-sent') {
    icon = 'send'; color = T.color.primary;
    label = <><strong>{a.to}</strong> さんへ</>;
    suffix = <span style={{ color: T.color.textSecondary, fontWeight: 700, fontSize: 13 }}>−{a.amount} THX</span>;
  } else if (a.kind === 'duty-assigned') {
    icon = 'duty'; color = T.color.role;
    label = <><strong>{a.who}</strong> さんが担当に</>;
    suffix = <span style={{ fontSize: 11, color: T.color.textSecondary }}>{a.duty}</span>;
  } else if (a.kind === 'split-created') {
    icon = 'pie'; color = T.color.split;
    label = <>分配「<strong>{a.name}</strong>」作成</>;
    suffix = <span style={{ fontSize: 11, color: T.color.textSecondary }}>{a.count}人</span>;
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
      <div style={{ width: 36, height: 36, borderRadius: T.radius.full,
        background: '#fff', border: `1.5px solid ${color}33`, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        <Icon name={icon} size={18} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: T.color.textPrimary }}>{label}</div>
        {a.msg && <div style={{ fontSize: 12, color: T.color.textSecondary, marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.msg}</div>}
        <div style={{ fontSize: 11, color: T.color.textSecondary, marginTop: 2 }}>{a.time}</div>
      </div>
      {suffix}
    </div>
  );
};

// ─── DUTIES ──────────────────────────────────────────────────
function DutiesScreen({ goto, ws, openWsMenu }) {
  const [tab, setTab] = useState('all');
  const [view, setView] = useState('duties');
  return (
    <div style={{ paddingBottom: 24 }}>
      <AppHeader ws={ws} openWsMenu={openWsMenu} />
      <div style={{ padding: '4px 20px 12px' }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>当番</div>
        <div style={{ fontSize: 13, color: T.color.textSecondary, marginTop: 2 }}>コミュニティの役割と関わり</div>
      </div>
      <div style={{ padding: '0 16px 12px' }}>
        <Segmented value={view} onChange={setView} options={[
          { value: 'duties', label: '当番' },
          { value: 'quests', label: 'クエスト' },
        ]} />
      </div>
      {view === 'duties' && <>
        <div style={{ padding: '0 16px 10px' }}>
          <Segmented value={tab} onChange={setTab} options={[
            { value: 'mine', label: 'あなたの当番' },
            { value: 'all', label: 'すべて' },
            { value: 'open', label: '空き' },
          ]} />
        </div>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {D.duties
            .filter(d => tab === 'all' ? true : tab === 'mine' ? d.assignee === 'ryu' : !d.assignee)
            .map(d => <DutyCard key={d.id} duty={d} onClick={() => goto({ name: 'duty-detail', dutyId: d.id })} />)
          }
        </div>
        <div style={{ padding: 16 }}>
          <Button variant="secondary" full icon="plus" onClick={() => goto({ name: 'duty-edit' })}>当番を作成</Button>
        </div>
      </>}
      {view === 'quests' && <AllQuestSections goto={goto} />}
    </div>
  );
}

const DutyCard = ({ duty, onClick }) => (
  <Card onClick={onClick} padding={14}>
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{duty.name}</div>
        {duty.assignee
          ? <Badge kind="lead">担当中</Badge>
          : <Badge kind="role">空き</Badge>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.color.textSecondary }}>
        {duty.assignee ? (
          <>
            <Avatar name={duty.assignee} size={22} />
            <span>担当: <strong style={{ color: T.color.textPrimary }}>{duty.assignee}</strong></span>
            {duty.next && <><span>・</span><span>次回 {duty.next}</span></>}
            {duty.supporters.length > 0 && <><span>・</span><span>サポーター {duty.supporters.length}人</span></>}
          </>
        ) : (
          <span>担当者を募集中</span>
        )}
      </div>
    </div>
  </Card>
);

// ─── DUTY DETAIL ─────────────────────────────────────────────
function DutyDetailScreen({ goto, dutyId }) {
  const duty = D.duties.find(d => d.id === dutyId);
  const assignee = duty.assignee ? memberById(duty.assignee) : null;
  return (
    <div style={{ paddingBottom: 24 }}>
      <ScreenHeader title="当番" onBack={() => goto({ name: 'duties' })} right={<button style={iconBtn} onClick={() => goto({ name: 'duty-edit', dutyId })}><Icon name="edit" size={18} /></button>} />
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{ width: 56, height: 56, borderRadius: T.radius.md,
            background: duty.accent + '33', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="duty" size={28} color="#7A5A2E" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{duty.name}</div>
            <div style={{ fontSize: 12, color: T.color.textSecondary, marginTop: 4 }}>
              次回: {duty.next || '未定'}
            </div>
          </div>
        </div>
      </div>

      <SectionLabel>説明</SectionLabel>
      <div style={{ padding: '0 16px 16px' }}>
        <Card padding={16}>
          {duty.desc.map((line, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: i === duty.desc.length - 1 ? 0 : 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: 999, background: T.color.primary, marginTop: 8, flex: 'none' }} />
              <div style={{ fontSize: 14, lineHeight: 1.5 }}>{line}</div>
            </div>
          ))}
        </Card>
      </div>

      <SectionLabel>現在の担当</SectionLabel>
      <div style={{ padding: '0 16px 16px' }}>
        <Card padding={0}>
          {assignee ? (
            <Row
              left={<Avatar name={assignee.name} size={40} />}
              title={assignee.name}
              subtitle={`${assignee.addr} ・ 担当者`}
              right={<Badge kind="lead">当番リード</Badge>}
              onClick={() => goto({ name: 'member-detail', memberId: assignee.id })}
            />
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: T.color.textSecondary, fontSize: 13 }}>
              まだ担当者はいません
            </div>
          )}
        </Card>
      </div>

      <SectionLabel>当番シェア分布</SectionLabel>
      <div style={{ padding: '0 16px 16px' }}>
        <ShareDistribution dutyId={dutyId} />
      </div>

      <QuestSections dutyId={dutyId} goto={goto} />

      <div style={{ padding: '0 16px 20px' }}>
        <Button variant="secondary" full icon="plus" onClick={() => goto({ name: 'quest-create', dutyId })}>クエストを作成</Button>
      </div>

      <SectionLabel>サポーター（{duty.supporters.length}人）</SectionLabel>
      <div style={{ padding: '0 16px 16px' }}>
        <Card padding={0}>
          {duty.supporters.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: T.color.textSecondary, fontSize: 13 }}>
              サポーターはいません
            </div>
          ) : duty.supporters.map((s, i) => (
            <div key={s} style={{display:"contents"}}>
              <Row
                left={<Avatar name={s} size={36} />}
                title={s}
                subtitle="サポーター"
                right={<Icon name="chevron-right" size={16} color={T.color.textSecondary} />}
              />
              {i < duty.supporters.length - 1 && <Divider inset={64} />}
            </div>
          ))}
        </Card>
      </div>

      <div style={{ padding: '8px 16px 0', display: 'flex', gap: 10 }}>
        <Button variant="primary" full icon="plus" onClick={() => goto({ name: 'assign-duty', dutyId })}>担当を追加</Button>
        <Button variant="secondary" icon="send" style={{ flex: 'none', width: 48, padding: 0 }} onClick={() => goto({ name: 'thanks-recipient', preselect: assignee?.id })}> </Button>
      </div>
    </div>
  );
}

// ─── ASSIGN DUTY ─────────────────────────────────────────────
function AssignDutyScreen({ goto, dutyId, onAssigned }) {
  const duty = D.duties.find(d => d.id === dutyId);
  const [step, setStep] = useState('select'); // select | settings | confirm | done
  const [picked, setPicked] = useState(null);
  const [role, setRole] = useState('lead');
  const [q, setQ] = useState('');
  const filtered = D.members.filter(m => !q || m.name.toLowerCase().includes(q.toLowerCase()) || m.addr.includes(q));

  if (step === 'done') {
    return (
      <div>
        <ScreenHeader title="完了" onBack={() => goto({ name: 'duty-detail', dutyId })} />
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: T.radius.full, background: '#E5F5EC',
            margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={36} color={T.color.contrib} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>担当を追加しました</div>
          <div style={{ fontSize: 13, color: T.color.textSecondary, marginBottom: 28 }}>
            <strong style={{ color: T.color.textPrimary }}>{picked.name}</strong> が「{duty.name}」の{role === 'lead' ? '担当者' : 'サポーター'}になりました。
          </div>
          <Button variant="primary" full onClick={() => goto({ name: 'duty-detail', dutyId })}>当番詳細へ戻る</Button>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div>
        <ScreenHeader title="確認" onBack={() => setStep('settings')} />
        <div style={{ padding: '8px 16px' }}>
          <Card padding={0}>
            <SummaryRow label="当番" value={duty.name} />
            <Divider />
            <SummaryRow label="メンバー" value={<><Avatar name={picked.name} size={24} style={{ marginRight: 8 }} />{picked.name}</>} />
            <Divider />
            <SummaryRow label="役割" value={role === 'lead' ? '担当者' : 'サポーター'} />
            <Divider />
            <SummaryRow label="開始日" value="2026/05/08 12:30" />
          </Card>
        </div>
        <div style={{ padding: 16, display: 'flex', gap: 10 }}>
          <Button variant="secondary" onClick={() => setStep('settings')}>戻って修正</Button>
          <Button variant="primary" full onClick={() => { onAssigned?.({ dutyId, member: picked.name, role }); setStep('done'); }}>追加する</Button>
        </div>
      </div>
    );
  }

  if (step === 'settings') {
    return (
      <div>
        <ScreenHeader title="開始日と役割" subtitle={duty.name} onBack={() => setStep('select')} />
        <div style={{ padding: '8px 20px 0' }}>
          <FieldLabel>担当者</FieldLabel>
          <Card padding={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={picked.name} size={36} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{picked.name}</div>
                <div style={{ fontSize: 11, color: T.color.textSecondary }}>{picked.addr}</div>
              </div>
            </div>
          </Card>
        </div>
        <div style={{ padding: '16px 20px 0' }}>
          <FieldLabel>役割</FieldLabel>
          <Segmented value={role} onChange={setRole} options={[
            { value: 'lead', label: '担当者' }, { value: 'supporter', label: 'サポーター' },
          ]} />
        </div>
        <div style={{ padding: '16px 20px 0' }}>
          <FieldLabel>開始日</FieldLabel>
          <Card padding={14}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>2026/05/08</span>
              <span style={{ fontSize: 13, color: T.color.textSecondary }}>12:30</span>
            </div>
          </Card>
        </div>
        <div style={{ padding: '16px 20px 0' }}>
          <FieldLabel>メモ（任意）</FieldLabel>
          <Input placeholder="引き継ぎ事項など" multiline rows={2} value="" onChange={() => {}} />
        </div>
        <div style={{ padding: 16, marginTop: 12 }}>
          <Button variant="primary" full onClick={() => setStep('confirm')}>確認へ</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ScreenHeader title="担当を追加" subtitle={duty.name} onBack={() => goto({ name: 'duty-detail', dutyId })} />
      <div style={{ padding: '4px 16px 12px' }}>
        <Input icon="search" placeholder="ユーザー名 or ウォレットアドレス" value={q} onChange={setQ} />
      </div>
      <SectionLabel>メンバー</SectionLabel>
      <div style={{ padding: '0 16px' }}>
        <Card padding={0}>
          {filtered.map((m, i) => (
            <div key={m.id} style={{display:"contents"}}>
              <Row
                left={<Avatar name={m.name} size={36} />}
                title={m.name}
                subtitle={m.addr}
                right={<Icon name="chevron-right" size={16} color={T.color.textSecondary} />}
                onClick={() => { setPicked(m); setStep('settings'); }}
              />
              {i < filtered.length - 1 && <Divider inset={64} />}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

const FieldLabel = ({ children }) => <div style={{ fontSize: 12, fontWeight: 700, color: T.color.textSecondary, marginBottom: 8, letterSpacing: 0.3 }}>{children}</div>;
const SummaryRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', gap: 12 }}>
    <span style={{ fontSize: 12, color: T.color.textSecondary, fontWeight: 600 }}>{label}</span>
    <span style={{ fontSize: 14, fontWeight: 600, textAlign: 'right', display: 'inline-flex', alignItems: 'center' }}>{value}</span>
  </div>
);

// ─── SPLITS ─────────────────────────────────────────────────
function SplitsScreen({ goto, ws, openWsMenu }) {
  return (
    <div style={{ paddingBottom: 24 }}>
      <AppHeader ws={ws} openWsMenu={openWsMenu} />
      <div style={{ padding: '4px 20px 16px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>分配</div>
          <div style={{ fontSize: 13, color: T.color.textSecondary, marginTop: 2 }}>貢献記録から、納得できる分配へ</div>
        </div>
        <Button size="sm" variant="primary" icon="plus" onClick={() => goto({ name: 'split-create' })}>新規作成</Button>
      </div>
      <SectionLabel>分配ルール</SectionLabel>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {D.splits.map(s => <SplitCard key={s.id} split={s} onClick={() => goto({ name: 'split-detail', splitId: s.id })} />)}
      </div>
    </div>
  );
}

const SplitCard = ({ split, onClick }) => (
  <Card onClick={onClick} padding={16}>
    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
      <DonutChart shares={split.shares} size={72} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{split.name}</div>
        <div style={{ fontSize: 12, color: T.color.textSecondary, marginTop: 2 }}>
          {split.count}人に分配 ・ 最終更新: {split.updated}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {split.shares.slice(0, 3).map(sh => (
            <span key={sh.name} style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px',
              borderRadius: T.radius.full, background: '#F0EBE0', color: T.color.textPrimary }}>
              {sh.name} {sh.pct.toFixed(1)}%
            </span>
          ))}
          {split.shares.length > 3 && <span style={{ fontSize: 11, color: T.color.textSecondary, alignSelf: 'center' }}>+{split.shares.length - 3}</span>}
        </div>
      </div>
      <Icon name="chevron-right" size={18} color={T.color.textSecondary} />
    </div>
  </Card>
);

// donut chart with split-blue palette family
const donutColors = ['#5DADEC', '#F5B82E', '#65C98A', '#D6B995', '#E48F4F', '#B696E0', '#E48ABF', '#7AC2D9', '#F2A6A0'];
function DonutChart({ shares, size = 80, total }) {
  const sum = shares.reduce((a, b) => a + b.pct, 0);
  const remainder = Math.max(0, 100 - sum);
  const all = remainder > 0.5 ? [...shares, { name: 'その他', pct: remainder, _other: true }] : shares;
  const r = size / 2 - 8;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F0EBE0" strokeWidth={10} />
        {all.map((s, i) => {
          const len = (s.pct / 100) * circ;
          const seg = (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={s._other ? T.color.border : donutColors[i % donutColors.length]}
              strokeWidth={10}
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-offset} />
          );
          offset += len;
          return seg;
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        {total != null
          ? <><span style={{ fontSize: size * 0.22, fontWeight: 800, lineHeight: 1 }}>{total}</span>
              <span style={{ fontSize: size * 0.11, color: T.color.textSecondary, fontWeight: 700 }}>THX</span></>
          : <span style={{ fontSize: size * 0.16, fontWeight: 700, color: T.color.textSecondary }}>{shares.length}人</span>}
      </div>
    </div>
  );
}

// ─── SPLIT DETAIL ─────────────────────────────────────────────
function SplitDetailScreen({ goto, splitId }) {
  const split = D.splits.find(s => s.id === splitId);
  const [showTech, setShowTech] = useState(false);
  return (
    <div style={{ paddingBottom: 24 }}>
      <ScreenHeader title="分配詳細" onBack={() => goto({ name: 'splits' })} />
      <div style={{ padding: '0 20px 8px' }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.3 }}>{split.name}</div>
        <div style={{ fontSize: 12, color: T.color.textSecondary, marginTop: 4 }}>
          作成日: {split.updated} ・ 対象 {split.count}人
        </div>
      </div>

      <div style={{ padding: '12px 16px' }}>
        <Card padding={20}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, justifyContent: 'center' }}>
            <DonutChart shares={split.shares} size={130} total={100} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {split.shares.slice(0, 4).map((s, i) => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 999,
                    background: donutColors[i % donutColors.length], flex: 'none' }} />
                  <span style={{ flex: 1, color: T.color.textPrimary }}>{s.name}</span>
                  <span style={{ fontWeight: 700 }}>{s.pct.toFixed(1)}%</span>
                </div>
              ))}
              {split.shares.length > 4 && (
                <div style={{ fontSize: 11, color: T.color.textSecondary, marginTop: 2 }}>
                  +{split.shares.length - 4}人
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <SectionLabel>分配結果</SectionLabel>
      <div style={{ padding: '0 16px 16px' }}>
        <Card padding={0}>
          {split.shares.map((s, i) => (
            <div key={s.name} style={{display:"contents"}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                <div style={{ width: 26, fontSize: 12, color: T.color.textSecondary, fontWeight: 700 }}>{i + 1}</div>
                <Avatar name={s.name} size={32} />
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{s.name}</div>
                <div style={{ width: 80, height: 6, background: '#F0EBE0', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${(s.pct / split.shares[0].pct) * 100}%`, height: '100%',
                    background: donutColors[i % donutColors.length] }} />
                </div>
                <div style={{ width: 52, textAlign: 'right', fontSize: 13, fontWeight: 700 }}>{s.pct.toFixed(2)}%</div>
              </div>
              {i < split.shares.length - 1 && <Divider inset={16} />}
            </div>
          ))}
        </Card>
      </div>

      <SectionLabel>分配ルール</SectionLabel>
      <div style={{ padding: '0 16px 16px' }}>
        <Card padding={16}>
          <WeightBar label="当番ベース" pct={split.dutyWeight} color={T.color.role} />
          <div style={{ height: 12 }} />
          <WeightBar label="サンクスベース" pct={split.thanksWeight} color={T.color.contrib} />
          <Divider style={{ margin: '14px -16px' }} />
          <div style={{ fontSize: 12, color: T.color.textSecondary, marginTop: 14, marginBottom: 10, fontWeight: 600 }}>サンクス内の重み</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, padding: 12, borderRadius: T.radius.sm, background: T.color.bg, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: T.color.textSecondary }}>受け取り</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.color.contrib }}>{split.thanksRecv}%</div>
            </div>
            <div style={{ flex: 1, padding: 12, borderRadius: T.radius.sm, background: T.color.bg, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: T.color.textSecondary }}>送付</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.color.primary }}>{split.thanksSent}%</div>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ padding: '0 16px' }}>
        <Card padding={0}>
          <button onClick={() => setShowTech(!showTech)} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.font,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.color.textSecondary }}>技術情報</span>
            <Icon name="chevron-down" size={16} color={T.color.textSecondary}
              style={{ transform: showTech ? 'rotate(180deg)' : 'none' }} />
          </button>
          {showTech && (
            <>
              <Divider />
              <TechRow label="ENS" value={split.ens} />
              <TechRow label="Contract" value={split.contract} />
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

const WeightBar = ({ label, pct, color }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <span style={{ fontWeight: 700, color }}>{pct}%</span>
    </div>
    <div style={{ height: 8, background: '#F0EBE0', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color }} />
    </div>
  </div>
);

const TechRow = ({ label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px' }}>
    <div style={{ width: 80, fontSize: 11, color: T.color.textSecondary, fontWeight: 600 }}>{label}</div>
    <div style={{ flex: 1, fontSize: 12, fontFamily: 'ui-monospace, SF Mono, monospace',
      color: T.color.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.color.textSecondary }}>
      <Icon name="copy" size={16} />
    </button>
  </div>
);

// ─── MEMBERS ─────────────────────────────────────────────────
function MembersScreen({ goto, ws, openWsMenu }) {
  const [q, setQ] = useState('');
  const filtered = D.members.filter(m => !q || m.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ paddingBottom: 24 }}>
      <AppHeader ws={ws} openWsMenu={openWsMenu} />
      <div style={{ padding: '4px 20px 16px' }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>メンバー</div>
        <div style={{ fontSize: 13, color: T.color.textSecondary, marginTop: 2 }}>{D.members.length}人が参加中</div>
      </div>
      <div style={{ padding: '0 16px 12px' }}>
        <Input icon="search" placeholder="ユーザー名 or ウォレットアドレス" value={q} onChange={setQ} />
      </div>
      <div style={{ padding: '0 16px' }}>
        <Card padding={0}>
          {filtered.map((m, i) => (
            <div key={m.id} style={{display:"contents"}}>
              <Row
                left={<Avatar name={m.name} size={40} />}
                title={m.name}
                subtitle={m.addr}
                right={<Badge kind={m.role}>{m.role === 'lead' ? '当番リード' : m.role === 'supporter' ? 'サポーター' : 'Member'}</Badge>}
                onClick={() => goto({ name: 'member-detail', memberId: m.id })}
              />
              {i < filtered.length - 1 && <Divider inset={68} />}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── MEMBER DETAIL ───────────────────────────────────────────
function MemberDetailScreen({ goto, memberId }) {
  const m = memberById(memberId);
  const dutiesOf = D.duties.filter(d => d.assignee === memberId || d.supporters.includes(memberId));
  return (
    <div style={{ paddingBottom: 24 }}>
      <ScreenHeader title="メンバー" onBack={() => goto({ name: 'members' })} />
      <div style={{ padding: '8px 24px 24px', textAlign: 'center' }}>
        <Avatar name={m.name} size={84} />
        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 12 }}>{m.name}</div>
        <div style={{ fontSize: 12, color: T.color.textSecondary, fontFamily: 'ui-monospace, monospace', marginTop: 4 }}>{m.addr}</div>
        <div style={{ marginTop: 10 }}>
          <Badge kind={m.role}>{m.role === 'lead' ? '当番リード' : m.role === 'supporter' ? 'サポーター' : 'Member'}</Badge>
        </div>
      </div>
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <StatCard label="今週の貢献" value={m.contribs} unit="件" />
          <StatCard label="受け取った" value={m.received} unit="THX" accent={T.color.contrib} />
        </div>
      </div>

      <SectionLabel>関わっている当番</SectionLabel>
      <div style={{ padding: '0 16px 16px' }}>
        <Card padding={0}>
          {dutiesOf.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: T.color.textSecondary, fontSize: 13 }}>
              関わっている当番はまだありません
            </div>
          ) : dutiesOf.map((d, i) => (
            <div key={d.id} style={{display:"contents"}}>
              <Row
                left={<div style={{ width: 36, height: 36, borderRadius: T.radius.sm, background: '#F2EAD9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="duty" size={18} color="#7A5A2E" />
                </div>}
                title={d.name}
                subtitle={d.assignee === memberId ? '担当者' : 'サポーター'}
                right={<Icon name="chevron-right" size={16} color={T.color.textSecondary} />}
                onClick={() => goto({ name: 'duty-detail', dutyId: d.id })}
              />
              {i < dutiesOf.length - 1 && <Divider inset={64} />}
            </div>
          ))}
        </Card>
      </div>

      <div style={{ padding: '8px 16px' }}>
        <Button variant="primary" full icon="send" onClick={() => goto({ name: 'thanks-recipient', preselect: memberId })}>サンクスを送る</Button>
      </div>
    </div>
  );
}

const StatCard = ({ label, value, unit, accent }) => (
  <Card padding={14} style={{ flex: 1, textAlign: 'center' }}>
    <div style={{ fontSize: 11, color: T.color.textSecondary, fontWeight: 600 }}>{label}</div>
    <div style={{ marginTop: 4, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
      <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, color: accent || T.color.textPrimary }}>{value}</span>
      <span style={{ fontSize: 12, color: T.color.textSecondary, fontWeight: 700 }}>{unit}</span>
    </div>
  </Card>
);

// ─── WALLET ─────────────────────────────────────────────────
function WalletScreen({ goto, ws, openWsMenu }) {
  return (
    <div style={{ paddingBottom: 24 }}>
      <AppHeader ws={ws} openWsMenu={openWsMenu} />
      <div style={{ padding: '4px 20px 12px' }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>ウォレット</div>
      </div>
      <div style={{ padding: '4px 16px 16px' }}>
        <Card padding={20} style={{ background: T.color.textPrimary, border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={D.user.name} size={52} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{D.user.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'ui-monospace, monospace', marginTop: 2 }}>{D.user.address}</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <button style={{ ...iconBtn, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}>
                <Icon name="qr" size={18} color="#fff" />
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>送れる</div>
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: T.color.primary, letterSpacing: -0.5 }}>120</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>THX</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>受け取った</div>
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: T.color.contrib, letterSpacing: -0.5 }}>80</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>THX</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <SectionLabel>所属ワークスペース</SectionLabel>
      <div style={{ padding: '0 16px 16px' }}>
        <Card padding={0}>
          {D.workspaces.map((w, i) => (
            <div key={w.id} style={{display:"contents"}}>
              <Row
                left={<div style={{ width: 36, height: 36, borderRadius: T.radius.full, background: w.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>{w.icon}</div>}
                title={w.name}
                subtitle={`${w.members}人`}
                right={w.id === ws.id ? <Badge kind="member">現在</Badge> : <Icon name="chevron-right" size={16} color={T.color.textSecondary} />}
              />
              {i < D.workspaces.length - 1 && <Divider inset={64} />}
            </div>
          ))}
        </Card>
      </div>

      <div style={{ padding: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button variant="secondary" full icon="edit">プロフィール編集</Button>
        <Button variant="ghost" full icon="logout" style={{ color: T.color.danger }}>ウォレット接続を解除</Button>
      </div>
    </div>
  );
}

// ─── SEND THANKS FLOW ────────────────────────────────────────
function ThanksFlow({ initial, onClose, onSent }) {
  // initial: { preselect?: memberId }
  const [step, setStep] = useState(initial?.preselect ? 'compose' : 'recipient');
  const [recipient, setRecipient] = useState(initial?.preselect ? memberById(initial.preselect) : null);
  const [amount, setAmount] = useState(50);
  const [msg, setMsg] = useState('');
  const [q, setQ] = useState('');

  const sendable = 120;
  const filtered = D.members.filter(m => !q || m.name.toLowerCase().includes(q.toLowerCase()));
  const presets = [25, 50, 100, sendable];

  if (step === 'recipient') {
    return (
      <div>
        <ScreenHeader title="サンクスを送る" onBack={onClose} subtitle={`送れるサンクス: ${sendable} THX`} />
        <div style={{ padding: '4px 16px 12px' }}>
          <Input icon="search" placeholder="ユーザー名 or ウォレットアドレス" value={q} onChange={setQ} />
        </div>
        <div style={{ padding: '0 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 12, color: T.color.textSecondary, fontWeight: 700, letterSpacing: 0.4 }}>最近関わった人</div>
          <button style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 4,
            color: T.color.textSecondary, fontSize: 12, fontWeight: 600, fontFamily: T.font, cursor: 'pointer' }}>
            <Icon name="qr" size={14} /> QR
          </button>
        </div>
        <div style={{ padding: '0 16px 16px', display: 'flex', gap: 10, overflowX: 'auto' }}>
          {['homma', 'ryu', 'shinya', 'sg', 'eri'].map(name => (
            <button key={name} onClick={() => { setRecipient(memberById(name)); setStep('compose'); }}
              style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 6, cursor: 'pointer', minWidth: 56 }}>
              <Avatar name={name} size={48} />
              <span style={{ fontSize: 11, fontWeight: 600, color: T.color.textPrimary }}>{name}</span>
            </button>
          ))}
        </div>
        <SectionLabel>メンバー一覧</SectionLabel>
        <div style={{ padding: '0 16px' }}>
          <Card padding={0}>
            {filtered.map((m, i) => (
              <div key={m.id} style={{display:"contents"}}>
                <Row
                  left={<Avatar name={m.name} size={36} />}
                  title={m.name}
                  subtitle={m.addr}
                  right={<Icon name="chevron-right" size={16} color={T.color.textSecondary} />}
                  onClick={() => { setRecipient(m); setStep('compose'); }}
                />
                {i < filtered.length - 1 && <Divider inset={64} />}
              </div>
            ))}
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'compose') {
    const valid = amount > 0 && amount <= sendable;
    return (
      <div>
        <ScreenHeader title={`${recipient.name} にサンクスを送る`} onBack={() => setStep('recipient')} subtitle={`送れるサンクス: ${sendable} THX`} />
        <div style={{ padding: '8px 20px 0' }}>
          <FieldLabel>送る量</FieldLabel>
          <Card padding={20} style={{ textAlign: 'center', background: T.color.primarySoft, border: `1px solid ${T.color.primary}55` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <button onClick={() => setAmount(Math.max(0, amount - 5))} style={amountBtn}><Icon name="chevron-left" size={20} /></button>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 56, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1, color: T.color.textPrimary }}>{amount}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#7A5A2E' }}>THX</span>
              </div>
              <button onClick={() => setAmount(Math.min(sendable, amount + 5))} style={amountBtn}><Icon name="chevron-right" size={20} /></button>
            </div>
          </Card>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            {presets.map(p => (
              <button key={p} onClick={() => setAmount(p)} style={{
                flex: 1, height: 36, borderRadius: T.radius.full, fontFamily: T.font,
                background: amount === p ? T.color.textPrimary : T.color.surface,
                color: amount === p ? '#fff' : T.color.textPrimary,
                border: `1px solid ${amount === p ? T.color.textPrimary : T.color.border}`,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>{p === sendable ? 'すべて' : p}</button>
            ))}
          </div>
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          <FieldLabel>メッセージ</FieldLabel>
          <Input multiline rows={3} placeholder="ありがとうを入力" value={msg} onChange={setMsg} />
          <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['手伝ってくれてありがとう！', '準備してくれて助かりました', '今日の対応ありがとう'].map(s => (
              <button key={s} onClick={() => setMsg(s)} style={{
                fontSize: 12, padding: '6px 10px', borderRadius: T.radius.full,
                background: T.color.surface, border: `1px solid ${T.color.border}`,
                cursor: 'pointer', fontFamily: T.font, color: T.color.textSecondary,
              }}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ padding: 16, marginTop: 16 }}>
          <Button variant="primary" full disabled={!valid} onClick={() => setStep('confirm')}>次へ</Button>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div>
        <ScreenHeader title="送信内容の確認" onBack={() => setStep('compose')} />
        <div style={{ padding: '8px 16px 16px' }}>
          <Card padding={20} style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 18 }}>
              <Avatar name={D.user.name} size={48} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 24, height: 1, background: T.color.border }} />
                <Icon name="heart" size={16} color={T.color.primary} />
                <div style={{ width: 24, height: 1, background: T.color.border }} />
              </div>
              <Avatar name={recipient.name} size={48} />
            </div>
            <div style={{ fontSize: 13, color: T.color.textSecondary }}>{D.user.name} → {recipient.name}</div>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
              <span style={{ fontSize: 48, fontWeight: 800, letterSpacing: -1, color: T.color.textPrimary }}>{amount}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#7A5A2E' }}>THX</span>
            </div>
            {msg && <div style={{ marginTop: 14, padding: 14, background: T.color.bg, borderRadius: T.radius.sm,
              fontSize: 13, color: T.color.textPrimary, lineHeight: 1.5 }}>{msg}</div>}
          </Card>
        </div>
        <div style={{ padding: '0 16px', display: 'flex', gap: 10 }}>
          <Button variant="secondary" onClick={() => setStep('compose')}>戻って修正</Button>
          <Button variant="primary" full onClick={() => { setStep('sending'); setTimeout(() => setStep('done'), 900); }}>送信する</Button>
        </div>
      </div>
    );
  }

  if (step === 'sending') {
    return (
      <div style={{ padding: '120px 24px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: T.radius.full, background: T.color.primarySoft,
          margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'tobanPulse 1.2s ease infinite' }}>
          <Icon name="send" size={28} color={T.color.primary} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 700 }}>サンクスを送信しています…</div>
      </div>
    );
  }

  // done
  return (
    <div style={{ padding: '40px 24px 24px', textAlign: 'center' }}>
      <div style={{ width: 88, height: 88, borderRadius: T.radius.full, background: T.color.contrib,
        margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 0 12px ${T.color.contrib}22` }}>
        <Icon name="check" size={42} color="#fff" stroke={2.5} />
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>サンクスを送りました</div>
      <div style={{ fontSize: 13, color: T.color.textSecondary, marginBottom: 24, lineHeight: 1.5 }}>
        <strong style={{ color: T.color.textPrimary }}>{recipient.name}</strong> に <strong style={{ color: T.color.textPrimary }}>{amount} THX</strong> を送りました。<br/>あなたのありがとうが記録されました。
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button variant="primary" full onClick={() => { onSent?.({ to: recipient.name, amount, msg }); onClose(); }}>ホームへ戻る</Button>
        <Button variant="ghost" full onClick={() => { setRecipient(null); setAmount(50); setMsg(''); setStep('recipient'); }}>もう一人に送る</Button>
      </div>
    </div>
  );
}

const amountBtn = {
  width: 36, height: 36, borderRadius: T.radius.full,
  background: T.color.surface, border: 'none',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: T.color.textPrimary,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

// ─── SPLIT CREATE ─────────────────────────────────────────────
function SplitCreateScreen({ goto }) {
  const [step, setStep] = useState('form');
  const [name, setName] = useState('kuu village day 8');
  const [duty, setDuty] = useState(75);
  const [recv, setRecv] = useState(30);
  const [selectedDuties, setSelectedDuties] = useState(new Set(['dishes', 'breakfast', 'food']));

  const previewShares = useMemo(() => {
    const base = D.splits[0].shares.map((s, i) => ({ ...s, pct: s.pct * (0.9 + (i * 0.03)) }));
    const sum = base.reduce((a, b) => a + b.pct, 0);
    return base.map(s => ({ ...s, pct: (s.pct / sum) * 100 }));
  }, [duty, recv, selectedDuties]);

  if (step === 'done') {
    return (
      <div style={{ padding: '40px 24px 24px', textAlign: 'center' }}>
        <div style={{ width: 88, height: 88, borderRadius: T.radius.full, background: T.color.split,
          margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="pie" size={40} color="#fff" />
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>分配ルールを作成しました</div>
        <div style={{ fontSize: 13, color: T.color.textSecondary, marginBottom: 28 }}>
          <strong style={{ color: T.color.textPrimary }}>{name}</strong> が作成されました。
        </div>
        <Button variant="primary" full onClick={() => goto({ name: 'splits' })}>分配一覧へ戻る</Button>
      </div>
    );
  }

  if (step === 'preview') {
    return (
      <div style={{ paddingBottom: 24 }}>
        <ScreenHeader title="分配プレビュー" subtitle="この設定での分配結果" onBack={() => setStep('form')} />
        <div style={{ padding: '8px 16px 0' }}>
          <Card padding={20} style={{ textAlign: 'center', background: '#F0F6FB', borderColor: '#5DADEC44' }}>
            <DonutChart shares={previewShares} size={140} total={previewShares.length} />
            <div style={{ marginTop: 8, fontSize: 12, color: T.color.textSecondary }}>{name}</div>
          </Card>
        </div>
        <SectionLabel>分配の内訳</SectionLabel>
        <div style={{ padding: '0 16px 16px' }}>
          <Card padding={0}>
            {previewShares.map((s, i) => (
              <div key={s.name} style={{display:"contents"}}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                  <Avatar name={s.name} size={32} />
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{s.pct.toFixed(2)}%</div>
                </div>
                {i < previewShares.length - 1 && <Divider inset={16} />}
              </div>
            ))}
          </Card>
        </div>
        <div style={{ padding: '0 16px 16px' }}>
          <Card padding={14} style={{ background: T.color.primarySoft, borderColor: T.color.primary + '55' }}>
            <div style={{ fontSize: 12, color: '#7A5A2E', fontWeight: 700, marginBottom: 6 }}>分配のもとになった要素</div>
            <div style={{ fontSize: 12, color: T.color.textPrimary, lineHeight: 1.6 }}>
              ・ 当番への参加（{duty}%）<br/>
              ・ サンクスの受け取り・送付（{100 - duty}%）
            </div>
          </Card>
        </div>
        <div style={{ padding: '0 16px', display: 'flex', gap: 10 }}>
          <Button variant="secondary" onClick={() => setStep('form')}>戻って修正</Button>
          <Button variant="primary" full onClick={() => setStep('done')}>作成する</Button>
        </div>
      </div>
    );
  }

  const valid = name.trim() && selectedDuties.size > 0;
  return (
    <div style={{ paddingBottom: 24 }}>
      <ScreenHeader title="分配ルールを作成" onBack={() => goto({ name: 'splits' })} />
      <div style={{ padding: '4px 20px 0' }}>
        <FieldLabel>分配ルール名</FieldLabel>
        <Input value={name} onChange={setName} />
      </div>
      <div style={{ padding: '20px 20px 0' }}>
        <FieldLabel>何を重視する？</FieldLabel>
        <Card padding={16}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
            <span style={{ fontWeight: 600 }}>当番ベース</span>
            <span style={{ fontWeight: 700, color: T.color.role }}>{duty}%</span>
          </div>
          <input type="range" min={0} max={100} value={duty} onChange={e => setDuty(+e.target.value)}
            style={{ width: '100%', accentColor: T.color.primary }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 12, marginBottom: 4 }}>
            <span style={{ fontWeight: 600 }}>サンクスベース</span>
            <span style={{ fontWeight: 700, color: T.color.contrib }}>{100 - duty}%</span>
          </div>
        </Card>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <FieldLabel>サンクスの中で何を重視する？</FieldLabel>
        <Card padding={16}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
            <span style={{ fontWeight: 600 }}>受け取った量</span>
            <span style={{ fontWeight: 700, color: T.color.contrib }}>{recv}%</span>
          </div>
          <input type="range" min={0} max={100} value={recv} onChange={e => setRecv(+e.target.value)}
            style={{ width: '100%', accentColor: T.color.contrib }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 12 }}>
            <span style={{ fontWeight: 600 }}>送った量</span>
            <span style={{ fontWeight: 700, color: T.color.primary }}>{100 - recv}%</span>
          </div>
        </Card>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <FieldLabel>対象にする当番</FieldLabel>
        <Card padding={0}>
          {D.duties.map((d, i) => {
            const checked = selectedDuties.has(d.id);
            return (
              <div key={d.id} style={{display:"contents"}}>
                <button onClick={() => {
                  const next = new Set(selectedDuties);
                  next.has(d.id) ? next.delete(d.id) : next.add(d.id);
                  setSelectedDuties(next);
                }} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', background: 'none', border: 'none',
                  cursor: 'pointer', fontFamily: T.font, textAlign: 'left',
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: checked ? T.color.primary : T.color.surface,
                    border: `1.5px solid ${checked ? T.color.primary : T.color.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
                  }}>{checked && <Icon name="check" size={14} color="#fff" stroke={2.5} />}</div>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{d.name}</span>
                </button>
                {i < D.duties.length - 1 && <Divider inset={50} />}
              </div>
            );
          })}
        </Card>
      </div>

      <div style={{ padding: 16, marginTop: 16 }}>
        <Button variant="primary" full disabled={!valid} icon="pie" onClick={() => setStep('preview')}>プレビューを見る</Button>
      </div>
    </div>
  );
}

// ─── WORKSPACE LIST ─────────────────────────────────────────
function WorkspaceListScreen({ ws, onPick, onCreate }) {
  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ padding: '14px 20px 8px' }}>
        <div style={{ fontSize: 13, color: T.color.textSecondary }}>こんにちは、{D.user.name} さん</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 2, letterSpacing: -0.4 }}>ワークスペース</div>
      </div>
      <div style={{ padding: '4px 16px 16px' }}>
        <Input icon="search" placeholder="ワークスペースを検索" value="" onChange={() => {}} />
      </div>
      <SectionLabel>参加中</SectionLabel>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {D.workspaces.map(w => (
          <Card key={w.id} onClick={() => onPick(w)} padding={16}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: T.radius.md, background: w.color, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>{w.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{w.name}</div>
                <div style={{ fontSize: 12, color: T.color.textSecondary, marginTop: 3,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.desc}</div>
                <div style={{ fontSize: 11, color: T.color.textSecondary, marginTop: 6 }}>
                  {w.members}人 ・ 最近の活動: {w.lastActive}
                </div>
              </div>
              {ws?.id === w.id && <Badge kind="member">現在</Badge>}
            </div>
          </Card>
        ))}
      </div>
      <div style={{ padding: 16, marginTop: 8 }}>
        <Button variant="secondary" full icon="plus" onClick={onCreate}>新しいワークスペースを作成</Button>
      </div>
    </div>
  );
}

// expose
Object.assign(window, {
  HomeScreen, DutiesScreen, DutyDetailScreen, AssignDutyScreen,
  SplitsScreen, SplitDetailScreen, SplitCreateScreen,
  MembersScreen, MemberDetailScreen, WalletScreen,
  ThanksFlow, WorkspaceListScreen,
});
