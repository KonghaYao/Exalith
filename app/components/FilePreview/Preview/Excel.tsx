import React, { useState, useEffect } from "react";
import { Table, Tabs, Alert } from "antd";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { PreviewProps } from "../PreviewComponents";

export const ExcelPreview: React.FC<PreviewProps> = ({
  data,
  type,
  fileName,
}) => {
  const [sheets, setSheets] = useState<
    {
      name: string;
      rows: any[][];
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const parseExcelFile = async () => {
      try {
        setLoading(true);

        const { default: readXlsxFile, readSheetNames } = await import(
          "read-excel-file"
        );

        const file =
          data instanceof File
            ? data
            : new File([data], fileName || "file.xlsx", {
                type:
                  type ||
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              });

        const sheets = await readSheetNames(file);
        const parsedSheets = await Promise.all(
          sheets.map(async (sheet) => {
            const rows = await readXlsxFile(file, { sheet });
            return {
              name: sheet,
              rows: rows,
            };
          }),
        );
        setSheets(parsedSheets);
        setError(null);
      } catch (err) {
        console.error("Error parsing Excel file:", err);
        setError(
          "Unable to preview the Excel file. Ensure it is a valid Excel file.",
        );
        setSheets([]);
      } finally {
        setLoading(false);
      }
    };

    if (data) {
      parseExcelFile();
    }
  }, [data, type, fileName]);

  const generateColumns = (rows: any[][]) => {
    if (rows.length === 0) return [];

    return rows[0].map((header, index) => ({
      title: (
        <div className="font-semibold text-gray-700 whitespace-normal break-words min-w-[120px] px-2">
          {header || `Column ${index + 1}`}
        </div>
      ),
      dataIndex: index,
      key: index,
      width: 180, // Set a default width
      render: (text: any) => {
        // Handle different data types
        if (text === null || text === undefined) {
          return <span className="text-gray-400 min-w-[120px] block">-</span>;
        }

        // Convert to string and handle line breaks
        const displayText = String(text);
        return (
          <div
            className="whitespace-normal break-words min-w-[120px] min-h-[40px] flex items-center px-2"
            style={{
              maxHeight: "200px",
              overflow: "auto",
            }}
          >
            {displayText.split("\n").map((line, idx) => (
              <React.Fragment key={idx}>
                {line}
                {idx < displayText.split("\n").length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
        );
      },
      onCell: () => ({
        style: {
          whiteSpace: "normal",
          wordWrap: "break-word",
          minWidth: "120px",
          padding: "8px",
        },
      }),
    }));
  };

  const transformRows = (rows: any[][]) => {
    return rows.slice(1).map((row, index) => {
      const transformedRow = row.reduce((acc, cell, colIndex) => {
        acc[colIndex] = cell;
        return acc;
      }, {});
      transformedRow.key = index;
      return transformedRow;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-lg text-gray-500">
        <Loader2 className="mr-2 animate-spin" size={24} />
        Loading file...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert
          message="Preview Error"
          description={error}
          type="error"
          showIcon
          icon={<FileSpreadsheet className="text-red-500" size={20} />}
        />
      </div>
    );
  }

  if (sheets.length === 0) {
    return (
      <div className="p-4">
        <Alert
          message="No Data"
          description="No sheets found in the file."
          type="warning"
          showIcon
          icon={<FileSpreadsheet className="text-yellow-500" size={20} />}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 bg-gray-50 rounded-lg shadow-sm">
      <Tabs
        type="card"
        tabBarStyle={{
          marginBottom: "16px",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        {sheets.map((sheet) => (
          <Tabs.TabPane tab={sheet.name} key={sheet.name}>
            <div className="mb-4 text-gray-700 flex items-center text-lg font-semibold">
              <FileSpreadsheet className="mr-2 text-green-600" size={24} />
              {sheet.name} Sheet
            </div>
            <Table
              columns={
                generateColumns(
                  sheet.rows,
                ) as import("antd/lib/table").ColumnType<any>[]
              }
              dataSource={transformRows(sheet.rows)}
              scroll={{ x: true, y: 400 }}
              pagination={{
                pageSize: 50,
                showSizeChanger: true,
                pageSizeOptions: ["10", "50", "100"],
                showTotal: (total) => `Total ${total} rows`,
                size: "default",
              }}
              bordered
              size="middle"
              className="bg-white rounded-lg shadow-sm"
              rowClassName={(record, index) =>
                index % 2 === 0 ? "bg-gray-50" : "bg-white"
              }
            />
          </Tabs.TabPane>
        ))}
      </Tabs>
    </div>
  );
};

export default ExcelPreview;
