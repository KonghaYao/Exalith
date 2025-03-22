"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import { CopilotActionHandler } from "./components/CopilotActionHandler";
import { MCPConfigForm } from "./components/MCPConfigForm";
import { useState } from "react";
import CopilotInput from "./components/CopilotInput";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotFEPlugin } from "./components/FETools";
import { InstructionsModal } from "./components/InstructionsModal";
import { DefaultInstructions } from "./DefaultInstructions";
import { ArtifactsProvider } from "./components/Artifacts/ArtifactsContext";
import { ArtifactsWrapper } from "./components/Artifacts/Wrapper";
import { ResourceProvider } from "./components/Artifacts/ResourceContext";
import FileList from "./components/FileManager/FileList";
import { FileText, Settings, Folder } from "lucide-react";
import { FileSystemProvider } from "./components/FileManager/FileSystemContext";
import { SelectedFileGroup } from "./components/FileManager/SelectedFileGroup";
import UserMessage from "./components/UserMessage";
import ResponseButton from "./components/ResponseButton";

export default function Home() {
  const [chatKey, setChatKey] = useState(0);
  const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false);
  const [instructions, setInstructions] = useState(DefaultInstructions);
  const [tab, setTab] = useState("files");

  return (
    <ArtifactsProvider key={chatKey}>
      <ResourceProvider key={chatKey}>
        <FileSystemProvider>
          <CopilotKit
            runtimeUrl="/api/copilotkit"
            showDevConsole={false}
            key={chatKey}
          >
            <div className="min-h-screen flex relative">
              <section className="flex-2">
                <div className="relative w-full max-w-3xl m-auto flex-none h-full">
                  <InstructionsModal
                    isOpen={isInstructionsModalOpen}
                    onClose={() => setIsInstructionsModalOpen(false)}
                    onSave={setInstructions}
                    defaultInstructions={instructions}
                  />
                  <button
                    onClick={() => setIsInstructionsModalOpen(true)}
                    className="absolute top-4 right-4 z-10 p-2 text-gray-600 hover:text-gray-800 "
                    aria-label="自定义指令"
                  >
                    <Settings></Settings>
                  </button>
                  <CopilotChat
                    className="h-screen flex flex-col "
                    key={chatKey}
                    UserMessage={UserMessage}
                    Input={(props) => (
                      <CopilotInput
                        {...props}
                        onReset={() => setChatKey((k) => k + 1)}
                      >
                        <SelectedFileGroup></SelectedFileGroup>
                      </CopilotInput>
                    )}
                    ResponseButton={ResponseButton}
                    instructions={instructions}
                    labels={{
                      title: "MCP 助手",
                      stopGenerating: "停止生成",
                      regenerateResponse: "重新生成",
                    }}
                  />
                </div>
              </section>
              <CopilotActionHandler />
              {/* Main content area */}
              <section className="flex-1 py-6 h-screen">
                <div className="h-full overflow-y-auto  flex flex-col border-y border-l border-gray-300 rounded-l-4xl bg-white py-6">
                  <div className="flex border-b">
                    <button
                      className={`cursor-pointer px-4 py-2 inline-flex items-center gap-2 ${tab === "artifacts" ? "border-b-2 border-blue-300" : ""}`}
                      onClick={() => setTab("artifacts")}
                    >
                      <FileText className="h-4 w-4" />
                      资源
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
                    className={`${tab === "artifacts" ? "flex-1 overflow-y-auto" : "hidden"}`}
                  >
                    <ArtifactsWrapper />
                  </div>

                  <div
                    className={`${tab === "files" ? "flex-1 overflow-y-auto" : "hidden"}`}
                  >
                    <FileList />
                  </div>
                </div>
              </section>
            </div>
          </CopilotKit>
        </FileSystemProvider>
      </ResourceProvider>
    </ArtifactsProvider>
  );
}
