import { useState } from "react";
import { Input, Space } from "antd";
import { CustomButton } from "./CustomButton";
import {
  Edit,
  FileText,
  Languages,
  Maximize,
  Minimize,
  Check,
  CheckCircle,
  X,
} from "lucide-react";

const processTypeIcons: Record<ProcessType, React.ReactNode> = {
  summarize: <FileText size={16} />,
  translate: <Languages size={16} />,
  expand: <Maximize size={16} />,
  shorten: <Minimize size={16} />,
  fix: <Check size={16} />,
};
import { useStreamResponse } from "../hooks/useStreamResponse";

type ProcessType = "summarize" | "translate" | "expand" | "shorten" | "fix";

const systemPrompts: Record<ProcessType, string> = {
  summarize: `作为文本总结助手，专注于提取文本的核心要点和主要信息。生成简洁明了的总结，确保保留关键信息的同时减少冗余内容。仅返回总结后的内容，无需其他内容。`,
  translate: `作为翻译助手，专注于准确翻译用户提供的文本。注重保持原文的语气和风格，同时确保翻译的自然流畅。将文本翻译成中文，仅返回翻译后的内容，无需其他内容。`,
  expand: `作为文本扩展助手，专注于丰富和扩展用户提供的文本。通过添加相关细节、例子和解释来扩充内容，使文本更加全面和深入。仅返回扩展后的内容，无需其他内容。`,
  shorten: `作为文本精简助手，专注于压缩和精简用户提供的文本。保留核心信息的同时删除冗余内容，使文本更加简洁。仅返回精简后的内容，无需其他内容。`,
  fix: `作为语法修复助手，专注于改进文本的语法和表达。纠正语法错误，优化句子结构，使文本更加规范和专业。仅返回修复后的内容，无需其他内容。`,
};

const processTypeLabels: Record<ProcessType, string> = {
  summarize: "总结文本",
  translate: "翻译文本",
  expand: "扩展文本",
  shorten: "精简文本",
  fix: "修复语法",
};

export const PromptPro = ({
  value,
  onApply,
  visible,
  onClose,
}: {
  value: string;
  onApply?: (text: string) => void;
  visible?: boolean;
  onClose?: () => void;
}) => {
  const [processedText, setProcessedText] = useState(value);
  const [processType, setProcessType] = useState<ProcessType>("expand");
  const { loading, fetchStreamResponse } = useStreamResponse();

  const handleProcess = async () => {
    const requestBody = {
      messages: [
        {
          role: "system",
          content:
            systemPrompts[processType] +
            ` \n\n <my-prompt>标签内的内容是用户的提示词</my-prompt>\n 不需要返回 <my-prompt> 标签`,
        },
        {
          role: "user",
          content: `请优化这个提示词： \n\n <my-prompt>${value}</my-prompt>`,
        },
      ],
      temperature: 0.1,
    };

    await fetchStreamResponse("/api/chat", requestBody, {
      onData: setProcessedText,
      onError: () => {},
    });
  };

  return (
    <Space
      className={`absolute z-50 bottom-0 left-0 right-0 border border-gradient-cool rounded-4xl shadow-2xl p-4 bg-white transition-all duration-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
      direction="vertical"
      style={{
        width: "100%",
        marginBottom: "2rem",
        zIndex: 50,
      }}
      size="middle"
    >
      <Input.TextArea
        variant="borderless"
        placeholder="点击优化按钮，可以生成优化后的提示词"
        disabled={loading}
        value={processedText}
        onChange={(e) => setProcessedText(e.target.value)}
        autoSize={{ minRows: 3, maxRows: 6 }}
      />
      <div className="flex items-center gap-2 border-t pt-4">
        {Object.entries(processTypeLabels).map(([type, label]) => (
          <CustomButton
            key={type}
            size="small"
            icon={processTypeIcons[type as ProcessType]}
            onClick={() => {
              setProcessType(type as ProcessType);
              handleProcess();
            }}
            loading={loading && processType === type}
            disabled={loading}
          >
            {label}
          </CustomButton>
        ))}
        <div className="flex-1"></div>
        <CustomButton
          size="small"
          icon={<CheckCircle size={16} />}
          onClick={() => {
            onApply?.(processedText);
            setProcessedText("");
          }}
          disabled={loading}
          type="primary"
        >
          应用
        </CustomButton>
        <CustomButton size="small" icon={<X size={16} />} onClick={onClose}>
          关闭
        </CustomButton>
      </div>
    </Space>
  );
};
