"""
创建规划代理的主入口模块。

本模块负责定义和构建规划代理的工作流图，包括状态管理、工具集成、节点定义和边缘连接。
主要功能：
- 构建双节点工作流（研究节点和规划节点）
- 管理代理状态和消息流
- 集成外部工具和模型
- 处理异常和错误情况
"""

# Standard library imports
from typing import Any, Callable, Optional, Sequence, Type, Union
from langchain_core.language_models import (
    LanguageModelLike,
)

from langchain_core.tools import BaseTool
from langgraph.prebuilt.tool_node import ToolNode
from langgraph.prebuilt.chat_agent_executor import (
    Prompt,
    StructuredResponseSchema,
    StateSchemaType,
)
from langgraph.types import Checkpointer
from langgraph.store.base import BaseStore

# Third-party imports
from langchain_core.messages import AIMessage, HumanMessage
from langgraph.graph import StateGraph, START
from langgraph.prebuilt import create_react_agent
from langgraph.prebuilt.chat_agent_executor import AgentState

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
            STATE_MODIFIER = """你是一个专注于数据分析和信息收集的研究代理。你的职责是收集和任务相关信息，并不需要完成用户提出的任务：
- 仅使用查看和分析类工具，严格禁止使用任何写入功能的工具
- 系统地收集和分析任务相关信息
- 保持客观，不做主观判断或建议
- 每次工具使用后保持沉默
- 信息收集完成时，仅回复"收集完成"
- 工具使用次数不超过五次
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
                + [
                    AIMessage(
                        content=f"规划生成失败 - {error_msg}。请检查输入参数和系统状态"
                    )
                ],
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
