"""
Prompts Module
Contains LLM prompts for different generation tasks
"""

from .landing_page_prompts import (
    get_landing_page_system_prompt,
    get_component_system_prompt,
    get_gaze_optimization_prompt,
    detect_page_type
)

__all__ = [
    'get_landing_page_system_prompt',
    'get_component_system_prompt',
    'get_gaze_optimization_prompt',
    'detect_page_type'
]

