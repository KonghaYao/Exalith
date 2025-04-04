import { useState } from "react";
import { message } from "antd";

type StreamResponseOptions = {
  onData?: (data: string) => void;
  onError?: (error: Error) => void;
  onFinish?: () => void;
};

export const useStreamResponse = () => {
  const [loading, setLoading] = useState(false);

  const fetchStreamResponse = async (
    url: string,
    body: any,
    options: StreamResponseOptions = {},
  ) => {
    try {
      setLoading(true);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("请求失败");
      }

      const reader = response.body?.getReader();
      let result = "";

      while (reader) {
        const { done, value: chunk } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(chunk);
        const lines = text.split("\n").filter(Boolean);

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || "";
              result += content;
              options.onData?.(result);
            } catch (e) {
              console.error("解析响应数据失败:", e);
            }
          }
        }
      }

      options.onFinish?.();
      return result;
    } catch (error) {
      console.error("请求出错:", error);
      const err = error instanceof Error ? error : new Error("未知错误");
      options.onError?.(err);
      message.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetchStreamResponse,
  };
};
