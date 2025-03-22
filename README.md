# Getting Started

## Set Up Environment Variables

```sh
touch .env
```

Add the following inside `.env` at the root:

```sh
LANGSMITH_API_KEY=
OPENAI_MODEL=
OPENAI_API_KEY=
OPENAI_BASE_URL=
OSS_BASE_PATH=./packages/powerExcelMCP/excel_files
```

## Development

```bash
git submodule update --init --recursive
pnpm run dev
```

Then, open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

The codebase is split into two main parts:

1. `/agent` **folder** – A LangGraph agent that connects to MCP servers and calls their tools.
2. `/app` **folder** – A frontend application using CopilotKit for UI and state synchronization.
3. `/packages/server` **folder** – A MCP server that can be used to run the agent.
   1. `pnpm dev` – Starts the server.
   2. `/mcp-config.example.json` - An example MCP config file can import from frontend.

```mermaid
flowchart TB
    subgraph Frontend["前端应用层"]
        UI[对话组件]
        SDK[CopilotKit SDK]
        Tools[资源浏览器]
    end
    subgraph Agent["Agent 层"]
        Engine[LangGraph 引擎]
        Toolkit[工具集]
    end
    subgraph KnowledgeBase["知识库"]
        Memory[记忆体]
        ExtKnowledge[知识库扩展]
    end
    subgraph Server["MCP 服务"]
        Endpoint[SSE 接口]
        ToolMgr[Tools]
    end
    subgraph Workspace["工作空间"]
        FS[文件系统]
        DB[数据库]
        Config[配置管理]
    end
    subgraph External["外部服务层"]
        Storage[存储服务]
        Search[搜索服务]
        LLM[大模型服务]
        Ops[运维服务]
    end

    Humnan["用户"] --> UI & Tools
    Tools --> Workspace
    Engine --> Memory & ExtKnowledge & LLM & Server
    Endpoint --> ToolMgr
    ToolMgr --> External & Workspace
    UI --> SDK
    Toolkit --> Engine
    SDK --> Toolkit

```
