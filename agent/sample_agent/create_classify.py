import json
from sample_agent.model_factory import create_classify_model
from langchain_core.messages import HumanMessage, AIMessage

async def classify_intent(state, intent_dict) -> str:
    """Classifies the user's intent using the intent detection model"""
    # Convert to a string for the system prompt
    intent_string = json.dumps(intent_dict, ensure_ascii=False)

    # Define the system prompt
    system_prompt = f"""You are a helpful assistant. You should choose one tag from the tag list:
    {intent_string}
    Just reply with the chosen tag."""
    client = create_classify_model("tongyi-intent-detect-v3")
    
    # 将state中的messages转换为适合LLM调用的格式
    formatted_messages = [
        {"role": "system", "content": system_prompt},
    ]
    
    # 添加对话历史
    for msg in state["messages"]:
        if isinstance(msg, HumanMessage):
            formatted_messages.append({"role": "user", "content": msg.content})
        elif isinstance(msg, AIMessage):
            formatted_messages.append({"role": "assistant", "content": msg.content})
    
    # 调用意图检测模型
    response = await client.ainvoke(formatted_messages)
    
    # 提取意图标签（确保处理AIMessage对象）
    if hasattr(response, 'content'):
        intent_tag = response.content
    else:
        # 如果response是AIMessage对象
        intent_tag = response.content
        
    # 清理标签（移除可能的额外空格或符号）
    intent_tag = intent_tag.strip()
    
    return intent_tag