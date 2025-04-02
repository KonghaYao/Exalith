"use client";

import { useMemo } from "react";

type StatusBadgeProps = {
  status: string;
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  // Status color mapping
  const statusColors: Record<string, string> = {
    executing: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    complete: "bg-green-100 text-green-800 border border-green-300",
    error: "bg-red-100 text-red-800 border border-red-300",
    inProgress: "bg-blue-100 text-blue-800 border border-blue-300",
    unknown: "bg-gray-100 text-gray-800 border border-gray-300",
  };

  const statusColor = useMemo(
    () => statusColors[status.toLowerCase()] || statusColors.unknown,
    [status],
  );

  return (
    <div
      className={`text-xs px-2 py-1 rounded-full ${statusColor} transition-colors duration-200 ease-in-out`}
    >
      {status}
    </div>
  );
};
