import { useRef } from "react";
import type { RefObject } from "react";
import type { Toast } from "primereact/toast";
import { useNotifier, type NotifyFn } from "./useNotifier";
import { getErrorMessage } from "../utils/errors";

export const useToastNotifier = (): {
  toastRef: RefObject<Toast | null>;
  notify: NotifyFn;
  getErrorMessage: (err: unknown, fallback: string) => string;
} => {
  const toastRef = useRef<Toast | null>(null);
  const notify = useNotifier(toastRef);

  return { toastRef, notify, getErrorMessage };
};
