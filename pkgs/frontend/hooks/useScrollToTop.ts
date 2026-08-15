import {
  type DependencyList,
  type RefObject,
  useLayoutEffect,
  useRef,
} from "react";

/** Stable empty deps for mount-only scroll reset. */
const MOUNT_ONLY: DependencyList = [];

const isVerticalScrollContainer = (el: HTMLElement): boolean => {
  const { overflowY } = getComputedStyle(el);
  return (
    overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay"
  );
};

/**
 * Scroll overflow ancestors of `fromEl` (and `window`) to the top.
 *
 * AppShell renders routes inside `<main className="overflow-y-auto">`, so
 * `window.scrollTo` alone does not reset the visible scroll position.
 *
 * We reset every `overflow-y: auto|scroll` ancestor — not only the first
 * whose `scrollHeight > clientHeight`. After a wizard step shrinks the page,
 * the container may no longer overflow while `scrollTop` is still clamped
 * partway down, which leaves the next step visibly scrolled.
 */
export function scrollAncestorToTop(fromEl: HTMLElement | null): void {
  if (typeof document === "undefined") return;

  const seen = new Set<HTMLElement>();

  let node: HTMLElement | null = fromEl;
  while (node) {
    if (isVerticalScrollContainer(node)) {
      seen.add(node);
      node.scrollTop = 0;
    }
    node = node.parentElement;
  }

  // AppShell `<main>` — belt-and-suspenders when the walk misses it.
  const appShellMain = document.querySelector<HTMLElement>(
    '[data-slot="app-shell"] main',
  );
  if (appShellMain && !seen.has(appShellMain)) {
    appShellMain.scrollTop = 0;
  }

  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

/** Reset scrollTop on a single element when it is a vertical scroll container. */
export function scrollElementToTop(el: HTMLElement | null): void {
  if (!el) return;
  if (isVerticalScrollContainer(el)) {
    el.scrollTop = 0;
  }
}

const runScrollReset = (fromEl: HTMLElement | null): (() => void) => {
  scrollAncestorToTop(fromEl);
  const frame = requestAnimationFrame(() => {
    scrollAncestorToTop(fromEl);
  });
  return () => cancelAnimationFrame(frame);
};

/**
 * Reset AppShell `<main>` (and window) scroll whenever the pathname changes.
 * Mount this once in `AppShellLayout` so every in-shell route navigation
 * lands at the top without per-route boilerplate.
 *
 * Wizard step changes within the same route are out of scope — those pages
 * should still call `useScrollToTop([step])`.
 */
export function useAppShellScrollReset(pathname: string): void {
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname drives route-change scroll reset
  useLayoutEffect(() => {
    return runScrollReset(null);
  }, [pathname]);
}

/**
 * Fire-and-forget scroll reset when `deps` change — no ref attachment needed.
 */
export function useScrollReset(deps: DependencyList): void {
  useLayoutEffect(() => {
    return runScrollReset(null);
  }, deps);
}

/**
 * Reset a detail pane's own scroll container when `key` changes. Pair with
 * `overflow-auto` on the pane — used by desktop master-detail layouts.
 */
export function useDetailScrollReset(
  key: unknown,
): RefObject<HTMLElement> {
  const ref = useRef<HTMLElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: key drives detail-pane scroll reset
  useLayoutEffect(() => {
    scrollElementToTop(ref.current);
    const frame = requestAnimationFrame(() => {
      scrollElementToTop(ref.current);
    });
    return () => cancelAnimationFrame(frame);
  }, [key]);
  return ref;
}

/**
 * Attach the returned ref to a page root and reset scroll when appropriate.
 *
 * - `useScrollToTop()` — reset on mount (e.g. navigating into a new route).
 * - `useScrollToTop([step])` — reset whenever a wizard step changes.
 */
export function useScrollToTop(
  deps?: DependencyList,
): RefObject<HTMLDivElement> {
  const rootRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    return runScrollReset(rootRef.current);
  }, deps ?? MOUNT_ONLY);
  return rootRef;
}
