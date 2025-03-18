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
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import Command
from copilotkit import CopilotKitState
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_mcp_adapters.tools import convert_mcp_tool_to_langchain_tool
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import ToolMessage, AIMessage, HumanMessage
import os


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
    plan: Optional[List[str]] = None


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
        react_agent = create_react_agent(model, mcp_tools)

        # Prepare messages for the react agent
        agent_input = {"messages": state["messages"]}

        # Run the react agent subgraph with our input
        agent_response = await react_agent.ainvoke(agent_input)

        # Update the state with the new messages
        updated_messages = state["messages"] + agent_response.get("messages", [])

        # End the graph with the updated messages
        return Command(
            goto=END,
            update={"messages": updated_messages},
        )


async def plan_node(
    state: AgentState, config: RunnableConfig
) -> Command[Union[Literal["chat_node"], Literal["__end__"]]]:
    """
    This node analyzes the user input and creates an execution plan.
    """
    if state.get("has_plan"):
        return Command(goto="chat_node")

    # Get MCP configuration from state
    mcp_config = state.get("mcp_config")

    # Set up the MCP client and model
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
        model = ChatOpenAI(
            model=os.getenv("OPENAI_MODEL"),
            base_url=os.getenv("OPENAI_BASE_URL"),
            api_key=os.getenv("OPENAI_API_KEY"),
        ).bind_tools(mcp_tools)

        # Create planning prompt
        messages = state["messages"]

        # 找到上一个用户的输入
        last_message = None
        for message in reversed(messages):
            if isinstance(message, HumanMessage):
                last_message = message

        if last_message is None:
            return Command(
                goto=END,
                update={
                    "messages": messages
                    + [{"role": "assistant", "content": "无法找到用户输入"}]
                },
            )

        planning_prompt = [
            {
                "role": "system",
                "content": "你是一个计划助手，负责分析用户输入并创建执行计划。请将任务分解为具体步骤, 以 Markdown 形式返回。",
            },
            {
                "role": "user",
                "content": f"请为以下用户输入创建执行计划：\n{message.text()}",
            },
        ]

        # Get plan from model
        response = await model.ainvoke(planning_prompt)
        plan = response.content

        # Update state with plan
        return Command(
            goto="chat_node",
            update={
                "has_plan": True,
                "plan": plan,
                "messages": messages + [AIMessage(content=response.content)],
            },
        )


# Define the workflow graph with planning and chat nodes
workflow = StateGraph(AgentState)
workflow.add_node("plan_node", plan_node)
workflow.add_node("chat_node", chat_node)
workflow.set_entry_point("plan_node")

# Compile the workflow graph
graph = workflow.compile(MemorySaver())
