# Toban V3 スマートコントラクト セキュリティ監査レポート

**監査対象:** `/Users/harukikondo/git/toban/pkgs/contract/contracts/`
**Solidity バージョン:** `^0.8.24`
**監査日:** 2026-05-10

---

## Vuln 1 (HIGH): Backdated Timestamp — `HatsTimeFrameModule.sol:63–71`

* **Severity:** High
* **Category:** Input Validation / Timestamp Manipulation
* **Confidence:** 9/10
* **Description:** `mintHat()` は任意の `time` パラメータを受け取り、`_setWoreTime()` を通じてそのまま `woreTime[hatId][wearer]` に書き込む。`block.timestamp` との上限チェックが存在しない。`0` の場合のみ
`block.timestamp` に置き換えられるが、過去の任意の Unix タイムスタンプ（例: `1`）は検証なしに格納される。
* **Exploit Scenario:** `minterHatId` 保有者が `mintHat(hatId, attacker, 1)` を呼び出す。`getWearingElapsedTime` は `block.timestamp - 1`（現在まで約56年）を返し、`SplitsCreator._getHatsTimeFrameMultiplier` の
`sqrt(elapsed)` を極大化する。これにより正当な貢献者からの Split 報酬配分を攻撃者が不正に奪う。
* **Recommendation:** `_setWoreTime` 内で `require(time == 0 || time <= block.timestamp, "Invalid start time")` を追加。

---

## Vuln 2 (HIGH): Backdated Timestamp (Batch) — `HatsTimeFrameModule.sol:79–111`

* **Severity:** High
* **Category:** Input Validation / Timestamp Manipulation
* **Confidence:** 9/10
* **Description:** `batchMintHat()` は `times[]` 配列の各要素を `_setWoreTime()` に直接渡す。事前検証ループ（93–96行）はゼロアドレスと重複チェックのみで、タイムスタンプの上限検証がない。Vuln 1
と同一の攻撃が最大100名分同時に実行可能。
* **Exploit Scenario:** Vuln 1 と同様、一括操作により複数のウォレットに対して過去タイムスタンプを設定し、Split 配分を一度に操作する。
* **Recommendation:** 事前検証ループ内に `require(times[i] == 0 || times[i] <= block.timestamp, "Invalid start time")` を追加。

---

## Vuln 3 (HIGH): Division by Zero — `SplitsCreator.sol:284–285, 295, 363–368`

* **Severity:** High
* **Category:** Integer Arithmetic / Missing Input Validation
* **Confidence:** 9/10
* **Description:** `_calculateRoleAllocations` 内で2つのゼロ除算が発生しうる。
  1. **Line 284–285:** `_splitInfo.multiplierTop / _splitInfo.multiplierBottom` — `multiplierBottom` が `0` の場合、Solidity 0.8.x の panic（DIVIDE_BY_ZERO）でリバート。
  2. **Line 363–368:** `(allocations[l] * PRECISION) / fractionTokenSupply` — `fractionTokenSupply` はウォレット毎の `FRACTION_TOKEN().totalSupply()` を合計するが、`mintInitialSupply`
未実行のウォレットが存在すると `0` になり panic。
* **Exploit Scenario:** `multiplierBottom = 0` の `SplitsInfo` で `create()` を呼び出す → パニックリバート。または初期供給が設定されていないロールを含む Split を作成しようとすると、全参加者の Split
作成が恒久的にブロックされる。
* **Recommendation:** `require(_splitInfo.multiplierBottom > 0, "Zero multiplier denominator")` および `require(fractionTokenSupply > 0, "Zero fraction supply")` を追加。

---

## Vuln 4 (MEDIUM): Unauthorized Token Burn — `HatsFractionTokenModule.sol:217–230`

* **Severity:** Medium
* **Category:** Access Control / Incorrect Authorization
* **Confidence:** 9/10
* **Description:** `burn(hatId, _wearer, _target, amount)` の認可チェック `_checkValidAction` は `_wearer`
がハットを保有しているか、呼び出し元が管理者またはウォレットウォレットウォレットかを検証するが、`_target == _wearer` を強制しない。ERC1155 の `_burn(_target, tokenId, amount)` は `_target`
として任意のアドレスを受け付ける。
* **Exploit Scenario:** ハット管理者（または同ハット保有者）が第三者への転送で増えた `_target` アドレスのトークン残高を、`_wearer` を正当なハット保有者に設定しつつ `_target`
に別アドレスを指定してバーンできる。Split 配分権限の不正剥奪が可能。
* **Recommendation:** `require(_target == _wearer, "Target must be wearer")` を追加するか、管理者専用パスを明示的に分離してイベントを発行する。

---

## Vuln 5 (MEDIUM): Circular Mint Amplification — `ThanksToken.sol:181–234`

* **Severity:** Medium
* **Category:** Economic Manipulation / Logic Error
* **Confidence:** 8/10
* **Description:** `mintableAmount()` の算出式に `balanceOf(owner) / 10`（受け取り済みトークンの10%ボーナス）が含まれる。ThanksToken は標準 ERC20 であり自由に転送可能なため、循環的なミント増幅が可能。
* **Exploit Scenario:**
  1. Alice が Bob に ThanksToken をミント。
  2. Bob が Alice に転送。
  3. Alice の `balanceOf` 増加 → `mintableAmount` が増加（+10%）。
  4. Alice が追加でミント → Bob に返却 → 繰り返し。
  各ループで10%ずつ増幅。収束するが、時間をかけることで正規の時間ベース割り当てを大幅に超えるトークンをミント可能。
* **Recommendation:** `balanceOf(owner) / 10` のボーナスを撤廃するか、受け取りトークン由来のボーナスに上限を設けるか、スナップショットベースのモデルに切り替える。

---

## Vuln 6 (MEDIUM): Contribution History Erasure — `HatsTimeFrameModule.sol:153–167`

* **Severity:** Medium
* **Category:** State Corruption / Logic Error
* **Confidence:** 8/10
* **Description:** `renounce()` は `woreTime`、`totalActiveTime`、`deactivatedTime` をすべてゼロリセットする。`totalActiveTime` は `SplitsCreator._getHatsTimeFrameMultiplier()` の `sqrt(elapsed)`
ウェイト計算の基礎となる。報酬期間終了後・`SplitsCreator.create()` 実行前に `renounce()` を呼び出すことで、自身または他者の Split 配分ウェイトをゼロにできる。
* **Exploit Scenario:** 報酬期間終了直後、管理者権限を持つ悪意あるアクターが競合する貢献者の `renounce()` を呼び出す（`hasAuthority` チェックを通過）。対象の `totalActiveTime` がゼロになり、その貢献者の Split
割り当てが0になる。ウォレット保有者自身も自らの履歴を消去して再ミントにより有利なタイムスタンプで再参加できる。
* **Recommendation:** `renounce()` 実行前に `totalActiveTime` を累積してから（ゼロではなく）確定値として保持する。例: ゼロリセットではなく `deactivate()` と同様のロジックで経過時間を確定させる。

---

## Vuln 7 (LOW): `hardhat/console.sol` in Production — `ThanksToken.sol:10`

* **Severity:** Low
* **Category:** Code Quality / Unintended Deployment Artifact
* **Confidence:** 10/10
* **Description:** `import "hardhat/console.sol"` が本番コントラクトに含まれている。本番ネット（Sepolia、Base）では precompile
がno-opとなるが、デプロイバイトコードサイズを増加させ、デバッグ成果物が本番コードに残存する。
* **Recommendation:** メインネットデプロイ前にインポートを削除する。

---

## 総括

| # | ファイル | 行 | 種別 | 深刻度 | 信頼度 |
|---|---------|---|-----|--------|--------|
| 1 | HatsTimeFrameModule.sol | 63–71 | タイムスタンプ操作 | **HIGH** | 9/10 |
| 2 | HatsTimeFrameModule.sol | 79–111 | タイムスタンプ操作 (Batch) | **HIGH** | 9/10 |
| 3 | SplitsCreator.sol | 284–285, 363–368 | ゼロ除算 | **HIGH** | 9/10 |
| 4 | HatsFractionTokenModule.sol | 217–230 | 不正バーン | **MEDIUM** | 9/10 |
| 5 | ThanksToken.sol | 181–234 | 循環ミント増幅 | **MEDIUM** | 8/10 |
| 6 | HatsTimeFrameModule.sol | 153–167 | 貢献履歴消去 | **MEDIUM** | 8/10 |
| 7 | ThanksToken.sol | 10 | デバッグインポート | **LOW** | 10/10 |

**優先対応:** Vuln 1・2（タイムスタンプ上限チェック追加）と Vuln 3（ゼロ除算ガード追加）は Split 報酬の直接操作につながるため最優先で修正を推奨します。Vuln
4（不正バーン）も配分権限の侵害につながるため早急な対応が必要です。
