import { useEffect, useState } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import Papa from "papaparse";
import { PreviewProps } from "../PreviewComponents";


interface DataType {
    [key: string]: string;
}

export default function CSVPreview({ data }: PreviewProps) {
    const [csvData, setCsvData] = useState<DataType[]>([]);
    const [columns, setColumns] = useState<ColumnsType<DataType>>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const parseCSV = async () => {
            try {

                Papa.parse(new File([data], 'temp.csv') as any, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        if (results.errors.length > 0) {
                            setError("Failed to parse CSV file: " + results.errors[0].message);
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
                    error: (error: Papa.ParseError) => {
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
        <div className="overflow-auto h-full">
            <Table
                columns={columns}
                dataSource={csvData}
                scroll={{ x: "max-content", y: "calc(100vh - 200px)" }}
                pagination={false}
                size="small"
            />
        </div>
    );
} 