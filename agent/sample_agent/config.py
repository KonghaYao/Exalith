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


def action_to_tool(tool):
    # Add structured tools with enhanced error handling
    async def call_tool(
        **arguments: dict[str, Any],
    ) -> tuple[str | list[str], None]:
        try:
            return ["执行完成", None]
        except Exception as e:
            return [f"Error: {str(e)}", None]

    return StructuredTool(
        name=tool["name"],
        description=tool["description"] or "",
        args_schema=tool["parameters"],
        coroutine=call_tool,
        response_format="content",
    )


# Tool initialization with error handling
async def initialize_tools(mcp_client: MultiServerMCPClient, actions: list) -> list:

    mcp_tools = mcp_client.get_tools()

    mcp_tools.extend([action_to_tool(tool) for tool in actions])

    # Add memory management tools
    memory_tools = [
        # create_manage_memory_tool(namespace=("memories",)),
        # create_search_memory_tool(namespace=("memories",)),
    ]

    tools = memory_tools + mcp_tools
    if not tools:
        return {}
    return tools
