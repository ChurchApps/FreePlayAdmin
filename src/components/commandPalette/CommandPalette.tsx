import React from "react";
import { createPortal } from "react-dom";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { Icon } from "@mui/material";
import "./CommandPalette.css";

interface PaletteItem { n: string; a?: string[]; t: "nav" | "do" | "jump"; u: string; i?: string; k?: PaletteItem[]; p?: string }
export interface PaletteMenuItem { url: string; icon?: string; label: string; children?: PaletteMenuItem[] }
export interface PaletteAction { url: string; icon: string; label: string; keywords?: string[] }

const GROUP: Record<PaletteItem["t"], string> = { nav: "Sections", do: "Actions", jump: "Also" };
const ORDER: PaletteItem["t"][] = ["nav", "do", "jump"];
const MAX = 12;

const matches = (item: PaletteItem, q: string) => (item.n + " " + (item.a || []).join(" ")).toLowerCase().includes(q);

const isTypingTarget = (el: EventTarget | null) => el instanceof HTMLElement && (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || el.isContentEditable);

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

interface Props { menu: PaletteMenuItem[]; actions: PaletteAction[]; also: PaletteAction[]; label: string; page?: string }

export const CommandPalette: React.FC<Props> = ({ menu, actions, also, label, page }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [expanded, setExpanded] = React.useState<string[]>([]);
  const [active, setActive] = React.useState(0);
  const [slot, setSlot] = React.useState<HTMLElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const resultsRef = React.useRef<HTMLDivElement>(null);
  const fromKeyboard = React.useRef(false);

  // SiteHeader has no slot and rebuilds its toolbar on re-render, so keep re-finding it.
  const resolveSlot = React.useCallback(() => {
    const next = document.getElementById("site-toolbar");
    setSlot((prev) => (prev === next ? prev : next));
  }, []);
  React.useEffect(() => { resolveSlot(); });
  React.useEffect(() => {
    const header = document.getElementById("site-header");
    if (!header) return;
    const observer = new MutationObserver(resolveSlot);
    observer.observe(header, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [resolveSlot, slot]);

  const items = React.useMemo(() => {
    const nav = menu.map((m): PaletteItem => {
      const k = m.children?.length ? m.children.map((c): PaletteItem => ({ n: c.label, t: "nav", u: c.url, i: c.icon })) : undefined;
      return { n: m.label, t: "nav", u: m.url, i: m.icon, k };
    });
    const doItems = actions.map((a): PaletteItem => ({ n: a.label, a: a.keywords, t: "do", u: a.url, i: a.icon }));
    const jumpItems = also.map((a): PaletteItem => ({ n: a.label, a: a.keywords, t: "jump", u: a.url, i: a.icon }));
    return [...nav, ...doItems, ...jumpItems];
  }, [menu, actions, also]);

  const current = React.useMemo(() => {
    const path = location.pathname;
    return Math.max(0, items.findIndex((it) => it.t === "nav" && (path === it.u || path.startsWith(it.u + "/"))));
  }, [items, location.pathname]);

  const close = React.useCallback(() => { setOpen(false); setQuery(""); setActive(0); setExpanded([]); }, []);
  const openPalette = React.useCallback(() => {
    const here = items[current]?.k ? items[current] : null;
    setOpen(true);
    setQuery("");
    setExpanded(here ? [here.u] : []);
    setActive(current);
  }, [current, items]);

  const toggle = (u: string) => {
    fromKeyboard.current = true;
    setExpanded((e) => (e.includes(u) ? [] : [u]));
    setActive(items.findIndex((i) => i.t === "nav" && i.u === u));
  };

  React.useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const slash = e.key === "/" && !open && !e.metaKey && !e.ctrlKey && !e.altKey && !isTypingTarget(e.target);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) close(); else openPalette();
      } else if (slash) {
        e.preventDefault();
        openPalette();
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close, openPalette]);

  const shown = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      const flat = items.flatMap((i) => [i, ...(i.k || []).map((c) => ({ ...c, p: i.u }))]);
      return ORDER.flatMap((t) => flat.filter((i) => i.t === t && matches(i, q))).slice(0, MAX);
    }
    const rows: PaletteItem[] = [];
    items.forEach((n) => {
      rows.push(n);
      if (n.k && expanded.includes(n.u)) n.k.forEach((c) => rows.push({ ...c, p: n.u }));
    });
    return rows;
  }, [items, query, expanded]);

  React.useEffect(() => {
    if (open) resultsRef.current?.querySelector(".om-hit.active")?.scrollIntoView({ block: "nearest" });
  }, [open]);
  React.useEffect(() => {
    if (!fromKeyboard.current) return;
    fromKeyboard.current = false;
    resultsRef.current?.querySelector(".om-hit.active")?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const run = (item: PaletteItem) => {
    if (item.k && !query) { toggle(item.u); return; }
    close();
    if (/^https?:/.test(item.u)) window.open(item.u, "_blank", "noopener");
    else navigate(item.u);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      fromKeyboard.current = true;
      setActive((i) => Math.min(shown.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      fromKeyboard.current = true;
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && shown[active]) {
      e.preventDefault();
      run(shown[active]);
    } else if (!query && e.key === "ArrowRight" && shown[active]?.k && !expanded.includes(shown[active].u)) {
      e.preventDefault();
      toggle(shown[active].u);
    } else if (!query && e.key === "ArrowLeft" && shown[active]) {
      const row = shown[active];
      const parent = row.p || (row.k && expanded.includes(row.u) ? row.u : null);
      if (parent) {
        e.preventDefault();
        toggle(parent);
      }
    }
  };

  const field = slot && createPortal(
    <div className="om-nav">
      <RouterLink to="/screens" className="om-logo" aria-label="FreePlay"><img src="/images/logo-icon.png" alt="" /></RouterLink>
      <button type="button" className="om-search" onClick={openPalette} data-testid="command-palette-open" aria-label={"Search or jump, current section " + label} title={"Search or jump (" + (isMac ? "⌘" : "Ctrl") + " K)"}>
        <Icon fontSize="small">search</Icon>
        <span className="om-search-label">
          <span data-testid="command-palette-section">{label}</span>
          {page && page !== label && <><span className="om-search-sep">›</span><span className="om-search-page" data-testid="command-palette-page">{page}</span></>}
        </span>
        <kbd>{isMac ? "⌘" : "Ctrl"} K</kbd>
      </button>
    </div>,
    slot
  );

  const palette = open && createPortal(
    <div className="om-overlay" role="dialog" aria-modal="true" aria-label="Command palette" data-testid="command-palette" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="om-palette">
        <input ref={inputRef} value={query} onChange={(e) => { setQuery(e.target.value); setActive(0); }} onKeyDown={onInputKey} placeholder="Pair a screen, find a playlist, jump…" autoComplete="off" aria-label="Search or jump" />
        <div className="om-palette-results" ref={resultsRef}>
          {shown.length === 0 && <div className="om-group-label">Nothing for that.</div>}
          {shown.map((item, idx) => (
            <React.Fragment key={(item.p || "") + item.t + item.u}>
              {item.t !== shown[idx - 1]?.t && <div className="om-group-label">{GROUP[item.t]}</div>}
              <button
                type="button"
                className={"om-hit" + (item.p && !query ? " om-child" : "") + (idx === active ? " active" : "")}
                aria-expanded={item.k && !query ? expanded.includes(item.u) : undefined}
                aria-current={item.p && item.u === location.pathname + location.search ? "page" : undefined}
                onMouseMove={() => { if (idx !== active) setActive(idx); }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => run(item)}
              >
                <span>{item.i && <Icon fontSize="small">{item.i}</Icon>}<span>{item.n}</span></span>
                <small>{item.k && !query ? <Icon fontSize="small">{expanded.includes(item.u) ? "expand_less" : "expand_more"}</Icon> : ""}</small>
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <>
      {field}
      {palette}
    </>
  );
};
