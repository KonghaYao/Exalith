"use client";

interface ServerStatisticsProps {
  totalServers: number;
  stdioServers: number;
  sseServers: number;
}

export function ServerStatistics({
  totalServers,
  stdioServers,
  sseServers,
}: ServerStatisticsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div className="bg-white border rounded-md p-4">
        <div className="text-sm text-gray-500">Total Servers</div>
        <div className="text-3xl font-bold">{totalServers}</div>
      </div>
      <div className="bg-white border rounded-md p-4">
        <div className="text-sm text-gray-500">Stdio Servers</div>
        <div className="text-3xl font-bold">{stdioServers}</div>
      </div>
      <div className="bg-white border rounded-md p-4">
        <div className="text-sm text-gray-500">SSE Servers</div>
        <div className="text-3xl font-bold">{sseServers}</div>
      </div>
    </div>
  );
}
