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
  // biome-ignore lint/correctness/useExhaustiveDependencies: caller-supplied deps control when scroll resets
  useLayoutEffect(() => {
    scrollAncestorToTop(rootRef.current);
    // Step swaps can change layout after the first pass (shorter/longer panels).
    const frame = requestAnimationFrame(() => {
      scrollAncestorToTop(rootRef.current);
    });
    return () => cancelAnimationFrame(frame);
  }, deps ?? MOUNT_ONLY);
  return rootRef;
}
