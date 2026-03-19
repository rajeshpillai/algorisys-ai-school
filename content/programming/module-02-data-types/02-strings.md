---
id: strings
module: module-02-data-types
sequence: 2
title: Strings and Text
activity_types: [slide, discussion, quiz, playground]
difficulty: beginner
estimated_minutes: 15
---

## Slide

# Strings and Text

Strings are sequences of characters — used for text data.

### Creating strings
```python
single = 'Hello'
double = "Hello"
multi = """This string
spans multiple
lines"""
```

### String operations

**Concatenation** (joining strings):
```python
first = "Hello"
second = "World"
combined = first + " " + second  # "Hello World"
```

**Repetition**:
```python
echo = "Ha" * 3  # "HaHaHa"
```

**Length**:
```python
message = "Hello"
print(len(message))  # 5
```

### f-strings (formatted strings)

The modern way to embed values in strings:
```python
name = "Alice"
age = 30
print(f"My name is {name} and I am {age} years old")
print(f"Next year I'll be {age + 1}")
```

### Common string methods
```python
text = "Hello, World!"
print(text.upper())       # "HELLO, WORLD!"
print(text.lower())       # "hello, world!"
print(text.replace("World", "Python"))  # "Hello, Python!"
print(text.split(", "))   # ["Hello", "World!"]
print(text.startswith("Hello"))  # True
```

### Indexing
```python
word = "Python"
print(word[0])    # "P" (first character)
print(word[-1])   # "n" (last character)
print(word[0:3])  # "Pyt" (slicing)
```

## Discussion

Strings are immutable in Python — once created, they cannot be changed. When you call `text.upper()`, it returns a NEW string rather than modifying the original. Why do you think Python was designed this way? What are the implications for memory and performance?

## Quiz
- question: "What does `len('Hello')` return?"
  type: single
  options: ["4", "5", "6", "Error"]
  answer: 1
- question: "What is the output of `'Ha' * 3`?"
  type: single
  options: ["Ha 3", "HaHaHa", "Ha*3", "Error"]
  answer: 1

## Playground
```python
# Experiment with strings
name = "Python"
version = 3.12

# Try f-strings
print(f"Learning {name} {version}")

# Try string methods
print(name.upper())
print(name.lower())
print(name[0:3])

# Try building a sentence
adjective = "awesome"
print(f"{name} is {adjective}!")
```

## Solution
```python
name = "Python"
version = 3.12

print(f"Learning {name} {version}")
print(name.upper())
print(name.lower())
print(name[0:3])  # "Pyt"

adjective = "awesome"
print(f"{name} is {adjective}!")

# Extra: string methods chain
sentence = "  hello, world!  "
print(sentence.strip().title())  # "Hello, World!"
```
