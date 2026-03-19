---
id: numbers
module: module-02-data-types
sequence: 1
title: Numbers and Arithmetic
activity_types: [slide, quiz, playground]
difficulty: beginner
estimated_minutes: 15
---

## Slide

# Numbers and Arithmetic

Python has two main number types:

### Integers (`int`)
Whole numbers without decimals:
```python
count = 42
negative = -7
big_number = 1_000_000  # Underscores for readability
```

### Floating-point (`float`)
Numbers with decimals:
```python
price = 19.99
temperature = -3.5
scientific = 2.5e6  # 2,500,000.0
```

### Arithmetic operators

| Operator | Name | Example | Result |
|----------|------|---------|--------|
| `+` | Addition | `3 + 2` | `5` |
| `-` | Subtraction | `3 - 2` | `1` |
| `*` | Multiplication | `3 * 2` | `6` |
| `/` | Division | `7 / 2` | `3.5` |
| `//` | Floor division | `7 // 2` | `3` |
| `%` | Modulo | `7 % 2` | `1` |
| `**` | Power | `3 ** 2` | `9` |

### Order of operations

Python follows standard math order (PEMDAS):
```python
result = 2 + 3 * 4    # 14, not 20
result = (2 + 3) * 4  # 20, parentheses first
```

## Quiz
- question: "What is the result of `7 / 2` in Python?"
  type: single
  options: ["3", "3.5", "3.0", "Error"]
  answer: 1
- question: "What does the `//` operator do?"
  type: single
  options: ["Regular division", "Floor division (rounds down)", "Modulo", "Power"]
  answer: 1

## Playground
```python
# Experiment with Python arithmetic
a = 10
b = 3

print("Addition:", a + b)
print("Division:", a / b)
print("Floor div:", a // b)
print("Modulo:", a % b)
print("Power:", a ** b)
```

## Solution
```python
a = 10
b = 3

print("Addition:", a + b)       # 13
print("Division:", a / b)       # 3.333...
print("Floor div:", a // b)     # 3
print("Modulo:", a % b)         # 1
print("Power:", a ** b)         # 1000

# Practical example: convert minutes to hours and minutes
total_minutes = 135
hours = total_minutes // 60
minutes = total_minutes % 60
print(f"{total_minutes} minutes = {hours}h {minutes}m")
```
