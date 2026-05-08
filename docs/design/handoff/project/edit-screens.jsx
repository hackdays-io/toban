// Toban — duty + workspace create/edit screens

// ─── DUTY CREATE / EDIT ─────────────────────────────────────
function DutyEditScreen({ goto, dutyId, onSaved }) {
  const editing = !!dutyId;
  const existing = editing ? D.duties.find(d => d.id === dutyId) : null;
  const [name, setName] = useState(existing?.name || '');
  const [tasks, setTasks] = useState(existing?.desc?.length ? existing.desc : ['']);
  const [accent, setAccent] = useState(existing?.accent || '#D6B995');
  const [frequency, setFrequency] = useState('weekly');
  const [icon, setIcon] = useState('duty');
  const [needSupporter, setNeedSupporter] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const accentOptions = [
    { c: '#D6B995', label: 'Beige' },
    { c: '#65C98A', label: 'Green' },
    { c: '#F5B82E', label: 'Yellow' },
    { c: '#5DADEC', label: 'Blue' },
    { c: '#E48F4F', label: 'Orange' },
    { c: '#B696E0', label: 'Purple' },
  ];
  const iconOptions = ['duty', 'sparkle', 'heart', 'shield', 'pie', 'user'];

  const updateTask = (i, v) => {
    const next = [...tasks]; next[i] = v; setTasks(next);
  };
  const addTask = () => setTasks([...tasks, '']);
  const removeTask = (i) => setTasks(tasks.filter((_, idx) => idx !== i));

  const valid = name.trim() && tasks.some(t => t.trim());

  const back = () => editing ? goto({ name: 'duty-detail', dutyId }) : goto({ name: 'duties' });

  return (
    <div style={{ paddingBottom: 32 }}>
      <ScreenHeader
        title={editing ? '当番を編集' : '当番を作成'}
        onBack={back}
        right={editing ? (
          <button onClick={() => setConfirmOpen(true)} style={{ ...iconBtn, color: T.color.danger, border: 'none', background: 'transparent' }}>
            <Icon name="close" size={20} color={T.color.danger} />
          </button>
        ) : null}
      />

      {/* live preview card */}
      <div style={{ padding: '8px 16px 12px' }}>
        <Card padding={16} style={{ background: T.color.primarySoft, borderColor: T.color.primary + '55' }}>
          <div style={{ fontSize: 11, color: '#7A5A2E', fontWeight: 700, marginBottom: 10, letterSpacing: 0.4 }}>プレビュー</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: T.radius.md,
              background: accent + '33', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={icon} size={24} color="#7A5A2E" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.color.textPrimary,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {name || '当番名を入力'}
              </div>
              <div style={{ fontSize: 12, color: T.color.textSecondary, marginTop: 2 }}>
                {tasks.filter(t => t.trim()).length}件のタスク ・ {frequency === 'daily' ? '毎日' : frequency === 'weekly' ? '毎週' : 'スポット'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ padding: '8px 20px 0' }}>
        <FieldLabel>当番名 <span style={{ color: T.color.danger }}>*</span></FieldLabel>
        <Input value={name} onChange={setName} placeholder="例：食器を洗おう" />
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <FieldLabel>アイコン</FieldLabel>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {iconOptions.map(ic => {
            const active = icon === ic;
            return (
              <button key={ic} onClick={() => setIcon(ic)} style={{
                width: 48, height: 48, borderRadius: T.radius.sm,
                background: active ? accent + '33' : T.color.surface,
                border: `1.5px solid ${active ? accent : T.color.border}`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={ic} size={22} color={active ? '#7A5A2E' : T.color.textSecondary} />
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <FieldLabel>カラー</FieldLabel>
        <div style={{ display: 'flex', gap: 10 }}>
          {accentOptions.map(o => {
            const active = accent === o.c;
            return (
              <button key={o.c} onClick={() => setAccent(o.c)} style={{
                width: 36, height: 36, borderRadius: T.radius.full,
                background: o.c, border: `3px solid ${active ? '#fff' : 'transparent'}`,
                boxShadow: active ? `0 0 0 2px ${o.c}` : 'none',
                cursor: 'pointer',
              }} aria-label={o.label} />
            );
          })}
        </div>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <FieldLabel>タスク（説明）<span style={{ color: T.color.danger }}>*</span></FieldLabel>
        <Card padding={0}>
          {tasks.map((t, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 8px 4px 12px',
              borderBottom: i < tasks.length - 1 ? `1px solid ${T.color.border}` : 'none',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: 999, background: accent, flex: 'none' }} />
              <input value={t} onChange={e => updateTask(i, e.target.value)} placeholder="タスクを入力"
                style={{ flex: 1, border: 'none', outline: 'none', fontFamily: T.font, fontSize: 14, padding: '12px 0', background: 'transparent', color: T.color.textPrimary }} />
              {tasks.length > 1 && (
                <button onClick={() => removeTask(i)} style={{
                  width: 32, height: 32, borderRadius: 999, background: 'transparent',
                  border: 'none', cursor: 'pointer', color: T.color.textSecondary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><Icon name="close" size={16} /></button>
              )}
            </div>
          ))}
        </Card>
        <button onClick={addTask} style={{
          marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: T.radius.full,
          background: 'transparent', border: `1px dashed ${T.color.border}`,
          color: T.color.textSecondary, fontSize: 12, fontWeight: 600,
          cursor: 'pointer', fontFamily: T.font,
        }}><Icon name="plus" size={14} />タスクを追加</button>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <FieldLabel>頻度</FieldLabel>
        <Segmented value={frequency} onChange={setFrequency} options={[
          { value: 'daily', label: '毎日' },
          { value: 'weekly', label: '毎週' },
          { value: 'spot', label: 'スポット' },
        ]} />
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <Card padding={0}>
          <ToggleRow label="サポーターを募集" sub="担当者以外も関わることができます"
            value={needSupporter} onChange={setNeedSupporter} />
        </Card>
      </div>

      <div style={{ padding: '24px 16px 0', display: 'flex', gap: 10 }}>
        <Button variant="secondary" onClick={back}>キャンセル</Button>
        <Button variant="primary" full disabled={!valid} icon={editing ? 'check' : 'plus'}
          onClick={() => { onSaved?.({ name, editing }); back(); }}>
          {editing ? '保存' : '作成する'}
        </Button>
      </div>

      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)} title="当番を削除しますか？">
        <div style={{ padding: '0 20px 8px', fontSize: 13, color: T.color.textSecondary, lineHeight: 1.6 }}>
          この当番を削除すると、関連する履歴は残りますが新しい担当の追加はできなくなります。
        </div>
        <div style={{ padding: '20px 16px 0', display: 'flex', gap: 10 }}>
          <Button variant="secondary" full onClick={() => setConfirmOpen(false)}>キャンセル</Button>
          <Button variant="dark" full style={{ background: T.color.danger }}
            onClick={() => { setConfirmOpen(false); onSaved?.({ deleted: true }); goto({ name: 'duties' }); }}>削除する</Button>
        </div>
      </Sheet>
    </div>
  );
}

const ToggleRow = ({ label, sub, value, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: T.color.textSecondary, marginTop: 2 }}>{sub}</div>}
    </div>
    <button onClick={() => onChange(!value)} style={{
      width: 48, height: 28, borderRadius: 999,
      background: value ? T.color.primary : '#E0DACC',
      border: 'none', cursor: 'pointer', position: 'relative',
      transition: 'background .15s',
    }}>
      <span style={{
        position: 'absolute', top: 2, left: value ? 22 : 2,
        width: 24, height: 24, borderRadius: 999, background: '#fff',
        transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </button>
  </div>
);

// ─── WORKSPACE CREATE FLOW ──────────────────────────────────
function WorkspaceCreateScreen({ goto, onCreated }) {
  const [step, setStep] = useState('basic'); // basic | initial | confirm | done
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [icon, setIcon] = useState('🌿');
  const [color, setColor] = useState('#65C98A');
  const [openness, setOpenness] = useState('invite');
  const [unitName, setUnitName] = useState('サンクス');
  const [unitSym, setUnitSym] = useState('THX');
  const [defaultRole, setDefaultRole] = useState('Member');
  const [enableSplit, setEnableSplit] = useState(true);
  const [enableDuty, setEnableDuty] = useState(true);

  const iconChoices = ['🌿', '🇯🇵', '✦', '🏠', '🌊', '🔥', '🌸', '⚡', '🛠'];
  const colorChoices = ['#65C98A', '#5DADEC', '#F5B82E', '#D6B995', '#E48F4F', '#B696E0', '#E48ABF', '#7AC2D9'];

  const stepIdx = { basic: 0, initial: 1, confirm: 2, done: 3 }[step];

  const StepBar = () => (
    <div style={{ display: 'flex', gap: 6, padding: '0 20px 12px' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          flex: 1, height: 4, borderRadius: 2,
          background: i <= stepIdx ? T.color.primary : T.color.border,
          transition: 'background .2s',
        }} />
      ))}
    </div>
  );

  if (step === 'done') {
    return (
      <div style={{ padding: '40px 24px 24px', textAlign: 'center' }}>
        <div style={{ width: 96, height: 96, borderRadius: T.radius.full, background: color,
          margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 44, color: '#fff', fontWeight: 700,
          boxShadow: `0 0 0 12px ${color}22` }}>{icon}</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>ワークスペースを作成しました</div>
        <div style={{ fontSize: 13, color: T.color.textSecondary, marginBottom: 28, lineHeight: 1.6 }}>
          <strong style={{ color: T.color.textPrimary }}>{name}</strong> をはじめましょう。
        </div>
        <Card padding={16} style={{ textAlign: 'left', marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: T.color.textSecondary, fontWeight: 700, marginBottom: 10, letterSpacing: 0.3 }}>次にできること</div>
          <NextStep icon="invite" label="メンバーを招待する" />
          <Divider />
          <NextStep icon="duty" label="当番を作成する" />
          <Divider />
          <NextStep icon="send" label="サンクスを送る" />
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button variant="primary" full icon="invite" onClick={() => { onCreated?.({ name, icon, color, desc }); goto({ name: 'home' }); }}>メンバーを招待</Button>
          <Button variant="ghost" full onClick={() => { onCreated?.({ name, icon, color, desc }); goto({ name: 'home' }); }}>ホームへ</Button>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div style={{ paddingBottom: 24 }}>
        <ScreenHeader title="作成内容を確認" subtitle="3 / 3" onBack={() => setStep('initial')} />
        <StepBar />
        <div style={{ padding: '0 16px 8px' }}>
          <Card padding={20} style={{ textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: T.radius.lg, background: color,
              margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, color: '#fff' }}>{icon}</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{name}</div>
            {desc && <div style={{ fontSize: 12, color: T.color.textSecondary, marginTop: 4, lineHeight: 1.5 }}>{desc}</div>}
          </Card>
        </div>
        <div style={{ padding: '12px 16px' }}>
          <Card padding={0}>
            <SummaryRow label="公開設定" value={openness === 'invite' ? '招待制' : 'リンク参加可'} />
            <Divider />
            <SummaryRow label="サンクス単位" value={`${unitName}（${unitSym}）`} />
            <Divider />
            <SummaryRow label="初期ロール" value={defaultRole} />
            <Divider />
            <SummaryRow label="有効な機能" value={
              <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
                <Badge kind="member">サンクス</Badge>
                {enableDuty && <Badge kind="role">当番</Badge>}
                {enableSplit && <Badge kind="info">分配</Badge>}
              </span>
            } />
          </Card>
        </div>
        <div style={{ padding: '16px 16px 0', display: 'flex', gap: 10 }}>
          <Button variant="secondary" onClick={() => setStep('initial')}>戻って修正</Button>
          <Button variant="primary" full icon="check" onClick={() => setStep('done')}>作成する</Button>
        </div>
      </div>
    );
  }

  if (step === 'initial') {
    return (
      <div style={{ paddingBottom: 24 }}>
        <ScreenHeader title="初期設定" subtitle="2 / 3" onBack={() => setStep('basic')} />
        <StepBar />
        <div style={{ padding: '0 20px 8px', fontSize: 13, color: T.color.textSecondary, lineHeight: 1.5 }}>
          あとから変更できます。
        </div>

        <div style={{ padding: '12px 20px 0' }}>
          <FieldLabel>サンクスの表示名と単位</FieldLabel>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 2 }}>
              <Input value={unitName} onChange={setUnitName} placeholder="サンクス" />
            </div>
            <div style={{ flex: 1 }}>
              <Input value={unitSym} onChange={setUnitSym} placeholder="THX" />
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          <FieldLabel>メンバーの初期ロール</FieldLabel>
          <Segmented value={defaultRole} onChange={setDefaultRole} options={[
            { value: 'Member', label: 'Member' },
            { value: 'Guest', label: 'Guest' },
          ]} />
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          <FieldLabel>機能</FieldLabel>
          <Card padding={0}>
            <ToggleRow label="当番" sub="役割と担当を見える化" value={enableDuty} onChange={setEnableDuty} />
            <Divider />
            <ToggleRow label="分配" sub="貢献記録から報酬を分ける" value={enableSplit} onChange={setEnableSplit} />
          </Card>
        </div>

        <div style={{ padding: '24px 16px 0', display: 'flex', gap: 10 }}>
          <Button variant="ghost" onClick={() => setStep('confirm')}>スキップ</Button>
          <Button variant="primary" full onClick={() => setStep('confirm')}>確認へ</Button>
        </div>
      </div>
    );
  }

  // basic
  const valid = name.trim().length > 0;
  return (
    <div style={{ paddingBottom: 24 }}>
      <ScreenHeader title="ワークスペースを作成" subtitle="1 / 3" onBack={() => goto({ name: 'home' })} />
      <StepBar />

      <div style={{ padding: '0 20px 0' }}>
        <FieldLabel>アイコン & カラー</FieldLabel>
        <Card padding={16}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: T.radius.md, background: color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#fff' }}>{icon}</div>
            <div style={{ flex: 1, fontSize: 12, color: T.color.textSecondary, lineHeight: 1.5 }}>
              プレビューはここに表示されます。アイコンとカラーは下から選択できます。
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {iconChoices.map(ic => (
              <button key={ic} onClick={() => setIcon(ic)} style={{
                width: 36, height: 36, borderRadius: T.radius.sm,
                background: icon === ic ? T.color.primarySoft : T.color.bg,
                border: `1.5px solid ${icon === ic ? T.color.primary : T.color.border}`,
                cursor: 'pointer', fontSize: 18, fontFamily: T.font,
              }}>{ic}</button>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {colorChoices.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{
                width: 28, height: 28, borderRadius: T.radius.full,
                background: c, border: `3px solid ${color === c ? '#fff' : 'transparent'}`,
                boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
                cursor: 'pointer',
              }} />
            ))}
          </div>
        </Card>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <FieldLabel>ワークスペース名 <span style={{ color: T.color.danger }}>*</span></FieldLabel>
        <Input value={name} onChange={setName} placeholder="例：kuu village #1" />
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <FieldLabel>説明</FieldLabel>
        <Input value={desc} onChange={setDesc} multiline rows={3} placeholder="どんなコミュニティかを入力" />
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <FieldLabel>公開設定</FieldLabel>
        <Segmented value={openness} onChange={setOpenness} options={[
          { value: 'invite', label: '招待制' },
          { value: 'link', label: 'リンク参加可' },
        ]} />
        <div style={{ fontSize: 11, color: T.color.textSecondary, marginTop: 6, lineHeight: 1.4 }}>
          {openness === 'invite' ? '招待されたメンバーのみ参加できます。' : '招待リンクを知っている人なら誰でも参加できます。'}
        </div>
      </div>

      <div style={{ padding: '24px 16px 0' }}>
        <Button variant="primary" full disabled={!valid} onClick={() => setStep('initial')}>次へ</Button>
      </div>
    </div>
  );
}

const NextStep = ({ icon, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
    <div style={{ width: 32, height: 32, borderRadius: T.radius.full, background: T.color.primarySoft,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
      <Icon name={icon} size={16} color="#7A5A2E" />
    </div>
    <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{label}</span>
    <Icon name="chevron-right" size={16} color={T.color.textSecondary} />
  </div>
);

// ─── WORKSPACE EDIT ─────────────────────────────────────────
function WorkspaceEditScreen({ goto, ws, onSaved }) {
  const [name, setName] = useState(ws.name);
  const [desc, setDesc] = useState(ws.desc);
  const [icon, setIcon] = useState(ws.icon);
  const [color, setColor] = useState(ws.color);
  const [openness, setOpenness] = useState('invite');
  const [unitName, setUnitName] = useState('サンクス');
  const [unitSym, setUnitSym] = useState('THX');
  const [enableSplit, setEnableSplit] = useState(true);
  const [enableDuty, setEnableDuty] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const iconChoices = ['🌿', '🇯🇵', '✦', '🏠', '🌊', '🔥', '🌸', '⚡', '🛠'];
  const colorChoices = ['#65C98A', '#5DADEC', '#F5B82E', '#D6B995', '#E48F4F', '#B696E0', '#E48ABF', '#7AC2D9'];

  return (
    <div style={{ paddingBottom: 32 }}>
      <ScreenHeader title="ワークスペース設定" onBack={() => goto({ name: 'home' })} />

      <div style={{ padding: '8px 16px 12px' }}>
        <Card padding={20} style={{ textAlign: 'center', background: T.color.primarySoft, borderColor: T.color.primary + '55' }}>
          <div style={{ width: 72, height: 72, borderRadius: T.radius.lg, background: color,
            margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, color: '#fff' }}>{icon}</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{name || '（名称未設定）'}</div>
          <div style={{ fontSize: 11, color: '#7A5A2E', fontWeight: 600, marginTop: 4 }}>プレビュー</div>
        </Card>
      </div>

      <SectionLabel>基本情報</SectionLabel>
      <div style={{ padding: '0 20px' }}>
        <Card padding={16}>
          <FieldLabel>アイコン</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {iconChoices.map(ic => (
              <button key={ic} onClick={() => setIcon(ic)} style={{
                width: 36, height: 36, borderRadius: T.radius.sm,
                background: icon === ic ? T.color.primarySoft : T.color.bg,
                border: `1.5px solid ${icon === ic ? T.color.primary : T.color.border}`,
                cursor: 'pointer', fontSize: 18, fontFamily: T.font,
              }}>{ic}</button>
            ))}
          </div>
          <FieldLabel>カラー</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {colorChoices.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{
                width: 28, height: 28, borderRadius: T.radius.full,
                background: c, border: `3px solid ${color === c ? '#fff' : 'transparent'}`,
                boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
                cursor: 'pointer',
              }} />
            ))}
          </div>
        </Card>
      </div>

      <div style={{ padding: '16px 20px 0' }}>
        <FieldLabel>ワークスペース名</FieldLabel>
        <Input value={name} onChange={setName} />
      </div>

      <div style={{ padding: '16px 20px 0' }}>
        <FieldLabel>説明</FieldLabel>
        <Input value={desc} onChange={setDesc} multiline rows={3} />
      </div>

      <SectionLabel>参加設定</SectionLabel>
      <div style={{ padding: '0 20px 0' }}>
        <Segmented value={openness} onChange={setOpenness} options={[
          { value: 'invite', label: '招待制' },
          { value: 'link', label: 'リンク参加可' },
        ]} />
      </div>

      <SectionLabel>機能</SectionLabel>
      <div style={{ padding: '0 16px' }}>
        <Card padding={0}>
          <ToggleRow label="当番" sub="役割と担当を見える化" value={enableDuty} onChange={setEnableDuty} />
          <Divider />
          <ToggleRow label="分配" sub="貢献記録から報酬を分ける" value={enableSplit} onChange={setEnableSplit} />
        </Card>
      </div>

      <SectionLabel>表示設定</SectionLabel>
      <div style={{ padding: '0 20px 0' }}>
        <Card padding={16}>
          <FieldLabel>サンクスの表示名 / 単位</FieldLabel>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 2 }}><Input value={unitName} onChange={setUnitName} /></div>
            <div style={{ flex: 1 }}><Input value={unitSym} onChange={setUnitSym} /></div>
          </div>
        </Card>
      </div>

      <SectionLabel>その他</SectionLabel>
      <div style={{ padding: '0 16px 16px' }}>
        <Card padding={0}>
          <Row left={<div style={{ width: 36, height: 36, borderRadius: 999, background: '#F0EBE0',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="invite" size={18} /></div>}
            title="メンバーを招待" subtitle="招待リンクを共有"
            right={<Icon name="chevron-right" size={16} color={T.color.textSecondary} />}
            onClick={() => onSaved?.({ kind: 'invite' })} />
          <Divider inset={64} />
          <Row left={<div style={{ width: 36, height: 36, borderRadius: 999, background: '#F0EBE0',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="copy" size={18} /></div>}
            title="ワークスペースID をコピー"
            subtitle="ws_kuu_001"
            right={<Icon name="chevron-right" size={16} color={T.color.textSecondary} />}
            onClick={() => onSaved?.({ kind: 'copy' })} />
        </Card>
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        <Card padding={0}>
          <Row left={<div style={{ width: 36, height: 36, borderRadius: 999, background: '#FBE5E2',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="logout" size={18} color={T.color.danger} /></div>}
            title={<span style={{ color: T.color.danger }}>ワークスペースをアーカイブ</span>}
            subtitle="閲覧専用にする"
            onClick={() => setArchiveOpen(true)} />
        </Card>
      </div>

      <div style={{ padding: '8px 16px 0', display: 'flex', gap: 10 }}>
        <Button variant="secondary" onClick={() => goto({ name: 'home' })}>キャンセル</Button>
        <Button variant="primary" full icon="check" onClick={() => setConfirmOpen(true)}>保存</Button>
      </div>

      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)} title="設定を変更しますか？">
        <div style={{ padding: '0 20px 8px', fontSize: 13, color: T.color.textSecondary, lineHeight: 1.6 }}>
          この変更は、ワークスペース内のメンバーに影響します。
        </div>
        <div style={{ padding: '20px 16px 0', display: 'flex', gap: 10 }}>
          <Button variant="secondary" full onClick={() => setConfirmOpen(false)}>キャンセル</Button>
          <Button variant="primary" full onClick={() => { setConfirmOpen(false); onSaved?.({ name, icon, color, desc }); goto({ name: 'home' }); }}>変更する</Button>
        </div>
      </Sheet>

      <Sheet open={archiveOpen} onClose={() => setArchiveOpen(false)} title="アーカイブしますか？">
        <div style={{ padding: '0 20px 8px', fontSize: 13, color: T.color.textSecondary, lineHeight: 1.6 }}>
          アーカイブ後はメンバーが閲覧のみ可能になります。あとで戻すこともできます。
        </div>
        <div style={{ padding: '20px 16px 0', display: 'flex', gap: 10 }}>
          <Button variant="secondary" full onClick={() => setArchiveOpen(false)}>キャンセル</Button>
          <Button variant="dark" full style={{ background: T.color.danger }}
            onClick={() => { setArchiveOpen(false); onSaved?.({ archived: true }); goto({ name: 'home' }); }}>アーカイブ</Button>
        </div>
      </Sheet>
    </div>
  );
}

Object.assign(window, {
  DutyEditScreen, WorkspaceCreateScreen, WorkspaceEditScreen, ToggleRow,
});
