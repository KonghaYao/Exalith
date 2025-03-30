"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { message } from "antd";

type CopyButtonProps = {
  text: string;
  className?: string;
};

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  className = "",
}) => {
  const [isCopying, setIsCopying] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCopying(true);
    navigator.clipboard
      .writeText(text)
      .then(() => {
        message.success("已复制到剪贴板");
        setIsCopying(false);
      })
      .catch(() => {
        message.error("复制失败");
        setIsCopying(false);
      });
  };

  return (
    <button
      className={`text-gray-500 hover:text-gray-900 cursor-pointer hover:bg-gray-200  focus:outline-none transition-colors px-1 rounded ${className}`}
      onClick={handleCopy}
      disabled={isCopying}
    >
      <Copy className={`h-4 w-4 ${isCopying ? "text-gray-400" : ""}`} />
    </button>
  );
};
