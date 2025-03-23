"use client";

import { MCPConfigForm } from "./MCPConfigForm";
import { CopilotFEPlugin } from "./FETools";
import { FileText, Settings, Folder } from "lucide-react";
import FileList from "./FileManager/FileList";
import { PreviewComponent } from "./FilePreview/CopilotPreview";
import { useTab } from "./TabContext";

export function MainSection() {
  const { tab, setTab } = useTab();

  return (
    <section className="flex-1 py-6 h-screen">
      <div className="h-full overflow-y-auto  flex flex-col border-y border-l border-gray-300 rounded-l-4xl bg-white py-6">
        <div className="flex border-b">
          <button
            className={`cursor-pointer px-4 py-2 inline-flex items-center gap-2 ${tab === "preview" ? "border-b-2 border-blue-300" : ""}`}
            onClick={() => setTab("preview")}
          >
            <FileText className="h-4 w-4" />
            预览
          </button>
          <button
            className={`cursor-pointer px-4 py-2 inline-flex items-center gap-2 ${tab === "config" ? "border-b-2 border-blue-300" : ""}`}
            onClick={() => setTab("config")}
          >
            <Settings className="h-4 w-4" />
            配置
          </button>
          <button
            className={`cursor-pointer px-4 py-2 inline-flex items-center gap-2 ${tab === "files" ? "border-b-2 border-blue-300" : ""}`}
            onClick={() => setTab("files")}
          >
            <Folder className="h-4 w-4" />
            文件
          </button>
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
