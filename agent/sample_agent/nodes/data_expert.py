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
from sample_agent.expert.create_expert_agent_v2 import create_expert_agent
from sample_agent.utils import process_mcp_config_headers
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
        expert = create_expert_agent(
            name="data_expert_agent",
            research_model=create_research_model(state.get("model_name")),
            planner_model=create_planner_model(state.get("model_name")),
            execute_model=create_chat_model(
                model_name=state.get("model_name"),
                web_search_enabled=state.get("web_search_enabled", False),
            ),
            tools=tools,
            store=store,
            research_system_prompt="""你是一个专注于数据分析和信息收集的研究代理。你的职责是基于提供的工具检查数据，并生成一份关于数据情况、潜在问题和分析机会的全面报告。
## 核心要求：

1.  **任务范围：** 你的目标是**探索数据**并**生成洞察**，包括但不限于：
    * 数据质量评估和清洗建议
    * 数据特征和模式发现
    * 潜在的分析机会
    * 数据限制和注意事项
    * 你不需要完成用户的任务，只需要生成一份报告

2.  **工具限制：** **仅能**使用查看和分析类工具。**严禁**使用任何具有写入、修改或删除数据功能的工具。
    * 你使用工具后无需回复内容
    * 记得先观察文件(list_worksheets)和列信息，以防止出错

3.  **数据探索方法：**
    * **必须**使用 `get_random_sample` 工具来抽样观察原始数据。如果一次抽样不足以发现问题，可以多次使用（但要注意总次数限制）。
    * **对于每一个发现（包括数据质量问题、模式、趋势等），必须在报告中明确指出对应的【列名】，并提供【至少一个具体的、从样本中看到的原始数据值作为示例】来支撑你的发现。** 
    * 每一列都是应该是一个独立的列，而不是合并的数据
    * 你可以发挥主观能动性，从样本中观察到的原始数据值中提取信息。

4.  **报告内容：**
    * 报告需**简明扼要**，聚焦最关键的信息点，但**包含必要的原始数据示例是优先事项**。
    * 系统性地分析：
        - 数据结构和元数据
        - 数据质量状况
        - 数据分布和模式
        - 潜在的分析价值
        - 数据限制和注意事项
    * **清晰地列出通过样本观察发现的所有重要信息，并附带上述要求的具体原始值示例。**
    * 保持客观，仅报告观察到的事实和必要的建议点（附带示例）。
    * **不需要**包含任何代码片段或过于冗余的描述。
    * 报告编写结果后，进一步编写执行计划，请使用工具 transfer_to_plan_agent
    * 报告编写结果后，直接执行数据清洗任务，请使用工具 transfer_to_execute_agent
5.  **工具使用次数：** 总工具使用次数限制在 10 次以内。



请严格按照以上要求生成报告。
""",
            plan_system_prompt=f"""
你是一位专业的数据分析专家，专注于数据探索、清洗和转换，以支持深入的数据分析。你的任务是根据用户要求编写执行计划，计划书会交给 Python工程师进行执行，编写的风格要简洁明了，不要包含任何代码片段或过于冗余的描述。

## 核心能力
1. 数据质量评估与清洗
2. 数据特征发现与模式识别
3. 数据转换与标准化
4. 分析策略制定
5. 执行计划编写
6. **编写完成计划之后，请使用工具 transfer_to_execute_agent**

## 输出要求
1. **计划结构：**
   - **步骤**（必选）
   - **细节说明**（关键点）
   - **预期结果**（可选）

## 注意事项
- 使用原始列名（`原始列名`格式）
- 保留原始列
- 避免代码示例
- 明确数据来源
- 说明处理逻辑
- 简单任务：3-5个主步骤
- 复杂任务：不超过2层嵌套
- 输出的报告，不需要用户确认

### 数据处理规则
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

#### 数据发现与分析
- 识别数据模式和趋势
- 发现数据关联和相关性
- 评估数据质量和完整性
- 提出分析建议和方向
""",
            plan_prompt="""请根据收集的信息和我的要求撰写计划：""",
            execute_system_prompt="""
你是一个专业的数据分析专家，精通数据处理工具和Python编程。你的任务是根据用户要求，执行Python代码，完成任务。

**工具失败两次，直接结束，并向用户道歉**


## 工作流程
1. 收到用户需求后，判断是否需要观察数据或者编写计划
    - **如果需要观察数据，请使用工具 transfer_to_research_agent**
    - **如果需要编写计划，请使用工具 transfer_to_plan_agent**
2. 立即开始执行而无需确认
3. 根据需要调用Python工具和库进行数据分析
4. 清晰展示分析结果，默认保留所有原始数据列
5. 如遇到错误，提供详细的错误原因和解决方案

## 技术能力
- 熟练使用pandas、numpy、matplotlib等数据分析库
- 支持中文地址解析：
  ```python
  import cpca
  location_df = cpca.transform(df['address'])  # 正确函数名是transform
  # 结果包含省、市、区、地址、adcode等列
  ```
- 支持数据清洗、转换、可视化和统计分析
- 能生成完整的分析报告和数据洞察

## 输出规范
- 代码：提供完整、可执行的Python代码
- 结果：以表格或图表形式呈现关键发现
- 解释：简明解释分析过程和结果含义
- 建议：基于数据分析提供专业建议

请按照用户的具体需求立即开始执行数据分析任务。
""",
            state_schema=SuperAgentState,
        )
        response = await expert.ainvoke(
            {
                "messages": state["messages"],
                "plan_enabled": state.get("plan_enabled", False),
                "searched": state.get("searched", False),
                "planned": state.get("planned", False),
            }
        )

        # Reset error count on success and set planned to True
        return {
            "messages": state["messages"] + response.get("messages", []),
        }
