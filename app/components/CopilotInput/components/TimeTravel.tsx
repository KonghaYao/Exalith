import { useCopilotMessagesContext } from "@copilotkit/react-core";
import { useTimeTravel } from "../../../hooks/useTimeTravel";
import { useEffect } from "react";
import { SkipBack, SkipForward } from "lucide-react";

export function useCopilotMessageTimeTravel() {
  const { messages, setMessages } = useCopilotMessagesContext();
  const {
    pushState,
    state,
    undo,
    redo,
    canUndo,
    canRedo,
    setCurrentIndex,
    history,
    currentIndex,
  } = useTimeTravel(messages, {
    getKey(messages) {
      return messages
        .filter((i) => i.type === "TextMessage" && i.status.code === "Success")
        .map((i) => (i as any).threadId || i.id)
        .join("");
    },
    onStateChange(state) {
      setMessages(state);
    },
  });
  useEffect(() => {
    if (
      currentIndex === history.length - 1 &&
      messages !== state &&
      messages[messages.length - 1] &&
      messages[messages.length - 1].status.code === "Success"
      //   messages[messages.length - 1].isTextMessage()
    ) {
      pushState(messages);
    }
  }, [messages, pushState]);
  return {
    undo,
    redo,
    canUndo,
    canRedo,
    setCurrentIndex,
    history,
    currentIndex,
  };
}

export const TimeTravel = (props: { inProgress: boolean }) => {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    setCurrentIndex,
    history,
    currentIndex,
  } = useCopilotMessageTimeTravel();

  if (history.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 mb-4 border-gradient-cool rounded-4xl ">
      <button
        onClick={undo}
        disabled={!canUndo || props.inProgress}
        className=" w-8 h-8 flex-none rounded-full disabled:opacity-50 hover:bg-gray-200/70 transition-colors"
        title="后退"
      >
        <SkipBack size={14} className="text-gray-700" />
      </button>
      <button
        onClick={redo}
        disabled={!canRedo || props.inProgress}
        className=" w-8 h-8 flex-none rounded-full disabled:opacity-50 hover:bg-gray-200/70 transition-colors"
        title="前进"
      >
        <SkipForward size={14} className="text-gray-700" />
      </button>
      <div className="flex items-center gap-3 flex-1 translate-y-0.5 pr-4">
        <span className="text-xs font-medium text-gray-500 tabular-nums min-w-[3em]">
          {currentIndex + 1}/{history.length}
        </span>
        <input
          type="range"
          min={0}
          max={history.length - 1}
          value={currentIndex}
          onChange={(e) => setCurrentIndex(Number(e.target.value))}
          className="flex-1 h-1 bg-gray-200 rounded-lg  cursor-pointer disabled:opacity-50"
          disabled={props.inProgress}
        />
      </div>
    </div>
  );
};
