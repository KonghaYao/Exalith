"""Error handling module for the agent.
This module contains custom exceptions and error handling utilities.
"""

from typing import Optional, Any, Dict
from langchain_core.tools import ToolException


class AgentError(Exception):
    """Base exception class for agent errors."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.details = details or {}


class ToolInitializationError(AgentError):
    """Raised when tool initialization fails."""

    pass


class ModelConfigError(AgentError):
    """Raised when model configuration is invalid."""

    pass


class StateUpdateError(AgentError):
    """Raised when state update fails."""

    pass


class MemoryOperationError(AgentError):
    """Raised when memory operations fail."""

    pass


def handle_tool_error(error: Exception) -> tuple[str, Optional[Dict[str, Any]]]:
    """Handle tool execution errors and return appropriate response."""
    if isinstance(error, ToolException):
        return f"Tool execution failed: {str(error)}", {"error_type": "tool_error"}
    elif isinstance(error, AgentError):
        return str(error), error.details
    else:
        return f"Unexpected error: {str(error)}", {"error_type": "unknown_error"}


def format_error_message(error: Exception) -> str:
    """Format error message for logging and user feedback."""
    if isinstance(error, AgentError):
        return f"{error.__class__.__name__}: {str(error)}"
    return f"Error: {str(error)}"
