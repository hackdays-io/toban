import {
  type DependencyList,
  type RefObject,
  useEffect,
  useRef,
} from "react";

/** Stable empty deps for mount-only scroll reset. */
const MOUNT_ONLY: DependencyList = [];

/**
 * Scroll the nearest scrollable ancestor of `fromEl` (and `window`) to the top.
 *
 * AppShell renders routes inside `<main className="overflow-y-auto">`, so
 * `window.scrollTo` alone does not reset the visible scroll position.
 */
export function scrollAncestorToTop(fromEl: HTMLElement | null): void {
  if (!fromEl) return;
  let node: HTMLElement | null = fromEl;
  while (node) {
    if (node.scrollHeight > node.clientHeight) {
      node.scrollTo({ top: 0, behavior: "auto" });
      break;
    }
    node = node.parentElement;
  }
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "auto" });
  }
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
  useEffect(() => {
    scrollAncestorToTop(rootRef.current);
  }, deps ?? MOUNT_ONLY);
  return rootRef;
}
