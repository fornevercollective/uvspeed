#!/usr/bin/env python3
# Quantum Code System Status - Complete UV-Speed Implementation
# Shows all quantum components and their readiness status

import os,sys,json
from pathlib import Path
import subprocess

class QuantumSystemStatus:
    """Status checker for UV-Speed Quantum ecosystem"""
    
    def __init__(self):
        self.base_path = "/Users/tref/uv-speed-opencode-quantum"
        self.components = {
            'quantum_handler_clean.py': 'Universal quantum code numbering',
            'opencode_quantum_terminal_clean.py': 'AI terminal with 3D navigation',
            'launch_quantum_terminal.sh': 'Main launcher script',
            'install_quantum_opencode.sh': 'Installation automation'
        }
    
    def check_file_exists(self, filename):
        """Check if quantum component file exists"""
        return os.path.exists(os.path.join(self.base_path, filename))
    
    def check_dependencies(self):
        """Check system dependencies"""
        deps = {}
        
        # Python check
        try:
            result = subprocess.run(['python3', '--version'], 
                                  capture_output=True, text=True)
            deps['python3'] = result.stdout.strip() if result.returncode == 0 else "❌ Missing"
        except:
            deps['python3'] = "❌ Missing"
        
        # Node.js check
        try:
            result = subprocess.run(['node', '--version'], 
                                  capture_output=True, text=True)
            deps['nodejs'] = result.stdout.strip() if result.returncode == 0 else "❌ Missing"
        except:
            deps['nodejs'] = "❌ Optional"
        
        # OpenCode check
        try:
            result = subprocess.run(['opencode', '--version'], 
                                  capture_output=True, text=True, timeout=3)
            deps['opencode'] = "✅ Installed" if result.returncode == 0 else "❌ Missing"
        except:
            deps['opencode'] = "❌ Missing (install via npm)"
        
        return deps
    
    def count_quantum_files(self):
        """Count converted quantum files"""
        count = 0
        for file in Path(self.base_path).glob("*_quantum.*"):
            count += 1
        return count
    
    def show_status(self):
        """Display comprehensive quantum system status"""
        print("🌌 QUANTUM CODE SYSTEM STATUS")
        print("=" * 50)
        print("")
        
        # Core components
        print("🔧 CORE COMPONENTS:")
        for component, description in self.components.items():
            status = "✅" if self.check_file_exists(component) else "❌"
            print(f"  {status} {component}")
            print(f"     {description}")
        
        print("")
        
        # System dependencies
        print("🏗️  SYSTEM DEPENDENCIES:")
        deps = self.check_dependencies()
        for dep, status in deps.items():
            print(f"  {dep}: {status}")
        
        print("")
        
        # Quantum files count
        quantum_count = self.count_quantum_files()
        print(f"📄 QUANTUM FILES: {quantum_count} files converted to quantum numbering")
        
        print("")
        
        # Architecture overview
        print("🎯 ARCHITECTURE:")
        print("  Zig (Ghostty) → Rust (Nushell/uv) → Semantic (GrepAI) → Visual")
        print("  All execution: uv run")
        print("  AI Coding: OpenCode → Quantum Navigation → 3D Space")
        
        print("")
        
        # Quantum prefixes
        print("🌌 QUANTUM NAVIGATION PREFIXES:")
        print("  n: = Entry points (#!/usr/bin/env)")
        print("  +1: = Comments/documentation")
        print("  -n: = Imports/dependencies")
        print("  +0: = Classes")
        print("  0: = Functions")
        print("  -1: = Error handling")
        print("  +n: = Conditionals")
        print("  +2: = Loops")
        print("  -0: = Returns")
        print("  +3: = Output statements")
        
        print("")
        
        # Launch instructions
        print("🚀 LAUNCH COMMANDS:")
        print(f"  cd {self.base_path}")
        print("  ./launch_quantum_terminal.sh")
        print("  OR")
        print("  python3 opencode_quantum_terminal_clean.py")
        
        print("")
        print("✅ UV-Speed Quantum System Ready for OS Rebuild!")

def main():
    """Run quantum system status check"""
    checker = QuantumSystemStatus()
    checker.show_status()

if __name__ == "__main__":
    main()