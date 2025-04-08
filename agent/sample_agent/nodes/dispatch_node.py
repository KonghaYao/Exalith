from typing import Dict, Any
from sample_agent.create_classify import classify_intent
from sample_agent.utils import process_mcp_config_headers
from sample_agent.state import SuperAgentState

async def dispatch_node(state: SuperAgentState) -> Dict[str, Any]:
    """
    Dispatch node that routes the request to the appropriate handler based on intent classification.
    """
    target = await classify_intent(
        state,
        {
            "excel-helper": "一个处理Excel的专家",
            "all-helper": "一个全能的助手，只有找不到其他专家的时候才会调用",
        },
    )
    return {"next_step": target} 