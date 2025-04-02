"""
This is the main entry point for the agent.
It defines the workflow graph, state, tools, nodes and edges.
"""

# Standard library imports
from typing import Any, Callable, Optional, Sequence, Type, Union
from langchain_core.language_models import (
    BaseChatModel,
    LanguageModelInput,
    LanguageModelLike,
)

from langchain_core.tools import BaseTool
from langgraph.prebuilt.tool_node import ToolNode
from langgraph.prebuilt.chat_agent_executor import (
    Prompt,
    StructuredResponseSchema,
    StateSchemaType,
)
from langgraph.types import Checkpointer, Send
from langgraph.store.base import BaseStore

# Third-party imports
from typing_extensions import Literal, TypedDict, Dict, List
from langchain_openai import ChatOpenAI
from langchain_core.runnables import RunnableConfig
from langchain_core.messages import ToolMessage, AIMessage, HumanMessage
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.graph import StateGraph, END, START
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.types import Command
from langgraph.prebuilt import create_react_agent
from langgraph.prebuilt.chat_agent_executor import AgentState
from copilotkit import CopilotKitState

# Local imports
from sample_agent.config import store, initialize_tools, STATE_MODIFIER
from sample_agent.errors import handle_tool_error, ToolInitializationError
from sample_agent.model_factory import create_planner_model, create_chat_model


def create_planner_agent(
    research_model: Union[str, LanguageModelLike],
    planner_model: Union[str, LanguageModelLike],
    tools: Union[Sequence[Union[BaseTool, Callable]], ToolNode],
    prompt: Optional[Prompt] = None,
    response_format: Optional[
        Union[StructuredResponseSchema, tuple[str, StructuredResponseSchema]]
    ] = None,
    state_schema: Optional[StateSchemaType] = None,
    config_schema: Optional[Type[Any]] = None,
    checkpointer: Optional[Checkpointer] = None,
    store: Optional[BaseStore] = None,
    interrupt_before: Optional[list[str]] = None,
    interrupt_after: Optional[list[str]] = None,
    debug: bool = False,
    name: Optional[str] = None,
):

    async def research_node(state: AgentState, config: RunnableConfig):
        """
        信息搜索节点，搜索的信息交由计划节点
        """
        try:
            # 生成计划
            STATE_MODIFIER = """你是一个专注于信息收集的专业研究代理，不需要进行汇总，收集完成只需要回复"收集完成"即可。
    你的角色仅限于收集和组织信息，为后面的计划报告过程做准备。
    你的主要职责包括：
    - 使用适当的工具访问多样且可靠的信息来源
    - 系统地收集相关信息，不需要汇总
    - 不要生成完整报告、分析性结论或建议。
    - 执行完工具之后，不需要回复用户
    - 最多能进行五次工具使用
    """
            react_agent = create_react_agent(
                research_model,
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
            plan_response = await planner_model.ainvoke(
                messages + [HumanMessage(content=plan_prompt)]
            )

            # Reset error count on success and set planned to True
            return {
                "messages": state["messages"] + [plan_response],
            }

        except Exception as e:
            error_msg, details = handle_tool_error(e)
            return {
                "messages": state["messages"]
                + [AIMessage(content=f"计划生成失败: {error_msg}")],
            }

    # Define the workflow graph with planning and chat nodes
    workflow = StateGraph(AgentState)
    workflow.add_node("research_node", research_node)
    workflow.add_node("plan_node", plan_node)
    workflow.add_edge(
        START,
        "research_node",
    )
    workflow.add_edge(
        "research_node",
        "plan_node",
    )
    # Define the edges
    # Finally, we compile it!
    # This compiles it into a LangChain Runnable,
    # meaning you can use it as you would any other runnable
    return workflow.compile(
        checkpointer=checkpointer,
        store=store,
        interrupt_before=interrupt_before,
        interrupt_after=interrupt_after,
        debug=debug,
        name=name,
    )
