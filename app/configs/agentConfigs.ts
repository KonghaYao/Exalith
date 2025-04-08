export const AgentConfigs = [
  {
    value: "all_helper",
    label: "智能助手",
  },
  {
    value: "excel_helper",
    label: "数据专家",
  },
];

export type AgentType = (typeof AgentConfigs)[number]["value"];
