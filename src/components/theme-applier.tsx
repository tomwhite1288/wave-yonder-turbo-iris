import { useEffect } from "react";
import type { LayoutMode, ThemeId } from "@/lib/field/types";

export function ThemeApplier({ theme, layout }: { theme?: ThemeId; layout?: LayoutMode }) {
  useEffect(() => {
    const root = document.documentElement;
    if (theme) root.dataset.theme = theme;
    else delete root.dataset.theme;
    if (layout) root.dataset.layout = layout;
    else delete root.dataset.layout;
  }, [theme, layout]);
  return null;
}
