import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { HydratedRouter } from "react-router/dom";
import { i18n, initI18n } from "./i18n";

// Privy's smart-wallet transport (and other web3 plumbing) `JSON.stringify`s
// typed-data messages before posting to its iframe; bigint fields throw
// without this opt-in. viem types EIP-712 `uint256` as bigint, so we cannot
// avoid bigint at the call site. Toising bigints as decimal strings matches
// how every JSON-RPC bridge serialises them.
// biome-ignore lint/suspicious/noExplicitAny: prototype patch
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

initI18n();

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <I18nextProvider i18n={i18n}>
        <HydratedRouter />
      </I18nextProvider>
    </StrictMode>,
  );
});
