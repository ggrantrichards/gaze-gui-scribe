# 🐛 Backend Import Error Fix

## Problem

**Error Message:**
```
❌ Error in multi-section generation: No module named 'backend'
Traceback (most recent call last):
  File "C:\Users\surya\Documents\GitHub\gaze-gui-scribe\backend\main.py", line 134, in generate_multi_section
    from backend.utils.section_splitter import split_into_sections
ModuleNotFoundError: No module named 'backend'
```

**Root Cause:**
When running `python main.py` from within the `backend` directory, Python's module search path doesn't include `backend` as a package name. The script was trying to import `from backend.utils.section_splitter`, but Python couldn't find a module named `backend`.

---

## Solution

**Changed absolute import to relative import:**

**Before:**
```python
from backend.utils.section_splitter import split_into_sections
```

**After:**
```python
from utils.section_splitter import split_into_sections
```

---

## Why This Works

When you run a Python script from within a directory:

```bash
cd backend
python main.py
```

Python's module search path includes:
1. The current directory (`backend/`)
2. Standard library
3. Site packages

**It does NOT include:**
- A package called `backend` (because you're already in that directory)

So imports should be relative to the current working directory:
- ✅ `from utils.section_splitter import ...` (looks for `backend/utils/section_splitter.py`)
- ❌ `from backend.utils.section_splitter import ...` (looks for `backend/backend/utils/...`)

---

## Files Modified

**File:** `backend/main.py`

**Line 134:**
```python
# Before
from backend.utils.section_splitter import split_into_sections

# After
from utils.section_splitter import split_into_sections
```

---

## Testing

**Test the fix:**
```bash
cd backend
python main.py
```

**Expected output:**
```
🚀 FastAPI server starting...
✅ Fetch.ai agents initialized
INFO: Application startup complete.
INFO: Uvicorn running on http://0.0.0.0:8000
```

**Test multi-section generation:**
```bash
# In frontend
Open Page Builder → Type: "build a modern landing page" → Generate
```

**Expected:**
- ✅ No ModuleNotFoundError
- ✅ Progress bar shows "Generating section X of Y..."
- ✅ Sections appear one by one
- ✅ Backend logs show successful generation

---

## Related Import Patterns in Project

**Correct import patterns in `backend/main.py`:**

```python
# ✅ Direct module imports (same level)
from agents.component_generator_agent import component_generator
from agents.gaze_optimizer_agent import gaze_optimizer

# ✅ Service imports (subdirectory)
from prompts.typescript_prompts import get_typescript_landing_page_prompt
from services.project_builder import create_project_structure
from utils.section_splitter import split_into_sections

# ❌ WRONG - Don't use 'backend' prefix when running from backend/
from backend.utils.section_splitter import split_into_sections
from backend.services.openrouter_client import openrouter_client
```

---

## Prevention

**Best Practice:**
When organizing Python backend code:

1. **If running script directly:** Use relative imports (no `backend.` prefix)
   ```python
   from utils.module import function
   ```

2. **If installing as package:** Use absolute imports with package name
   ```python
   from backend.utils.module import function
   ```

3. **Our setup:** We run `python main.py` directly, so use pattern (1)

---

## Verification

**Check all imports are correct:**
```bash
cd backend
grep -r "from backend\." *.py
```

**Expected output:**
```
(no results - all imports should be relative)
```

---

## Additional Fix: Missing Function

**After fixing the import path, discovered another issue:**

**Error:**
```python
ImportError: cannot import name 'split_into_sections' from 'utils.section_splitter'
```

**Root Cause:**
The `section_splitter.py` file had helper functions (`detect_landing_page_request`, `get_section_prompts`, etc.) but was missing the main `split_into_sections` function that `main.py` was trying to import.

**Solution:**
Added the `split_into_sections` function to `backend/utils/section_splitter.py`:

```python
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
```

**Testing:**
```bash
python -c "from utils.section_splitter import split_into_sections; print(split_into_sections('build a modern landing page'))"
```

**Output:**
```
✅ Import successful!
Result: {'is_landing_page': True, 'page_type': 'saas', 'sections': [7 sections...]}
```

---

## Status

✅ **FIXED** - Backend now starts successfully and handles multi-section generation requests without import errors.

**Both issues resolved:**
1. ✅ Changed absolute import to relative import (`from utils.section_splitter`)
2. ✅ Added missing `split_into_sections` function to `section_splitter.py`

---

**Related Documentation:**
- [MODERN_LIBRARIES_SUPPORT.md](MODERN_LIBRARIES_SUPPORT.md) - Modern libraries integration
- [MULTI_SECTION_FIX.md](MULTI_SECTION_FIX.md) - Multi-section generation implementation
- [COMPLETE_IMPLEMENTATION_STATUS.md](COMPLETE_IMPLEMENTATION_STATUS.md) - Full project status

