"use client";

import { MCPConfigForm } from "./MCPConfigForm";
import { CopilotFEPlugin } from "./FETools";
import {
  FileText,
  Settings,
  Folder,
  ArrowLeft,
  MoveLeft,
  ChevronLeft,
} from "lucide-react";
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
    <section className="flex-none h-screen flex border-r shadow-2xl relative">
      <nav className="w-12 flex-none border-r bg-gray-100 flex flex-col items-center py-4 gap-4">
        {tabConfig.map((item) => (
          <button
            key={item.key}
            className={`w-12 h-12 cursor-pointer flex items-center justify-center ${
              tab === item.key ? "bg-emerald-500 text-white" : " text-gray-600"
            }`}
            onClick={() => setTab(item.key)}
          >
            <item.icon className="h-6 w-6" />
          </button>
        ))}
      </nav>

      {tab && (
        <div className="flex-1 w-128 h-full overflow-y-auto flex flex-col bg-white relative">
          <div
            className={`${
              tab === "config" ? "flex-1 overflow-y-auto p-8" : "hidden"
            }`}
          >
            <MCPConfigForm />
            <CopilotFEPlugin />
          </div>

          <div
            className={`${
              tab === "preview" ? "flex-1 overflow-y-auto" : "hidden"
            }`}
          >
            <PreviewComponent></PreviewComponent>
          </div>

          <div
            className={`${tab === "files" ? "flex-1 overflow-y-auto" : "hidden"}`}
          >
            <FileList />
          </div>
        </div>
      )}
      <button
        className="absolute top-[50%]  -right-4 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center transition-transform duration-300 cursor-pointer shadow"
        onClick={() => setTab(tab ? undefined : "files")}
        style={{
          transform: tab ? "rotate(0deg)" : "rotate(180deg)",
        }}
      >
        <ChevronLeft></ChevronLeft>
      </button>
    </section>
  );
}
