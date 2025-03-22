import { ResponseButtonProps } from "@copilotkit/react-ui";
import { CirclePause } from "lucide-react";

export default function (props: ResponseButtonProps) {
  return (
    <>
      {props.inProgress && (
        <button
          className="mx-auto border border-green-50 bg-white text-green-800 rounded-3xl py-2 cursor-pointer w-fit px-4 transition-colors duration-200 flex items-center"
          onClick={props.onClick}
        >
          <CirclePause className="mr-2 w-5 h-5"></CirclePause>
          停止生成
        </button>
      )}
    </>
  );
}
