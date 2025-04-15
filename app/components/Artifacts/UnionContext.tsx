import { ArtifactsProvider } from "./ArtifactsContext"
import { ResourceProvider } from "./ResourceContext"

export const UnionContext = (props: { children: React.ReactNode }) => {
    return <ResourceProvider>
        <ArtifactsProvider>
            {props.children}
        </ArtifactsProvider>
    </ResourceProvider>
}
