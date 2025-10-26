"""
Fetch.ai uAgents for ClientSight
Cal Hacks 12.0

This package contains specialized agents for:
- Component generation from natural language
- Gaze pattern analysis and UX optimization
- Style and design system management
"""

from .component_generator_agent import component_generator, ComponentGenerationRequest, ComponentGenerationResponse
from .gaze_optimizer_agent import gaze_optimizer, GazeOptimizationRequest, GazeOptimizationResponse

__all__ = [
    'component_generator',
    'ComponentGenerationRequest',
    'ComponentGenerationResponse',
    'gaze_optimizer',
    'GazeOptimizationRequest',
    'GazeOptimizationResponse',
]

