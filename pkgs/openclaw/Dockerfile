# OpenClaw 公式イメージ（ghcr.io/openclaw/openclaw / Docker Hub の openclaw/openclaw と同一）。
# latest / main / extended-stable といった moving tag は使わない — デプロイのたびに
# 中身が変わるとロールバック先が特定できなくなる。
#
# 2026.9.1 = 本家リリース v2026.9.1（2026-09-03）。
# 上げるときは https://github.com/openclaw/openclaw/releases を見てから、
# このタグだけを差し替えて再デプロイする。
FROM ghcr.io/openclaw/openclaw:2026.9.1

# エージェントへの指示書はイメージに焼き込む。設定（/data/openclaw.json）と違って
# リポジトリが唯一の出所で、デプロイのたびに丸ごと入れ替わってほしいため。
# 参照するパスは config/openclaw.template.json の agent.instructions と揃えること。
COPY instructions/ /opt/toban/instructions/
