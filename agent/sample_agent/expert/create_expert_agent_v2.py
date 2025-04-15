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
from sample_agent.swarm.handoff import (
    create_handoff_tool_for_react,
    create_handoff_tool,
    create_handoff_tool_defer,
    HandoffError,
)
from sample_agent.config import AgentRouteConfig
from sample_agent.swarm import create_swarm, SwarmState
from langgraph.types import interrupt
from copilotkit.langgraph import copilotkit_interrupt
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
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from langgraph.prebuilt import create_react_agent
from langgraph.prebuilt.chat_agent_executor import AgentState
from sample_agent.errors import handle_tool_error
from langgraph.func import entrypoint
from langgraph.types import Command


class ExpertState(AgentState, SwarmState):
    plan_enabled: bool = False  # 控制是否启用计划节点
    searched: bool = False
    planned: bool = False


def create_expert_agent(
    name: str,
    research_model: Union[str, LanguageModelLike],
    planner_model: Union[str, LanguageModelLike],
    execute_model: Union[str, LanguageModelLike],
    plan_prompt: Optional[Prompt],
    plan_system_prompt: Optional[Prompt],
    tools: Union[Sequence[Union[BaseTool, Callable]], ToolNode],
    research_system_prompt: Optional[Prompt] = None,
    execute_system_prompt: Optional[Prompt] = None,
    response_format: Optional[
        Union[StructuredResponseSchema, tuple[str, StructuredResponseSchema]]
    ] = None,
    state_schema: Optional[StateSchemaType] = ExpertState,
    config_schema: Optional[Type[Any]] = None,
    checkpointer: Optional[Checkpointer] = None,
    store: Optional[BaseStore] = None,
    interrupt_before: Optional[list[str]] = None,
    interrupt_after: Optional[list[str]] = None,
    debug: bool = False,
):
    @entrypoint()
    async def research_agent(state: ExpertState):
        try:
            research_tools = [
                create_handoff_tool_for_react(agent_name="plan_agent"),
                create_handoff_tool_for_react(agent_name="execute_agent"),
            ] + tools.copy()
            react_agent = create_react_agent(
                research_model,
                research_tools,
                checkpointer=checkpointer,
                store=store,
                state_modifier=research_system_prompt,
                state_schema=state_schema,
            )
            plan_response = await react_agent.ainvoke(state)
            return {
                "messages": state["messages"] + plan_response.get("messages", []),
                "searched": True,
            }

        except HandoffError as e:
            return e.toCommand()
        except Exception as e:
            error_msg, details = handle_tool_error(e)
            return {
                "messages": state["messages"]
                + [
                    AIMessage(
                        content=f"研究生成失败 - {error_msg} {e}。请检查输入参数和系统状态"
                    )
                ],
                "searched": False,
            }

    @entrypoint()
    async def plan_agent(state: ExpertState):
        try:
            plan_tools = [
                create_handoff_tool_for_react(agent_name="execute_agent"),
                create_handoff_tool_for_react(agent_name="research_agent"),
            ]
            react_agent = create_react_agent(
                planner_model,
                plan_tools,
                checkpointer=checkpointer,
                store=store,
                state_modifier=plan_system_prompt,
                state_schema=state_schema,
            )
            plan_response = await react_agent.ainvoke(state)
            return {
                "messages": state["messages"] + plan_response.get("messages", []),
                "planned": True,
            }

        except HandoffError as e:
            return e.toCommand()
        except Exception as e:
            error_msg, details = handle_tool_error(e)
            return {
                "messages": state["messages"]
                + [AIMessage(content=f"计划生成失败: {error_msg} {e}")],
                "planned": False,
            }

    @entrypoint()
    async def execute_agent(state: ExpertState):
        try:
            execute_tools = (
                [
                    create_handoff_tool_for_react(agent_name="research_agent"),
                    create_handoff_tool_for_react(agent_name="plan_agent"),
                ]
                if state.get("plan_enabled", False)
                else []
            ) + tools.copy()
            react_agent = create_react_agent(
                execute_model,
                execute_tools,
                checkpointer=checkpointer,
                store=store,
                state_modifier=execute_system_prompt,
                state_schema=state_schema,
            )
            plan_response = await react_agent.ainvoke(state)

            return {
                "messages": state["messages"] + plan_response.get("messages", []),
            }

        except HandoffError as e:
            return e.toCommand()
        except Exception as e:
            error_msg, details = handle_tool_error(e)
            return {
                "messages": state["messages"]
                + [
                    AIMessage(
                        content=f"执行生成失败 - {error_msg} {e}。请检查输入参数和系统状态"
                    )
                ],
            }

    plan_agent.name = "plan_agent"
    research_agent.name = "research_agent"
    execute_agent.name = "execute_agent"
    route_config = AgentRouteConfig(
        input_agents=["research_agent", "plan_agent", "execute_agent"],
        default_agent="execute_agent",
    )

    # Define the workflow graph with planning and chat agents
    # print(route_config.routes)
    expert = create_swarm(
        [research_agent, plan_agent, execute_agent],
        default_active_agent=route_config.default_agent,
        target=route_config.routes,
        state_schema=state_schema,
    )
    graph = expert.compile(
        checkpointer=checkpointer,
        store=store,
        interrupt_before=interrupt_before,
        interrupt_after=interrupt_after,
        debug=debug,
        name=name,
    )
    return graph
