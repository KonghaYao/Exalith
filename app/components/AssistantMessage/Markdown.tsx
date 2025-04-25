"use client"
import { FC, memo } from "react";
import ReactMarkdown, { Options, Components } from "react-markdown";
import { CodeBlock } from "./CodeBlock";
import { Image } from "antd";
import remarkGfm from "remark-gfm";
const MemoizedReactMarkdown: FC<Options> = memo(
    ReactMarkdown,
    (prevProps, nextProps) =>
        prevProps.children === nextProps.children && prevProps.className === nextProps.className,
);

type MarkdownProps = {
    content: string;
};

export const Markdown = ({ content }: MarkdownProps) => {
    return (
        <div className="copilotKitMarkdown">
            <MemoizedReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
                {content}
            </MemoizedReactMarkdown>
        </div>
    );
};

const components: Components = {
    img(props) {
        let src = props.src || '';
        try {
            // 处理相对路径
            if (src) {
                if (src.endsWith('.html')) {
                    // 如果是 html 文件，使用 iframe
                    return (
                        <iframe
                            src={src}
                            style={{ width: '100%', maxHeight: '40vh', border: 'none' }}
                            title={props.alt || 'HTML Content'}
                        />
                    );
                }
                if (src.startsWith('/')) {
                    // 使用当前域名
                    src = `${window.location.origin}/api/oss${src}`;
                } else if (src.startsWith('./') || src.startsWith('../')) {
                    // 处理相对路径
                    const baseUrl = window.location.origin;
                    src = new URL(src, baseUrl).href;
                } else if (!src.startsWith('http://') && !src.startsWith('https://')) {
                    // 处理没有协议的情况
                    src = `${window.location.origin}/api/oss/${src}`;
                }
            }
        } catch (error) {
            console.error('Error processing image src:', error);
        }

        return <Image src={src} alt={props.alt} />;
    },
    a({ children, ...props }) {
        return (
            <a
                style={{ color: "blue", textDecoration: "underline" }}
                {...props}
                target="_blank"
                rel="noopener noreferrer"
            >
                {children}
            </a>
        );
    },
    code({ children, className, inline, ...props }) {
        if (children.length && typeof childeren !== 'string') {
            if (children[0] == "▍") {
                return (
                    <span
                        style={{
                            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                            marginTop: "0.25rem",
                        }}
                    >
                        ▍
                    </span>
                );
            }

            children[0] = (children[0] as string).replace("`▍`", "▍");
        }

        const match = /language-(\w+)/.exec(className || "");

        if (inline) {
            return (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        }

        return (
            <CodeBlock
                key={Math.random()}
                language={(match && match[1]) || ""}
                value={String(children).replace(/\n$/, "")}
                {...props}
            />
        );
    },
};
