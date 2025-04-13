import { useEffect, useState } from "react";
// import { Table } from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import Papa from "papaparse";
import { PreviewProps } from "../PreviewComponents";

interface DataType {
  [key: string]: string;
}

const CustomTable = ({
  columns,
  dataSource,
}: {
  columns: ColumnType<DataType>[];
  dataSource: DataType[];
}) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-white shadow-sm z-10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b border-gray-200"
                  style={{ width: column.width }}
                >
                  {typeof column.title === "function"
                    ? column.title({})
                    : column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataSource.map((row, rowIndex) => (
              <tr
                key={row.key}
                className={`${rowIndex % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-gray-100`}
              >
                {columns.map((column) => (
                  <td
                    key={`${row.key}-${column.dataIndex}`}
                    className="px-4 py-2 text-sm text-gray-600 border-b border-gray-200"
                  >
                    {column.dataIndex ? row[column.dataIndex as string] : ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function CSVPreview({ data }: PreviewProps) {
  const [csvData, setCsvData] = useState<DataType[]>([]);
  const [columns, setColumns] = useState<ColumnType<DataType>[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const parseCSV = async () => {
      try {
        Papa.parse(new File([data], "temp.csv") as any, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              setError(
                "Failed to parse CSV file: " + results.errors[0].message,
              );
              return;
            }

            if (!results.data || results.data.length === 0) {
              setError("CSV file is empty");
              return;
            }

            // 生成列配置
            const headers = results.meta.fields || [];
            const newColumns = headers.map((header, index) => ({
              title: header,
              dataIndex: header,
              key: index.toString(),
              width: 150,
            }));
            setColumns(newColumns);

            // 生成数据
            const newData = results.data.map((row: any, rowIndex) => ({
              ...row,
              key: rowIndex.toString(),
            }));
            setCsvData(newData);
          },
          error: (error) => {
            setError("Failed to parse CSV file: " + error.message);
          },
        });
      } catch (err) {
        setError("Failed to read CSV file");
        console.error("CSV parsing error:", err);
      }
    };

    parseCSV();
  }, [data]);

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (csvData.length === 0) {
    return <div className="text-gray-500 p-4">Loading CSV data...</div>;
  }

  return (
    <div className="h-full">
      <CustomTable columns={columns} dataSource={csvData} />
    </div>
  );
}
