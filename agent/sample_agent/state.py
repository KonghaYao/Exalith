from typing_extensions import Literal, TypedDict, Dict, List, Any, Union, Optional
import os
from copilotkit import CopilotKitState
from langgraph.prebuilt.chat_agent_executor import AgentState
from sample_agent.expert.create_expert_agent import ExpertState
from sample_agent.swarm.create_swarm import SwarmState
from sample_agent.mcp.config import MCPConfig

class KnowledgeConfig(TypedDict):
    type: str
    dataset_ids: List[str]


class SuperAgentState(ExpertState, CopilotKitState, AgentState, SwarmState):
    """
    Enhanced agent state with improved state management and error handling.
    """

    mcp_config: Optional[MCPConfig]
    knowledge_config: Optional[KnowledgeConfig] = []
    error_count: int = 0
    max_retries: int = 2
    web_search_enabled: bool = False
    model_name: str = os.getenv("OPENAI_MODEL")
    thinking_model_name: str | None = None
    next_step: str | None = None
