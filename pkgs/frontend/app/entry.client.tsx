import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { HydratedRouter } from "react-router/dom";
import { i18n, initI18n } from "./i18n";

// NOTE: the previous global `BigInt.prototype.toJSON` patch lived here.
// It was removed in favour of `app/lib/bigint-json.ts:withBigIntJSON`,
// which scopes the patch to a single signing call. See that file for
// the rationale and the (#15) review context.

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
