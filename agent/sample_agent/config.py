"""Configuration module for the agent.
This module handles tool initialization and model settings.
"""

from typing import Dict, Any, Optional
from langchain_openai import ChatOpenAI
from langchain_core.tools import StructuredTool
from langchain_mcp_adapters.client import MultiServerMCPClient
from langmem import create_manage_memory_tool, create_search_memory_tool
from langgraph.store.memory import InMemoryStore
import os

# Initialize memory store with optimized settings
store = InMemoryStore(
    index={
        "dims": 1536,
        "embed": "openai:text-embedding-3-small",
    }
)


# Tool initialization with error handling
async def initialize_tools(mcp_client: MultiServerMCPClient, actions: list) -> list:
    try:
        mcp_tools = mcp_client.get_tools()

        # Add structured tools with enhanced error handling
        async def call_tool(
            **arguments: dict[str, Any],
        ) -> tuple[str | list[str], None]:
            try:
                return ["ok", None]
            except Exception as e:
                return [f"Error: {str(e)}", None]

        mcp_tools.extend(
            [
                StructuredTool(
                    name=tool["name"],
                    description=tool["description"] or "",
                    args_schema=tool["parameters"],
                    coroutine=call_tool,
                    response_format="content",
                )
                for tool in actions
            ]
        )

        # Add memory management tools
        memory_tools = [
            create_manage_memory_tool(namespace=("memories",)),
            create_search_memory_tool(namespace=("memories",)),
        ]

        return memory_tools + mcp_tools
    except Exception as e:
        # Log error and return basic tools
        print(f"Error initializing tools: {str(e)}")
        return [
            create_manage_memory_tool(namespace=("memories",)),
            create_search_memory_tool(namespace=("memories",)),
        ]


# Agent state modifier template
STATE_MODIFIER = """
你是一个数据清理大师，请严格按照用户需求或者计划完成任务并回复用户信息。
你需要具体检查文件, 检查表的列的状态，确认用户的需求能够运行，然后调用工具完成任务。如果有结果文件，默认保留原始列。

注意事项：
1. 你无法回复链接和图片给用户
2. 编写代码时，不用编写 if __name__ == '__main__'
3. !!!所有的 import 都需要写在函数内，避免全局导入函数的性能损耗
4. 你犯错最多2次，然后需要用户同意才能继续
5. 数据类型并不一定一致，请注意

地址解析示例：
def main():
    import cpca
    address_df = cpca.transform(single_df_col) # DataFrame, 没有其它入参 
    address_df # 返回 DataFrame 包含 '省', '市', '区', '地址', 'adcode' 列
"""
