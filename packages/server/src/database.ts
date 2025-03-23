import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { Pool } from "pg";

const server = new McpServer(
  {
    name: "数据库助手",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

const pool = new Pool({
  user: process.env.POSTGRES_USER || "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  database: process.env.POSTGRES_DB || "postgres",
  password: process.env.POSTGRES_PASSWORD || "postgres",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
});

server.tool(
  "list_tables",
  "获取数据库中的所有表",
  {
    schema: z.string().optional().default("public").describe("模式名"),
  },
  async (args) => {
    try {
      const query = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `;
      const result = await pool.query(query, [args.schema]);

      return {
        content: [
          {
            type: "text",
            text: `模式 ${args.schema} 中的表：\n${result.rows.map((row, index) => `${index + 1}. ${row.table_name}`).join("\n")}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `获取表列表失败: ${(error as Error).message}`,
          },
        ],
      };
    }
  },
);

server.tool(
  "execute_query",
  "执行SQL查询",
  {
    query: z.string().describe("SQL查询语句"),
    params: z.array(z.any()).optional().default([]).describe("查询参数"),
  },
  async (args) => {
    try {
      const result = await pool.query(args.query, args.params);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result.rows, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `执行查询失败: ${(error as Error).message}`,
          },
        ],
      };
    }
  },
);

server.tool(
  "query_table",
  "查询表数据",
  {
    table: z.string().describe("表名"),
    schema: z.string().optional().default("public").describe("模式名"),
    limit: z.number().optional().default(100).describe("返回的最大行数"),
    offset: z.number().optional().default(0).describe("跳过的行数"),
    where: z.string().optional().describe("WHERE条件"),
    order_by: z.string().optional().describe("排序字段"),
  },
  async (args) => {
    try {
      let query = `SELECT * FROM ${args.schema}.${args.table}`;
      const params = [];

      if (args.where) {
        query += ` WHERE ${args.where}`;
      }

      if (args.order_by) {
        query += ` ORDER BY ${args.order_by}`;
      }

      query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(args.limit, args.offset);

      const result = await pool.query(query, params);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result.rows, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `查询表数据失败: ${(error as Error).message}`,
          },
        ],
      };
    }
  },
);

server.tool(
  "get_table_info",
  "获取数据表的结构信息",
  {
    table: z.string().describe("表名"),
    schema: z.string().optional().default("public").describe("模式名"),
  },
  async (args) => {
    try {
      // 获取表的列信息
      const columnsQuery = `
        SELECT 
          column_name, 
          data_type,
          character_maximum_length,
          column_default,
          is_nullable
        FROM information_schema.columns 
        WHERE table_schema = $1 
        AND table_name = $2
        ORDER BY ordinal_position;
      `;
      const columnsResult = await pool.query(columnsQuery, [
        args.schema,
        args.table,
      ]);

      // 获取主键信息
      const pkQuery = `
        SELECT a.attname as column_name
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = ($1 || '.' || $2)::regclass
        AND i.indisprimary;
      `;
      const pkResult = await pool.query(pkQuery, [args.schema, args.table]);

      // 获取索引信息
      const indexQuery = `
        SELECT
          i.relname as index_name,
          array_agg(a.attname) as column_names,
          ix.indisunique as is_unique
        FROM pg_class t
        JOIN pg_index ix ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
        WHERE t.relkind = 'r'
        AND t.relname = $2
        AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = $1)
        GROUP BY i.relname, ix.indisunique;
      `;
      const indexResult = await pool.query(indexQuery, [
        args.schema,
        args.table,
      ]);

      return {
        content: [
          {
            type: "text",
            text: `表 ${args.schema}.${args.table} 的结构信息：

列信息：
${columnsResult.rows
  .map(
    (col) =>
      `- ${col.column_name} (${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ""})
   默认值: ${col.column_default || "NULL"}
   允许空值: ${col.is_nullable}`,
  )
  .join("\n")}

主键：
${pkResult.rows.map((pk) => `- ${pk.column_name}`).join("\n")}

索引：
${indexResult.rows
  .map(
    (idx) =>
      `- ${idx.index_name} (${idx.column_names.join(", ")})
   唯一索引: ${idx.is_unique ? "是" : "否"}`,
  )
  .join("\n")}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `获取表信息失败: ${(error as Error).message}`,
          },
        ],
      };
    }
  },
);
export default server;
