#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import "dotenv/config";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { useContext } from "./context.js";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";

interface TavilyResponse {
  // Response structure from Tavily API
  query: string;
  follow_up_questions?: Array<string>;
  answer?: string;
  images?: Array<
    | string
    | {
        url: string;
        description?: string;
      }
  >;
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
    published_date?: string;
    raw_content?: string;
  }>;
}

class TavilyClient {
  // Core client properties
  server: Server;
  private baseURLs = {
    search: "https://api.tavily.com/search",
    extract: "https://api.tavily.com/extract",
  };

  private headers = {
    accept: "application/json",
    "content-type": "application/json",
  };
  createHeaders(extra: RequestHandlerExtra) {
    const headers = useContext(extra);
    return {
      ...this.headers,
      Authorization: "Bearer " + headers["TAVILY_API_KEY"]!,
    };
  }
  constructor() {
    this.server = new Server(
      {
        name: "tavily-mcp",
        version: "0.1.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
          prompts: {},
        },
      },
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers(): void {
    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      // Define available tools: tavily-search and tavily-extract
      const tools: Tool[] = [
        {
          name: "tavily-search",
          description:
            "A powerful web search tool that provides comprehensive, real-time results using Tavily's AI search engine. Returns relevant web content with customizable parameters for result count, content type, and domain filtering. Ideal for gathering current information, news, and detailed web content analysis.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query",
              },
              search_depth: {
                type: "string",
                enum: ["basic", "advanced"],
                description:
                  "The depth of the search. It can be 'basic' or 'advanced'",
                default: "basic",
              },
              topic: {
                type: "string",
                enum: ["general", "news"],
                description:
                  "The category of the search. This will determine which of our agents will be used for the search",
                default: "general",
              },
              days: {
                type: "number",
                description:
                  "The number of days back from the current date to include in the search results. This specifies the time frame of data to be retrieved. Please note that this feature is only available when using the 'news' search topic",
                default: 3,
              },
              time_range: {
                type: "string",
                description:
                  "The time range back from the current date to include in the search results. This feature is available for both 'general' and 'news' search topics",
                enum: ["day", "week", "month", "year", "d", "w", "m", "y"],
              },
              max_results: {
                type: "number",
                description: "The maximum number of search results to return",
                default: 10,
                minimum: 5,
                maximum: 20,
              },
              include_images: {
                type: "boolean",
                description:
                  "Include a list of query-related images in the response",
                default: false,
              },
              include_image_descriptions: {
                type: "boolean",
                description:
                  "Include a list of query-related images and their descriptions in the response",
                default: false,
              },
              /*
              // Since the mcp server is using claude to generate answers form the search results, we don't need to include this feature.
              include_answer: { 
                type: ["boolean", "string"],
                enum: [true, false, "basic", "advanced"],
                description: "Include an answer to original query, generated by an LLM based on Tavily's search results. Can be boolean or string ('basic'/'advanced'). 'basic'/true answer will be quick but less detailed, 'advanced' answer will be more detailed but take longer to generate",
                default: false,
              },
              */
              include_raw_content: {
                type: "boolean",
                description:
                  "Include the cleaned and parsed HTML content of each search result",
                default: false,
              },
              include_domains: {
                type: "array",
                items: { type: "string" },
                description:
                  "A list of domains to specifically include in the search results, if the user asks to search on specific sites set this to the domain of the site",
                default: [],
              },
              exclude_domains: {
                type: "array",
                items: { type: "string" },
                description:
                  "List of domains to specifically exclude, if the user asks to exclude a domain set this to the domain of the site",
                default: [],
              },
            },
            required: ["query"],
          },
        },
        {
          name: "tavily-extract",
          description:
            "A powerful web content extraction tool that retrieves and processes raw content from specified URLs, ideal for data collection, content analysis, and research tasks.",
          inputSchema: {
            type: "object",
            properties: {
              urls: {
                type: "array",
                items: { type: "string" },
                description: "List of URLs to extract content from",
              },
              extract_depth: {
                type: "string",
                enum: ["basic", "advanced"],
                description:
                  "Depth of extraction - 'basic' or 'advanced', if usrls are linkedin use 'advanced' or if explicitly told to use advanced",
                default: "basic",
              },
              include_images: {
                type: "boolean",
                description:
                  "Include a list of images extracted from the urls in the response",
                default: false,
              },
            },
            required: ["urls"],
          },
        },
      ];
      return { tools };
    });

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request, extra) => {
        try {
          let response: TavilyResponse;
          const args = request.params.arguments ?? {};

          switch (request.params.name) {
            case "tavily-search":
              response = await this.search(
                {
                  query: args.query,
                  search_depth: args.search_depth,
                  topic: args.topic,
                  days: args.days,
                  time_range: args.time_range,
                  max_results: args.max_results,
                  include_images: args.include_images,
                  include_image_descriptions: args.include_image_descriptions,
                  include_raw_content: args.include_raw_content,
                  include_domains: Array.isArray(args.include_domains)
                    ? args.include_domains
                    : [],
                  exclude_domains: Array.isArray(args.exclude_domains)
                    ? args.exclude_domains
                    : [],
                },
                extra,
              );
              break;

            case "tavily-extract":
              response = await this.extract(
                {
                  urls: args.urls,
                  extract_depth: args.extract_depth,
                  include_images: args.include_images,
                },
                extra,
              );
              break;

            default:
              throw new McpError(
                ErrorCode.MethodNotFound,
                `Unknown tool: ${request.params.name}`,
              );
          }

          return {
            content: [
              {
                type: "text",
                text: formatResults(response),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: `Tavily API error: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      },
    );
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Tavily MCP server running on stdio");
  }

  async search(
    params: any,
    extra: RequestHandlerExtra,
  ): Promise<TavilyResponse> {
    try {
      // Choose endpoint based on whether it's an extract request
      const endpoint = params.url
        ? this.baseURLs.extract
        : this.baseURLs.search;

      // Add topic: "news" if query contains the word "news"
      const searchParams = {
        ...params,

        topic: params.query.toLowerCase().includes("news") ? "news" : undefined,
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: this.createHeaders(extra),
        body: JSON.stringify(searchParams),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Invalid API key");
        } else if (response.status === 429) {
          throw new Error("Usage limit exceeded");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      throw error;
    }
  }

  async extract(
    params: any,
    extra: RequestHandlerExtra,
  ): Promise<TavilyResponse> {
    try {
      const response = await fetch(this.baseURLs.extract, {
        method: "POST",
        headers: this.createHeaders(extra),
        body: JSON.stringify({
          ...params,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Invalid API key");
        } else if (response.status === 429) {
          throw new Error("Usage limit exceeded");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      throw error;
    }
  }
}

function formatResults(response: TavilyResponse): string {
  // Format API response into human-readable text
  const output: string[] = [];

  // Include answer if available
  if (response.answer) {
    output.push(`Answer: ${response.answer}`);
    output.push("\nSources:");
    response.results.forEach((result) => {
      output.push(`- ${result.title}: ${result.url}`);
    });
    output.push("");
  }

  // Format detailed search results
  output.push("Detailed Results:");
  response.results.forEach((result) => {
    output.push(`\nTitle: ${result.title}`);
    output.push(`URL: ${result.url}`);
    output.push(`Content: ${result.content}`);
    if (result.raw_content) {
      output.push(`Raw Content: ${result.raw_content}`);
    }
  });

  return output.join("\n");
}

const server = new TavilyClient();
export default server.server;
