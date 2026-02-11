  n:  1  #!/usr/bin/env python3
 +1:  2  # Universal Quantum Code Handler v2 - OS Rebuild Numbering System
 +1:  3  # Converts any code file to quantum navigation format
 -n:  4  
 -n:  5  import re,os,sys
 -n:  6  from pathlib import Path
 -n:  7  
+0:  8  class QuantumCodeHandler:
 +1:  9      """Universal handler for quantum code numbering in all languages"""
    10      
 +1: 11      # Quantum prefix mapping based on code semantics
    12      PREFIXES = {
    13          'shebang': 'n:',     # Entry points #!/usr/bin/env
    14          'comment': '+1:',    # Comments and documentation  
    15          'import': '-n:',     # Imports/includes/requires
    16          'class': '+0:',      # Class definitions
    17          'function': '0:',    # Function/method definitions
    18          'error': '-1:',      # Error handling/exceptions
    19          'condition': '+n:',  # If/else/switch statements
    20          'loop': '+2:',       # For/while/repeat loops
    21          'return': '-0:',     # Return statements
    22          'output': '+3:',     # Print/echo/console output
    23          'variable': '0:',    # Variable declarations
    24          'default': '   '     # Unclassified lines
    25      }
    26      
 +1: 27      # Language-specific patterns
    28      PATTERNS = {
    29          'python': {
    30              'shebang': r'^#!/.*python',
    31              'comment': r'^\s*#',
    32              'import': r'^\s*(import|from)',
    33              'class': r'^\s*class\s',
    34              'function': r'^\s*def\s',
    35              'error': r'^\s*(try|except|finally|raise)',
    36              'condition': r'^\s*(if|elif|else)\s',
    37              'loop': r'^\s*(for|while)\s',
    38              'return': r'^\s*return\s',
    39              'output': r'^\s*print\('
    40          },
    41          'javascript': {
    42              'shebang': r'^#!/.*node',
    43              'comment': r'^\s*(//|/\*)',
    44              'import': r'^\s*(import|require|const.*=.*require)',
    45              'class': r'^\s*class\s',
    46              'function': r'^\s*(function|const.*=>|\w+\s*:\s*function)',
    47              'error': r'^\s*(try|catch|finally|throw)',
    48              'condition': r'^\s*(if|else)\s',
    49              'loop': r'^\s*(for|while)\s',
    50              'return': r'^\s*return\s',
    51              'output': r'^\s*console\.'
    52          },
    53          'rust': {
    54              'comment': r'^\s*//',
    55              'import': r'^\s*use\s',
    56              'function': r'^\s*fn\s',
    57              'condition': r'^\s*(if|else)\s',
    58              'loop': r'^\s*(for|while|loop)\s',
    59              'output': r'^\s*(println!|print!)'
    60          },
    61          'shell': {
    62              'shebang': r'^#!/bin/(bash|sh|zsh)',
    63              'comment': r'^\s*#',
    64              'function': r'^\s*\w+\(\)\s*\{',
    65              'condition': r'^\s*(if|elif|else)\s',
    66              'loop': r'^\s*(for|while)\s',
    67              'output': r'^\s*echo\s'
    68          }
    69      }
    70      
  0: 71      def __init__(self):
    72          self.line_counter = 0
    73      
  0: 74      def detect_language(self, filename):
 +1: 75          """Detect programming language from filename"""
    76          ext = Path(filename).suffix.lower()
    77          lang_map = {
    78              '.py': 'python',
    79              '.js': 'javascript', '.ts': 'javascript', '.jsx': 'javascript',
    80              '.rs': 'rust',
    81              '.sh': 'shell', '.bash': 'shell', '.zsh': 'shell'
    82          }
-0: 83          return lang_map.get(ext, 'python')  # Default to Python patterns
    84      
  0: 85      def classify_line(self, line, language):
 +1: 86          """Classify line and return appropriate quantum prefix"""
    87          patterns = self.PATTERNS.get(language, self.PATTERNS['python'])
    88          
+n: 89          for category, pattern in patterns.items():
+n: 90              if re.match(pattern, line):
-0: 91                  return self.PREFIXES[category]
    92          
-0: 93          return self.PREFIXES['default']
    94      
  0: 95      def add_quantum_numbering(self, content, language='python'):
 +1: 96          """Add quantum numbering to code content"""
    97          lines = content.split('\n')
    98          numbered_lines = []
    99          
+2:100          for i, line in enumerate(lines, 1):
   101              prefix = self.classify_line(line, language)
   102              numbered_line = f"{prefix:>4s}{i:>3d}  {line}"
   103              numbered_lines.append(numbered_line)
   104          
-0:105          return '\n'.join(numbered_lines)
   106      
  0:107      def process_file(self, filepath):
 +1:108          """Process a file and add quantum numbering"""
-1:109          try:
   110              with open(filepath, 'r', encoding='utf-8') as f:
   111                  content = f.read()
   112              
   113              language = self.detect_language(filepath)
   114              quantum_content = self.add_quantum_numbering(content, language)
   115              
   116              # Create quantum version with _quantum suffix
   117              quantum_path = str(filepath).replace('.', '_quantum.')
   118              
   119              with open(quantum_path, 'w', encoding='utf-8') as f:
   120                  f.write(quantum_content)
   121              
+3:122              print(f"✅ Converted {filepath} → {quantum_path}")
-0:123              return quantum_path
   124              
-1:125          except Exception as e:
+3:126              print(f"❌ Error processing {filepath}: {e}")
-0:127              return None
   128      
  0:129      def process_directory(self, directory, extensions=None):
 +1:130          """Process all code files in directory"""
+n:131          if extensions is None:
   132              extensions = ['.py', '.js', '.ts', '.jsx', '.rs', '.sh', '.bash']
   133          
   134          converted = []
   135          
+2:136          for ext in extensions:
+2:137              for filepath in Path(directory).rglob(f'*{ext}'):
+n:138                  if '_quantum' not in str(filepath):  # Skip already processed files
   139                      quantum_file = self.process_file(filepath)
+n:140                      if quantum_file:
   141                          converted.append(quantum_file)
   142          
+3:143          print(f"\n🌌 Converted {len(converted)} files to quantum numbering")
-0:144          return converted

  0:145  def main():
 +1:146      """CLI interface for quantum code handler"""
+n:147      if len(sys.argv) < 2:
+3:148          print("Usage: python3 quantum_handler_v2.py <file_or_directory>")
+3:149          print("Example: python3 quantum_handler_v2.py my_script.py")
+3:150          print("         python3 quantum_handler_v2.py /path/to/project/")
   151          sys.exit(1)
   152      
   153      handler = QuantumCodeHandler()
   154      target = sys.argv[1]
   155      
+n:156      if os.path.isfile(target):
+3:157          print(f"🔄 Converting file: {target}")
   158          handler.process_file(target)
+n:159      elif os.path.isdir(target):
+3:160          print(f"🔄 Converting directory: {target}")
   161          handler.process_directory(target)
   162      else:
+3:163          print(f"❌ Path not found: {target}")
   164          sys.exit(1)

+n:165  if __name__ == "__main__":
   166      main()