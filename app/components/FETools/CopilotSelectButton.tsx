import { useCopilotAction } from "@copilotkit/react-core";

// 单选 button
export const CopilotSelectButton = (props: { enable?: boolean }) => {
  useCopilotAction({
    name: "提供列表选择功能",
    description:
      "按钮组返回给用户（最多 10 条），用户从中选择一项，然后你提供更进一步的信息",
    parameters: [
      {
        name: "options",
        type: "string[]",
        description: "列表名称",
        required: true,
      },
    ],
    available: props.enable ? "enabled" : "disabled",
    renderAndWaitForResponse: ({ status, args, respond }) => {
      return (
        <div className={`flex flex-wrap`}>
          {args.options?.map((option: string, index: number) => {
            return (
              <button
                key={index}
                className={`px-4 py-2 m-1 text-sm font-medium rounded-lg transition-colors duration-200
                  ${
                    status === "executing"
                      ? "text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                      : "text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500 dark:border-gray-600"
                  }`}
                onClick={() => {
                  respond?.(option);
                }}
                disabled={status !== "executing"}
              >
                {option}
              </button>
            );
          })}
        </div>
      );
    },
  });
};
