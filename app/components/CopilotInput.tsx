import { InputProps } from "@copilotkit/react-ui";
import { ArrowUpFromDot, Eraser } from "lucide-react";
import { Mentions } from "antd";
import { JSX, useRef, useState } from "react";
import "./CopilotInput.css";
import { useFileSystem } from "./FileManager/FileSystemContext";
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
        <div className="w-full flex">
          <button
            onClick={onReset}
            className={buttonStyle}
            disabled={inProgress}
            aria-label="Reset chat"
          >
            <Eraser size={16} />
          </button>
          <div className="flex-1"></div>
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
            <ArrowUpFromDot size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
