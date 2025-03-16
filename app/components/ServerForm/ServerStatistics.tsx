"use client";

interface ServerStatisticsProps {
  totalServers: number;
  stdioServers: number;
  sseServers: number;
  enabledServers: number;
}

export function ServerStatistics({
  totalServers,
  stdioServers,
  enabledServers,
  sseServers,
}: ServerStatisticsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {/* 服务器总数统计卡片 */}
      <div className="bg-white border rounded-md p-4">
        <div className="text-sm text-gray-500">Total Servers</div>
        <div className="text-3xl font-bold">{totalServers}</div>
      </div>

      {/* 已启用服务器统计卡片 */}
      <div className="bg-white border rounded-md p-4">
        <div className="text-sm text-gray-500">Enabled Servers</div>
        <div className="text-3xl font-bold">{enabledServers}</div>
      </div>

      {/* 服务器类型统计卡片 */}
      <div className="bg-white border rounded-md p-4">
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-sm text-gray-500">StdIO</div>
            <div className="text-2xl font-bold mt-1">{stdioServers}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">SSE</div>
            <div className="text-2xl font-bold mt-1">{sseServers}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
