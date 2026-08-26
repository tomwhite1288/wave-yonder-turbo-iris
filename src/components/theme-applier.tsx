import { useLayoutEffect } from "react";
import type { LayoutMode, ThemeId } from "@/lib/field/types";

export function ThemeApplier({ theme, layout }: { theme?: ThemeId; layout?: LayoutMode }) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const cached = window.localStorage.getItem("fl_theme") as ThemeId | null;
    const next = theme || cached;
    if (next) {
      root.dataset.theme = next;
      if (theme) window.localStorage.setItem("fl_theme", theme);
    } else delete root.dataset.theme;
    if (layout) root.dataset.layout = layout;
    else delete root.dataset.layout;
  }, [theme, layout]);
  return null;
}
