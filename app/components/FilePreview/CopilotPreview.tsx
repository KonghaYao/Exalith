"use client";
import { useCopilotAction } from "@copilotkit/react-core";
import { useFilePreview } from "./FilePreviewContext";
import { useEffect, useState } from "react";
import {
  TextPreview,
  ImagePreview,
  PDFPreview,
  MediaPreview,
} from "./PreviewComponents";
import ExcelPreview from "./Preview/Excel";
import CSVPreview from "./Preview/CSV";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  FileIcon,
  Loader2Icon,
} from "lucide-react";
import { useTab } from "../TabContext";
import { MarkdownPreview } from "./Preview/Markdown";
const getFileType = (filePath: string) => {
  const ext = filePath.split(".").pop()?.toLowerCase();
  if (!ext) return "unknown";

  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
  const videoExts = ["mp4", "webm", "ogg"];
  const audioExts = ["mp3", "wav", "ogg"];
  const codeExts = [
    "js",
    "jsx",
    "ts",
    "tsx",
    "py",
    "json",
    "html",
    "css",
  ];
  const excelExts = ["xlsx", "xls"];
  const csvExts = ["csv"];

  if (imageExts.includes(ext)) return "image";
  if (videoExts.includes(ext)) return "video";
  if (audioExts.includes(ext)) return "audio";
  if (ext === "pdf") return "pdf";
  if (ext === "md") return "markdown";
  if (codeExts.includes(ext)) return "code";
  if (excelExts.includes(ext)) return "excel";
  if (csvExts.includes(ext)) return "csv";
  return "text";
};
export const CopilotPreview = (props: { enable?: boolean }) => {

  useCopilotAction({
    name: "send_file_to_user",
    description:
      "发送电脑上的一个文件给用户，不需要返回在线链接",
    parameters: [
      {
        name: "filePath",
        type: "string",
        description: "预览文件路径",
        required: true,
      },
      {
        name: "fileType",
        type: "string",
        description: "文件类型，比如 text、image、video、audio",
        required: false,
      },
    ],
    available: props.enable ? "enabled" : "disabled",
    renderAndWaitForResponse: ({ status, args, respond }) => {
      const tab = useTab();
      const { previewState, preview } = useFilePreview();
      const [lastPreviewPath, setLastPreviewPath] = useState<string | null>(
        null,
      );

      useEffect(() => {
        if (
          args.filePath &&
          args.filePath !== lastPreviewPath &&
          status === "executing"
        ) {
          preview(args.filePath);
          setLastPreviewPath(args.filePath);
        }
      }, [args.filePath, lastPreviewPath, status, preview]);

      useEffect(() => {
        if (!respond || typeof respond !== "function") return;
        if (previewState.error) {
          respond({ status: "error", message: previewState.error });
        } else if (!previewState.previewData && !previewState.loading) {
          respond({ status: "empty", message: "暂无预览内容" });
        } else if (previewState.previewData) {
          console.log("done");
          respond({
            status: "done",
            message: "已经帮用户预览完成，用户已看到预览内容",
            data: {
              filePath: args.filePath,
              previewType: args.fileType,
              size: previewState.previewData?.size,
            },
          });
          tab.setTab("preview");
        }
      }, [previewState, previewState.previewData]);

      return (
        <button
          className="flex items-center gap-2 w-full h-full py-1 px-2 rounded-2xl bg-gradient-to-l from-gray-200 to-white border border-gray-300 cursor-pointer"
          disabled={!previewState.previewData}
          onClick={() => tab.setTab("preview")}
        >
          {previewState.loading ? (
            <Loader2Icon className="w-4 h-4 text-gray-500 animate-spin" />
          ) : previewState.error ? (
            <AlertCircleIcon className="w-4 h-4 text-red-500" />
          ) : previewState.previewData ? (
            <CheckCircleIcon className="w-4 h-4 text-green-500" />
          ) : (
            <FileIcon className="w-4 h-4 text-gray-500" />
          )}
          <span className="text-sm text-gray-700 truncate">
            {args.filePath}
          </span>
          {previewState.error && (
            <div className="absolute bottom-full left-0 mb-2 p-2 bg-red-100 text-red-600 text-xs rounded-md border border-red-200">
              {previewState.error}
            </div>
          )}
          {previewState.loading && (
            <div className="absolute bottom-full left-0 mb-2 p-2 bg-blue-100 text-blue-600 text-xs rounded-md border border-blue-200">
              正在加载预览...
            </div>
          )}
          {!previewState.previewData &&
            !previewState.loading &&
            !previewState.error && (
              <div className="absolute bottom-full left-0 mb-2 p-2 bg-gray-100 text-gray-600 text-xs rounded-md border border-gray-200">
                暂无预览内容
              </div>
            )}
        </button>
      );
    },
  });
};

export const PreviewComponent = () => {
  const previewFile = useFilePreview();
  const { setTab } = useTab();
  if (previewFile.previewState.loading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  if (previewFile.previewState.error) {
    return <div className="text-red-500">{previewFile.previewState.error}</div>;
  }

  if (
    !previewFile.previewState.previewData ||
    !previewFile.previewState.filePath
  ) {
    return (
      <div className="bg-gray-100 flex flex-col items-center justify-center w-full h-full text-gray-500">
        <svg
          className="w-12 h-12 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p>请选择要预览的文件</p>
        <button
          className="mt-4 px-4 py-2 bg-white border cursor-pointer rounded-md"
          onClick={() => setTab("files")}
        >
          文件列表
        </button>
      </div>
    );
  }

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-medium">
              {previewFile.previewState.filePath.split("/").pop()}
            </span>
            <span className="text-sm text-gray-500">
              {formatFileSize(previewFile.previewState.previewData.size)}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {previewFile.previewState.previewType ||
              getFileType(previewFile.previewState.filePath) ||
              "未知类型"}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {(() => {
          const type =
            previewFile.previewState.previewType ||
            getFileType(previewFile.previewState.filePath);

          switch (type) {
            case "image":
              return (
                <ImagePreview data={previewFile.previewState.previewData} />
              );
            case "video":
              return (
                <MediaPreview
                  data={previewFile.previewState.previewData}
                  type="video"
                />
              );
            case "audio":
              return (
                <MediaPreview
                  data={previewFile.previewState.previewData}
                  type="audio"
                />
              );
            case "pdf":
              return <PDFPreview data={previewFile.previewState.previewData} />;
            case "excel":
              return (
                <ExcelPreview data={previewFile.previewState.previewData} />
              );
            case "csv":
              return (
                <CSVPreview data={previewFile.previewState.previewData} />
              );
            case "markdown":
              return <MarkdownPreview data={previewFile.previewState.previewData} />;
            case "code":
            case "text":
            default:
              return (
                <TextPreview
                  data={previewFile.previewState.previewData}
                  fileName={previewFile.previewState.filePath}
                />
              );
          }
        })()}
      </div>
    </div>
  );
};
