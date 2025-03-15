import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";

const server = new McpServer(
  {
    name: "网络八爪鱼",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);
server.tool(
  "search_website",
  "全网搜索数据",
  {
    query: z.string(),
    freshness: z
      .enum(["oneDay", "oneWeek", "oneMonth", "oneYear", "noLimit"])
      .optional()
      .default("noLimit"),
    summary: z.boolean().optional().default(false),
    count: z.number().min(1).max(50).optional().default(10),
    page: z.number().min(1).optional().default(1),
  },
  async (args) => {
    const res = await fetch("https://api.langsearch.com/v1/web-search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${
          process.env.SEARCH_API_KEY || "sk-90452b2bcf294c95bcaa378586df6862"
        }`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });
    const data = await res.json();
    return {
      content: [
        {
          type: "text",
          text: data.data.webPages.value
            .map(
              (item: any, index: number) =>
                `${index}. ${item.name}\n${item.url}\n${item.snippet}`
            )
            .join("\n\n"),
        },
      ],
    };
  }
);
export default server;
