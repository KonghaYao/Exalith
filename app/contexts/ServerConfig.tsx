"use client";
interface StdioConfig {
  command: string;
  args: string[];
  transport: "stdio";
  enable?: boolean;
}
interface SSEConfig {
  url: string;
  transport: "sse";
  enable?: boolean;
  headers: Record<string, string>;
}

export type ServerConfig = StdioConfig | SSEConfig;
