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
import { FileText, Settings } from "lucide-react";

export default function Home() {
  const [chatKey, setChatKey] = useState(0);
  const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false);
  const [instructions, setInstructions] = useState(DefaultInstructions);
  const [tab, setTab] = useState("artifacts")

  return (
    <ArtifactsProvider>
      <ResourceProvider>

        <CopilotKit
          runtimeUrl="/api/copilotkit"
          showDevConsole={false}
          key={chatKey}
        >
          <div className="min-h-screen flex relative">
            <section className="flex-2">
              <div className="relative w-[40vw] m-auto flex-none">
                <InstructionsModal
                  isOpen={isInstructionsModalOpen}
                  onClose={() => setIsInstructionsModalOpen(false)}
                  onSave={setInstructions}
                  defaultInstructions={instructions}
                />
                <button
                  onClick={() => setIsInstructionsModalOpen(true)}
                  className="absolute top-4 right-4 z-10 p-2 text-gray-600 hover:text-gray-800"
                  aria-label="自定义指令"
                >
                  <Settings></Settings>
                </button>
                <CopilotChat
                  className="h-screen flex flex-col "
                  key={chatKey}
                  Input={(props) => (
                    <CopilotInput
                      {...props}
                      onReset={() => setChatKey((k) => k + 1)}
                    />
                  )}
                  instructions={instructions}
                  labels={{
                    title: "MCP 助手",
                    initial: "需要什么帮助吗？",
                  }}
                />
              </div>
            </section>
            <CopilotActionHandler />
            {/* Main content area */}
            <section className="flex-1 py-6 pr-6">

              <div className="h-full overflow-y-auto  flex flex-col border rounded-4xl">
                <div className="flex border-b">
                  <button
                    className={`cursor-pointer px-4 py-2 inline-flex items-center gap-2 ${tab === 'artifacts' ? 'border-b-2 border-blue-300' : ''}`}
                    onClick={() => setTab('artifacts')}
                  >
                    <FileText className="h-4 w-4" />
                    资源
                  </button>
                  <button
                    className={`cursor-pointer px-4 py-2 inline-flex items-center gap-2 ${tab === 'config' ? 'border-b-2 border-blue-300' : ''}`}
                    onClick={() => setTab('config')}
                  >
                    <Settings className="h-4 w-4" />
                    配置
                  </button>
                </div>

                <div className={`${tab === 'config' ? 'flex-1 overflow-y-auto p-8' : 'hidden'}`}>
                  <MCPConfigForm />
                  <CopilotFEPlugin />
                </div>

                <div className={`${tab === 'artifacts' ? 'flex-1 overflow-y-auto' : 'hidden'}`}>
                  <ArtifactsWrapper />
                </div>
              </div>
            </section>
          </div>
        </CopilotKit>
      </ResourceProvider>
    </ArtifactsProvider>
  );
}
