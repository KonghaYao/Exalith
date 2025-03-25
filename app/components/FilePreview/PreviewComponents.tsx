import { useEffect, useState } from "react";

export interface PreviewProps {
  data: Blob;
  type?: string;
  fileName?: string;
}

// 文本预览组件
export const TextPreview = ({ data, fileName }: PreviewProps) => {
  const [content, setContent] = useState<string>("");
  const [language, setLanguage] = useState<string>("text");
  const [isTooBig, setIsTooBig] = useState<boolean>(false);

  useEffect(() => {
    const MAX_FILE_SIZE = 512 * 1024; // 10MB
    if (data.size > MAX_FILE_SIZE) {
      setIsTooBig(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setContent(e.target?.result as string);
    };
    reader.readAsText(data);

    // 根据文件扩展名设置语言
    if (fileName) {
      const ext = fileName.split(".").pop()?.toLowerCase();
      switch (ext) {
        case "js":
        case "jsx":
          setLanguage("javascript");
          break;
        case "ts":
        case "tsx":
          setLanguage("typescript");
          break;
        case "py":
          setLanguage("python");
          break;
        case "json":
          setLanguage("json");
          break;
        case "html":
          setLanguage("html");
          break;
        case "css":
          setLanguage("css");
          break;
        default:
          setLanguage("text");
      }
    }
  }, [data, fileName]);

  if (isTooBig) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        文件过大（超过512KB），无法预览
      </div>
    );
  }

  return <div className="w-full h-full overflow-auto">{content}</div>;
};

// 图片预览组件
export const ImagePreview = ({ data }: PreviewProps) => {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    const imageUrl = URL.createObjectURL(data);
    setUrl(imageUrl);
    return () => URL.revokeObjectURL(imageUrl);
  }, [data]);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      {url && (
        <img
          src={url}
          alt="preview"
          className="max-w-full max-h-full object-contain"
        />
      )}
    </div>
  );
};

// 图片预览组件
export const ExcelPreview = ({ data }: PreviewProps) => {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    const imageUrl = URL.createObjectURL(data);
    setUrl(imageUrl);
    return () => URL.revokeObjectURL(imageUrl);
  }, [data]);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      {url && (
        <img
          src={url}
          alt="preview"
          className="max-w-full max-h-full object-contain"
        />
      )}
    </div>
  );
};

// PDF预览组件
export const PDFPreview = ({ data }: PreviewProps) => {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    const pdfUrl = URL.createObjectURL(data);
    setUrl(pdfUrl);
    return () => URL.revokeObjectURL(pdfUrl);
  }, [data]);

  return (
    <div className="w-full h-full">
      <iframe src={url} className="w-full h-full" title="PDF Preview" />
    </div>
  );
};

// 音视频预览组件
export const MediaPreview = ({ data, type }: PreviewProps) => {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    const mediaUrl = URL.createObjectURL(data);
    setUrl(mediaUrl);
    return () => URL.revokeObjectURL(mediaUrl);
  }, [data]);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      {type?.startsWith("video") ? (
        <video src={url} controls className="max-w-full max-h-full">
          Your browser does not support the video tag.
        </video>
      ) : (
        <audio src={url} controls className="w-full">
          Your browser does not support the audio tag.
        </audio>
      )}
    </div>
  );
};
