#!/usr/bin/env python3
# n: = Simple calculator with basic operations

# -1: = Dependencies
import sys

# 0: = Calculator function
def calculator(operation, a, b):
    """
    Perform basic arithmetic operations
    Operations: add, subtract, multiply, divide
    """
    # +n: = Operation selection
    if operation == 'add':
        return a + b
    elif operation == 'subtract':
        return a - b
    elif operation == 'multiply':
        return a * b
    elif operation == 'divide':
        # -1: = Error handling for division by zero
        if b == 0:
            raise ValueError("Cannot divide by zero")
        return a / b
    else:
        raise ValueError(f"Unknown operation: {operation}")

# 0: = Main function
def main():
    # +3: = Example usage
    try:
        result = calculator('add', 5, 3)
        print(f"5 + 3 = {result}")
        
        result = calculator('multiply', 4, 7)
        print(f"4 * 7 = {result}")
        
        result = calculator('divide', 10, 2)
        print(f"10 / 2 = {result}")
        
    # -1: = Error handling
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()