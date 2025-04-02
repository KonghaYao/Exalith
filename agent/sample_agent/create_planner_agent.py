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

# Local imports
from sample_agent.config import initialize_tools
from sample_agent.errors import handle_tool_error


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

    async def research_node(state: AgentState):
        """
        信息搜索节点：负责收集和组织任务相关的信息

        参数:
            state (AgentState): 当前代理状态，包含消息历史和上下文信息

        返回:
            dict: 包含更新后的消息列表的状态字典
                - messages: 包含原始消息和响应消息的列表

        功能:
            - 使用专业研究代理收集任务相关信息
            - 限制工具使用次数最多5次
            - 不进行信息汇总，仅收集原始数据
            - 为计划节点提供决策所需的信息基础
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

    async def plan_node(state: AgentState):
        """
        计划节点：基于收集的信息生成结构化执行计划

        参数:
            state (AgentState): 当前代理状态，包含消息历史和上下文信息

        返回:
            dict: 包含更新后的消息列表的状态字典
                - messages: 包含原始消息和计划响应的列表

        功能:
            - 分析用户请求的复杂度
            - 制定具体可执行的步骤
            - 生成两层结构的任务分解
            - 预判可能的执行障碍
        """
        try:

            # 生成计划
            plan_prompt = f"""
请根据任务复杂度和上面收集到的信息生成一份执行计划。
计划的文章长度取决于用户提出的需求，而不是一味求长。
对于简单任务，直接给出关键步骤，不需要细节内容；
对于复杂任务，再展开子步骤和细节。
你可以修复一些用户的执行要求缺陷，但是不必扩展用户的需求，揣测用户的意图。
不用给出示例代码，简述流程即可。

请确保：
1. 步骤清晰可执行，简洁
2. 复杂任务最多展开两层
3. 关注实际执行效果
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
    return workflow.compile(
        checkpointer=checkpointer,
        store=store,
        interrupt_before=interrupt_before,
        interrupt_after=interrupt_after,
        debug=debug,
        name=name,
    )
