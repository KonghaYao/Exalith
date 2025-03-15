import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import * as XLSX from "xlsx";

const resourcePathToDistPath = (resourcePath: string) => {
  const url = new URL(resourcePath);

  return "." + url.pathname;
};

const server = new McpServer(
  {
    name: "表单工具",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 获取Excel文件中的表名称
server.tool(
  "get_sheet_names",
  "获取文件中的所有表名称",
  {
    /** file:///excel/test.xlsx */
    filePath: z.string(),
  },
  async (args) => {
    const workbook = XLSX.readFile(resourcePathToDistPath(args.filePath));
    return {
      content: [
        {
          type: "text",
          text: `该文件包含以下工作表：\n${workbook.SheetNames.join("\n")}`,
        },
      ],
    };
  }
);

// 获取Excel文件中的前五行数据
server.tool(
  "get_first_five_rows",
  "获取文件中指定工作表的前五行数据",
  {
    filePath: z.string(),
    sheetName: z.string(),
  },
  async (args) => {
    const workbook = XLSX.readFile(resourcePathToDistPath(args.filePath));
    const worksheet = workbook.Sheets[args.sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      rawNumbers: false,
    });
    const firstFiveRows = json.slice(0, 5);
    return {
      content: [
        {
          type: "text",
          text: `该文件中${
            args.sheetName
          }工作表的前五行数据如下：\n${firstFiveRows
            .map((row) => (row as string[]).join(", "))
            .join("\n")}`,
        },
      ],
    };
  }
);

export default server;
