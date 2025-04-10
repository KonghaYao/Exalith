from typing import Dict, Any
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_core.runnables import RunnableConfig
from langchain_core.messages import AIMessage
from langgraph.types import Command
from langgraph.graph import StateGraph, END, START
from sample_agent.state import SuperAgentState
from sample_agent.config import store, initialize_tools
from sample_agent.model_factory import create_chat_model
from sample_agent.errors import handle_tool_error
from sample_agent.utils import process_mcp_config_headers
from langgraph.prebuilt import create_react_agent
from langgraph_swarm import create_handoff_tool
from sample_agent.checkpointer import checkpoint
from langgraph.func import entrypoint
from sample_agent.state import KnowledgeConfig
from typing_extensions import Literal, TypedDict, Dict, List, Any, Union, Optional
from langchain_core.tools import StructuredTool


@entrypoint()
async def knowledge_helper(state: SuperAgentState, config: RunnableConfig):

    tools = create_knowledge_tools(state.get("knowledge_config", []))
    # Create the react agent with optimized configuration
    react_agent = create_react_agent(
        create_chat_model(
            model_name=state.get("model_name"),
            web_search_enabled=state.get("web_search_enabled", False),
        ),
        tools,
        store=store,
        state_schema=SuperAgentState,
    )

    agent_response = await react_agent.ainvoke(state)

    print("Agent Response:", agent_response["messages"])
    # Update state with success response and reset error count
    return {
        "messages": state["messages"] + agent_response.get("messages", []),
    }


#
class SearchKnowledgeBaseTool:
    """Tool to search a knowledge base and return specific knowledge."""

    def __init__(self, base_url: str, api_token: str):
        self.base_url = base_url
        self.api_token = api_token

    def search(self, query: str, dataset_ids: List[str]) -> str:
        """
        Search the knowledge base with the given query and dataset IDs.

        Args:
            query: The search query string
            dataset_ids: List of dataset IDs to search within

        Returns:
            Formatted search results
        """
        import requests

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_token}",
        }

        request_body = {"question": query, "dataset_ids": dataset_ids}

        try:
            response = requests.post(
                f"{self.base_url}/retrieval", headers=headers, json=request_body
            )

            response.raise_for_status()
            data = response.json()

            if data.get("code") != 0:
                raise ValueError(f"API error: {data.get('message', 'Unknown error')}")

            chunks = data.get("data", {}).get("chunks", [])
            formatted_text = ""

            for i, chunk in enumerate(chunks):
                content = chunk.get("content", "").replace("\r\n", "\n").strip()
                source = chunk.get("document_keyword", "Unknown")
                similarity = float(chunk.get("similarity", 0)) * 100

                formatted_text += (
                    f"{i + 1}. {content}\n\n来源: {source}\n相关度: {similarity:.2f}%"
                )

                if i < len(chunks) - 1:
                    formatted_text += "\n\n---\n\n"
            return formatted_text or "未找到相关内容"

        except Exception as e:
            return f"搜索出错: {str(e)}"


import os
from langchain_core.tools import tool
import functools
import asyncio

def create_langflow_tool(config: KnowledgeConfig):
    model = SearchKnowledgeBaseTool(
        base_url=os.getenv("RAGFLOW_BASE_URL"), api_token=os.getenv("RAGFLOW_TOKEN")
    )
    @tool
    async def search_knowledge(query: str) -> str:
        """搜索知识库

        Args:
            query (str): 搜索内容

        Returns:
            str: 返回内容
        """
        loop = asyncio.get_event_loop()
        # 将同步方法包装在线程池中执行
        result = await loop.run_in_executor(
            None, 
            functools.partial(model.search, query=query, dataset_ids=config["dataset_ids"])
        )
        return result
    return search_knowledge


knowledge_configs = {"langflow": create_langflow_tool}


def create_knowledge_tools(configs: List[KnowledgeConfig]):
    return [knowledge_configs[config["type"]](config) for config in configs]
