---
id: variables-intro
module: module-01-getting-started
sequence: 3
title: Introduction to Variables
activity_types: [slide, discussion, quiz, playground]
difficulty: beginner
estimated_minutes: 15
---

## Slide

# Introduction to Variables

A variable is a name that refers to a value stored in memory. Think of it as a labeled box that holds data.

### Creating variables

In Python, you create a variable by assigning a value with `=`:

```python
name = "Alice"
age = 25
pi = 3.14159
is_student = True
```

No need to declare types — Python figures it out automatically. This is called **dynamic typing**.

### Naming rules

- Must start with a letter or underscore: `name`, `_count`
- Can contain letters, numbers, underscores: `player_1`, `total_score`
- Case-sensitive: `Name` and `name` are different variables
- Cannot use Python keywords: `if`, `for`, `class`, etc.

### Convention

Python uses **snake_case** for variable names:

```python
first_name = "Alice"      # Good
firstName = "Alice"        # Works but not Pythonic
FIRST_NAME = "Alice"       # Convention for constants
```

### Using variables

```python
greeting = "Hello"
name = "World"
message = greeting + ", " + name + "!"
print(message)  # Hello, World!
```

## Discussion

Variables are like labeled containers. When you write `x = 5`, you're not saying "x equals 5" in the mathematical sense. You're saying "put 5 into the container labeled x." How does this differ from math? What happens when you write `x = x + 1`?

## Quiz
- question: "What will `x = 10; x = 20; print(x)` output?"
  type: single
  options: ["10", "20", "10 20", "Error"]
  answer: 1
- question: Which is a valid Python variable name?
  type: single
  options: ["2nd_place", "my-var", "my_var", "class"]
  answer: 2

## Playground
```python
# Create some variables and experiment
first_name = "Ada"
last_name = "Lovelace"
birth_year = 1815

# Try combining them
full_name = first_name + " " + last_name
print(full_name)
print("Born in", birth_year)
```

## Solution
```python
first_name = "Ada"
last_name = "Lovelace"
birth_year = 1815

full_name = first_name + " " + last_name
print(full_name)
print("Born in", birth_year)

# You can also calculate with variables
current_year = 2026
age = current_year - birth_year
print(full_name, "would be", age, "years old")
```
