"use client"; // only necessary if you are using Next.js with the App Router.
import { useCopilotAction } from "@copilotkit/react-core";
import mermaid from "mermaid";
mermaid.initialize({ startOnLoad: false });

const drawDiagram = async function (
  element: HTMLElement,
  graphDefinition: string
) {
  const { svg } = await mermaid.render("graphDiv", graphDefinition);
  element.innerHTML = svg;
};

interface CopilotMermaidProps {
  children?: React.ReactNode;
}

export function CopilotMermaid({ children }: CopilotMermaidProps) {
  useCopilotAction({
    name: "showMermaidDiagram",
    description: "Displays a Mermaid diagram",
    parameters: [
      {
        name: "mermaid_code",
        type: "string",
        description: "用于展示的 mermaid 代码",
        required: true,
      },
    ],
    render: ({ status, args }) => {
      const { mermaid_code } = args;

      if (status === "inProgress") {
        return (
          <div className="flex items-center justify-center p-4">
            <div className="h-6 w-6 bg-blue-600 rounded-full animate-pulse"></div>
            <span className="ml-3 text-gray-600">加载中</span>
          </div>
        );
      }

      return (
        <div
          ref={(element) => {
            if (element && mermaid_code) {
              drawDiagram(element, mermaid_code).catch((e) => {
                console.error("Failed to render Mermaid diagram:", e);
                element.innerHTML =
                  '<div style="color: red;">图表渲染失败</div>';
              });
            }
          }}
        />
      );
    },
  });

  return <>{children}</>;
}
