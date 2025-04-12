import { Modal, Input, Button } from "antd";
import { useState } from "react";
import { useMCPConfig } from "../../../contexts/MCPConfigContext";

interface PromptProProps {
  value: string;
  onApply: (value: string) => void;
  visible: boolean;
  onClose: () => void;
}

export function PromptPro({ value, onApply, visible, onClose }: PromptProProps) {
  const [prompt, setPrompt] = useState(value);
  const agent = useMCPConfig();

  const handleApply = () => {
    onApply(prompt);
    onClose();
  };

  return (
    <Modal
      title="Prompt Pro"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="apply" type="primary" onClick={handleApply}>
          应用
        </Button>,
      ]}
    >
      <Input.TextArea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        autoSize={{ minRows: 4, maxRows: 8 }}
        placeholder="输入你的提示词..."
      />
    </Modal>
  );
} 