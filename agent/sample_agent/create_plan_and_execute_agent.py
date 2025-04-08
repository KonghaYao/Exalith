"""
This is the main entry point for the agent.
It defines the workflow graph, state, tools, nodes and edges.
"""

from typing_extensions import Literal, TypedDict, Dict, List, Any, Union, Optional
from langgraph.graph import StateGraph, END, START
from copilotkit import CopilotKitState
from langgraph.prebuilt.chat_agent_executor import AgentState
import pathlib
import os
from sample_agent.create_expert_agent import ExpertState
from langgraph.types import interrupt
from sample_agent.nodes import dispatch_node, excel_helper, all_helper
from sample_agent.checkpointer import checkpoint

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


class SuperAgentState(ExpertState, CopilotKitState, AgentState):
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





def create_plan_and_execute_agent():
    workflow = StateGraph(SuperAgentState)
    workflow.add_node("dispatch_node", dispatch_node)
    workflow.add_node("excel-helper", excel_helper)
    workflow.add_node("all-helper", all_helper)

    workflow.add_edge(START, "dispatch_node")
    workflow.add_edge("dispatch_node", END)
    workflow.add_conditional_edges(
        "dispatch_node",
        lambda state: state.get("next_step", "end"),
        {
            "excel-helper": "excel-helper",
            "all-helper": "all-helper",
            "end": END,
        },
    )

    # 使用 SQLiteSaver 替代 MemorySaver
    graph = workflow.compile(checkpointer=checkpoint)
    return graph
