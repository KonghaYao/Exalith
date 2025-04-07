"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import { useState } from "react";
import CopilotInput from "./CopilotInput";
import { InstructionsModal } from "./InstructionsModal";
import { DefaultInstructions } from "../DefaultInstructions";
import { SelectedFileGroup } from "./FileManager/SelectedFileGroup";
import UserMessage from "./UserMessage";
import { Settings } from "lucide-react";
export function ChatSection({
  chatKey,
  setChatKey,
}: {
  chatKey: number;
  setChatKey: (k: (k: number) => number) => void;
}) {
  const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false);
  const [instructions, setInstructions] = useState(DefaultInstructions);

  return (
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
          className="absolute top-4 left-4 z-10 p-2 text-gray-600 hover:text-gray-800 "
          aria-label="自定义指令"
        >
          <Settings></Settings>
        </button>
        <CopilotChat
          className="h-screen flex flex-col "
          key={chatKey}
          UserMessage={UserMessage}
          Input={(props) => (
            <CopilotInput {...props} onReset={() => setChatKey((k) => k + 1)}>
              <SelectedFileGroup></SelectedFileGroup>
            </CopilotInput>
          )}
          instructions={instructions}
          labels={{
            title: "MCP 助手",
            stopGenerating: "停止生成",
            regenerateResponse: "重新生成",
          }}
        />
      </div>
    </section>
  );
}
