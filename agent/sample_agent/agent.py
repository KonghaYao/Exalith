from sample_agent.nodes import data_expert, all_helper, knowledge_helper

from sample_agent.checkpointer import checkpoint
from sample_agent.config import route_config
from sample_agent.swarm.create_swarm import create_swarm
from sample_agent.state import SuperAgentState

data_expert.name = "data_expert"
all_helper.name = "all_helper"
knowledge_helper.name = "knowledge_helper"


def create_super_agent():
    workflow = create_swarm(
        [data_expert, all_helper, knowledge_helper],
        default_active_agent=route_config.default_agent,
        target=route_config.routes,
        state_schema=SuperAgentState,
    )
    return workflow.compile(checkpointer=checkpoint)


graph = create_super_agent()
