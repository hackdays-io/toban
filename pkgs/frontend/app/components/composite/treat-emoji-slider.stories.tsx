import { useState } from "react";

import { TreatEmojiSlider } from "./treat-emoji-slider";

export const Default = () => {
  const [value, setValue] = useState(50);
  return (
    <div className="max-w-[420px] p-6">
      <TreatEmojiSlider
        value={value}
        onChange={setValue}
        max={500}
        sendable={300}
        step={5}
      />
    </div>
  );
};

/** Initial value 0 — shows the slider hint caption. */
export const ZeroInitial = () => {
  const [value, setValue] = useState(0);
  return (
    <div className="max-w-[420px] p-6">
      <TreatEmojiSlider
        value={value}
        onChange={setValue}
        max={500}
        sendable={300}
        step={5}
      />
    </div>
  );
};

export const SmallRange = () => {
  const [value, setValue] = useState(10);
  return (
    <div className="max-w-[420px] p-6">
      <TreatEmojiSlider
        value={value}
        onChange={setValue}
        max={100}
        sendable={120}
        step={1}
      />
    </div>
  );
};

/** Sendable cap under 5 — use ±1 buttons or tap the amount for 1-step input. */
export const LowSendableCap = () => {
  const [value, setValue] = useState(2);
  return (
    <div className="max-w-[420px] p-6">
      <TreatEmojiSlider
        value={value}
        onChange={setValue}
        max={100}
        sendable={3}
        step={1}
      />
    </div>
  );
};

export const OverSendable = () => {
  const [value, setValue] = useState(450);
  return (
    <div className="max-w-[420px] p-6">
      <TreatEmojiSlider
        value={value}
        onChange={setValue}
        max={500}
        sendable={300}
        step={5}
      />
    </div>
  );
};
