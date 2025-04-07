"use client"; // only necessary if you are using Next.js with the App Router.
import { useCopilotAction } from "@copilotkit/react-core";
export function CopilotInterrupt(props: { enable?: boolean }) {
  useCopilotAction({
    name: "interrupt",
    description: "",
    parameters: [
      {
        name: "message",
        type: "string",
        description: "展示的原因",
        required: true,
      },
    ],
    available: props.enable ? "enabled" : "disabled",
    renderAndWaitForResponse: ({ status, args, respond }) => {
      return (
        <div className="border rounded-lg shadow-sm p-4 bg-white">
          <div className="text-sm text-gray-500 mb-2">
            {args.message!}
            <button onClick={() => respond?.("")}>确认</button>
            <button onClick={() => respond?.("重试")}>重试</button>
          </div>
        </div>
      );
    },
  });
}
