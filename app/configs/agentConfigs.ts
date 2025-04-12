export const AgentConfigs = [
  {
    value: "all_helper",
    label: "智能助手",
  },
  {
    value: "data_expert",
    label: "数据专家",
  },
  {
    value: "knowledge_helper",
    label: "知识库专家",
  },
];

export type AgentType = (typeof AgentConfigs)[number]["value"];
