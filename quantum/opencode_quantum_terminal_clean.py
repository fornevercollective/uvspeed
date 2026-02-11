#!/usr/bin/env python3
# OpenCode Quantum Terminal - AI Coding in 3D Quantum Space
# Integrates OpenCode with quantum navigation and numbering

import os,sys,json,subprocess,re
from pathlib import Path
import threading,time
from quantum_handler_clean import QuantumCodeHandler

class OpenCodeQuantumTerminal:
    """AI Terminal with 3D quantum navigation and OpenCode integration"""
    
    def __init__(self):
        self.quantum_handler = QuantumCodeHandler()
        self.position = [0, 0, 0]  # X, Y, Z coordinates in code space
        self.active_files = []
        self.opencode_process = None
        print("🌌 QUANTUM OPENCODE TERMINAL")
        print("AI Pair Programming in 3D Code Space")
        print("Position:", self.position)
    
    def check_opencode_installed(self):
        """Verify OpenCode is available"""
        try:
            result = subprocess.run(['opencode', '--version'], 
                                  capture_output=True, text=True, timeout=5)
            return result.returncode == 0
        except Exception:
            return False
    
    def install_opencode(self):
        """Install OpenCode if not present"""
        print("📦 Installing OpenCode...")
        try:
            subprocess.run(['npm', 'install', '-g', 'opencode-ai'], check=True)
            print("✅ OpenCode installed successfully")
            return True
        except subprocess.CalledProcessError:
            print("❌ Failed to install OpenCode")
            print("Please install manually: npm install -g opencode-ai")
            return False
    
    def parse_quantum_coordinates(self, command):
        """Parse quantum navigation commands (+1,-1,+0,-0,+n,-n)"""
        coords = [0, 0, 0]  # x, y, z deltas
        tokens = command.split()
        
        for token in tokens:
            if token.startswith(('+', '-')):
                try:
                    if token in ['+1', '1']:
                        coords[1] += 1  # Y up (line numbers)
                    elif token in ['-1']:
                        coords[1] -= 1  # Y down
                    elif token in ['+0', '0']:
                        coords[0] += 1  # X right (dependencies)
                    elif token in ['-0']:
                        coords[0] -= 1  # X left
                    elif token.startswith('+n') or token.startswith('+'):
                        n = int(token[2:]) if len(token) > 2 else 1
                        coords[2] += n  # Z forward (complexity)
                    elif token.startswith('-n') or token.startswith('-'):
                        n = int(token[2:]) if len(token) > 2 else 1
                        coords[2] -= n  # Z back
                except ValueError:
                    continue
        
        return coords
    
    def move_quantum_position(self, delta):
        """Update 3D position in quantum code space"""
        for i in range(3):
            self.position[i] += delta[i]
        
        print(f"🎯 Position: X={self.position[0]}, Y={self.position[1]}, Z={self.position[2]}")
        print(f"   X=Dependencies, Y=Lines, Z=Complexity")
    
    def generate_quantum_code(self, prompt, code_type='python'):
        """Generate code with quantum numbering using OpenCode"""
        print(f"🤖 Generating {code_type} code: {prompt}")
        print("📍 Quantum Context:", self.position)
        
        # Try OpenCode with short timeout
        try:
            result = subprocess.run([
                'opencode', 'run',
                '--format', 'json',
                '--model', 'opencode/gpt-5-nano',
                f"Generate {code_type} code for: {prompt}. Keep it simple and functional."
            ], capture_output=True, text=True, timeout=8)
            
            if result.returncode == 0:
                # Parse JSON response from OpenCode
                try:
                    import json
                    lines = result.stdout.strip().split('\n')
                    raw_code = ""
                    
                    # Extract text content from JSON events
                    for line in lines:
                        if line.strip():
                            try:
                                event = json.loads(line)
                                if event.get('type') == 'text' and 'part' in event and 'text' in event['part']:
                                    raw_code += event['part']['text']
                            except json.JSONDecodeError:
                                continue
                    
                    # Clean up markdown code blocks
                    if '```' in raw_code:
                        code_start = raw_code.find('```')
                        code_end = raw_code.rfind('```')
                        if code_start != -1 and code_end != -1 and code_end > code_start:
                            raw_code = raw_code[code_start:code_end+3]
                            # Remove markdown formatting
                            raw_code = raw_code.replace('```python', '').replace('```', '').strip()
                    
                    if raw_code.strip():
                        # Apply quantum numbering
                        quantum_code = self.quantum_handler.add_quantum_numbering(raw_code, code_type)
                        print("\n🌌 QUANTUM GENERATED CODE:")
                        print("=" * 60)
                        print(quantum_code)
                        print("=" * 60)
                        return quantum_code
                        
                except Exception as e:
                    print(f"🔄 OpenCode parsing failed: {e}")
                    
        except subprocess.TimeoutExpired:
            print("⏰ OpenCode timeout - using quantum fallback")
        except Exception as e:
            print(f"❌ OpenCode error: {e}")
        
        # Generate quantum fallback code
        return self.generate_fallback_code(prompt, code_type)
    
    def generate_fallback_code(self, prompt, code_type):
        """Generate intelligent quantum-numbered code fallback"""
        # Generate contextual code based on prompt keywords
        templates = {
            'python': {
                'calculator': '''#!/usr/bin/env python3
# Quantum Calculator - Generated at position {position}
import math

class QuantumCalculator:
    def __init__(self):
        self.history = []
    
    def add(self, a, b):
        result = a + b
        self.history.append(f"{a} + {b} = {result}")
        return result
    
    def subtract(self, a, b):
        result = a - b
        self.history.append(f"{a} - {b} = {result}")
        return result
    
    def multiply(self, a, b):
        result = a * b
        self.history.append(f"{a} * {b} = {result}")
        return result
    
    def divide(self, a, b):
        if b == 0:
            raise ValueError("Cannot divide by zero")
        result = a / b
        self.history.append(f"{a} / {b} = {result}")
        return result

def main():
    calc = QuantumCalculator()
    print("Quantum Calculator Ready")
    print(f"Operating at position: {position}")
    return calc

if __name__ == "__main__":
    main()''',
                'hello': '''#!/usr/bin/env python3
# Quantum Hello World - Generated at position {position}

def hello_world():
    """Quantum hello function"""
    return "Hello from Quantum Space!"

def greet(name="World"):
    """Personalized quantum greeting"""
    return f"Hello, {name} from position {position}!"

def main():
    print(hello_world())
    print(greet("Quantum Coder"))

if __name__ == "__main__":
    main()''',
                'function': '''#!/usr/bin/env python3
# Quantum Function - Generated at position {position}

def quantum_function(data):
    """Quantum processing function"""
    try:
        # Process data in quantum space
        if isinstance(data, str):
            return data.upper()
        elif isinstance(data, (int, float)):
            return data * 2
        elif isinstance(data, list):
            return [item * 2 for item in data]
        else:
            return str(data)
    except Exception as e:
        print(f"Quantum error: {e}")
        return None

def main():
    test_data = ["hello", 42, [1, 2, 3]]
    for data in test_data:
        result = quantum_function(data)
        print(f"Input: {data} -> Output: {result}")

if __name__ == "__main__":
    main()'''
            }
        }
        
        # Select appropriate template
        template = templates[code_type]['function']  # default
        prompt_lower = prompt.lower()
        
        if 'calculator' in prompt_lower or 'calc' in prompt_lower:
            template = templates[code_type]['calculator']
        elif 'hello' in prompt_lower or 'world' in prompt_lower:
            template = templates[code_type]['hello']
        
        # Format with quantum position  
        raw_code = template.replace('{position}', str(self.position))
        
        # Apply quantum numbering
        quantum_code = self.quantum_handler.add_quantum_numbering(raw_code, code_type)
        print("\n🌌 QUANTUM FALLBACK CODE:")
        print("=" * 60)
        print(quantum_code)
        print("=" * 60)
        return quantum_code
    
    def show_help(self):
        """Display quantum terminal help"""
        print("""
🌌 QUANTUM OPENCODE TERMINAL COMMANDS
=====================================

QUANTUM NAVIGATION:
  +1/-1    Move up/down lines (Y-axis)
  +0/-0    Move left/right dependencies (X-axis) 
  +n/-n    Move forward/back complexity (Z-axis)
  +n5/-n3  Move by specific amounts
  pos      Show current position

AI CODING:
  code <prompt>        Generate code with quantum context
  gen python <prompt>  Generate Python code
  gen js <prompt>      Generate JavaScript code
  gen rust <prompt>    Generate Rust code

FILE OPERATIONS:
  convert <file>       Add quantum numbering to file
  quantum <dir>        Convert entire directory
  files                List quantum files in current position

SYSTEM:
  help     Show this help
  status   Show system status
  quit     Exit terminal
""")
    
    def show_status(self):
        """Show quantum terminal status"""
        print(f"🌌 Quantum Position: {self.position}")
        print(f"📁 Active Files: {len(self.active_files)}")
        print(f"🤖 OpenCode: {'✅' if self.check_opencode_installed() else '❌'}")
        print(f"🔧 Quantum Handler: ✅")
    
    def run(self):
        """Main terminal loop"""
        print("Type 'help' for commands or 'quit' to exit")
        print()
        
        while True:
            try:
                command = input("🌌 quantum> ").strip().lower()
                
                if not command:
                    continue
                
                if command == 'quit':
                    break
                elif command == 'help':
                    self.show_help()
                elif command == 'status':
                    self.show_status()
                elif command == 'pos':
                    print(f"Position: {self.position}")
                elif command.startswith('code '):
                    prompt = command[5:]
                    self.generate_quantum_code(prompt)
                elif command.startswith('gen '):
                    parts = command.split(maxsplit=2)
                    if len(parts) >= 3:
                        lang, prompt = parts[1], parts[2]
                        self.generate_quantum_code(prompt, lang)
                    else:
                        print("Usage: gen <language> <prompt>")
                elif command.startswith('convert '):
                    filepath = command[8:].strip()
                    self.quantum_handler.process_file(filepath)
                elif command.startswith('quantum '):
                    dirpath = command[8:].strip()
                    self.quantum_handler.process_directory(dirpath)
                elif any(command.startswith(prefix) for prefix in ['+', '-']):
                    delta = self.parse_quantum_coordinates(command)
                    self.move_quantum_position(delta)
                else:
                    print(f"Unknown command: {command}")
                    print("Type 'help' for available commands")
                
            except KeyboardInterrupt:
                print("\n👋 Exiting quantum terminal")
                break
            except Exception as e:
                print(f"❌ Error: {e}")

def main():
    """Launch quantum OpenCode terminal"""
    print("🚀 Initializing Quantum OpenCode Terminal...")
    terminal = OpenCodeQuantumTerminal()
    terminal.run()

if __name__ == "__main__":
    main()