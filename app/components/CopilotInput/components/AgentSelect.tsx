import { Select } from "antd";
import { useMCPConfig } from "../../../contexts/MCPConfigContext";
import { AgentConfigs } from "../../../configs/agentConfigs";

export function AgentSelect(props: {
  inProgress: boolean;
  onChange: (value: string) => void;
}) {
  const agent = useMCPConfig();
  return (
    <Select
      value={agent.agentState.active_agent || "all_agent"}
      onChange={(value) => props.onChange(value)}
      style={{ width: 120 }}
      options={AgentConfigs}
      disabled={props.inProgress}
      className="text-sm"
    />
  );
} 