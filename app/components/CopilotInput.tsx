import { InputProps } from "@copilotkit/react-ui";
import { Send, Eraser, Brain } from "lucide-react";
import { Mentions, Switch } from "antd";
import { JSX, useRef, useState } from "react";
import "./CopilotInput.css";
import { useFileSystem } from "./FileManager/FileSystemContext";
import { useMCPConfig } from "../contexts/MCPConfigContext";
export default function CopilotInput({
  inProgress,
  onSend,
  onReset,
  children,
}: InputProps & { children: JSX.Element; onReset?: () => void }) {
  const system = useFileSystem();
  const handleSubmit = (value: string) => {
    if (value?.trim()) {
      const filePrefix =
        system.selectedFiles.length > 0
          ? `${system.selectedFiles
              .map((i, index) => {
                return `<file path="${i.path}">${i.name}</file>`;
              })
              .join("\n")}\n`
          : "";
      system.clearSelection();
      onSend(filePrefix + value);
    }
  };
  const input = useRef<any>(null);
  const [value, setValue] = useState("");
  const wrapperStyle =
    "flex flex-col items-center gap-2 p-4 rounded-t-4xl border border-gray-200 bg-white shadow-xl";
  const buttonStyle =
    "w-8 h-8 flex-none rounded-full border text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer";

  const agent = useMCPConfig();
  const togglePlan = () => {
    agent.setAgentState((i) => ({
      ...i,
      plan_enabled: !i.plan_enabled,
    }));
  };
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
          placeholder={`${
            globalThis.navigator?.platform?.toLowerCase?.()?.includes?.("mac")
              ? "⌘"
              : "Ctrl"
          } + Enter 向 Agent 发送信息`}
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
            className={buttonStyle}
            disabled={inProgress}
            aria-label="Reset chat"
          >
            <Eraser size={16} />
          </button>
          <div className="flex-1 flex items-center justify-center gap-2"></div>
          {/* <button>{JSON.stringify(agent.agentState)}</button> */}
          <button
            onClick={togglePlan}
            disabled={inProgress}
            className={`h-8 px-2 flex-none rounded-full text-sm transition-colors border duration-200 bg-gray-100  hover:bg-gray-200 ${agent.agentState.plan_enabled ? "text-green-700  border-green-700" : ""} ${inProgress ? "cursor-not-allowed opacity-50" : "cursor-pointer"} flex items-center gap-1`}
          >
            <Brain size={16} />
            深度规划
          </button>
          <button
            disabled={inProgress}
            className={
              "w-8 h-8 flex-none rounded-full border hover:bg-green-600 disabled:bg-green-200 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer bg-green-500 text-white"
            }
            onClick={(e) => {
              handleSubmit(value);
              setValue("");
            }}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
