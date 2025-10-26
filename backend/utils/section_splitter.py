"""
Section Splitter - Generate multi-section landing pages
Splits "landing page" requests into individual section prompts
"""

from typing import List, Dict

def detect_landing_page_request(prompt: str) -> bool:
    """Detect if user wants a full landing page vs single section"""
    landing_keywords = [
        'landing page',
        'full page',
        'complete page',
        'entire page',
        'website',
        'web page',
        'full site',
        'complete site'
    ]
    return any(keyword in prompt.lower() for keyword in landing_keywords)


def get_section_prompts(original_prompt: str, page_type: str = "saas") -> List[Dict[str, str]]:
    """
    Generate individual section prompts for a landing page
    
    Returns list of dicts with:
    - name: Section name (e.g., "Hero")
    - prompt: Detailed prompt for that section
    - order: Display order
    """
    
    # Extract product/business context from original prompt
    # e.g., "Create a landing page for a project management tool" -> "project management tool"
    context = extract_context(original_prompt)
    
    # Section templates based on page type
    section_templates = {
        "saas": [
            {
                "name": "Navigation",
                "prompt": f"Create a sticky navigation bar for {context}. Include logo, menu items (Features, Pricing, Testimonials, Contact), and a CTA button. Make it responsive with mobile menu toggle. Add smooth scroll handlers for menu items. Modern, clean design with backdrop blur.",
                "order": 0
            },
            {
                "name": "Hero",
                "prompt": f"Create a hero section for {context}. Include compelling headline about the main benefit, subheadline explaining the value proposition, two CTA buttons (primary and secondary), and a hero image/illustration placeholder. Use gradient background. Modern, attention-grabbing design.",
                "order": 1
            },
            {
                "name": "Features",
                "prompt": f"Create a features section for {context}. Display 3-6 feature cards in a grid. Each card should have an icon (emoji), title, and description. Use modern card design with hover effects. Emphasize key benefits and capabilities.",
                "order": 2
            },
            {
                "name": "SocialProof",
                "prompt": f"Create a testimonials/social proof section for {context}. MUST include: (1) Section title 'What Our Customers Say' or similar, (2) Exactly 3 testimonial cards with customer quotes in quotation marks, (3) Each card has avatar/image, full name, job title & company, (4) Trust indicators like '10,000+ happy users' or '4.9/5 star rating' with star emojis ⭐. Use a grid layout with hover effects. Make it compelling and trustworthy.",
                "order": 3
            },
            {
                "name": "Pricing",
                "prompt": f"Create a pricing section for {context}. Display 3 pricing tiers (Free/Starter, Pro, Enterprise) in cards. Each tier should show price, features list, and CTA button. Highlight the recommended tier. Modern, clean design.",
                "order": 4
            },
            {
                "name": "CTA",
                "prompt": f"Create a call-to-action section for {context}. Use gradient background, compelling headline with urgency, subheadline explaining the benefit, and prominent CTA button. Add social proof element like 'Join 10,000+ teams'. Conversion-focused design.",
                "order": 5
            },
            {
                "name": "Footer",
                "prompt": f"Create a complete footer for {context}. MUST include: (1) Company/logo section with brief description, (2) At least 3 columns of links (Product, Company, Resources) with 4-5 links each, (3) Social media icons (Twitter, LinkedIn, GitHub, etc) as clickable links with hover effects, (4) Copyright text '© 2024 [Company Name]. All rights reserved.', (5) Optional newsletter signup. Use dark background (bg-slate-900 or similar) with light text. Multi-column responsive layout that stacks on mobile.",
                "order": 6
            }
        ],
        "portfolio": [
            {
                "name": "Navigation",
                "prompt": f"Create a sticky navigation bar for a portfolio site. Include name/logo, menu items (Work, About, Skills, Contact), smooth scroll handlers. Minimal, elegant design.",
                "order": 0
            },
            {
                "name": "Hero",
                "prompt": f"Create a hero section for a portfolio. Include name, tagline/role, brief description, CTA button to view work, and professional photo placeholder. Clean, modern design.",
                "order": 1
            },
            {
                "name": "Projects",
                "prompt": f"Create a projects showcase section. Display 3-4 project cards with images, titles, descriptions, and 'View Project' links. Grid layout with hover effects. Modern portfolio style.",
                "order": 2
            },
            {
                "name": "Skills",
                "prompt": f"Create a skills section. Show skill categories with proficiency indicators (bars or percentages). Group skills logically. Clean, visual design.",
                "order": 3
            },
            {
                "name": "About",
                "prompt": f"Create an about section with bio, experience highlights, and optionally education/awards. Include photo. Personal, approachable design.",
                "order": 4
            },
            {
                "name": "Contact",
                "prompt": f"Create a contact section with email, social links, and optional contact form. Include CTA to get in touch. Professional, accessible design.",
                "order": 5
            }
        ],
        "agency": [
            {
                "name": "Navigation",
                "prompt": f"Create a sticky navigation for an agency site. Include logo, menu (Services, Work, About, Contact), CTA button. Professional design.",
                "order": 0
            },
            {
                "name": "Hero",
                "prompt": f"Create a hero section for {context}. Strong value proposition, results-focused headline, CTA button. Bold, confident design.",
                "order": 1
            },
            {
                "name": "Services",
                "prompt": f"Create a services section for {context}. Display 3-4 core services with icons, titles, descriptions. Grid layout. Professional design.",
                "order": 2
            },
            {
                "name": "CaseStudies",
                "prompt": f"Create a case studies section. Show 2-3 client success stories with metrics (e.g., '300% increase'), company logos, brief descriptions. Results-focused design.",
                "order": 3
            },
            {
                "name": "Clients",
                "prompt": f"Create a clients section with logos of companies worked with. Grid or carousel layout. Trust-building design.",
                "order": 4
            },
            {
                "name": "CTA",
                "prompt": f"Create a CTA section for {context}. Invite to schedule consultation, strong headline, form or button. Conversion-focused design.",
                "order": 5
            },
            {
                "name": "Footer",
                "prompt": f"Create a complete footer for {context}. MUST include: (1) Company/logo section, (2) Services links in columns, (3) Contact information (email, phone, address), (4) Social media icons as clickable links, (5) Copyright text '© 2024 [Company]. All rights reserved.' Use dark background with organized multi-column layout.",
                "order": 6
            }
        ]
    }
    
    # Get sections for this page type, default to SaaS
    sections = section_templates.get(page_type, section_templates["saas"])
    
    return sections


def extract_context(prompt: str) -> str:
    """
    Extract business/product context from prompt
    e.g., "Create a landing page for a project management tool" -> "a project management tool"
    """
    import re
    
    # Common patterns
    patterns = [
        r'for\s+(?:a|an)\s+(.+?)(?:\s+with|\s+that|$)',  # "for a project management tool"
        r'(?:about|showcasing|promoting)\s+(.+?)(?:\s+with|\s+that|$)',
        r'landing page\s+(.+?)(?:\s+with|\s+that|$)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, prompt, re.IGNORECASE)
        if match:
            context = match.group(1).strip()
            # Clean up
            context = context.replace('landing page', '').replace('website', '').strip()
            if context:
                return f"a {context}" if not context.startswith(('a ', 'an ', 'the ')) else context
    
    # Default generic context
    return "a modern web application"


def should_split_sections(prompt: str) -> bool:
    """
    Determine if we should split into multiple sections
    User can request single sections too
    """
    single_section_keywords = [
        'just a',
        'only a',
        'single',
        'one section',
        'add a',
        'create a hero',
        'create a nav',
        'create a features',
        'create a pricing',
        'create a footer',
        'create a contact',
        'create a testimonial'
    ]
    
    # If asking for specific single section, don't split
    if any(keyword in prompt.lower() for keyword in single_section_keywords):
        return False
    
    # If asking for full page, split
    return detect_landing_page_request(prompt)


def split_into_sections(prompt: str) -> Dict:
    """
    Main function: Analyze prompt and return section generation plan
    
    Returns:
    {
        'is_landing_page': bool,
        'page_type': str,  # 'saas', 'portfolio', 'agency', etc.
        'sections': List[Dict],  # List of section prompts
        'original_prompt': str
    }
    """
    is_landing_page = detect_landing_page_request(prompt)
    
    if not is_landing_page:
        # Single component request
        return {
            'is_landing_page': False,
            'page_type': 'single',
            'sections': [],
            'original_prompt': prompt
        }
    
    # Detect page type from keywords
    page_type = 'saas'  # default
    if 'portfolio' in prompt.lower():
        page_type = 'portfolio'
    elif 'agency' in prompt.lower() or 'consulting' in prompt.lower():
        page_type = 'agency'
    
    # Get section prompts
    sections = get_section_prompts(prompt, page_type)
    
    return {
        'is_landing_page': True,
        'page_type': page_type,
        'sections': sections,
        'original_prompt': prompt
    }

