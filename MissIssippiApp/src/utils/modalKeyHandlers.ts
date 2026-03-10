import type { KeyboardEvent } from "react";

export const shouldSubmitOnEnter = (event: KeyboardEvent<HTMLElement>) => {
  if (event.key !== "Enter") return false;
  if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return false;

  const target = event.target as HTMLElement | null;
  if (!target) return false;

  if (target.tagName === "TEXTAREA") return false;
  if (target.isContentEditable) return false;
  if (target.closest("button, a")) return false;

  return true;
};
