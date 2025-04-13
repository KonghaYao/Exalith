"""Configuration module for the agent.
This module handles tool initialization and model settings.
"""

from typing import Any
from langchain_core.tools import StructuredTool
from langchain_mcp_adapters.client import MultiServerMCPClient
from langmem import create_manage_memory_tool, create_search_memory_tool
from langgraph.store.memory import InMemoryStore

# Initialize memory store with optimized settings
store = InMemoryStore(
    index={
        "dims": 1536,
        "embed": "openai:text-embedding-3-small",
    }
)


class AgentRouteConfig:
    def __init__(
        self,
        input_agents: list[str] = None,
        default_agent: str = None,
    ):
        self._agents = input_agents or []
        self._routes = self._generate_routes()
        self._default_agent = default_agent or (
            self._agents[0] if self._agents else None
        )

    def _generate_routes(self) -> dict:
        """为每个代理生成到其他所有代理的路由"""
        routes = {}
        for agent in self._agents:
            routes[agent] = [a for a in self._agents if a != agent]
        return routes

    @property
    def routes(self):
        return self._routes

    @property
    def default_agent(self):
        return self._default_agent

    def add_agent(self, agent_name: str):
        """添加新代理并更新路由"""
        if agent_name not in self._agents:
            self._agents.append(agent_name)
            self._routes = self._generate_routes()
            if not self._default_agent:
                self._default_agent = agent_name

    def remove_agent(self, agent_name: str):
        """移除代理并更新路由"""
        if agent_name in self._agents:
            self._agents.remove(agent_name)
            self._routes = self._generate_routes()
            if self._default_agent == agent_name:
                self._default_agent = self._agents[0] if self._agents else None

    def update_route(self, source: str, targets: list[str]):
        if source not in self._routes:
            raise ValueError(f"Agent {source} not found in routes")
        self._routes[source] = targets

    def set_default_agent(self, agent: str):
        if agent not in self._routes:
            raise ValueError(f"Agent {agent} not found in routes")
        self._default_agent = agent


def action_to_tool(tool):
    # Add structured tools with enhanced error handling
    async def call_tool(
        **arguments: dict[str, Any],
    ) -> tuple[str | list[str], None]:
        try:
            return ["执行完成", None]
        except Exception as e:
            return [f"Error: {str(e)}", None]

    return StructuredTool(
        name=tool["name"],
        description=tool["description"] or "",
        args_schema=tool["parameters"],
        coroutine=call_tool,
        response_format="content",
    )


# Tool initialization with error handling
async def initialize_tools(mcp_client: MultiServerMCPClient, actions: list) -> list:

    mcp_tools = mcp_client.get_tools()

    mcp_tools.extend([action_to_tool(tool) for tool in actions])

    # Add memory management tools
    memory_tools = [
        # create_manage_memory_tool(namespace=("memories",)),
        # create_search_memory_tool(namespace=("memories",)),
    ]

    tools = memory_tools + mcp_tools
    if not tools:
        return {}
    return tools
