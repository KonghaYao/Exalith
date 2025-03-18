import type { Metadata } from "next";
import "./globals.css";
import "@copilotkit/react-ui/styles.css";

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
    <html lang="en">
      <body
        className={`antialiased w-screen h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
