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
          className="w-6 h-6 text-gray-500"
        >
          <path
            fillRule="evenodd"
            d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <input
        disabled={inProgress}
        type="text"
        placeholder={`${
          navigator.platform.toLowerCase().includes("mac") ? "⌘" : "Ctrl"
        } + Enter 提交`}
        className={inputStyle}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            handleSubmit(e.currentTarget.value);
            e.currentTarget.value = "";
          }
        }}
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
