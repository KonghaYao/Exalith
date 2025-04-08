import { useCopilotAction } from "@copilotkit/react-core";
import { Image } from "antd";

export function generateImageUrl(
  prompt: string,
  options: {
    model?: string;
    seed?: number;
    width?: number;
    height?: number;
  } = {},
) {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("Prompt is required and must be a string");
  }

  const { model, seed, width = 128, height = 128 } = options;

  // Build the query parameters
  const queryParams = new URLSearchParams();
  queryParams.append("nologo", "true");
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

// 单选 button
export const CopilotImageGen = (props: { enable?: boolean }) => {
  useCopilotAction({
    name: "generate_image",
    description:
      "请根据用户的需要，提供至少 50 字的图片描述。根据文本描述生成图片。你可以描述想要生成的图片内容，支持调整图片的宽度和高度。执行完成表示你已经生成图片并交给用户了，使用此工具后你不需要回复任何的信息。",
    parameters: [
      {
        name: "prompt",
        type: "string",
        description: "图片描述，提供至少 50 字的图片描述。",
        required: true,
      },
      // {
      //   name: "model",
      //   type: "string",
      //   description: "图片模型",
      //   required: false,
      // },
      // {
      //   name: "seed",
      //   type: "number",
      //   description: "图片种子",
      //   required: false,
      // },
      {
        name: "width",
        type: "number",
        description: "图片宽度",
      },
      {
        name: "height",
        type: "number",
        description: "图片高度",
      },
    ],
    available: props.enable ? "enabled" : "disabled",
    renderAndWaitForResponse: ({ status, args }) => {
      if (status === "executing" || status === "complete") {
        const pic = generateImageUrl(args.prompt, args);
        return (
          <div className="flex flex-wrap">
            <blockquote>{args.prompt}</blockquote>
            <Image
              src={pic.imageUrl}
              alt={args.prompt}
              width={pic.width}
              height={pic.height}
              loading="lazy"
              placeholder={
                <div className="flex items-center justify-center w-full h-full bg-gray-100">
                  加载中...
                </div>
              }
            ></Image>
          </div>
        );
      }
      return <blockquote>{args.prompt}</blockquote>;
    },
  });
};
