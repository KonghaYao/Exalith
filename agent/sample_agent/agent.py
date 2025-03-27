"""
This is the main entry point for the agent.
It defines the workflow graph, state, tools, nodes and edges.
"""

from typing_extensions import Literal, TypedDict, Dict, List, Any, Union, Optional
from langchain_openai import ChatOpenAI

from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.types import Command
from copilotkit import CopilotKitState
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import ToolMessage, AIMessage, HumanMessage
import pathlib
import os
from sample_agent.config import (
    store,
    initialize_tools,
    STATE_MODIFIER,
)
from sample_agent.errors import handle_tool_error, ToolInitializationError


# Define the connection type structures
class StdioConnection(TypedDict):
    command: str
    args: List[str]
    transport: Literal["stdio"]


class SSEConnection(TypedDict):
    url: str
    transport: Literal["sse"]


# Type for MCP configuration
MCPConfig = Dict[str, Union[StdioConnection, SSEConnection]]


class AgentState(CopilotKitState):
    """
    Enhanced agent state with improved state management and error handling.
    """

    mcp_config: Optional[MCPConfig]
    error_count: int = 0
    max_retries: int = 2


async def chat_node(
    state: AgentState, config: RunnableConfig
) -> Command[Literal["__end__"]]:
    """
    Enhanced chat node with improved error handling and state management.
    """
    try:
        mcp_config = state.get("mcp_config")
        actions = state.get("copilotkit", {}).get("actions", [])

        async with MultiServerMCPClient(mcp_config) as mcp_client:
            # Initialize tools with error handling
            tools = await initialize_tools(mcp_client, actions)
            if not tools:
                raise ToolInitializationError("Failed to initialize tools")

            # Create the react agent with optimized configuration
            react_agent = create_react_agent(
                ChatOpenAI(
                    model=os.getenv("OPENAI_MODEL"),
                    base_url=os.getenv("OPENAI_BASE_URL"),
                    api_key=os.getenv("OPENAI_API_KEY"),
                    temperature=0.1,
                    presence_penalty=0.0,
                    frequency_penalty=0.3,
                    top_p=0.95,
                ),
                tools,
                store=store,
                state_modifier=STATE_MODIFIER,
            )

            # Execute agent with error handling
            try:
                agent_response = await react_agent.ainvoke(
                    {"messages": state["messages"]}
                )
                state["error_count"] = 0  # Reset error count on success
            except Exception as e:
                state["error_count"] = state.get("error_count", 0) + 1
                error_msg, details = handle_tool_error(e)
                if state["error_count"] >= state.get("max_retries", 2):
                    return Command(
                        goto=END,
                        update={
                            "messages": state["messages"]
                            + [AIMessage(content=f"达到最大重试次数: {error_msg}")]
                        },
                    )
                raise

            # Update state and return success response
            return Command(
                goto=END,
                update={
                    "messages": state["messages"] + agent_response.get("messages", [])
                },
            )

    except Exception as e:
        error_msg, details = handle_tool_error(e)
        return Command(
            goto=END,
            update={"messages": state["messages"] + [AIMessage(content=error_msg)]},
        )


# Define the workflow graph with planning and chat nodes
workflow = StateGraph(AgentState)
workflow.add_node("chat_node", chat_node)
workflow.set_entry_point("chat_node")

# Compile the workflow graph
# 配置 SQLite 数据库路径
db_path = pathlib.Path("./agent_data.db")
# 使用 SQLiteSaver 替代 MemorySaver
graph = workflow.compile(SqliteSaver(db_path))
