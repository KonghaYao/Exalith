"""
This is the main entry point for the agent.
It defines the workflow graph, state, tools, nodes and edges.
"""

from typing_extensions import Literal, TypedDict, Dict, List, Any, Union, Optional
from langchain_openai import ChatOpenAI

from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph, END, START
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
from sample_agent.model_factory import create_planner_model, create_chat_model


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
    web_search_enabled: bool = False
    plan_enabled: bool = False  # 控制是否启用计划节点
    planned = False  # 控制是否已经生成了计划
    model_name: str = os.getenv("OPENAI_MODEL")


async def plan_node(state: AgentState, config: RunnableConfig):
    """
    计划节点，用于生成执行计划。只有当用户手动开启计划按钮时才会执行此节点。
    """
    try:
        mcp_config = state.get("mcp_config")
        actions = state.get("copilotkit", {}).get("actions", [])
        async with MultiServerMCPClient(mcp_config) as mcp_client:
            # 初始化工具
            tools = await initialize_tools(mcp_client, actions)
            if not tools:
                raise ToolInitializationError("Failed to initialize tools")

            # 创建计划生成器
            planner = create_planner_model(state.get("model_name"))
            # 获取用户最新消息
            user_messages = [
                msg for msg in state["messages"] if isinstance(msg, HumanMessage)
            ]
            latest_user_message = user_messages[-1].content if user_messages else ""

            # 生成计划
            plan_prompt = f"根据用户的请求：'{latest_user_message}'，请生成一个执行计划，根据用户输入的信息长度，输出合适长度，列出需要完成的步骤，层次不超过2层："
            plan_response = await planner.ainvoke([HumanMessage(content=plan_prompt)])

            # Reset error count on success and set planned to True
            return {
                "messages": state["messages"] + [plan_response],
                "planned": True,
            }

    except Exception as e:
        error_msg, details = handle_tool_error(e)
        return {
            "messages": state["messages"]
            + [AIMessage(content=f"计划生成失败: {error_msg}")],
            "planned": True,
        }


# 计划完成节点已移除，计划节点现在直接设置planned=True并跳转到chat_node


async def chat_node(state: AgentState, config: RunnableConfig):
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
            print(
                state.get(
                    "model_name",
                )
            )
            # Create the react agent with optimized configuration
            react_agent = create_react_agent(
                create_chat_model(
                    model_name=state.get("model_name"),
                    web_search_enabled=state.get("web_search_enabled", False),
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
                # Update state with success response and reset error count
                new_state = state.copy()
                new_state["error_count"] = 0
                return {
                    "messages": state["messages"] + agent_response.get("messages", []),
                    "error_count": 0,
                }
            except Exception as e:
                error_count = state.get("error_count", 0) + 1
                error_msg, details = handle_tool_error(e)
                if error_count >= state.get("max_retries", 2):
                    return Command(
                        goto=END,
                        update={
                            "messages": state["messages"]
                            + [AIMessage(content=f"达到最大重试次数: {error_msg}")],
                            "error_count": error_count,
                        },
                    )
                # Update error count and re-raise for retry
                return Command(
                    goto=END,
                    update={
                        "messages": state["messages"]
                        + [
                            AIMessage(
                                content=f"执行出错 (尝试 {error_count}/{state.get('max_retries', 2)}): {error_msg}"
                            )
                        ],
                        "error_count": error_count,
                    },
                )

    except Exception as e:
        error_msg, details = handle_tool_error(e)
        return {"messages": state["messages"] + [AIMessage(content=error_msg)]}


# 添加条件路由
def should_plan(state: AgentState) -> Literal["plan_node", "chat_node"]:
    """根据state中的plan_enabled字段决定是否执行计划节点"""
    print("should_plan", state.get("planned"))
    # 如果计划已完成，直接进入chat_node
    if state.get("planned", False):
        return "chat_node"
    # 否则根据plan_enabled决定是否需要生成计划
    return "plan_node" if state.get("plan_enabled", False) else "chat_node"


def create_plan_and_execute_agent():

    # Define the workflow graph with planning and chat nodes
    workflow = StateGraph(AgentState)
    workflow.add_node("plan_node", plan_node)
    workflow.add_node("chat_node", chat_node)

    workflow.add_conditional_edges(START, should_plan, ["plan_node", "chat_node"])
    workflow.add_conditional_edges(
        "plan_node",
        lambda state: "chat_node" if state.get("planned", False) else "end",
        {
            "chat_node": "chat_node",
            "end": END,
        },
    )
    db_path = pathlib.Path("./agent_data.db")
    # 使用 SQLiteSaver 替代 MemorySaver
    graph = workflow.compile(SqliteSaver(db_path))
    return graph
