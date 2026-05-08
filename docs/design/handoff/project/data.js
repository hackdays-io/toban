// Toban data
window.TOBAN_DATA = {
  user: {
    id: 'me', name: 'ryoma', address: '0x1234...abcd',
    sendable: 120, received: 80,
  },
  workspaces: [
    { id: 'kuu', name: 'kuu village #1', desc: 'オフグリッドポップアップビレッジの貢献を記録する場', members: 24, lastActive: '2時間前', icon: '🌿', color: '#65C98A' },
    { id: 'cfj', name: 'Code for Japan', desc: 'シビックテックコミュニティ', members: 128, lastActive: '昨日', icon: '🇯🇵', color: '#5DADEC' },
    { id: 'sen', name: 'Senspace', desc: 'デザインスタジオ', members: 8, lastActive: '3日前', icon: '✦', color: '#D6B995' },
  ],
  members: [
    { id: 'ryu', name: 'ryu', addr: '0x7a5b...F4BF', role: 'lead', received: 80, contribs: 3 },
    { id: 'homma', name: 'homma', addr: '0x4e3c...a821', role: 'lead', received: 145, contribs: 7 },
    { id: 'shinya', name: 'shinya', addr: '0x91fa...2b04', role: 'member', received: 60, contribs: 2 },
    { id: 'sg', name: 'sg', addr: '0x2eb1...c9d3', role: 'supporter', received: 42, contribs: 4 },
    { id: 'eri', name: 'eri', addr: '0x88aa...6712', role: 'member', received: 55, contribs: 3 },
    { id: 'shingoohki', name: 'shingoohki', addr: '0x5cdd...0afe', role: 'member', received: 30, contribs: 1 },
    { id: 'atsu', name: 'atsu', addr: '0x77b9...4422', role: 'member', received: 92, contribs: 5 },
    { id: 'yumaito', name: 'yumaito', addr: '0xa12c...8809', role: 'member', received: 70, contribs: 4 },
    { id: 'takerun', name: 'takerun', addr: '0xfbe2...12dd', role: 'member', received: 50, contribs: 2 },
    { id: 'koichi', name: 'koichi', addr: '0xe411...77a3', role: 'supporter', received: 48, contribs: 3 },
  ],
  duties: [
    { id: 'dishes', name: '食器を洗おう', desc: ['食器を洗う', '食器を拭く', '食器を棚に戻す'], assignee: 'ryu', supporters: ['sg', 'eri', '中田柚葉'], next: '6/08', status: '担当中', accent: '#D6B995' },
    { id: 'breakfast', name: '美味しい朝食を作る', desc: ['食材を準備', '料理する', '配膳'], assignee: 'atsu', supporters: ['homma'], next: '6/09', status: '担当中', accent: '#65C98A' },
    { id: 'onoono', name: 'ONOONOを美しく保とう', desc: ['ゴミ拾い', '掃除', '整頓'], assignee: 'koichi', supporters: ['ryu'], next: '6/10', status: '担当中', accent: '#D6B995' },
    { id: 'food', name: '食材準備', desc: ['買い出し', '仕分け', '保管'], assignee: null, supporters: [], next: null, status: '空き', accent: '#D6B995' },
  ],
  splits: [
    { id: 'd7', name: 'kuu village day 7', count: 7, updated: '2025/10/07', dutyWeight: 82, thanksWeight: 18, thanksRecv: 25, thanksSent: 75, ens: 'kuuvillageday7.split.toban.eth', contract: '0xD8EF...5B18e',
      shares: [
        { name: 'atsu', pct: 22.4 }, { name: 'ryoma', pct: 18.1 },
        { name: 'yumaito', pct: 16.4 }, { name: 'takerun', pct: 13.8 },
        { name: 'koichi', pct: 12.1 }, { name: 'ryu', pct: 9.4 },
        { name: 'eri', pct: 7.8 },
      ] },
    { id: 'd5', name: 'kuu village day 5', count: 9, updated: '2025/10/05', dutyWeight: 70, thanksWeight: 30, thanksRecv: 40, thanksSent: 60, ens: 'kuuvillageday5.split.toban.eth', contract: '0xA221...90fe',
      shares: [
        { name: 'homma', pct: 18.5 }, { name: 'atsu', pct: 16.2 },
        { name: 'ryoma', pct: 14.8 }, { name: 'sg', pct: 12.1 },
        { name: 'eri', pct: 10.4 }, { name: 'ryu', pct: 9.3 },
        { name: 'shinya', pct: 8.0 }, { name: 'koichi', pct: 6.2 },
        { name: 'yumaito', pct: 4.5 },
      ] },
  ],
  activity: [
    { id: 'a1', kind: 'thanks-recv', from: 'homma', to: 'me', amount: 100, msg: 'EXPOにお誘いいただきありがとうございます！', time: '2時間前' },
    { id: 'a2', kind: 'thanks-recv', from: 'shinya', to: 'me', amount: 20, msg: 'Tobanの仕様確認ありがとう！', time: '5時間前' },
    { id: 'a3', kind: 'duty-assigned', who: 'ryu', duty: '食器を洗おう', time: '昨日' },
    { id: 'a4', kind: 'split-created', name: 'kuu village day 7', count: 7, time: '昨日' },
    { id: 'a5', kind: 'thanks-sent', from: 'me', to: 'sg', amount: 30, msg: '準備してくれて助かりました', time: '2日前' },
  ],
};
