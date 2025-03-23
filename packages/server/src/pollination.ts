/**
 * Pollinations Image API Client
 *
 * A simple client for the Pollinations Image API that doesn't require Cloudflare Workers
 * modify by KonghaYao from https://github.com/pollinations/pollinations/blob/master/model-context-protocol/src/index.js
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
interface ImageGenerationOptions {
  model?: string;
  seed?: number;
  width?: number;
  height?: number;
}

interface ImageUrlResult {
  imageUrl: string;
  prompt: string;
  width: number;
  height: number;
  model: string;
  seed?: number;
}

interface ImageGenerationResult {
  data: string;
  mimeType: string;
  metadata: {
    prompt: string;
    width: number;
    height: number;
    model: string;
    seed?: number;
  };
}

interface ModelsResponse {
  models: string[];
}

export async function generateImageUrl(
  prompt: string,
  options: ImageGenerationOptions = {},
): Promise<ImageUrlResult> {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("Prompt is required and must be a string");
  }

  const { model, seed, width = 1024, height = 1024 } = options;

  // Build the query parameters
  const queryParams = new URLSearchParams();
  if (model) queryParams.append("model", model);
  if (seed !== undefined) queryParams.append("seed", seed.toString());
  if (width) queryParams.append("width", width.toString());
  if (height) queryParams.append("height", height.toString());

  // Construct the URL
  const encodedPrompt = encodeURIComponent(prompt);
  const baseUrl = "https://image.pollinations.ai";
  let url = `${baseUrl}/prompt/${encodedPrompt}`;

  // Add query parameters if they exist
  const queryString = queryParams.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  // Return the URL directly, keeping it simple
  return {
    imageUrl: url,
    prompt,
    width,
    height,
    model: model || "flux", // Default model is flux
    seed,
  };
}

/**
 * Generates an image from a text prompt and returns the image data as base64
 *
 * @param {string} prompt - The text description of the image to generate
 * @param {Object} options - Additional options for image generation
 * @param {string} [options.model] - Model name to use for generation
 * @param {number} [options.seed] - Seed for reproducible results
 * @param {number} [options.width=1024] - Width of the generated image
 * @param {number} [options.height=1024] - Height of the generated image
 * @returns {Promise<Object>} - Object containing the base64 image data, mime type, and metadata
 */
export async function generateImage(
  prompt: string,
  options: ImageGenerationOptions = {},
): Promise<ImageGenerationResult> {
  // First, generate the image URL
  const result = await generateImageUrl(prompt, options);

  try {
    // Fetch the image from the URL
    const response = await fetch(result.imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // Get the image data as an ArrayBuffer
    const imageBuffer = await response.arrayBuffer();

    // Convert the ArrayBuffer to a base64 string
    const base64Data = Buffer.from(imageBuffer).toString("base64");

    // Determine the mime type from the response headers or default to image/png
    const contentType = response.headers.get("content-type") || "image/png";

    return {
      data: base64Data,
      mimeType: contentType,
      metadata: {
        prompt: result.prompt,
        width: result.width,
        height: result.height,
        model: result.model,
        seed: result.seed,
      },
    };
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}

/**
 * List available image generation models from Pollinations API
 *
 * @returns {Promise<Object>} - Object containing the list of available models
 */
export async function listModels(): Promise<ModelsResponse> {
  try {
    const baseUrl = "https://image.pollinations.ai";
    console.log(`Fetching models from ${baseUrl}/models`);

    const response = await fetch(`${baseUrl}/models`);

    if (!response.ok) {
      throw new Error(`Error fetching models: ${response.statusText}`);
    }

    const models = await response.json();
    return { models };
  } catch (error) {
    console.error("Error in listModels:", error);
    throw error;
  }
}
const server = new McpServer(
  {
    name: "pollinations-image-api",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.tool(
  "generateImageUrl",
  "Generate an image URL from a text prompt",
  {
    prompt: z
      .string()
      .describe("The text description of the image to generate"),
    options: z
      .object({
        model: z
          .string()
          .optional()
          .describe("Model name to use for generation"),
        seed: z.number().optional().describe("Seed for reproducible results"),
        width: z.number().optional().describe("Width of the generated image"),
        height: z.number().optional().describe("Height of the generated image"),
      })
      .optional(),
  },
  async (args) => {
    try {
      const { prompt, options = {} } = args;
      const result = await generateImageUrl(prompt, options);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error generating image URL: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "generateImage",
  "Generate an image from a text prompt and return the image data",
  {
    prompt: z
      .string()
      .describe("The text description of the image to generate"),
    options: z
      .object({
        model: z
          .string()
          .optional()
          .describe("Model name to use for generation"),
        seed: z.number().optional().describe("Seed for reproducible results"),
        width: z.number().optional().describe("Width of the generated image"),
        height: z.number().optional().describe("Height of the generated image"),
      })
      .optional(),
  },
  async (args) => {
    try {
      const { prompt, options = {} } = args;
      const result = await generateImage(prompt, options);
      return {
        content: [
          {
            type: "image",
            data: result.data,
            mimeType: result.mimeType,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error generating image: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "listModels",
  "List available image generation models",
  {},
  async () => {
    try {
      const result = await listModels();
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error listing models: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

export default server;
