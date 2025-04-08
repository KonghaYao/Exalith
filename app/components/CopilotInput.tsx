import { InputProps } from "@copilotkit/react-ui";
import {
  Send,
  Eraser,
  Brain,
  Globe,
  Square,
  Edit,
  WandSparkles,
  Sparkles,
} from "lucide-react";
import { Mentions, Switch, Select } from "antd";
import { JSX, useRef, useState, useEffect } from "react";
import "./CopilotInput.css";
import { useFileSystem } from "./FileManager/FileSystemContext";
import {
  ModelConfigs,
  ThinkingModelConfigs,
  useMCPConfig,
} from "../contexts/MCPConfigContext";
import { useMount } from "ahooks";
import {
  useCopilotChat,
  useLangGraphInterrupt,
  useCopilotMessagesContext,
} from "@copilotkit/react-core";
import { PromptPro } from "./PromptPro";

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
  const [showPromptPro, setShowPromptPro] = useState(false);
  const { messages } = useCopilotMessagesContext();
  console.log(messages);
  useLangGraphInterrupt({
    render: ({ event, resolve }) => (
      <div>
        <p>{event.value}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            resolve((e.target as HTMLFormElement).response.value);
          }}
        >
          <input
            type="text"
            name="response"
            placeholder="Enter your response"
          />
          <button type="submit">Submit</button>
        </form>
      </div>
    ),
  });
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
    "border-gradient-cool text-gray-800 flex flex-col items-center gap-2 p-4 rounded-t-4xl border border-gray-200 bg-white shadow-xl";
  const baseButtonStyle = `h-8 flex-none rounded-full bg-gray-100 border border-gray-200 transition-colors duration-200 ${inProgress ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`;
  const iconButtonStyle = `${baseButtonStyle} w-8 text-gray-600 hover:text-gray-800 disabled:text-gray-300`;
  const featureButtonStyle = (enabled: boolean) =>
    `${baseButtonStyle} px-2 text-sm bg-gray-100 hover:bg-gray-200 flex items-center gap-1 ${enabled ? "text-emerald-600 border-gray-300" : ""}`;

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
      const newState = { ...i!, plan_enabled: !i!.plan_enabled };
      saveAgentState(newState);
      return newState;
    });
  };

  const toggleWebSearch = () => {
    agent.setAgentState((i) => {
      const newState = { ...i!, web_search_enabled: !i!.web_search_enabled };
      saveAgentState(newState);
      return newState;
    });
  };
  const { stopGeneration } = useCopilotChat();
  return (
    <section
      className="copilot-input "
      style={{
        fontFamily: "'LXGW WenKai Light'",
      }}
    >
      <nav className="relative w-full">
        <PromptPro
          value={value}
          onApply={setValue}
          visible={showPromptPro}
          onClose={() => setShowPromptPro(false)}
        ></PromptPro>
      </nav>
      <div className={wrapperStyle}>
        {children}
        <Mentions
          ref={input}
          autoSize={{ minRows: 2, maxRows: 6 }}
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
        <div className="w-full flex gap-4 border-t border-gray-200 pt-4">
          <button
            onClick={() => setShowPromptPro(true)}
            className={`${baseButtonStyle} w-8 text-gray-600 hover:text-gray-800 disabled:text-gray-300`}
            disabled={inProgress}
            aria-label="Open PromptPro"
          >
            <WandSparkles size={16} />
          </button>

          <button
            onClick={togglePlan}
            disabled={inProgress}
            className={featureButtonStyle(agent.agentState.plan_enabled)}
          >
            <Sparkles size={16} />
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
          <button
            onClick={onReset}
            className={iconButtonStyle}
            disabled={inProgress}
            aria-label="Reset chat"
          >
            <Eraser size={16} />
          </button>
          <Select
            value={agent.agentState.model_name || "qwen-plus"}
            onChange={(value) => {
              agent.setAgentState((i) => {
                const newState = { ...i!, model_name: value };
                saveAgentState(newState);
                return newState;
              });
            }}
            style={{ width: 120 }}
            options={ModelConfigs}
            disabled={inProgress}
            className="text-sm"
          />
          {/* <Select
            value={agent.agentState.thinking_model}
            onChange={(value) => {
              agent.setAgentState((i) => {
                const newState = { ...i!, thinking_model: value };
                saveAgentState(newState);
                return newState;
              });
            }}
            allowClear
            style={{ width: 120 }}
            options={ThinkingModelConfigs}
            disabled={inProgress}
            className="text-sm"
          /> */}
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
