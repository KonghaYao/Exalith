"use client";
import React, { useState, useEffect, useRef } from "react";
import { Alert } from "antd";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { PreviewProps } from "../PreviewComponents";

import "@js-preview/excel/lib/index.css";

export const ExcelPreview: React.FC<PreviewProps> = ({
  data,
  type,
  fileName,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const previewExcelFile = async () => {
    const { default: jsPreviewExcel } = await import("@js-preview/excel");
    try {
      setLoading(true);

      if (!containerRef.current) {
        throw new Error("Excel preview container not found.");
      }

      const file =
        data instanceof File
          ? data
          : new File([data], fileName || "file.xlsx", {
              type:
                type ||
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

      const excelPreviewer = jsPreviewExcel.init(containerRef.current);
      await excelPreviewer.preview(file);
      setError(null);
    } catch (err) {
      console.error("Error previewing Excel file:", err);
      setError(
        "Unable to preview the Excel file. Ensure it is a valid Excel file.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (data && containerRef.current) {
      previewExcelFile();
    }
  }, [data, type, fileName]);

  if (error) {
    return (
      <div className="p-6">
        <Alert
          message="预览错误"
          description={error}
          type="error"
          showIcon
          className="shadow-sm"
          icon={<FileSpreadsheet className="text-red-500" size={24} />}
        />
      </div>
    );
  }

  return (
    <>
      {loading && (
        <div className="flex items-center justify-center h-full p-8 bg-white/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-primary" size={32} />
            <span className="text-gray-600">正在加载Excel文件...</span>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full bg-white rounded-lg" />
    </>
  );
};

export default ExcelPreview;
