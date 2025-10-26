"""
Quick script to replace Unicode emojis with ASCII equivalents in backend files
"""
import os
import re

# Map of Unicode emojis to ASCII equivalents
EMOJI_MAP = {
    '[OK]': '[OK]',
    '[WARN]': '[WARN]',
    '[ERROR]': '[ERROR]',
    '[SUCCESS]': '[SUCCESS]',
    '[PROCESSING]': '[PROCESSING]',
    '[RECEIVED]': '[RECEIVED]',
    '[BUILDING]': '[BUILDING]',
    '[STARTING]': '[STARTING]',
    '[STATS]': '[STATS]',
    '[RETRY]': '[RETRY]',
    '[AI]': '[AI]',
    '[SIZE]': '[SIZE]',
    '[NOTE]': '[NOTE]',
    '[BUILD]': '[BUILD]',
    '[TARGET]': '[TARGET]',
    '[INFO]': '[INFO]',
}

def fix_file(filepath):
    """Replace emojis in a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        for emoji, ascii_equiv in EMOJI_MAP.items():
            content = content.replace(emoji, ascii_equiv)
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed: {filepath}")
            return True
        return False
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")
        return False

def main():
    """Fix all Python files in backend"""
    backend_dir = '.'
    fixed_count = 0
    
    for root, dirs, files in os.walk(backend_dir):
        # Skip __pycache__ and venv
        dirs[:] = [d for d in dirs if d not in ['__pycache__', 'venv', '.venv', 'node_modules']]
        
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                if fix_file(filepath):
                    fixed_count += 1
    
    print(f"\nFixed {fixed_count} files")

if __name__ == '__main__':
    main()

