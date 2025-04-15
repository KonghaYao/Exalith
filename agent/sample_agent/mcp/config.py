from typing import TypedDict, List, Literal, Dict, Union
import os

class MCPMappingConnection(TypedDict):
    name: str
    transport: Literal["mcp"]


# Define the connection type structures
class StdioConnection(TypedDict):
    command: str
    args: List[str]
    transport: Literal["stdio"]


class SSEConnection(TypedDict):
    url: str
    transport: Literal["sse"]


# Type for MCP configuration
MCPConfig = Dict[str, Union[StdioConnection, SSEConnection, MCPMappingConnection]]


# 前端通过 MCPMappingConfig 配置 name, 直接替换为一个 SSE 连接
class MCPMappingConfig:
    def __init__(self, mapping: Dict[str, Union[StdioConnection, SSEConnection]]):
        self.mapping = mapping

    def get_connection(self, name: str) -> Union[StdioConnection, SSEConnection]:
        if name not in self.mapping:
            raise ValueError(f"Connection {name} not found in mapping")
        return self.mapping[name]

    def toConfigs(self, configs: MCPConfig) -> MCPConfig:
        new_configs = configs.copy()
        for key, value in new_configs.items():
            if value["transport"] == "mcp":
                try:
                    new_configs[key] = self.get_connection(value["name"])
                except ValueError as e:
                    print(f"Warning: {e}")
                    continue
        return new_configs


mcp_mapping_config = MCPMappingConfig(
    {
        "mcp-excel": {
            "transport": "sse",
            "url": os.getenv("MCP_EXCEL_URL", "http://localhost:8000/sse"),
        }
    }
)
