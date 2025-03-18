import { InputProps } from "@copilotkit/react-ui";
import { ArrowUpFromDot, Eraser } from "lucide-react";
export default function CopilotInput({
  inProgress,
  onSend,
  onReset,
}: InputProps & { onReset?: () => void }) {
  const handleSubmit = (value: string) => {
    if (value.trim()) onSend(value);
  };

  const wrapperStyle =
    "flex flex-col items-center gap-2 p-4 rounded-4xl border border-gray-200 bg-white shadow-xs";
  const inputStyle =
    "w-full flex-1 px-2 pb-2.5 pt-1 rounded-lg focus:outline-none transition-all duration-200 disabled:bg-gray-50 placeholder-gray-400";
  const buttonStyle =
    "w-8 h-8 flex-none rounded-full border text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer";

  return (
    <section
      className="px-8 pb-4"
      style={{
        fontFamily: "'LXGW WenKai Light'",
      }}
    >
      <div className={wrapperStyle}>
        <input
          disabled={inProgress}
          type="text"
          placeholder={`${
            globalThis.navigator?.platform?.toLowerCase?.()?.includes?.("mac")
              ? "⌘"
              : "Ctrl"
          } + Enter 向 Agent 发送信息`}
          className={inputStyle}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              handleSubmit(e.currentTarget.value);
              e.currentTarget.value = "";
            }
          }}
        />
        <div className="w-full flex">
          <button
            onClick={onReset}
            className={buttonStyle}
            disabled={inProgress}
            aria-label="Reset chat"
          >
            <Eraser size={16} />
          </button>
          <div className="flex-1"></div>
          <button
            disabled={inProgress}
            className={buttonStyle + " bg-gray-50"}
            onClick={(e) => {
              const input = e.currentTarget
                .previousElementSibling as HTMLInputElement;
              handleSubmit(input.value);
              input.value = "";
            }}
            aria-label="Send message"
          >
            <ArrowUpFromDot size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
