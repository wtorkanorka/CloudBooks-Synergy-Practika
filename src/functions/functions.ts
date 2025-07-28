import { useCallback, useRef } from "react";

export function useDebounce(callback: any, delay: number) {
  const timer: any = useRef(null);
  const debouncedCallback = useCallback(
    (...args: any) => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
  return debouncedCallback;
}
