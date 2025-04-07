import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import { CopilotImageGen } from "./ImageGen";
import { CopilotInterrupt } from "./Interrupt";
export const plugins = [
  // {
  //   name: "select_buttons",
  //   code: "select_buttons",
  //   description: "选择列表",
  //   component: CopilotSelectButton,
  // },
  // {
  //   name: "preview_file",
  //   code: "preview_file",
  //   description: "预览远程文件",
  //   component: CopilotPreview,
  // },
  {
    name: "generate_image",
    code: "generate_image",
    description: "文生图",
    component: CopilotImageGen,
  },
  {
    name: "interrupt",
    code: "interrupt",
    description: "中断组件",
    component: CopilotInterrupt,
  },
];
export const CopilotFEPlugin = () => {
  const [selectedPlugins, setSelectedPlugins] = useLocalStorage<string[]>(
    "mcp-selected-plugins",
    plugins.map((i) => i.code),
  );
  return (
    <div className="grid  grid-cols-2 gap-4 p-4">
      {plugins.map((plugin) => {
        const isSelected = selectedPlugins.includes(plugin.code);
        plugin.component({ enable: isSelected });
        return (
          <div
            key={plugin.code}
            className={`p-4 rounded-lg transition-all cursor-pointer bg-white border shadow-sm`}
            onClick={() => {
              setSelectedPlugins(
                isSelected
                  ? selectedPlugins.filter((name) => name !== plugin.code)
                  : [...selectedPlugins, plugin.code],
              );
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800">
                {plugin.code}
              </h3>
              <div
                className={`w-4 h-4 flex items-center justify-center rounded-full ${
                  isSelected ? "bg-green-500" : "bg-gray-200"
                }`}
              >
                {isSelected && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-4">{plugin.description}</p>
          </div>
        );
      })}
    </div>
  );
};
