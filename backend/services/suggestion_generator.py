"""
AI-Powered Gaze Suggestion Generator
Generates context-aware UI/UX improvement suggestions based on what element the user is looking at
"""

import os
from typing import Dict, List, Optional
from openai import AsyncOpenAI

# Initialize OpenAI client
openai_client = None
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY:
    openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)

async def generate_suggestions(
    element_type: str,
    element_text: str,
    element_properties: Dict,
    context: Dict,
    dwell_time: float
) -> List[Dict]:
    """
    Generate intelligent suggestions for a component based on gaze data
    
    Args:
        element_type: HTML tag name (button, div, img, etc.)
        element_text: Text content of the element
        element_properties: CSS properties and attributes
        context: Surrounding context (parent, siblings)
        dwell_time: How long user looked at it (seconds)
        
    Returns:
        List of suggestions with type, description, and action
    """
    
    # Build context for AI
    prompt = f"""You are a UX expert analyzing user eye-gaze behavior. A user has been looking at this element for {dwell_time:.1f} seconds.

Element Details:
- Type: {element_type}
- Text: "{element_text}"
- Current Properties: {element_properties}
- Context: {context}

Based on the extended gaze time, generate 3-5 actionable UI/UX improvement suggestions. For each suggestion:
1. Identify what might need improvement (size, color, position, contrast, etc.)
2. Provide a specific, implementable change
3. Keep suggestions reasonable and professional

Return ONLY a JSON array of suggestions in this format:
[
  {{
    "type": "size|color|spacing|text|style",
    "title": "Brief title (e.g., 'Make button larger')",
    "description": "Why this might help",
    "action": {{
      "property": "CSS property to change",
      "value": "new value",
      "oldValue": "current value"
    }},
    "priority": "high|medium|low"
  }}
]

Example suggestions:
- Increase button size if it's small
- Improve color contrast if text is hard to read
- Adjust spacing if elements are cramped
- Simplify text if it's too long
- Add visual emphasis (bold, icon, etc.)

Be specific with CSS values (e.g., "fontSize": "1.25rem" not "bigger")."""

    try:
        if openai_client:
            response = await openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a UX expert. Return only valid JSON arrays."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            import json
            suggestions_text = response.choices[0].message.content.strip()
            
            # Clean markdown code fences if present
            if suggestions_text.startswith("```"):
                suggestions_text = suggestions_text.split("```")[1]
                if suggestions_text.startswith("json"):
                    suggestions_text = suggestions_text[4:]
            
            suggestions = json.loads(suggestions_text)
            return suggestions
        else:
            # Mock suggestions if no API key
            return generate_mock_suggestions(element_type, element_text, element_properties)
            
    except Exception as e:
        print(f"[ERROR] Suggestion generation failed: {e}")
        return generate_mock_suggestions(element_type, element_text, element_properties)


def generate_mock_suggestions(element_type: str, element_text: str, properties: Dict) -> List[Dict]:
    """Generate mock suggestions when AI is unavailable"""
    
    suggestions = []
    
    # Size suggestion
    if element_type in ['button', 'a']:
        suggestions.append({
            "type": "size",
            "title": "Make button larger",
            "description": "Larger buttons are easier to click and draw more attention",
            "action": {
                "property": "padding",
                "value": "1rem 2rem",
                "oldValue": properties.get("padding", "0.5rem 1rem")
            },
            "priority": "high"
        })
    
    # Color suggestion
    suggestions.append({
        "type": "color",
        "title": "Improve color contrast",
        "description": "Higher contrast makes text easier to read",
        "action": {
            "property": "backgroundColor",
            "value": "#2563eb",
            "oldValue": properties.get("backgroundColor", "#current")
        },
        "priority": "medium"
    })
    
    # Text suggestion
    if element_text and len(element_text) > 50:
        suggestions.append({
            "type": "text",
            "title": "Simplify text content",
            "description": "Shorter text is easier to scan and understand",
            "action": {
                "property": "textContent",
                "value": element_text[:30] + "...",
                "oldValue": element_text
            },
            "priority": "medium"
        })
    
    # Spacing suggestion
    suggestions.append({
        "type": "spacing",
        "title": "Add more spacing",
        "description": "More whitespace improves readability and focus",
        "action": {
            "property": "margin",
            "value": "1.5rem 0",
            "oldValue": properties.get("margin", "1rem 0")
        },
        "priority": "low"
    })
    
    return suggestions[:3]  # Return top 3


async def apply_suggestion_to_code(
    original_code: str,
    element_selector: str,
    suggestion: Dict
) -> str:
    """
    Apply a suggestion to the component code
    
    Args:
        original_code: Original React component code
        element_selector: CSS selector or identifier for the element
        suggestion: The suggestion to apply
        
    Returns:
        Modified component code
    """
    
    action = suggestion.get("action", {})
    property_name = action.get("property")
    new_value = action.get("value")
    
    prompt = f"""You are a React code expert. Modify this component to apply a specific style change.

Original Component:
```jsx
{original_code}
```

Task: Find the element matching selector "{element_selector}" and change its {property_name} to "{new_value}".

Rules:
1. Modify inline styles or className as appropriate
2. If using Tailwind classes, convert to equivalent Tailwind utilities
3. Preserve all other functionality and styling
4. Return ONLY the modified JSX code, no explanations or markdown

Modified Component:"""

    try:
        if openai_client:
            response = await openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a React expert. Return only code."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            modified_code = response.choices[0].message.content.strip()
            
            # Clean code fences
            if modified_code.startswith("```"):
                lines = modified_code.split("\n")
                modified_code = "\n".join(lines[1:-1])
            
            return modified_code
        else:
            # Simple find-replace for mock
            return original_code
            
    except Exception as e:
        print(f"[ERROR] Code modification failed: {e}")
        return original_code

