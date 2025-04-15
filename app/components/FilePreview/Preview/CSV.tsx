"use client";
import { useEffect, useState, useRef } from "react";
import { Table } from "antd";
import type { ColumnType } from "antd/es/table";
import Papa from "papaparse";
import { PreviewProps } from "../PreviewComponents";

interface DataType {
  [key: string]: string;
}

export default function CSVPreview({ data }: PreviewProps) {
  const [columns, setColumns] = useState<ColumnType<DataType>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dataRef = useRef<DataType[]>([]);
  const [displayCount, setDisplayCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tableHeight, setTableHeight] = useState(0);

  useEffect(() => {
    const updateTableHeight = () => {
      if (containerRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        const infoHeight = 48; // 底部信息栏高度
        const headerHeight = 39; // 表头高度
        const newHeight = containerHeight - infoHeight - headerHeight;
        setTableHeight(newHeight);
      }
    };

    updateTableHeight();
    window.addEventListener('resize', updateTableHeight);

    return () => {
      window.removeEventListener('resize', updateTableHeight);
    };
  }, []);

  useEffect(() => {
    let isFirstChunk = true;
    let headers: string[] = [];

    const parseCSV = async () => {
      try {
        Papa.parse(new File([data], "temp.csv") as any, {
          header: true,
          skipEmptyLines: true,
          step: (results) => {
            if (isFirstChunk) {
              // 处理第一块数据，设置列
              headers = results.meta.fields || [];
              const newColumns = headers.map((header, index) => ({
                title: header,
                dataIndex: header,
                key: index.toString(),
                width: 150,
              }));
              setColumns(newColumns);
              isFirstChunk = false;
            }

            // 添加新数据
            if (results.data) {
              const newRow = {
                ...results.data,
                key: dataRef.current.length.toString(),
              };
              dataRef.current.push(newRow);
              // 每1000行更新一次显示
              if (dataRef.current.length % 1000 === 0) {
                setDisplayCount(dataRef.current.length);
              }
            }
          },
          complete: () => {
            setDisplayCount(dataRef.current.length);
            setIsLoading(false);
          },
          error: (error) => {
            setError("Failed to parse CSV file: " + error.message);
            setIsLoading(false);
          },
        });
      } catch (err) {
        setError("Failed to read CSV file");
        console.error("CSV parsing error:", err);
        setIsLoading(false);
      }
    };

    parseCSV();

    return () => {
      // 清理数据
      dataRef.current = [];
      setDisplayCount(0);
    };
  }, [data]);

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div ref={containerRef} className="h-full w-full flex flex-col">
      <div className="flex-1">
        <Table
          columns={columns}
          dataSource={dataRef.current}
          scroll={{ y: tableHeight }}
          pagination={false}
          size="small"
          bordered
          virtual
          loading={isLoading}
        />
      </div>
      <div className="text-gray-500 p-4">
        {columns.length} 列 {dataRef.current.length} 行
      </div>
    </div>
  );
}
