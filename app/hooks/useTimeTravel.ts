import { useState, useCallback, useRef, useEffect } from "react";

interface TimeTravelOptions<T> {
  maxHistory?: number;
  onStateChange?: (state: T) => void;
  getKey?: (state: T) => string;
}

export function useTimeTravel<T>(
  initialState: T,
  options: TimeTravelOptions<T> = {},
) {
  const { maxHistory = 50, onStateChange, getKey = JSON.stringify } = options;
  const [current, setCurrent] = useState(0);
  const [history, setHistory] = useState<T[]>([initialState]);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
  }, [current, history, onStateChange]);

  const canUndo = current > 0;
  const canRedo = current < history.length - 1;

  const pushState = useCallback(
    (newState: T) => {
      const newStateKey = getKey(newState);
      setHistory((currentHistory) => {
        const existingIndex = currentHistory.findIndex(
          (state) => getKey(state) === newStateKey,
        );

        if (existingIndex !== -1) {
          // 如果存在相同 key，则覆盖该位置的状态
          const newHistory = [...currentHistory];
          newHistory[existingIndex] = newState;
          console.log("覆盖", newHistory);
          return newHistory;
        } else {
          // 如果是新状态，则添加并更新 current
          setTimeout(() => {
            setCurrent((prev) => nextHistory.length - 1);
          });
          const nextHistory = [...currentHistory, newState];
          console.log("新增", nextHistory);
          return nextHistory;
        }
      });
    },
    [current, maxHistory, getKey],
  );

  const undo = useCallback(() => {
    if (canUndo) {
      setCurrent(current - 1);
      onStateChange?.(history[current - 1]);
    }
  }, [current, canUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      setCurrent(current + 1);
      onStateChange?.(history[current + 1]);
    }
  }, [current, canRedo]);

  const clear = useCallback(() => {
    setHistory([history[current]]);
    setCurrent(0);
  }, [history, current]);

  const setCurrentIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < history.length) {
        setCurrent(index);
        onStateChange?.(history[index]);
      }
    },
    [history.length],
  );

  return {
    state: history[current],
    pushState,
    undo,
    redo,
    clear,
    canUndo,
    canRedo,
    historyLength: history.length,
    currentIndex: current,
    setCurrentIndex,
    history,
  };
}
