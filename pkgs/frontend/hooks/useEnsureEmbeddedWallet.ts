import { useCreateWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useRef } from "react";

/**
 * Creates the embedded wallet that Privy's `createOnLogin` never gets around
 * to creating for us.
 *
 * `config.embeddedWallets.ethereum.createOnLogin` only fires for logins that
 * go through Privy's own modal. Our login screen drives the headless hooks
 * instead (`useLoginWithEmail`, `useLoginWithOAuth` — see `login.tsx`), and
 * Privy's docs are explicit about the gap: automatic wallet creation "only
 * applies to login via the Privy modal and not from whitelabel login methods.
 * It does not trigger wallet creation for users who authenticate through
 * direct login methods like loginWithCode, useLoginWithOAuth, or similar
 * custom flows."
 * https://docs.privy.io/basics/react/advanced/automatic-wallet-creation
 *
 * So since we moved the login card off the modal, a brand-new account finishes
 * authentication owning no wallet at all. Every address the app cares about is
 * the smart wallet's, and that needs the embedded EOA as its signer, so
 * `useActiveWallet` never resolves and the user sits on /login forever.
 * Existing accounts are unaffected — they already have a wallet — which is why
 * this only ever showed up for new sign-ups.
 *
 * Recovery is Privy-managed here (the app's
 * `require_user_owned_recovery_on_create` is false), so `createWallet` shows
 * no UI of its own.
 */
export const useEnsureEmbeddedWallet = () => {
  const { authenticated, user } = usePrivy();
  const { ready: walletsReady } = useWallets();
  const { createWallet } = useCreateWallet();

  // Mirror `createOnLogin: "users-without-wallets"`: only step in when the
  // account has no Ethereum wallet at all, so a user who signed in with an
  // external wallet doesn't get a surprise embedded one. This is the same
  // check Privy makes internally before auto-creating.
  const hasEthereumWallet = !!user?.linkedAccounts.some(
    (account) => account.type === "wallet" && account.chainType === "ethereum",
  );

  // `createWallet` throws if a wallet already exists, and hammering Privy's
  // API on failure is worse than surfacing the stall, so attempt once per
  // session. Held in a ref alongside the callback so the effect can depend on
  // plain booleans — `usePrivy().user` gets a fresh identity on most renders,
  // and depending on it would re-run this on every render.
  const attemptedRef = useRef(false);
  const createWalletRef = useRef(createWallet);
  createWalletRef.current = createWallet;

  useEffect(() => {
    if (!authenticated || !walletsReady || hasEthereumWallet) return;
    if (attemptedRef.current) return;
    attemptedRef.current = true;

    createWalletRef.current().catch((error: unknown) => {
      console.error("Failed to create the embedded wallet", error);
    });
  }, [authenticated, walletsReady, hasEthereumWallet]);
};
