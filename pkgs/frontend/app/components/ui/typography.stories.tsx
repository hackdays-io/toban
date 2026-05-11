import type { Story } from "@ladle/react";
import { Typography } from "./typography";

export default {
  title: "UI / Typography",
};

export const Variants: Story = () => (
  <div className="flex flex-col gap-4">
    <Typography variant="display">
      display — LP の強調パラグラフ。流動サイズ。
    </Typography>
    <Typography variant="lead">
      lead — ランディングやページのイントロ本文。少し大きめのボディ。
    </Typography>
    <Typography variant="body">
      body — 通常本文。標準的なボディサイズ（15px）。
    </Typography>
    <Typography variant="bodySm" tone="secondary">
      bodySm — カード説明や補足本文。
    </Typography>
    <Typography variant="caption" tone="secondary">
      caption — 1 行キャプション・メタ情報
    </Typography>
    <Typography variant="micro" tone="secondary">
      micro — 最小ラベル
    </Typography>
    <Typography variant="label" as="span">
      label
    </Typography>
    <Typography variant="mono" tone="secondary">
      0x1234…abcd
    </Typography>
  </div>
);

export const Tones: Story = () => (
  <div className="flex flex-col gap-2">
    <Typography tone="primary">primary トーン</Typography>
    <Typography tone="secondary">secondary トーン</Typography>
    <Typography tone="danger">danger トーン</Typography>
    <Typography tone="success">success トーン</Typography>
  </div>
);

export const Weights: Story = () => (
  <div className="flex flex-col gap-2">
    <Typography weight="regular">regular ウェイト</Typography>
    <Typography weight="medium">medium ウェイト</Typography>
    <Typography weight="semibold">semibold ウェイト</Typography>
    <Typography weight="bold">bold ウェイト</Typography>
  </div>
);

export const Truncate: Story = () => (
  <div className="max-w-[200px]">
    <Typography truncate>
      長いテキストは省略される — 0x1234567890abcdef1234567890abcdef12345678
    </Typography>
  </div>
);
