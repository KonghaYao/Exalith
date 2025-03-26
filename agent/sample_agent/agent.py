"""
This is the main entry point for the agent.
It defines the workflow graph, state, tools, nodes and edges.
"""

from typing_extensions import Literal, TypedDict, Dict, List, Any, Union, Optional
from langchain_openai import ChatOpenAI
from langchain_core.utils.function_calling import (
    convert_to_openai_function,
    convert_to_openai_tool,
)
from langchain_core.tools import BaseTool, StructuredTool, ToolException
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.types import Command
from copilotkit import CopilotKitState
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_mcp_adapters.tools import convert_mcp_tool_to_langchain_tool
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import ToolMessage, AIMessage, HumanMessage
from langgraph.store.memory import InMemoryStore
from langmem import create_manage_memory_tool, create_search_memory_tool
import os
import pathlib

store = InMemoryStore(
    index={
        "dims": 1536,
        "embed": "openai:text-embedding-3-small",
    }
)


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
    Here we define the state of the agent

    In this instance, we're inheriting from CopilotKitState, which will bring in
    the CopilotKitState fields. We're also adding custom fields:
    - mcp_config: used to configure MCP services for the agent
    - has_plan: indicates whether a plan has been created
    - plan: stores the execution plan
    """

    # Define mcp_config as an optional field without skipping validation
    mcp_config: Optional[MCPConfig]
    # Define planning related fields
    has_plan: bool = False


async def chat_node(
    state: AgentState, config: RunnableConfig
) -> Command[Literal["__end__"]]:
    """
    This is a simplified agent that uses the ReAct agent as a subgraph.
    It handles both chat responses and tool execution in one node.
    """

    # Get MCP configuration from state, or use the default config if not provided
    mcp_config = state.get("mcp_config")

    # Set up the MCP client and tools using the configuration from state
    async with MultiServerMCPClient(mcp_config) as mcp_client:
        actions = state.get("copilotkit", {}).get("actions", [])
        # Get the tools
        mcp_tools = mcp_client.get_tools()

        async def call_tool(
            **arguments: dict[str, Any],
        ) -> tuple[str | list[str], None]:
            return ["ok", None]

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

        # Create the react agent
        model = ChatOpenAI(
            model=os.getenv("OPENAI_MODEL"),
            base_url=os.getenv("OPENAI_BASE_URL"),
            api_key=os.getenv("OPENAI_API_KEY"),
        )
        # Combine tools
        react_agent = create_react_agent(
            model,
            [
                create_manage_memory_tool(namespace=("memories",)),
                create_search_memory_tool(namespace=("memories",)),
            ]
            + mcp_tools,
            store=store,
            state_modifier="你是一个数据清理大师，请严格按照用户需求完成任务，并使用中文回复用户的要求，复杂任务请先做计划。你需要具体查看文件确认用户的需求能够运行，然后调用工具完成任务。如果有结果文件，默认保留原始列。你无法回复链接和图片给用户",
        )

        agent_input = {
            "messages": state["messages"],
        }

        # Run the react agent subgraph with our input
        agent_response = await react_agent.ainvoke(agent_input)

        # End the graph with the updated messages
        return Command(
            goto=END,
            update={"messages": state["messages"] + agent_response.get("messages", [])},
        )


# Define the workflow graph with planning and chat nodes
workflow = StateGraph(AgentState)
workflow.add_node("plan_node", plan_node)
workflow.add_node("chat_node", chat_node)
workflow.set_entry_point("chat_node")

# Compile the workflow graph
# 配置 SQLite 数据库路径
db_path = pathlib.Path("./agent_data.db")
# 使用 SQLiteSaver 替代 MemorySaver
graph = workflow.compile(SqliteSaver(db_path))
