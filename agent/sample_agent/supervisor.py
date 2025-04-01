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
from sample_agent.create_plan_and_execute_agent import AgentState
from sample_agent.errors import handle_tool_error, ToolInitializationError
from sample_agent.config import (
    store,
    initialize_tools,
    STATE_MODIFIER,
)
from langchain_core.messages import ToolMessage, AIMessage, HumanMessage
from langchain_mcp_adapters.client import MultiServerMCPClient


@entrypoint()
async def create_planner_agent(state: AgentState):
    system_message = {"role": "system", "content": planner_prompt}
    model = create_planner_model()
    mes = await model.ainvoke([system_message] + state["messages"])
    messages = add_messages(state["messages"], [mes])
    return {"messages": messages}


create_planner_agent.name = "create_planner_agent"


@entrypoint()
async def execute_agent(state: AgentState):
    try:
        mcp_config = state.get("mcp_config")
        actions = state.get("copilotkit", {}).get("actions", [])
        print(mcp_config)

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


execute_agent.name = "execute_agent"


def create_super_agent():
    workflow = create_supervisor(
        [create_planner_agent, execute_agent],
        model=create_dispatcher_model(),
        prompt=(
            "你是一个团队主管，负责管理计划和执行代理。对于任何复杂任务，使用create_planner_agent将其分解为步骤，并系统地汇总并交由其他人员执行。"
        ),
        output_mode="full_history",
        state_schema=AgentState,
    )
    return workflow
