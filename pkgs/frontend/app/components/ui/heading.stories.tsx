import type { Story } from "@ladle/react";
import { Heading } from "./heading";

export default {
  title: "UI / Heading",
};

export const Variants: Story = () => (
  <div className="flex flex-col gap-6">
    <Heading variant="display" level={1}>
      display — あたたかい当番帳
    </Heading>
    <Heading variant="hero" level={1}>
      hero — 認証画面ヒーロー
    </Heading>
    <Heading variant="h1" level={2}>
      h1 — LP セクション見出し
    </Heading>
    <Heading variant="h2">h2 — ページタイトル</Heading>
    <Heading variant="h3">h3 — 大きめカード見出し</Heading>
    <Heading variant="h4">h4 — 中カード見出し</Heading>
    <Heading variant="h5">h5 — ScreenHeader タイトル</Heading>
    <Heading variant="h6">h6 — 行 / EmptyState タイトル</Heading>
    <Heading variant="eyebrow">eyebrow — あなたの当番</Heading>
  </div>
);

export const Tones: Story = () => (
  <div className="flex flex-col gap-3">
    <Heading variant="h3" tone="primary">
      Primary トーン
    </Heading>
    <Heading variant="h3" tone="secondary">
      Secondary トーン
    </Heading>
    <Heading variant="h3" tone="danger">
      Danger トーン
    </Heading>
  </div>
);

export const SemanticOverride: Story = () => (
  <div className="flex flex-col gap-3">
    <Heading variant="display" level={1}>
      level=1 / variant=display
    </Heading>
    <Heading variant="h6" level={2}>
      level=2 / variant=h6（カード内タイトル）
    </Heading>
  </div>
);
