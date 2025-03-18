"use client";

import { useEffect, useState } from "react";
import { DefaultInstructions } from "../DefaultInstructions";

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (instructions: string) => void;
  defaultInstructions: string;
}

export function InstructionsModal({
  isOpen,
  onClose,
  onSave,
  defaultInstructions,
}: InstructionsModalProps) {
  const [instructions, setInstructions] = useState(defaultInstructions);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0  z-50 flex items-center justify-center">
      <div className="bg-white border rounded-lg p-6 w-full max-w-2xl mx-4">
        <h2 className="text-xl font-semibold mb-4">助手角色</h2>
        <textarea
          className="w-full h-48 p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="输入自定义指令..."
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setInstructions(DefaultInstructions)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            还原
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            取消
          </button>
          <button
            onClick={() => {
              onSave(instructions);
              onClose();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
