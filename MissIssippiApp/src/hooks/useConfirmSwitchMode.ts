import { useCallback, useState } from "react";

type ScanMode = "add" | "remove";

type UseConfirmSwitchModeParams = {
  mode: ScanMode | null;
  onModeSelected: (next: ScanMode) => void;
  clearAll: () => void;
  hasScans: boolean;
};

type UseConfirmSwitchModeResult = {
  mode: ScanMode | null;
  pendingMode: ScanMode | null;
  showModal: boolean;
  requestModeChange: (next: ScanMode) => void;
  confirmKeep: () => void;
  confirmClear: () => void;
  cancel: () => void;
};

export const useConfirmSwitchMode = ({
  mode,
  onModeSelected,
  clearAll,
  hasScans,
}: UseConfirmSwitchModeParams): UseConfirmSwitchModeResult => {
  const [pendingMode, setPendingMode] = useState<ScanMode | null>(null);
  const [showModal, setShowModal] = useState(false);

  const cancel = useCallback(() => {
    setShowModal(false);
    setPendingMode(null);
  }, []);

  const selectMode = useCallback(
    (next: ScanMode) => {
      onModeSelected(next);
    },
    [onModeSelected]
  );

  const requestModeChange = useCallback(
    (next: ScanMode) => {
      if (mode === next) {
        return;
      }

      if (hasScans) {
        setPendingMode(next);
        setShowModal(true);
        return;
      }

      selectMode(next);
    },
    [mode, hasScans, selectMode]
  );

  const confirmKeep = useCallback(() => {
    if (pendingMode) {
      selectMode(pendingMode);
      cancel();
      return;
    }
    cancel();
  }, [pendingMode, selectMode, cancel]);

  const confirmClear = useCallback(() => {
    if (pendingMode) {
      clearAll();
      selectMode(pendingMode);
      cancel();
      return;
    }
    cancel();
  }, [pendingMode, clearAll, selectMode, cancel]);

  return {
    mode,
    pendingMode,
    showModal,
    requestModeChange,
    confirmKeep,
    confirmClear,
    cancel,
  };
};
