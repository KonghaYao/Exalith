import type { Metadata } from "next";
import "./globals.css";
import "@copilotkit/react-ui/styles.css";
import { Head } from "next/document";

export const metadata: Metadata = {
  title: "Open MCP Client",
  description: "An open source MCP client built with CopilotKit 🪁",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-cn">
      <head>
        <link precedence="default" rel='stylesheet' href='https://chinese-fonts-cdn.deno.dev/packages/lxgwwenkai/dist/LXGWWenKai-Light/result.css' />
      </head>
      <body
        className={`antialiased w-screen h-screen`}
        style={{
          "fontFamily": "'LXGW WenKai Light'"
        }}
      >
        {children}
      </body>
    </html>
  );
}
