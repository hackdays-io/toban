// Toban app shell
const { useState: us, useEffect: ue, Fragment: F } = React;
const C = window.TOBAN.color;
const D2 = window.TOBAN_DATA;

function App() {
  const [ws, setWs] = us(D2.workspaces[0]);
  const [route, setRoute] = us({ name: 'home' });
  const [tab, setTab] = us('home');
  const [thanksOpen, setThanksOpen] = us(null); // null | { preselect }
  const [wsMenuOpen, setWsMenuOpen] = us(false);
  const [wsListOpen, setWsListOpen] = us(false);
  const [toast, setToast] = us(null);

  ue(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const goto = (r) => {
    if (r.name === 'thanks-recipient') { setThanksOpen({ preselect: r.preselect }); return; }
    setRoute(r);
    if (['home', 'duties', 'splits', 'members', 'wallet'].includes(r.name)) setTab(r.name);
  };

  const onTab = (t) => {
    setTab(t); setRoute({ name: t });
  };

  const showSent = ({ to, amount }) => setToast(`${to} に ${amount} THX を送りました`);

  let screen;
  switch (route.name) {
    case 'home': screen = <HomeScreen goto={goto} openThanks={() => setThanksOpen({})} ws={ws} openWsMenu={() => setWsMenuOpen(true)} />; break;
    case 'duties': screen = <DutiesScreen goto={goto} ws={ws} openWsMenu={() => setWsMenuOpen(true)} />; break;
    case 'duty-detail': screen = <DutyDetailScreen goto={goto} dutyId={route.dutyId} />; break;
    case 'assign-duty': screen = <AssignDutyScreen goto={goto} dutyId={route.dutyId} onAssigned={({ member }) => setToast(`${member} を担当に追加しました`)} />; break;
    case 'duty-edit': screen = <DutyEditScreen goto={goto} dutyId={route.dutyId} onSaved={(r) => setToast(r?.deleted ? '当番を削除しました' : r?.editing ? '当番を保存しました' : '当番を作成しました')} />; break;
    case 'workspace-create': screen = <WorkspaceCreateScreen goto={goto} onCreated={(w) => setToast(`${w.name} を作成しました`)} />; break;
    case 'workspace-edit': screen = <WorkspaceEditScreen goto={goto} ws={ws} onSaved={(r) => { if (r?.kind === 'invite') setToast('招待リンクをコピーしました'); else if (r?.kind === 'copy') setToast('IDをコピーしました'); else if (r?.archived) setToast('アーカイブしました'); else setToast('設定を保存しました'); }} />; break;
    case 'splits': screen = <SplitsScreen goto={goto} ws={ws} openWsMenu={() => setWsMenuOpen(true)} />; break;
    case 'split-detail': screen = <SplitDetailScreen goto={goto} splitId={route.splitId} />; break;
    case 'split-create': screen = <SplitCreateScreen goto={goto} />; break;
    case 'members': screen = <MembersScreen goto={goto} ws={ws} openWsMenu={() => setWsMenuOpen(true)} />; break;
    case 'member-detail': screen = <MemberDetailScreen goto={goto} memberId={route.memberId} />; break;
    case 'wallet': screen = <WalletScreen goto={goto} ws={ws} openWsMenu={() => setWsMenuOpen(true)} />; break;
    case 'thanks-insights': screen = <ThanksInsightsScreen goto={goto} />; break;
    case 'quest-create': screen = <QuestCreateScreen goto={goto} dutyId={route.dutyId} onCreated={(r) => setToast(`クエスト「${r.title}」を作成しました`)} />; break;
    case 'quest-detail': screen = <QuestDetailScreen goto={goto} questId={route.questId} onAction={({ kind, q }) => setToast(kind === 'apply' ? `「${q.title}」に申請しました` : kind === 'request' ? '完了申請を送りました' : kind === 'cancel' ? 'クエストをキャンセルしました' : '')} />; break;
    case 'quest-approve': screen = <QuestApproveScreen goto={goto} questId={route.questId} onApproved={({ q }) => setToast(`${q.applicant} のクエストを承認しました`)} />; break;
    default: screen = <div style={{ padding: 40 }}>Unknown</div>;
  }

  const showBottomNav = ['home', 'duties', 'splits', 'members', 'wallet'].includes(route.name);

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: C.bg, fontFamily: window.TOBAN.font, color: C.textPrimary,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {screen}
      </div>
      {showBottomNav && <BottomNav active={tab} onChange={onTab} />}

      <Sheet open={!!thanksOpen} onClose={() => setThanksOpen(null)}>
        <ThanksFlow initial={thanksOpen} onClose={() => setThanksOpen(null)} onSent={showSent} />
      </Sheet>

      <Sheet open={wsMenuOpen} onClose={() => setWsMenuOpen(false)} title={ws.name}>
        <div style={{ padding: '4px 16px 0' }}>
          <Card padding={0}>
            <Row left={<div style={{ width: 36, height: 36, borderRadius: 999, background: '#F0EBE0',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="members" size={18} /></div>}
              title="ワークスペースを切り替え" subtitle={`${D2.workspaces.length}件`}
              right={<Icon name="chevron-right" size={16} color={C.textSecondary} />}
              onClick={() => { setWsMenuOpen(false); setWsListOpen(true); }} />
            <Divider inset={64} />
            <Row left={<div style={{ width: 36, height: 36, borderRadius: 999, background: '#F0EBE0',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="invite" size={18} /></div>}
              title="メンバーを招待" subtitle="リンクをコピーして共有"
              right={<Icon name="chevron-right" size={16} color={C.textSecondary} />}
              onClick={() => { setWsMenuOpen(false); setToast('招待リンクをコピーしました'); }} />
            <Divider inset={64} />
            <Row left={<div style={{ width: 36, height: 36, borderRadius: 999, background: '#F0EBE0',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="gear" size={18} /></div>}
              title="ワークスペース設定" subtitle="名前・参加・機能設定"
              right={<Icon name="chevron-right" size={16} color={C.textSecondary} />}
              onClick={() => { setWsMenuOpen(false); goto({ name: 'workspace-edit' }); }} />
          </Card>
        </div>
        <div style={{ padding: 16 }}>
          <Button variant="ghost" full onClick={() => setWsMenuOpen(false)}>閉じる</Button>
        </div>
      </Sheet>

      <Sheet open={wsListOpen} onClose={() => setWsListOpen(false)}>
        <WorkspaceListScreen ws={ws} onPick={(w) => { setWs(w); setWsListOpen(false); setRoute({ name: 'home' }); setTab('home'); setToast(`${w.name} に切り替えました`); }} onCreate={() => { setWsListOpen(false); goto({ name: 'workspace-create' }); }} />
      </Sheet>

      <Toast show={!!toast}>{toast}</Toast>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />);
