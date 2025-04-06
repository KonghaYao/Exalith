"""
This is the main entry point for the agent.
It defines the workflow graph, state, tools, nodes and edges.
"""

from typing_extensions import Literal, TypedDict, Dict, List, Any, Union, Optional
from langchain_openai import ChatOpenAI

from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph, END, START
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.types import Command
from copilotkit import CopilotKitState
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import ToolMessage, AIMessage, HumanMessage
from langgraph.prebuilt.chat_agent_executor import AgentState
import pathlib
import os
from sample_agent.config import (
    store,
    initialize_tools,
)
from sample_agent.errors import handle_tool_error, ToolInitializationError
from sample_agent.model_factory import create_planner_model, create_chat_model
from sample_agent.create_planner_agent import create_planner_agent


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


class AgentState(CopilotKitState, AgentState):
    """
    Enhanced agent state with improved state management and error handling.
    """

    mcp_config: Optional[MCPConfig]
    error_count: int = 0
    max_retries: int = 2
    web_search_enabled: bool = False
    plan_enabled: bool = False  # 控制是否启用计划节点
    planned = False  # 控制是否已经生成了计划
    model_name: str = os.getenv("OPENAI_MODEL")
    thinking_model_name: str | None = None
    next_step: str | None = None


async def plan_node(state: AgentState, config: RunnableConfig):
    """
    信息搜索节点，搜索的信息交由计划节点
    """
    try:
        mcp_config = process_mcp_config_headers(state.get("mcp_config"))
        actions = state.get("copilotkit", {}).get("actions", [])
        async with MultiServerMCPClient(mcp_config) as mcp_client:
            # 初始化工具
            tools = await initialize_tools(mcp_client, actions)
            if not tools:
                return {}
            planner_agent = create_planner_agent(
                research_model=create_chat_model("qwen-plus"),
                planner_model=create_planner_model("qwen-plus"),
                tools=tools,
                store=store,
                prompt="""你是一个专注于数据分析和信息收集的研究代理。你的职责是收集和任务相关信息，给出一份执行环境的报告。
- 你并不需要完成用户提出的任务
- 仅使用查看和分析类工具，严格禁止使用任何写入功能的工具
- 你需要使用 get_random_sample 来初步观察数据的样子
    - 根据样本中的数据样式，给出一些清洗建议
    - 有些数据可能有些脏，可以从中发现一些可以清洗的点，这个你需要记录原始数据的列和值举例，记录在报告中
    - 如果觉得数据不够，可以使用 get_random_sample 多次
- 系统地收集和分析任务相关信息
- 保持客观，不做主观判断或建议
- 工具使用次数不超过十次
- 你的报告需要简短，只包含特征最为显著的信息，不需要包含代码，不需要包含冗余的信息
""",
                plan_system_prompt=f"""
# 角色与职责
你是一位专业的数据清洗专家，专注于将原始数据转化为结构化、可分析的格式。

## 核心能力
1. 数据质量评估
2. 清洗策略制定
3. 数据转换设计
4. 执行计划编写

## 输出要求
1. **计划结构：**
   - **步骤**（必选）
   - **细节说明**（关键点）

## 注意事项
- 使用原始列名（`原始列名`格式）
- 避免代码示例
- 明确数据来源
- 说明处理逻辑
- 简单任务：3-5个主步骤
- 复杂任务：不超过2层嵌套

### 清洗规则
#### 缺失数据处理
- 数值类型：明确缺失标记为0，否则保留空值。
- 文本类型：使用"N/A"填充，否则保留空值。

#### 文本数据处理
- 单列多维度：识别并设计拆分方案，定义新列名。
- 数值+文本混合：提取数值，按需保留文本。

#### 地址数据处理
- 默认：保留原始格式。
- 需要时：使用cpca库解析。

#### 数值数据处理
- 统一保留2位小数。
- 处理异常值。
""",
                plan_prompt="""请根据收集的信息撰写数据清洗计划：""",
            )
            plan_response = await planner_agent.ainvoke(state)

            # Reset error count on success and set planned to True
            return {
                "messages": state["messages"] + plan_response.get("messages", []),
                "planned": True,
            }

    except Exception as e:
        error_msg, details = handle_tool_error(e)
        return {
            "messages": state["messages"]
            + [AIMessage(content=f"计划生成失败: {error_msg}")],
            "planned": False,
        }


async def excel_helper(state: AgentState, config: RunnableConfig):
    """
    Enhanced chat node with improved error handling and state management.
    """
    try:
        mcp_config = process_mcp_config_headers(state.get("mcp_config"))
        actions = state.get("copilotkit", {}).get("actions", [])

        async with MultiServerMCPClient(
            {"excel": {"url": "http://localhost:8000/sse", "transport": "sse"}}
        ) as mcp_client:
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
                state_modifier="""
你是一个数据清理大师，请严格按照用户需求或者计划完成任务并回复用户信息。
你需要具体检查文件, 检查表的列的状态，确认用户的需求能够运行，然后调用工具完成任务。如果有结果文件，默认保留原始列。
不用确认是否执行任务，可以直接开始执行。

注意事项：
1. 你无法回复链接和图片给用户
2. 编写代码时，不用编写 if __name__ == '__main__'
3. !!!所有的 import 都需要写在函数内，避免全局导入函数的性能损耗
4. 两次错误后直接放弃执行，并向用户道歉
5. 数据类型并不一定一致，请注意
6. 地址类型的列一定要使用 cpca 库进行解析
地址解析示例：
def main():
    import cpca
    address_df = cpca.transform(single_df_col) # DataFrame, 没有其它入参 
    address_df # 返回 DataFrame 包含 '省', '市', '区', '地址', 'adcode' 列
""",
            )

            # Execute agent with error handling
            try:
                agent_response = await react_agent.ainvoke(
                    {"messages": state["messages"]}
                )
                # Update state with success response and reset error count
                return {
                    "messages": state["messages"] + agent_response.get("messages", []),
                    "error_count": 0,
                    "planned": True,
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
                            "planned": True,
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
                        "planned": True,
                    },
                )

    except Exception as e:
        error_msg, details = handle_tool_error(e)
        return {
            "messages": state["messages"] + [AIMessage(content=error_msg)],
            "planned": True,
        }


async def all_helper(state: AgentState, config: RunnableConfig):
    """
    Enhanced chat node with improved error handling and state management.
    """
    try:
        mcp_config = process_mcp_config_headers(state.get("mcp_config"))
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
                # state_modifier="",
            )

            # Execute agent with error handling
            try:
                agent_response = await react_agent.ainvoke(
                    {"messages": state["messages"]}
                )
                # Update state with success response and reset error count
                return {
                    "messages": state["messages"] + agent_response.get("messages", []),
                    "error_count": 0,
                    "planned": True,
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
                            "planned": True,
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
                        "planned": True,
                    },
                )

    except Exception as e:
        error_msg, details = handle_tool_error(e)
        return {
            "messages": state["messages"] + [AIMessage(content=error_msg)],
            "planned": True,
        }


from sample_agent.create_classify import classify_intent
from sample_agent.utils import process_mcp_config_headers


async def chat_node(state):
    target = await classify_intent(
        state,
        {
            "excel-helper": "一个处理Excel的专家",
            "all-helper": "一个全能的助手，只有找不到其他专家的时候才会调用",
        },
    )
    return {"next_step": target}


# 添加条件路由
def should_plan(state: AgentState) -> Literal["plan_node", "chat_node"]:
    """根据state中的plan_enabled字段决定是否执行计划节点"""
    print("should_plan", state.get("planned"))
    # 如果计划已完成，直接进入chat_node
    if state.get("planned", False):
        return "chat_node"
    # 否则根据plan_enabled决定是否需要生成计划
    return "plan_node" if state.get("plan_enabled", False) else "chat_node"


def create_plan_and_execute_agent():

    workflow = StateGraph(AgentState)
    workflow.add_node("plan_node", plan_node)
    workflow.add_node("chat_node", chat_node)
    workflow.add_node("excel-helper", excel_helper)
    workflow.add_node("all-helper", all_helper)

    workflow.add_conditional_edges(START, should_plan, ["plan_node", "chat_node"])

    workflow.add_conditional_edges(
        "plan_node",
        lambda state: "chat_node" if state.get("planned", False) else END,
        {
            "chat_node": "chat_node",
            "end": END,
        },
    )
    workflow.add_conditional_edges(
        "chat_node",
        lambda state: state.get("next_step", "end"),
        {
            "excel-helper": "excel-helper",
            "all-helper": "all-helper",
            "end": END,
        },
    )

    workflow.add_edge("chat_node", END)

    db_path = pathlib.Path("./agent_data.db")
    # 使用 SQLiteSaver 替代 MemorySaver
    graph = workflow.compile(SqliteSaver(db_path))
    return graph
