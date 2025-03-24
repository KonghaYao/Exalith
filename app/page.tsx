"use client";

import { useState } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotActionHandler } from "./components/CopilotActionHandler";
import { FileSystemProvider } from "./components/FileManager/FileSystemContext";
import { FilePreviewProvider } from "./components/FilePreview/FilePreviewContext";
import { TabProvider } from "./components/TabContext";
import { ChatSection } from "./components/ChatSection";
import { MainSection } from "./components/MainSection";

function Home() {
  const [chatKey, setChatKey] = useState(0);

  return (
    <FileSystemProvider key={chatKey}>
      <FilePreviewProvider key={chatKey}>
        <CopilotKit
          runtimeUrl="/api/copilotkit"
          showDevConsole={false}
          key={chatKey}
        >
          <div className="min-h-screen flex relative">
            <ChatSection chatKey={chatKey} setChatKey={setChatKey} />
            <CopilotActionHandler />
            <MainSection />
          </div>
        </CopilotKit>
      </FilePreviewProvider>
    </FileSystemProvider>
  );
}

export default function () {
  return (
    <TabProvider>
      <Home></Home>
    </TabProvider>
  );
}
