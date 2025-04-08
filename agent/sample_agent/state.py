from typing_extensions import Literal, TypedDict, Dict, List, Any, Union, Optional
import os
from copilotkit import CopilotKitState
from langgraph.prebuilt.chat_agent_executor import AgentState
from sample_agent.create_expert_agent import ExpertState
from sample_agent.swarm.create_swarm import SwarmState


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


class SuperAgentState(ExpertState, CopilotKitState, AgentState, SwarmState):
    """
    Enhanced agent state with improved state management and error handling.
    """

    mcp_config: Optional[MCPConfig]
    error_count: int = 0
    max_retries: int = 2
    web_search_enabled: bool = False
    model_name: str = os.getenv("OPENAI_MODEL")
    thinking_model_name: str | None = None
    next_step: str | None = None
