import { InputProps } from "@copilotkit/react-ui";
import { Send, Eraser, Brain, Globe, Square } from "lucide-react";
import { Mentions, Switch, Select } from "antd";
import { JSX, useRef, useState, useEffect } from "react";
import "./CopilotInput.css";
import { useFileSystem } from "./FileManager/FileSystemContext";
import { ModelConfigs, useMCPConfig } from "../contexts/MCPConfigContext";
import { useMount } from "ahooks";
import { useCopilotChat } from "@copilotkit/react-core";

export default function CopilotInput({
  inProgress,
  onSend,
  onReset,
  children,
}: InputProps & { children: JSX.Element; onReset?: () => void }) {
  const system = useFileSystem();
  const agent = useMCPConfig();
  const [value, setValue] = useState("");
  const input = useRef<any>(null);
  const [isMac, setIsMac] = useState(false);

  const handleSubmit = (value: string) => {
    const trimmedValue = value?.trim();
    if (!trimmedValue) return;

    const filePrefix =
      system.selectedFiles.length > 0
        ? system.selectedFiles
            .map((i) => `<file path="${i.path}">${i.name}</file>`)
            .join("\n") + "\n"
        : "";

    system.clearSelection();
    onSend(filePrefix + trimmedValue);
  };
  const wrapperStyle =
    "flex flex-col items-center gap-2 p-4 rounded-t-4xl border border-gray-200 bg-white shadow-xl";
  const baseButtonStyle = `h-8 flex-none rounded-full border transition-colors duration-200 ${inProgress ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`;
  const iconButtonStyle = `${baseButtonStyle} w-8 text-gray-600 hover:text-gray-800 disabled:text-gray-300`;
  const featureButtonStyle = (enabled: boolean) =>
    `${baseButtonStyle} px-2 text-sm bg-gray-100 hover:bg-gray-200 flex items-center gap-1 ${enabled ? "text-emerald-600 border-emerald-600" : ""}`;

  useMount(() => {
    setIsMac(
      globalThis.navigator?.platform?.toLowerCase?.()?.includes?.("mac"),
    );
  });

  const saveAgentState = (newState: any) => {
    localStorage.setItem(
      "mcp_input_state",
      JSON.stringify({
        plan_enabled: newState.plan_enabled,
        web_search_enabled: newState.web_search_enabled,
        model_name: newState.model_name,
      }),
    );
  };

  const togglePlan = () => {
    agent.setAgentState((i) => {
      const newState = { ...i, plan_enabled: !i.plan_enabled };
      saveAgentState(newState);
      return newState;
    });
  };

  const toggleWebSearch = () => {
    agent.setAgentState((i) => {
      const newState = { ...i, web_search_enabled: !i.web_search_enabled };
      saveAgentState(newState);
      return newState;
    });
  };
  const { stopGeneration } = useCopilotChat();
  return (
    <section
      className="copilot-input"
      style={{
        fontFamily: "'LXGW WenKai Light'",
      }}
    >
      <div className={wrapperStyle}>
        {children}
        <Mentions
          ref={input}
          autoSize
          variant="borderless"
          style={{ width: "100%" }}
          disabled={inProgress}
          placeholder={`${isMac ? "⌘" : "Ctrl"} + Enter 向 Agent 发送信息`}
          value={value}
          onChange={setValue}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              handleSubmit(value);
              setValue("");
            }
          }}
          options={[
            {
              value: "llm-agent",
              label: "大模型助手",
            },
          ]}
        />
        <div className="w-full flex gap-4">
          <button
            onClick={onReset}
            className={iconButtonStyle}
            disabled={inProgress}
            aria-label="Reset chat"
          >
            <Eraser size={16} />
          </button>

          <button
            onClick={togglePlan}
            disabled={inProgress}
            className={featureButtonStyle(agent.agentState.plan_enabled)}
          >
            <Brain size={16} />
            深度规划
          </button>
          <button
            onClick={toggleWebSearch}
            disabled={inProgress}
            className={featureButtonStyle(agent.agentState.web_search_enabled)}
          >
            <Globe size={16} />
            网络搜索
          </button>
          <div className="flex-1 flex items-center justify-center gap-2"></div>
          <Select
            value={agent.agentState.model_name || "qwen-plus"}
            onChange={(value) => {
              agent.setAgentState((i) => {
                const newState = { ...i, model_name: value };
                saveAgentState(newState);
                return newState;
              });
            }}
            style={{ width: 120 }}
            options={ModelConfigs}
            disabled={inProgress}
            className="text-sm"
          />
          {inProgress ? (
            <button
              onClick={stopGeneration}
              className={`${baseButtonStyle} w-8 bg-red-500 text-white hover:bg-red-600 cursor-pointer`}
              aria-label="Stop generation"
            >
              <Square size={16} />
            </button>
          ) : (
            <button
              className={`${baseButtonStyle} w-8 bg-green-500 text-white hover:bg-green-600 disabled:bg-green-200`}
              onClick={(e) => {
                handleSubmit(value);
                setValue("");
              }}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
