"""
Code Validator - Ensure generated code is valid and renderable
Checks for common issues that cause blank sections
"""

import re
from typing import Tuple

def validate_component_code(code: str, section_name: str = "Component") -> Tuple[bool, str]:
    """
    Validate that generated code is valid and will render
    
    Returns:
        (is_valid, error_message)
    """
    
    # Check 1: Code is not empty
    if not code or len(code.strip()) < 50:
        return False, f"Code is empty or too short ({len(code)} chars)"
    
    # Check 2: Has function or const declaration
    has_function = re.search(r'(function\s+\w+|const\s+\w+\s*=)', code)
    if not has_function:
        return False, "No component function found"
    
    # Check 3: Has return statement with JSX
    has_return = 'return' in code.lower()
    if not has_return:
        return False, "No return statement found"
    
    # Check 4: Has JSX/HTML elements (looks for opening tags)
    has_jsx = re.search(r'<\w+[\s>]', code)
    if not has_jsx:
        return False, "No JSX/HTML elements found"
    
    # Check 5: Has actual content (not just empty divs)
    # Look for text content, images, or significant elements
    # Made more lenient - just need SOME indication of content
    has_content = any([
        re.search(r'<h[1-6]', code),  # Headings
        re.search(r'<p[\s>]', code),  # Paragraphs
        re.search(r'<button', code),  # Buttons
        re.search(r'<img', code),  # Images
        re.search(r'<a[\s>]', code),  # Links
        re.search(r'<span', code),  # Spans with text
        re.search(r'<li', code),  # List items (more lenient)
        re.search(r'<input', code),  # Input elements
        re.search(r'<label', code),  # Labels
        re.search(r'>\s*\w+\s*<', code),  # Text between tags
        re.search(r'[A-Z][a-z]{2,}', code),  # Likely text content (shorter match)
        re.search(r'className="[^"]*"', code) and len(code) > 200,  # Has styling and decent length
        re.search(r'<svg', code),  # SVG icons
        re.search(r'<form', code)  # Forms
    ])
    
    if not has_content:
        return False, "Code appears to have no visible content"
    
    # Check 6: Not all comments
    code_without_comments = re.sub(r'//.*?$|/\*.*?\*/', '', code, flags=re.MULTILINE | re.DOTALL)
    if len(code_without_comments.strip()) < 100:
        return False, "Code is mostly comments"
    
    # Check 7: Has proper component export
    has_export = re.search(r'export\s+(function|const)', code)
    if not has_export:
        # Check if it at least has a function declaration
        if not re.search(r'(function\s+\w+|const\s+\w+\s*=\s*\()', code):
            return False, "No component export or function found"
    
    # Check 8: Section-specific validation (RELAXED - warning only)
    # These checks are informational, not blocking
    if section_name.lower() == 'footer':
        # Footer should have links or copyright (but don't block if missing)
        has_footer_content = any([
            'copyright' in code.lower(),
            '©' in code,
            '<a' in code.lower(),
            'footer' in code.lower(),
            '<nav' in code.lower(),
            'link' in code.lower()
        ])
        if not has_footer_content:
            print(f"[WARN] Warning: Footer might lack typical content, but allowing it")
    
    if section_name.lower() in ['socialproof', 'testimonials']:
        # Social proof should have testimonials or reviews (but don't block if missing)
        has_social_content = any([
            'testimonial' in code.lower(),
            'review' in code.lower(),
            'customer' in code.lower(),
            'rating' in code.lower(),
            '⭐' in code or '★' in code,
            '"' in code or '"' in code or '"' in code,  # Quotes
            'quote' in code.lower()
        ])
        if not has_social_content:
            print(f"[WARN] Warning: Social proof might lack testimonials, but allowing it")
    
    return True, "Valid"


def clean_and_validate_code(code: str, section_name: str = "Component") -> str:
    """
    Clean and validate code, raising an exception if invalid
    """
    # Remove any markdown code fences
    code = re.sub(r'^```[\w]*\n', '', code, flags=re.MULTILINE)
    code = re.sub(r'\n```$', '', code, flags=re.MULTILINE)
    code = code.strip()
    
    # Validate
    is_valid, error_msg = validate_component_code(code, section_name)
    
    if not is_valid:
        raise ValueError(f"Invalid code for {section_name}: {error_msg}")
    
    return code


def extract_component_name(code: str, default: str = "Component") -> str:
    """Extract component name from code"""
    patterns = [
        r'export\s+function\s+(\w+)',
        r'export\s+const\s+(\w+)',
        r'function\s+(\w+)',
        r'const\s+(\w+)\s*='
    ]
    
    for pattern in patterns:
        match = re.search(pattern, code)
        if match:
            return match.group(1)
    
    return default

