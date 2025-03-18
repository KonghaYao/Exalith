import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Resource } from '../ResourceContext';


mermaid.initialize({ startOnLoad: false });

interface MermaidDisplayerProps {
    resource: Resource;
}
let id = 0
export function MermaidDisplayer({ resource }: MermaidDisplayerProps) {
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = elementRef.current;
        if (element && resource.content) {
            id++
            mermaid.render('mermaid-' + id, resource.content).then(svg => {
                element.innerHTML = svg.svg
            })
        }
    }, [resource.content, resource.name, elementRef]);

    return (
        <div className="border rounded-lg shadow-sm p-4 bg-white">
            <div ref={elementRef} />
        </div>
    );
} 