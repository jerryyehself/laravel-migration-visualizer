// DOM presentation only: never changes the selected schema or migration.
export function restoreSourceFocus(origin: HTMLElement | null): boolean {
  if (!origin?.isConnected) return false;
  for (let parent = origin.parentElement; parent; parent = parent.parentElement) {
    if (parent instanceof HTMLDetailsElement) parent.open = true;
  }
  if (origin.getClientRects().length === 0) return false;
  origin.scrollIntoView({ block: 'center' });
  origin.focus({ preventScroll: true });
  return origin.ownerDocument.activeElement === origin;
}
