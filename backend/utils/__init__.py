"""
Utility functions for the backend
"""

from .section_splitter import (
    detect_landing_page_request,
    get_section_prompts,
    should_split_sections,
    extract_context
)

__all__ = [
    'detect_landing_page_request',
    'get_section_prompts',
    'should_split_sections',
    'extract_context'
]

