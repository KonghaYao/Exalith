"use client";
import ReactECharts from "echarts-for-react";
import { Resource } from "../ResourceContext";

interface EchartsDisplayerProps {
  resource: Resource;
}
export function EchartsDisplayer({ resource }: EchartsDisplayerProps) {
  let options;
  try {
    options = JSON.parse(resource.content);
  } catch (e) {}
  return (
    <div className="border rounded-lg shadow-sm p-4 bg-white">
      {options && <ReactECharts option={options} />}
    </div>
  );
}
