"use client";

import { MCPConfigForm } from "./MCPConfigForm";
import { CopilotFEPlugin } from "./FETools";
import { FileText, Settings, Folder } from "lucide-react";
import FileList from "./FileManager/FileList";
import { PreviewComponent } from "./FilePreview/CopilotPreview";
import { useTab } from "./TabContext";
import { useCoAgent, useCopilotChat } from "@copilotkit/react-core";
import { useFileSystem } from "./FileManager/FileSystemContext";
import { useEffect } from "react";

const tabConfig = [
  {
    key: "files",
    icon: Folder,
    text: "文件",
  },
  {
    key: "preview",
    icon: FileText,
    text: "预览",
  },
  {
    key: "config",
    icon: Settings,
    text: "配置",
  },
] as const;

export function MainSection() {
  const messages = useCopilotChat();
  const files = useFileSystem();
  // 监听 messages, 长度变化时，重新渲染files
  useEffect(() => {
    // 当消息列表长度发生变化时，触发文件系统重新渲染
    if (messages.visibleMessages.length > 0) {
      files.loadFiles();
    }
  }, [messages.visibleMessages.length]);

  const { tab, setTab } = useTab();

  return (
    <section className="flex-1 py-6 h-screen">
      <div className="h-full overflow-y-auto  flex flex-col border-y border-l border-gray-300 rounded-l-4xl bg-white py-6">
        <div className="flex border-b">
          {tabConfig.map((item) => (
            <button
              key={item.key}
              className={`cursor-pointer px-4 py-2 inline-flex items-center gap-2 ${tab === item.key ? "border-b-2 border-blue-300" : ""}`}
              onClick={() => setTab(item.key)}
            >
              <item.icon className="h-4 w-4" />
              {item.text}
            </button>
          ))}
        </div>

        <div
          className={`${tab === "config" ? "flex-1 overflow-y-auto p-8" : "hidden"}`}
        >
          <MCPConfigForm />
          <CopilotFEPlugin />
        </div>

        <div
          className={`${tab === "preview" ? "flex-1 overflow-y-auto" : "hidden"}`}
        >
          <PreviewComponent></PreviewComponent>
        </div>

        <div
          className={`${tab === "files" ? "flex-1 overflow-y-auto" : "hidden"}`}
        >
          <FileList />
        </div>
      </div>
    </section>
  );
}
