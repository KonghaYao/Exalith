"use client";

import { useState } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotActionHandler } from "./components/CopilotActionHandler";
import { FileSystemProvider } from "./components/FileManager/FileSystemContext";
import { FilePreviewProvider } from "./components/FilePreview/FilePreviewContext";
import { TabProvider } from "./components/TabContext";
import { ChatSection } from "./components/ChatSection";
import { MainSection } from "./components/MainSection";
import { MCPConfigProvider } from "./contexts/MCPConfigContext";
import { GlobalDropZone } from "./components/GlobalDropZone";
import "@ant-design/v5-patch-for-react-19";
import { UnionContext } from "./components/Artifacts/UnionContext";

function Home() {
  const [chatKey, setChatKey] = useState(0);

  return (
    <FileSystemProvider key={chatKey}>
      <FilePreviewProvider key={chatKey}>
        <UnionContext>
          <CopilotKit
            runtimeUrl="/api/copilotkit"
            showDevConsole={false}
            key={chatKey}
            agent="llm_agent"
          >
            <MCPConfigProvider>
              <GlobalDropZone>
                <div className="min-h-screen flex relative">
                  <MainSection />
                  <ChatSection chatKey={chatKey} setChatKey={setChatKey} />
                  <CopilotActionHandler />
                </div>
              </GlobalDropZone>
            </MCPConfigProvider>
          </CopilotKit>
        </UnionContext>
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
