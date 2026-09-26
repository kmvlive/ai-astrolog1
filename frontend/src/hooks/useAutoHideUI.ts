"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface UseAutoHideUIOptions {
  delay?: number;
  disabled?: boolean;
  enabled?: boolean;
}

export function useAutoHideUI({ delay = 3000, disabled = false, enabled = true }: UseAutoHideUIOptions = {}) {
  const [isVisible, setIsVisible] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const show = useCallback(() => {
    if (!enabled) return;
    setIsVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!disabled && enabled) {
      timerRef.current = setTimeout(() => setIsVisible(false), delay);
    }
  }, [delay, disabled, enabled]);

  useEffect(() => {
    if (!enabled) {
      setIsVisible(true);
      return;
    }
    
    if (disabled) {
      setIsVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    show();

    const handleMove = () => show();

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchstart", handleMove);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchstart", handleMove);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [show, enabled, disabled]);

  return { isVisible, show };
}
