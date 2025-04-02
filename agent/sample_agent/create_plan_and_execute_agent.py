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
from langgraph.prebuilt.chat_agent_executor import AgentState
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


class AgentState(CopilotKitState, AgentState):
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


async def information_gather_node(state: AgentState, config: RunnableConfig):
    """
    信息搜索节点，搜索的信息交由计划节点
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
            # 生成计划
            STATE_MODIFIER = """你是一个专注于信息收集的专业研究代理，不需要进行汇总，收集完成只需要回复“收集完成”即可。
你的角色仅限于收集和组织信息，为后面的计划报告过程做准备。
你的主要职责包括：
- 使用适当的工具访问多样且可靠的信息来源
- 系统地收集相关信息，不需要汇总
- 不要生成完整报告、分析性结论或建议。
- 执行完工具之后，不需要回复用户
- 最多能进行五次工具使用
"""
            react_agent = create_react_agent(
                planner,
                tools,
                store=store,
                state_modifier=STATE_MODIFIER,
            )
            plan_response = await react_agent.ainvoke(state)

            # Reset error count on success and set planned to True
            return {
                "messages": state["messages"] + plan_response.get("messages", []),
            }

    except Exception as e:
        error_msg, details = handle_tool_error(e)
        return {
            "messages": state["messages"]
            + [AIMessage(content=f"计划生成失败: {error_msg}")],
        }


async def plan_node(state: AgentState, config: RunnableConfig):
    """
    计划节点，用于生成执行计划。只有当用户手动开启计划按钮时才会执行此节点。
    """
    try:

        # 创建计划生成器
        planner = create_planner_model(state.get("model_name"))

        # 生成计划
        plan_prompt = f"""
请根据用户的请求和工具返回的信息，创建一个清晰、结构化的执行计划。

在制定计划时，请考虑以下几点：
1. 用户请求的复杂程度
2. 完全满足请求所需的必要步骤
3. 可能出现的潜在挑战

请按照以下格式组织您的计划：
- 使用主要步骤和子步骤的层次结构
- 层次结构最多限制为2层
- 根据复杂性调整详细程度
- 确保步骤具体且可执行

请专注于创建一个能有效解决以上问题的计划
"""
        messages = state["messages"].copy()
        plan_response = await planner.ainvoke(
            messages + [HumanMessage(content=plan_prompt)]
        )

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
    return (
        "information_gather_node" if state.get("plan_enabled", False) else "chat_node"
    )


def create_plan_and_execute_agent():

    # Define the workflow graph with planning and chat nodes
    workflow = StateGraph(AgentState)
    workflow.add_node("information_gather_node", information_gather_node)
    workflow.add_node("plan_node", plan_node)
    workflow.add_node("chat_node", chat_node)

    workflow.add_conditional_edges(
        START, should_plan, ["information_gather_node", "chat_node"]
    )

    workflow.add_conditional_edges(
        "plan_node",
        lambda state: "chat_node" if state.get("planned", False) else "end",
        {
            "chat_node": "chat_node",
            "end": END,
        },
    )
    workflow.add_edge(
        "information_gather_node",
        "plan_node",
    )
    db_path = pathlib.Path("./agent_data.db")
    # 使用 SQLiteSaver 替代 MemorySaver
    graph = workflow.compile(SqliteSaver(db_path))
    return graph
