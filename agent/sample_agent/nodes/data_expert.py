from typing import Dict, Any
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_core.runnables import RunnableConfig
from sample_agent.state import SuperAgentState
from sample_agent.config import store, initialize_tools
from sample_agent.model_factory import (
    create_planner_model,
    create_chat_model,
    create_research_model,
)
from sample_agent.create_expert_agent import create_expert_agent
from sample_agent.utils import process_mcp_config_headers
from sample_agent.checkpointer import checkpoint
from langgraph.func import entrypoint


@entrypoint()
async def data_expert(state: SuperAgentState, config: RunnableConfig):
    """
    信息搜索节点，搜索的信息交由计划节点
    """
    mcp_config = process_mcp_config_headers(state.get("mcp_config"))
    actions = state.get("copilotkit", {}).get("actions", [])
    async with MultiServerMCPClient(mcp_config) as mcp_client:
        # 初始化工具
        tools = await initialize_tools(mcp_client, actions)
        planner_agent = create_expert_agent(
            research_model=create_research_model(state.get("model_name")),
            planner_model=create_planner_model(state.get("model_name")),
            execute_model=create_chat_model(
                model_name=state.get("model_name"),
                web_search_enabled=state.get("web_search_enabled", False),
            ),
            tools=tools,
            checkpointer=checkpoint,
            store=store,
            research_system_prompt="""你是一个专注于数据分析和信息收集的研究代理。你的职责是基于提供的工具检查数据，并生成一份关于数据情况和潜在清洗点的报告，这份报告将交给后续的数据处理工程师。

**核心要求：**

1.  **任务范围：** 你的目标是**检查数据**并**报告发现**，**不需要**执行任何清洗操作或完成最终的数据分析任务。
2.  **工具限制：** **仅能**使用查看和分析类工具。**严禁**使用任何具有写入、修改或删除数据功能的工具。
    * 你使用工具后无需回复内容
    * 记得先观察文件(list_worksheets)和列信息，以防止出错
3.  **数据抽样与示例（重点）：**
    * **必须**使用 `get_random_sample` 工具来抽样观察原始数据。如果一次抽样不足以发现问题，可以多次使用（但要注意总次数限制）。
    * **对于每一个你识别出的数据质量问题或清洗建议（例如格式不统一、特殊字符、需要拆分等），必须在报告中明确指出对应的【列名】，并提供【至少一个具体的、从样本中看到的原始数据值作为示例】来支撑你的发现。** 
    * 每一列都是应该是一个独立的列，而不是合并的数据
    * 你可以发挥主观能动性，从样本中观察到的原始数据值中提取信息。
4.  **报告内容：**
    * 报告需**简明扼要**，聚焦最关键的信息点，但**包含必要的原始数据示例是优先事项**。
    * 系统性地分析工作表结构、列信息、缺失值情况。
    * **清晰地列出通过样本观察发现的数据质量问题，并附带上述要求的具体原始值示例。**
    * 保持客观，仅报告观察到的事实和必要的清洗建议点（附带示例）。
    * **不需要**包含任何代码片段或过于冗余的描述。
5.  **工具使用次数：** 总工具使用次数限制在 10 次以内。

请严格按照以上要求生成报告。
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
- 保留原始列
- 避免代码示例
- 明确数据来源
- 说明处理逻辑
- 简单任务：3-5个主步骤
- 复杂任务：不超过2层嵌套

### 清洗规则
#### 缺失数据处理
- 数值类型：明确缺失标记为0，否则保留空值。
    - 如 无、- 等缺失文本标记为 0
- 文本类型：不填充，保留空值。

#### 文本数据处理
- 单列多维度：识别并设计拆分方案，定义新列名。
- 数值+文本混合：提取数值，按需保留文本。

#### 地址数据处理
- 默认：保留原始格式。
- 需要时：使用cpca库解析。

#### 数值数据处理
- 统一保留原始小数位数。
- 处理异常值。
""",
            plan_prompt="""请根据收集的信息和我的要求撰写计划：""",
            execute_system_prompt="""你是一个数据清理大师，请严格按照用户需求或者计划完成任务并回复用户信息。你需要具体检查文件, 检查表的列的状态，确认用户的需求能够运行，然后调用工具完成任务。如果有结果文件，默认保留原始列。不用确认是否执行任务，可以直接开始执行。""",
            state_schema=SuperAgentState,
        )
        plan_response = await planner_agent.ainvoke(state)

        # Reset error count on success and set planned to True
        return {
            "messages": state["messages"] + plan_response.get("messages", []),
        }
