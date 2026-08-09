import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_TOOLBAR_ENABLED,
  readToolbarEnabled,
  subscribeToolbarEnabled,
  writeToolbarEnabled,
} from "../preferences";

export default function useToolbarEnabled() {
  const [enabled, setEnabled] = useState<boolean>(DEFAULT_TOOLBAR_ENABLED);

  useEffect(() => {
    readToolbarEnabled().then(setEnabled);

    return subscribeToolbarEnabled(setEnabled);
  }, []);

  const setToolbarEnabled = useCallback((next: boolean) => {
    writeToolbarEnabled(next);
  }, []);

  return { enabled, setEnabled: setToolbarEnabled };
}
