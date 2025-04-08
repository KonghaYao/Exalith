"use client"
import React from 'react';
import { Markdown } from '@copilotkit/react-ui';
import { PreviewProps } from '../PreviewComponents';

export const MarkdownPreview = ({ data }: PreviewProps) => {
    const [content, setContent] = React.useState<string>('');

    React.useEffect(() => {
        const reader = new FileReader();
        reader.onload = (e) => {
            setContent(e.target?.result as string);
        };
        reader.readAsText(data);
    }, [data]);

    return (
        <div className="w-full h-full overflow-auto p-4 prose prose-sm max-w-none">
            <Markdown content={content}></Markdown>
        </div>
    );
}; 