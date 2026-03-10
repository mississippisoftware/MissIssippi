import { useCallback, useState } from "react";

type ScanMode = "add" | "remove";

type UseScanModeSwitchParams = {
  mode: ScanMode | null;
  onModeSelected: (next: ScanMode) => void;
  clearAll: () => void;
  hasScans: boolean;
};

type UseScanModeSwitchResult = {
  mode: ScanMode | null;
  pendingMode: ScanMode | null;
  showModeModal: boolean;
  requestModeChange: (next: ScanMode) => void;
  closeModeModal: () => void;
  confirmSwitchKeep: () => void;
  confirmSwitchClear: () => void;
};

export const useScanModeSwitch = ({
  mode,
  onModeSelected,
  clearAll,
  hasScans,
}: UseScanModeSwitchParams): UseScanModeSwitchResult => {
  const [pendingMode, setPendingMode] = useState<ScanMode | null>(null);
  const [showModeModal, setShowModeModal] = useState(false);

  const closeModeModal = useCallback(() => {
    setShowModeModal(false);
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
        setShowModeModal(true);
        return;
      }

      selectMode(next);
    },
    [mode, hasScans, selectMode]
  );

  const confirmSwitchKeep = useCallback(() => {
    if (pendingMode) {
      selectMode(pendingMode);
      closeModeModal();
      return;
    }
    closeModeModal();
  }, [pendingMode, selectMode, closeModeModal]);

  const confirmSwitchClear = useCallback(() => {
    if (pendingMode) {
      clearAll();
      selectMode(pendingMode);
      closeModeModal();
      return;
    }
    closeModeModal();
  }, [pendingMode, clearAll, selectMode, closeModeModal]);

  return {
    mode,
    pendingMode,
    showModeModal,
    requestModeChange,
    closeModeModal,
    confirmSwitchKeep,
    confirmSwitchClear,
  };
};
