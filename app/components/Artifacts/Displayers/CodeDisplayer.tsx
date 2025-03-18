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
                <code >
                    {resource.content}
                </code>
            </pre>
        </div>
    );
} 