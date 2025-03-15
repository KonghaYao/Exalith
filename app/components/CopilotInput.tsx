import { InputProps } from "@copilotkit/react-ui";
export default function CopilotInput({
  inProgress,
  onSend,
  isVisible,
  onReset,
}: InputProps & { onReset?: () => void }) {
  const handleSubmit = (value: string) => {
    if (value.trim()) onSend(value);
  };

  const wrapperStyle =
    "flex items-center gap-2 p-4 border-t border-gray-200 bg-white shadow-sm";
  const inputStyle =
    "flex-1 px-4 py-2.5 rounded-lg focus:outline-none transition-all duration-200 disabled:bg-gray-50 placeholder-gray-400";
  const buttonStyle =
    "p-2 text-blue-500 hover:text-blue-600 active:text-blue-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer";

  return (
    <div className={wrapperStyle}>
      <button
        onClick={onReset}
        className={buttonStyle}
        disabled={inProgress}
        aria-label="Reset chat"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6"
        >
          <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
        </svg>
      </button>
      <input
        disabled={inProgress}
        type="text"
        placeholder="Ask your question here..."
        className={inputStyle}
      />
      <button
        disabled={inProgress}
        className={buttonStyle}
        onClick={(e) => {
          const input = e.currentTarget
            .previousElementSibling as HTMLInputElement;
          handleSubmit(input.value);
          input.value = "";
        }}
        aria-label="Send message"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6"
        >
          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
        </svg>
      </button>
    </div>
  );
}
