# 用語集
Toban-当番-に登場する専門用語についての解説ページです。
- 241221 初稿（takerun）
## 
- ユーザー名: 新規登録時にtoban.ethのサブドメイン形式で取得できる個人のアカウント名
- Workspace(s): Toban運用中のプロジェクト名、及びプロジェクト名一覧のこと
- Role: 報酬分配受取の権利となる「役割」。プロジェクトオーナーがRoleを新規作成、メンバーへの付与（Assign）が可能。役割の「概要」「責務」を定義して入力する。Roleを付与されたメンバーは、他人へ「AssistCredit」の送付が可能。
- Split(s): 実行する報酬分配の内訳、及び報酬分配実行履歴一覧のこと。実行するSplit毎に、Roleに対して分配率を設定する(Create Splitter)。Splitsページでは付与されたRoleに基づいて算出された分配率がユーザー毎に可視化される。
- AssistCredit: 自分の持つRoleの範疇でお手伝いしてもらった場合に、自身のRoleを分割する形式で他人に譲渡するトークン。Role同様に報酬分配受取の権利となる。Roleを持ったメンバーはユーザー名またはウォレットアドレスを指定して、決められた割合のAssistCreditを送付できる。
- Splitter: 実行する報酬分配の内訳（「分配率」）を"個人の保有するAssistCredit"に基づいて算出する機能。
  - "あるRoleのAssistCredit保有量"に基づいた分配率の計算式は、SQRT(Roleに従事した期間) * Role固有の倍率 * AssistCredit保有率
  - Roleに従事した期間[sec] : Roleを剥奪された時刻(または現在時刻) - Roleを付与された時刻
  　- 従事した期間が断続的に存在する場合は、それらを加算する。
  - Role固有の倍率: コミュニティにおける合意形成のもと、他のRoleとの兼ね合いで決定する値
  - AssistCredit保有率: 該当Roleの保有AssistCredit量/該当Roleの発行済AssistCredit総量
    - Roleを直接持たずAssistCreditのみ持っているメンバーの場合はAssistCreditをもらったメンバーの従事期間が適用される（暫定）
