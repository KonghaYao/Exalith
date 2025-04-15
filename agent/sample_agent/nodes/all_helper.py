from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_core.runnables import RunnableConfig
from sample_agent.state import SuperAgentState
from sample_agent.config import store, initialize_tools
from sample_agent.model_factory import create_chat_model
from sample_agent.utils import process_mcp_config_headers
from langgraph.prebuilt import create_react_agent
from sample_agent.swarm import create_handoff_tool
from langgraph.func import entrypoint


@entrypoint()
async def all_helper(state: SuperAgentState, config: RunnableConfig):
    """
    Enhanced chat node with improved error handling and state management.
    """
    mcp_config = process_mcp_config_headers(state.get("mcp_config"))
    actions = state.get("copilotkit", {}).get("actions", [])

    async with MultiServerMCPClient(mcp_config) as mcp_client:
        # Initialize tools with error handling
        tools = await initialize_tools(mcp_client, actions)
        tools += [create_handoff_tool(agent_name="data_expert")]
        # Create the react agent with optimized configuration
        react_agent = create_react_agent(
            create_chat_model(
                model_name=state.get("model_name"),
                web_search_enabled=state.get("web_search_enabled", False),
            ),
            tools,
            store=store,
            state_schema=SuperAgentState,
        )

        agent_response = await react_agent.ainvoke(state)

        print("Agent Response:", agent_response["messages"])
        # Update state with success response and reset error count
        return {
            "messages": state["messages"] + agent_response.get("messages", []),
            "error_count": 0,
            "planned": True,
        }
