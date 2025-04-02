"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { ToolCallRenderer } from "./Action/ToolCallRenderer";

export const CopilotActionHandler: React.FC = () => {
  // useCoAgentStateRender({
  //   name: "llm_agent",
  //   render: (context) => <div>

  //   </div>,
  // });
  // add a custom action renderer for all actions
  useCopilotAction({
    name: "*",
    render: ({ name, args, status, result }: any) => {
      return (
        <ToolCallRenderer
          name={name}
          args={args}
          status={status || "unknown"}
          result={result}
        />
      );
    },
  });

  // Return null as this component doesn't render anything visible
  return null;
};
