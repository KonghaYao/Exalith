from langchain_openai import ChatOpenAI, AzureChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_community.chat_models import ChatLiteLLM
from typing import Optional
import os


# 统一使用 openrouter 的 api 就可以使用 openai 的接口接入所有的模型


def create_llm_model(
    model_name: Optional[str] = None,
    web_search_enabled: bool = False,
    temperature: float | None = None,
    top_p: float | None = None,
    frequency_penalty: float | None = None,
    presence_penalty: float | None = None,
    top_k: int | None = None,
    **kwargs,
) -> ChatOpenAI | ChatAnthropic | AzureChatOpenAI | ChatLiteLLM:
    return ChatOpenAI(
        model=model_name,
        base_url=os.getenv("OPENAI_BASE_URL"),
        api_key=os.getenv("OPENAI_API_KEY"),
        temperature=temperature,
        top_p=top_p,
        frequency_penalty=frequency_penalty,
        presence_penalty=presence_penalty,
        extra_body={"enable_search": web_search_enabled},
    )
