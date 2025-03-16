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

export function CopilotMermaid(props: { enable?: boolean }) {
  useCopilotAction({
    name: "绘制 Mermaid 图",
    description: "绘制 Mermaid 图",
    parameters: [
      {
        name: "mermaid_code",
        type: "string",
        description: "用于展示的 mermaid 代码",
        required: true,
      },
    ],
    available: props.enable ? "enabled" : "disabled",
    render: ({ status, args }) => {
      const { mermaid_code } = args;

      if (status === "inProgress") {
        return (
          <div className="flex items-center justify-center p-4 border rounded-lg shadow-sm bg-white">
            <div className="h-6 w-6 bg-blue-600 rounded-full animate-pulse"></div>
            <span className="ml-3 text-gray-600">加载中</span>
          </div>
        );
      }

      return (
        <div className="border rounded-lg shadow-sm p-4 bg-white">
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
        </div>
      );
    },
  });
}
