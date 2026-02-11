#!/usr/bin/env python3
# Universal Quantum Code Handler - OS Rebuild Numbering System
# Converts any code file to quantum navigation format

import re,os,sys
from pathlib import Path

class QuantumCodeHandler:
    """Universal handler for quantum code numbering in all languages"""
    
    # Quantum prefix mapping based on code semantics
    PREFIXES = {
        'shebang': 'n:',     # Entry points #!/usr/bin/env
        'comment': '+1:',    # Comments and documentation  
        'import': '-n:',     # Imports/includes/requires
        'class': '+0:',      # Class definitions
        'function': '0:',    # Function/method definitions
        'error': '-1:',      # Error handling/exceptions
        'condition': '+n:',  # If/else/switch statements
        'loop': '+2:',       # For/while/repeat loops
        'return': '-0:',     # Return statements
        'output': '+3:',     # Print/echo/console output
        'variable': '0:',    # Variable declarations
        'default': '   '     # Unclassified lines
    }
    
    # Language-specific patterns
    PATTERNS = {
        'python': {
            'shebang': r'^#!/.*python',
            'comment': r'^\s*#',
            'import': r'^\s*(import|from)',
            'class': r'^\s*class\s',
            'function': r'^\s*def\s',
            'error': r'^\s*(try|except|finally|raise)',
            'condition': r'^\s*(if|elif|else)\s',
            'loop': r'^\s*(for|while)\s',
            'return': r'^\s*return\s',
            'output': r'^\s*print\('
        },
        'javascript': {
            'shebang': r'^#!/.*node',
            'comment': r'^\s*(//|/\*)',
            'import': r'^\s*(import|require|const.*=.*require)',
            'class': r'^\s*class\s',
            'function': r'^\s*(function|const.*=>|\w+\s*:\s*function)',
            'error': r'^\s*(try|catch|finally|throw)',
            'condition': r'^\s*(if|else)\s',
            'loop': r'^\s*(for|while)\s',
            'return': r'^\s*return\s',
            'output': r'^\s*console\.'
        },
        'rust': {
            'comment': r'^\s*//',
            'import': r'^\s*use\s',
            'function': r'^\s*fn\s',
            'condition': r'^\s*(if|else)\s',
            'loop': r'^\s*(for|while|loop)\s',
            'output': r'^\s*(println!|print!)'
        },
        'shell': {
            'shebang': r'^#!/bin/(bash|sh|zsh)',
            'comment': r'^\s*#',
            'function': r'^\s*\w+\(\)\s*\{',
            'condition': r'^\s*(if|elif|else)\s',
            'loop': r'^\s*(for|while)\s',
            'output': r'^\s*echo\s'
        }
    }
    
    def __init__(self):
        self.line_counter = 0
    
    def detect_language(self, filename):
        """Detect programming language from filename"""
        ext = Path(filename).suffix.lower()
        lang_map = {
            '.py': 'python',
            '.js': 'javascript', '.ts': 'javascript', '.jsx': 'javascript',
            '.rs': 'rust',
            '.sh': 'shell', '.bash': 'shell', '.zsh': 'shell'
        }
        return lang_map.get(ext, 'python')  # Default to Python patterns
    
    def classify_line(self, line, language):
        """Classify line and return appropriate quantum prefix"""
        patterns = self.PATTERNS.get(language, self.PATTERNS['python'])
        
        for category, pattern in patterns.items():
            if re.match(pattern, line):
                return self.PREFIXES[category]
        
        return self.PREFIXES['default']
    
    def add_quantum_numbering(self, content, language='python'):
        """Add quantum numbering to code content"""
        lines = content.split('\n')
        numbered_lines = []
        
        for i, line in enumerate(lines, 1):
            prefix = self.classify_line(line, language)
            numbered_line = f"{prefix:>4s}{i:>3d}  {line}"
            numbered_lines.append(numbered_line)
        
        return '\n'.join(numbered_lines)
    
    def process_file(self, filepath):
        """Process a file and add quantum numbering"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            language = self.detect_language(filepath)
            quantum_content = self.add_quantum_numbering(content, language)
            
            # Create quantum version with _quantum suffix
            quantum_path = str(filepath).replace('.', '_quantum.')
            
            with open(quantum_path, 'w', encoding='utf-8') as f:
                f.write(quantum_content)
            
            print(f"✅ Converted {filepath} → {quantum_path}")
            return quantum_path
            
        except Exception as e:
            print(f"❌ Error processing {filepath}: {e}")
            return None
    
    def process_directory(self, directory, extensions=None):
        """Process all code files in directory"""
        if extensions is None:
            extensions = ['.py', '.js', '.ts', '.jsx', '.rs', '.sh', '.bash']
        
        converted = []
        
        for ext in extensions:
            for filepath in Path(directory).rglob(f'*{ext}'):
                if '_quantum' not in str(filepath):  # Skip already processed files
                    quantum_file = self.process_file(filepath)
                    if quantum_file:
                        converted.append(quantum_file)
        
        print(f"\n🌌 Converted {len(converted)} files to quantum numbering")
        return converted

def main():
    """CLI interface for quantum code handler"""
    if len(sys.argv) < 2:
        print("Usage: python3 quantum_handler_clean.py <file_or_directory>")
        print("Example: python3 quantum_handler_clean.py my_script.py")
        print("         python3 quantum_handler_clean.py /path/to/project/")
        sys.exit(1)
    
    handler = QuantumCodeHandler()
    target = sys.argv[1]
    
    if os.path.isfile(target):
        print(f"🔄 Converting file: {target}")
        handler.process_file(target)
    elif os.path.isdir(target):
        print(f"🔄 Converting directory: {target}")
        handler.process_directory(target)
    else:
        print(f"❌ Path not found: {target}")
        sys.exit(1)

if __name__ == "__main__":
    main()