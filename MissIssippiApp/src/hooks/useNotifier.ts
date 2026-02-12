import { useCallback } from "react";
import type { RefObject } from "react";
import type { Toast } from "primereact/toast";

export type NotifyFn = (
  severity: "info" | "success" | "warn" | "error",
  summary: string,
  detail: string,
  life?: number
) => void;

export const useNotifier = (toastRef: RefObject<Toast | null>): NotifyFn =>
  useCallback(
    (severity, summary, detail, life) => {
      toastRef.current?.show({
        severity,
        summary,
        detail,
        ...(life !== undefined ? { life } : {}),
      });
    },
    [toastRef]
  );
