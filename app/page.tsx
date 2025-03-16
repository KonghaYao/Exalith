"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import { CopilotActionHandler } from "./components/CopilotActionHandler";
import { CopilotKitCSSProperties } from "@copilotkit/react-ui";
import { MCPConfigForm } from "./components/MCPConfigForm";
import { useState } from "react";
import CopilotInput from "./components/CopilotInput";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotMermaid } from "./components/CopilotMermaid";
import { InstructionsModal } from "./components/InstructionsModal";
import { DefaultInstructions } from "./DefaultInstructions";

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false);
  const [instructions, setInstructions] = useState(DefaultInstructions);

  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      showDevConsole={false}
      key={chatKey}
    >
      <CopilotMermaid></CopilotMermaid>
      <div className="min-h-screen bg-gray-50 flex relative">
        {/* Client component that sets up the Copilot action handler */}
        <CopilotActionHandler />

        {/* Main content area */}
        <div className="flex-1 p-4 md:p-8">
          <MCPConfigForm />
        </div>

        {/* Fixed sidebar - hidden on mobile, shown on larger screens */}
        <div className="relative min-w-[40vw] flex-none">
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
          <CopilotChat
            className="h-full flex flex-col "
            key={chatKey}
            Input={(props) => (
              <CopilotInput
                {...props}
                onReset={() => setChatKey((k) => k + 1)}
              />
            )}
            instructions={`你是一个工作助手，你需要根据用户提出的工作，使用工具完成帮助用户的任务，尽量列举所有的数据，保证数据的真实性，不能胡编乱造假的链接。你的用户使用中文，请用中文回答。回复使用整洁美观的 markdown 语法`}
            labels={{
              title: "MCP 助手",
              initial: "需要什么帮助吗？",
            }}
          />
        </div>
      </div>
    </CopilotKit>
  );
}
