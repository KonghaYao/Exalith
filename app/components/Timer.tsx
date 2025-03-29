"use client";

import { useState, useCallback, useEffect } from "react";

type TimerProps = {
  status: string;
};

export const Timer: React.FC<TimerProps> = ({ status }) => {
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [duration, setDuration] = useState(0);

  const formatDuration = useCallback((ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);

    return [
      minutes.toString().padStart(2, "0"),
      seconds.toString().padStart(2, "0"),
    ].join(":");
  }, []);

  useEffect(() => {
    setStartTime(new Date());
    setDuration(0);
  }, []);

  useEffect(() => {
    if (startTime) {
      setDuration(new Date().getTime() - startTime.getTime());
      console.log("更新");
    }
  }, [status, startTime]);

  if (duration <= 0) return null;

  return (
    <div className="text-xs text-gray-500">{formatDuration(duration)}</div>
  );
};
