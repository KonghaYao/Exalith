from langgraph_supervisor import create_supervisor
from langgraph.prebuilt import create_react_agent
from sample_agent.model_factory import (
    create_chat_model,
    create_planner_model,
    create_dispatcher_model,
)
from sample_agent.prompts import planner_prompt
import json
from langgraph.graph import add_messages
from langgraph.func import entrypoint, task
from sample_agent.create_plan_and_execute_agent import SuperAgentState
from sample_agent.errors import handle_tool_error, ToolInitializationError
from sample_agent.config import (
    store,
    initialize_tools,
)
from langchain_core.messages import ToolMessage, AIMessage, HumanMessage
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph_swarm import (
    create_handoff_tool,
)
from langgraph.graph import StateGraph, END, START

from langgraph.graph import START, MessagesState, StateGraph
from langgraph.graph.state import CompiledStateGraph
from typing_extensions import (
    Any,
    Literal,
    Optional,
    Type,
    TypeVar,
    Union,
    get_args,
    get_origin,
)


class SwarmState(MessagesState, SuperAgentState):
    """State schema for the multi-agent swarm."""

    # NOTE: this state field is optional and is not expected to be provided by the user.
    # If a user does provide it, the graph will start from the specified active agent.
    # If active agent is typed as a `str`, we turn it into enum of all active agent names.
    active_agent: Optional[str]


StateSchema = TypeVar("StateSchema", bound=SwarmState)
StateSchemaType = Type[StateSchema]


def _update_state_schema_agent_names(
    state_schema: StateSchemaType, agent_names: list[str]
) -> StateSchemaType:
    """Update the state schema to use Literal with agent names for 'active_agent'."""

    active_agent_annotation = state_schema.__annotations__["active_agent"]

    # Check if the annotation is str or Optional[str]
    is_str_type = active_agent_annotation is str
    is_optional_str = (
        get_origin(active_agent_annotation) is Union
        and get_args(active_agent_annotation)[0] is str
    )

    # We only update if the 'active_agent' is a str or Optional[str]
    if not (is_str_type or is_optional_str):
        return state_schema

    updated_schema = type(
        f"{state_schema.__name__}",
        (state_schema,),
        {"__annotations__": {**state_schema.__annotations__}},
    )

    # Create the Literal type with agent names
    literal_type = Literal.__getitem__(tuple(agent_names))

    # If it was Optional[str], make it Optional[Literal[...]]
    if is_optional_str:
        updated_schema.__annotations__["active_agent"] = Optional[literal_type]
    else:
        updated_schema.__annotations__["active_agent"] = literal_type

    return updated_schema


def add_active_agent_router(
    builder: StateGraph,
    *,
    route_to: list[str],
    default_active_agent: str,
) -> StateGraph:
    """Add a router to the currently active agent to the StateGraph.

    Args:
        builder: The graph builder (StateGraph) to add the router to.
        route_to: A list of agent (node) names to route to.
        default_active_agent: Name of the agent to route to by default (if no agents are currently active).

    Returns:
        StateGraph with the router added.
    """
    channels = builder.schemas[builder.schema]
    if "active_agent" not in channels:
        raise ValueError(
            "Missing required key 'active_agent' in in builder's state_schema"
        )

    if default_active_agent not in route_to:
        raise ValueError(
            f"Default active agent '{default_active_agent}' not found in routes {route_to}"
        )

    def route_to_active_agent(state: dict):
        return state.get("active_agent", default_active_agent)

    builder.add_conditional_edges(START, route_to_active_agent, path_map=route_to)
    return builder


def create_swarm(
    agents: list[CompiledStateGraph],
    *,
    default_active_agent: str,
    state_schema: StateSchemaType = SwarmState,
    config_schema: Type[Any] | None = None,
    target={},
) -> StateGraph:
    """Create a multi-agent swarm.

    Args:
        agents: List of agents to add to the swarm
        default_active_agent: Name of the agent to route to by default (if no agents are currently active).
        state_schema: State schema to use for the multi-agent graph.
        config_schema: An optional schema for configuration.
            Use this to expose configurable parameters via supervisor.config_specs.

    Returns:
        A multi-agent swarm StateGraph.
    """
    active_agent_annotation = state_schema.__annotations__.get("active_agent")
    if active_agent_annotation is None:
        raise ValueError("Missing required key 'active_agent' in state_schema")

    agent_names = [agent.name for agent in agents]
    state_schema = _update_state_schema_agent_names(state_schema, agent_names)
    builder = StateGraph(state_schema, config_schema)
    add_active_agent_router(
        builder,
        route_to=agent_names,
        default_active_agent=default_active_agent,
    )
    for agent in agents:
        builder.add_node(
            agent.name,
            agent,
            destinations=tuple(target.get(agent.name, [])),
        )

    return builder


@entrypoint()
async def create_planner_agent(state: SuperAgentState):
    system_message = """
你是一个计划生成器，负责根据用户的需求生成执行计划。
                      
你可以要求下面的角色在你的计划中执行任务：
execute_agent 任务执行者，可以执行任何任务，任务请交给他
"""
    model = create_planner_model()
    agent = create_react_agent(
        model,
        [create_handoff_tool(agent_name="execute_agent")],
        state_modifier=system_message,
    )
    msg = await agent.ainvoke(state)
    messages = add_messages(state["messages"], msg.get("messages", []))
    return {"messages": messages}


create_planner_agent.name = "create_planner_agent"


@entrypoint()
async def execute_agent(state: SuperAgentState):
    try:
        mcp_config = state.get("mcp_config")
        actions = state.get("copilotkit", {}).get("actions", [])

        async with MultiServerMCPClient(mcp_config) as mcp_client:
            # Initialize tools with error handling
            tools = await initialize_tools(mcp_client, actions)
            # Create the react agent with optimized configuration
            react_agent = create_react_agent(
                create_chat_model(
                    model_name=state.get("model_name"),
                    web_search_enabled=state.get("web_search_enabled", False),
                ),
                tools,
                store=store,
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


execute_agent.name = "execute_agent"

import pathlib
from langgraph.checkpoint.sqlite import SqliteSaver


def create_super_agent():
    workflow = create_swarm(
        [create_planner_agent, execute_agent],
        default_active_agent="create_planner_agent",
        target={
            "create_planner_agent": ("execute_agent",),
        },
        state_schema=SwarmState,
    )
    db_path = pathlib.Path("./agent_data.db")
    # 使用 SQLiteSaver 替代 MemorySaver
    return workflow.compile(SqliteSaver(db_path))
