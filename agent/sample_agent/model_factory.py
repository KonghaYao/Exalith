"""Model factory module for creating different types of language models.
This module provides factory functions for creating different types of language models
with specific configurations based on their intended use.
"""

from typing import Optional
from langchain_openai import ChatOpenAI
import os
from .llms import create_llm_model


def create_planner_model(
    model_name: Optional[str] = None,
    web_search_enabled: bool = False,
) -> ChatOpenAI:
    """Create a model instance optimized for planning tasks.

    Args:
        model_name: Optional model name to use. Defaults to environment variable.
        web_search_enabled: Whether to enable web search capability.

    Returns:
        ChatOpenAI: Configured model instance for planning.
    """
    return create_llm_model(
        model_name=model_name or os.getenv("OPENAI_MODEL"),
        web_search_enabled=web_search_enabled,
        temperature=0.3,
        top_p=0.9,
        frequency_penalty=0.1,
        presence_penalty=0.1,
    )


def create_chat_model(
    model_name: Optional[str] = None, web_search_enabled: bool = False
) -> ChatOpenAI:
    """Create a model instance optimized for chat interactions.

    Args:
        model_name: Optional model name to use. Defaults to environment variable.
        web_search_enabled: Whether to enable web search capability.

    Returns:
        ChatOpenAI: Configured model instance for chat.
    """
    return create_llm_model(
        model_name=model_name or os.getenv("OPENAI_MODEL"),
        web_search_enabled=web_search_enabled,
        temperature=0.1,
        presence_penalty=0.0,
        frequency_penalty=0.3,
        top_p=0.95,
    )


def create_executer_model(
    model_name: Optional[str] = None, web_search_enabled: bool = False
) -> ChatOpenAI:
    """Create a model instance optimized for chat interactions.

    Args:
        model_name: Optional model name to use. Defaults to environment variable.
        web_search_enabled: Whether to enable web search capability.

    Returns:
        ChatOpenAI: Configured model instance for chat.
    """
    return create_llm_model(
        model_name=model_name or os.getenv("OPENAI_MODEL"),
        web_search_enabled=web_search_enabled,
        temperature=0.1,
        presence_penalty=0.0,
        frequency_penalty=0.3,
        top_p=0.95,
    )


def create_research_model(
    model_name: Optional[str] = None, web_search_enabled: bool = False
) -> ChatOpenAI:
    """Create a model instance optimized for chat interactions.

    Args:
        model_name: Optional model name to use. Defaults to environment variable.
        web_search_enabled: Whether to enable web search capability.

    Returns:
        ChatOpenAI: Configured model instance for chat.
    """
    return create_llm_model(
        model_name=model_name or os.getenv("OPENAI_MODEL"),
        web_search_enabled=web_search_enabled,
        temperature=0.7,  # 提高 temperature 以增加随机性
        presence_penalty=0.5,  # 提高 presence_penalty 以鼓励探索新概念
        frequency_penalty=0.5,  # 提高 frequency_penalty 以减少常用词的使用
        top_p=0.95,
        parallel_tool_calls=False,
    )
