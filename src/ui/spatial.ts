import { focus_target } from '../rust/generated/cyberstream';
/**
 * Lightweight spatial navigation for remotes / keyboards (D-pad).
 *  - focusable elements: [data-f]  (buttons, links, inputs, cards)
 *  - rows:   [data-row]   left/right stays inside the row first, rows remember their last focus
 *  - scope:  [data-scope] the last mounted scope traps focus (modals, player overlay)
 *  - long press on OK: elements with [data-lp] receive a `longpress` CustomEvent
 *  - tab rows: [data-row][data-tabs]  entering one focuses its current tab (`.active`), and a tab
 *    reached with left/right is opened by itself after a short pause (no OK needed);
 *    [data-noauto] items (toggles) still need OK
 */
type Dir = 'up' | 'down' | 'left' | 'right';

const KEY_DIR: Record<string, Dir> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
let backHandler: () => boolean = () => false;
let keyInterceptor: ((e: KeyboardEvent) => boolean) | null = null;
let smooth = true;

export function setBackHandler(fn: () => boolean) {
  backHandler = fn;
}
/** player etc. can take over raw keys (return true = handled) */
export function setKeyInterceptor(fn: ((e: KeyboardEvent) => boolean) | null) {
  keyInterceptor = fn;
}
export function setSmoothScroll(v: boolean) {
  smooth = v;
}

function visible(el: HTMLElement): boolean {
  if (el.hasAttribute('disabled') || el.closest('[inert]')) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

export function currentScope(): HTMLElement {
  const scopes = document.querySelectorAll<HTMLElement>('[data-scope]');
  for (let i = scopes.length - 1; i >= 0; i--) if (visible(scopes[i])) return scopes[i];
  return document.body;
}

function focusables(root: Element): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-f]')).filter(visible);
}

/** a film / series page (stack page) keeps the main tabs and the update strip reachable above it */
const OPEN_ABOVE = '.topnav [data-f], .update-banner [data-f]';
const isStackScope = (scope: Element) => scope.classList.contains('stack-page');
function inScope(scope: Element, el: Element): boolean {
  return scope.contains(el) || (isStackScope(scope) && !!el.closest('.topnav, .update-banner'));
}
function scopeItems(scope: Element): HTMLElement[] {
  const list = Array.from(scope.querySelectorAll<HTMLElement>('[data-f]'));
  if (isStackScope(scope)) list.push(...document.querySelectorAll<HTMLElement>(OPEN_ABOVE));
  return list;
}

export function focusEl(el: HTMLElement | null | undefined, scroll = true) {
  if (!el) return;
  el.focus({ preventScroll: true });
  if (!scroll) return;
  // the featured banner sits at the top of its page: show it whole (back up from the rows below)
  if (el.closest('.hero, .detail-hero')) {
    const box = scrollParent(el);
    if (box) return box.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
  }
  el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: smooth ? 'smooth' : 'auto' });
}
function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const o = getComputedStyle(p).overflowY;
    if ((o === 'auto' || o === 'scroll') && p.scrollHeight > p.clientHeight) return p;
  }
  return null;
}

export function focusFirst(root: Element = currentScope()) {
  const auto = root.querySelector<HTMLElement>('[data-autofocus]');
  if (auto && visible(auto)) return focusEl(auto);
  const list = focusables(root);
  if (list.length) focusEl(list[0]);
}

/** current tab of a tab row */
function currentTab(row: Element): HTMLElement | null {
  const el = row.querySelector<HTMLElement>('[data-f].active:not([data-noauto])');
  return el && visible(el) ? el : null;
}

let autoTimer: number | null = null;
/** a tab focused with the remote opens after a short pause (passing over tabs doesn't load each) */
function autoSelect(el: HTMLElement) {
  if (autoTimer) clearTimeout(autoTimer);
  autoTimer = null;
  if (!el.closest('[data-tabs]') || el.hasAttribute('data-noauto') || el.classList.contains('active')) return;
  autoTimer = window.setTimeout(() => {
    autoTimer = null;
    if (document.activeElement === el && el.isConnected) el.click();
  }, 350);
}

function best(from: HTMLElement, cands: HTMLElement[], dir: Dir): HTMLElement | null {
  const a = from.getBoundingClientRect();
  const rects = new Float64Array(cands.length * 4);
  cands.forEach((el, i) => {
    if (el === from || el.hasAttribute('disabled') || el.closest('[inert]')) return;
    const {left,top,right,bottom} = el.getBoundingClientRect();
    rects.set([left,top,right,bottom], i*4);
  });
  const idx = focus_target(new Float64Array([a.left,a.top,a.right,a.bottom]), rects, dir);
  return cands[idx] || null;
}

export function move(dir: Dir): boolean {
  const scope = currentScope();
  const active = document.activeElement as HTMLElement | null;
  if (!active || !inScope(scope, active) || !active.hasAttribute('data-f')) {
    focusFirst(scope);
    return true;
  }
  // Up from any main tab: straight to the update strip's install button (whatever the tab's
  // position). Without a strip, stay put (it used to jump to content scrolled out of view above).
  if (dir === 'up' && active.closest('.topnav')) {
    const strip = Array.from(document.querySelectorAll<HTMLElement>('.update-banner [data-f]')).filter(visible);
    if (strip.length) focusEl(strip.find((e) => e.classList.contains('primary')) || strip[0], false);
    return true;
  }
  // and Down from that strip back to the current tab
  if (dir === 'down' && active.closest('.update-banner')) {
    const tabs = document.querySelector('.topnav [data-tabs]');
    const tab = tabs && currentTab(tabs);
    if (tab) {
      focusEl(tab, false);
      return true;
    }
  }
  const row = active.closest('[data-row]');
  // 1. horizontal moves stay inside the row
  if (row && (dir === 'left' || dir === 'right')) {
    const inRow = Array.from(row.querySelectorAll<HTMLElement>('[data-f]'));
    const t = best(active, inRow, dir);
    if (t) {
      focusEl(t);
      autoSelect(t);
      return true;
    }
    if (row.hasAttribute('data-row-lock')) return true;
  }
  const all = scopeItems(scope);
  const others = row && (dir === 'up' || dir === 'down') ? all.filter((e) => !row.contains(e)) : all;
  // the floating Back button (always shown, top left) is reached from the page's header only:
  // lower down, Up goes to the row above (it used to grab the focus as soon as the page was scrolled)
  const nearBack = !!active.closest('.hero, .detail-hero, .page-header');
  let target = (nearBack ? null : best(active, others.filter((e) => !e.classList.contains('back-btn')), dir)) || best(active, others, dir);
  // a tab row lying between here and the target is never skipped (the closest wins)
  if (target && (dir === 'up' || dir === 'down')) {
    const a = active.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    let gap = Infinity;
    for (const r of scope.querySelectorAll<HTMLElement>('[data-row][data-tabs]')) {
      if (r === row || r.contains(target) || !visible(r)) continue;
      const rr = r.getBoundingClientRect();
      const between = dir === 'up' ? rr.bottom <= a.top + 4 && rr.top >= t.bottom - 4 : rr.top >= a.bottom - 4 && rr.bottom <= t.top + 4;
      const d = dir === 'up' ? a.top - rr.bottom : rr.top - a.bottom;
      const el = between && d < gap ? currentTab(r) || best(active, focusables(r), dir) : null;
      if (el) (gap = d), (target = el);
    }
  }
  // 2. entering a row from above / below: a tab row gives its current tab, a section (rail, button
  //    row) its first item, not the one nearest in the column (the player's bars keep the nearest)
  if (target) {
    const trow = target.closest('[data-row]');
    const cur = trow && trow !== row && trow.hasAttribute('data-tabs') ? currentTab(trow) : null;
    if (cur) target = cur;
    else if (trow && trow !== row && (dir === 'up' || dir === 'down') && !trow.closest('.player, .topnav')) {
      const first = focusables(trow).find((e) => !e.hasAttribute('disabled'));
      if (first) target = first;
    }
  }
  if (target) {
    focusEl(target);
    return true;
  }
  return false;
}

const isTextInput = (el: Element | null) =>
  !!el && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !['checkbox', 'radio', 'range', 'button'].includes((el as HTMLInputElement).type)));

let lpTimer: number | null = null;
let lpFired = false;
let lastLp = 0;
/** fire a longpress once (touch long-press triggers both our timer and `contextmenu`) */
function fireLp(el: HTMLElement) {
  if (Date.now() - lastLp < 800) return;
  lastLp = Date.now();
  lpFired = true;
  el.dispatchEvent(new CustomEvent('longpress', { bubbles: true }));
}

function onKeyDown(e: KeyboardEvent) {
  if (keyInterceptor && keyInterceptor(e)) {
    e.preventDefault();
    return;
  }
  const active = document.activeElement as HTMLElement | null;
  const dir = KEY_DIR[e.key];
  if (dir) {
    if (isTextInput(active) && (dir === 'left' || dir === 'right')) {
      const inp = active as HTMLInputElement;
      const atEdge = dir === 'left' ? inp.selectionStart === 0 : inp.selectionEnd === inp.value.length;
      if (!atEdge) return;
    }
    if (move(dir)) e.preventDefault();
    return;
  }
  if (e.key === 'Enter' && active?.hasAttribute('data-lp')) {
    e.preventDefault();
    if (e.repeat) return;
    lpFired = false;
    lpTimer = window.setTimeout(() => {
      lpTimer = null;
      fireLp(active);
    }, 600);
    return;
  }
  if (e.key === 'Escape' || e.key === 'GoBack' || e.key === 'BrowserBack' || (e.key === 'Backspace' && !isTextInput(active))) {
    if (backHandler()) e.preventDefault();
  }
}

function onKeyUp(e: KeyboardEvent) {
  if (e.key !== 'Enter') return;
  const active = document.activeElement as HTMLElement | null;
  if (!active?.hasAttribute('data-lp')) return;
  if (lpTimer) {
    clearTimeout(lpTimer);
    lpTimer = null;
    if (!lpFired) active.click();
  }
}

/** pointer long-press for touch/mouse */
function onPointerDown(e: PointerEvent) {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-lp]');
  if (!el) return;
  lpFired = false;
  const sx = e.clientX;
  const sy = e.clientY;
  const timer = window.setTimeout(() => {
    fireLp(el);
    navigator.vibrate?.(20);
  }, 550);
  const cancel = (ev: PointerEvent) => {
    if (ev.type === 'pointermove' && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 10) return;
    clearTimeout(timer);
    window.removeEventListener('pointerup', cancel);
    window.removeEventListener('pointercancel', cancel);
    window.removeEventListener('pointermove', cancel);
  };
  window.addEventListener('pointerup', cancel);
  window.addEventListener('pointercancel', cancel);
  window.addEventListener('pointermove', cancel);
}

function onClickCapture(e: MouseEvent) {
  if (lpFired) {
    lpFired = false;
    if ((e.target as HTMLElement).closest('[data-lp]')) {
      e.stopPropagation();
      e.preventDefault();
    }
  }
}

function onContextMenu(e: MouseEvent) {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-lp]');
  if (!el) return;
  e.preventDefault();
  fireLp(el);
}

export function installSpatialNav() {
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('click', onClickCapture, true);
  window.addEventListener('contextmenu', onContextMenu);
}
