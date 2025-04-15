from typing import Dict, Any
from sample_agent.config import mcp_mapping_config

def process_mcp_config_headers(mcp_config: Dict[str, Any]) -> Dict[str, Any]:
    """
    处理 mcp_config 中的 headers 字段，为每个键添加 x- 前缀（如果没有的话）

    Args:
        mcp_config: MCP 配置字典

    Returns:
        处理后的 MCP 配置字典
    """
    if not mcp_config:
        return mcp_config

    processed_config = mcp_config.copy()
    for config in processed_config.values():
        if isinstance(config, dict) and "headers" in config:
            headers = config["headers"]
            if isinstance(headers, dict):
                config["headers"] = {
                    f"x-{k}" if not k.startswith("x-") else k: v
                    for k, v in headers.items()
                }
    new_mcp_config = mcp_mapping_config.toConfigs(processed_config)
    print(new_mcp_config)
    return new_mcp_config
