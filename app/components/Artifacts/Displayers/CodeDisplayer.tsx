"use client"; // only necessary if you are using Next.js with the App Router.
import { useEffect, useRef } from 'react';
import { Resource } from '../ResourceContext';

interface CodeDisplayerProps {
    resource: Resource;
}

export function CodeDisplayer({ resource }: CodeDisplayerProps) {

    return (
        <div className="border rounded-lg shadow-sm p-4 bg-white">
            <pre className="m-0">
                <div>
                    {resource.name}
                </div>
                <code className='text-wrap' >
                    {resource.content}
                </code>
            </pre>
        </div>
    );
} 