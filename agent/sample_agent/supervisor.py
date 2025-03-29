from langchain_openai import ChatOpenAI
from langgraph_supervisor import create_supervisor
from langgraph.prebuilt import create_react_agent
from sample_agent.model_factory import (
    create_chat_model,
    create_planner_model,
    create_dispatcher_model,
)
from sample_agent.agent import create_plan_and_execute_agent

model = create_planner_model()


def create_super_agent():
    # Create supervisor workflow
    workflow = create_supervisor(
        [create_plan_and_execute_agent],
        model=create_dispatcher_model(),
        prompt=(
            "You are a team supervisor managing a research expert and a math expert. "
            "For current events, use research_agent. "
            "For math problems, use math_agent."
        ),
    )
    return workflow.compile()
