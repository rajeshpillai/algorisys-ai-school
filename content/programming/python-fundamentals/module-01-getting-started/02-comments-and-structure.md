---
id: comments-and-structure
module: module-01-getting-started
sequence: 2
title: Comments and Code Structure
activity_types: [slide, quiz, playground]
difficulty: beginner
estimated_minutes: 12
---

## Slide

# Comments and Code Structure

Comments are notes in your code that Python ignores. They help humans understand what the code does.

### Single-line comments

Use the `#` symbol:

```python
# This is a comment
print("Hello")  # This is an inline comment
```

### Multi-line comments

Use triple quotes for longer explanations:

```python
"""
This is a multi-line comment.
It can span several lines.
Often used for documentation.
"""
```

### Code structure

Python uses **indentation** (spaces) to define code blocks, unlike most languages that use braces `{}`. This enforces readable code:

```python
if True:
    print("This is indented")
    print("Same block")
print("Back to top level")
```

- Standard indentation is **4 spaces**
- Mixing tabs and spaces causes errors
- Blank lines improve readability

## Quiz
- question: Which symbol starts a single-line comment in Python?
  type: single
  options: ["//", "#", "--", "/*"]
  answer: 1
- question: What does Python use to define code blocks?
  type: single
  options: ["Curly braces {}", "Indentation (spaces)", "Parentheses ()", "Square brackets []"]
  answer: 1

## Playground
```python
# Experiment with comments and structure
# Try uncommenting the lines below

# print("Line 1")
# print("Line 2")

# What happens if you remove the # from the lines above?
print("Comments are invisible to Python!")
```

## Solution
```python
# Comments help explain your code
print("Line 1")  # This prints the first line
print("Line 2")  # This prints the second line

# You can also use comments to temporarily disable code
# print("This line won't run")

print("Comments are invisible to Python!")
```
