"use client";

import { useMemo, useRef } from "react";

const formatJSON = (obj: any) => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return obj;
  }
};

const isEmptyObject = (obj: any) => {
  return obj && typeof obj === "object" && Object.keys(obj).length === 0;
};

export function useJSONFormatter(value: any, displayMode?: "json" | "text") {
  const prevValueRef = useRef<any>(null);

  const formattedValue = useMemo(() => {
    if (!value) return "";

    if (isEmptyObject(value)) {
      return prevValueRef.current || "";
    }

    const result =
      displayMode === "json" || displayMode === undefined
        ? formatJSON(value)
        : String(value);

    prevValueRef.current = result;
    return result;
  }, [value, displayMode]);

  return formattedValue;
}
