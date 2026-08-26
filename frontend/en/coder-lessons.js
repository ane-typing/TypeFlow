/* ============================================================
   程序员练习 - 课程数据 + Shift 符号映射
   提供两种计算机语言的练习（选择最稳定、使用最多的版本）：
     - Python 3.14  ：最新稳定版本
     - Java 17 (LTS)：企业级广泛部署的长期支持版本
   每语言 6 课渐进：符号键 → 上档符号 → 括号 → 关键词 → 代码行 → 代码段
   前 3 课（符号/上档/括号）为两种语言通用
   复用 finger-lessons.js 中的 KBD / KEY_FINGER 等键盘数据
   ============================================================ */

// ---------- Shift 符号 → 基本键 映射 ----------
const SHIFT_MAP = {
  '~': '`', '!': '1', '@': '2', '#': '3', '$': '4', '%': '5',
  '^': '6', '&': '7', '*': '8', '(': '9', ')': '0',
  '_': '-', '+': '=',
  '{': '[', '}': ']', '|': '\\',
  ':': ';', '"': "'",
  '<': ',', '>': '.', '?': '/'
};

// 判断字符是否需要 Shift 的辅助函数
function needsShift(ch) {
  return (ch >= 'A' && ch <= 'Z') || !!SHIFT_MAP[ch];
}

function getBaseKey(ch) {
  if (ch >= 'A' && ch <= 'Z') return ch.toLowerCase();
  return SHIFT_MAP[ch] || ch;
}

// ---------- 前3课通用（符号/上档/括号），两种语言共用 ----------
const SHARED_LESSONS = [
  {
    id: 1,
    name: '课程1 符号键入门',
    desc: '免 Shift 符号键',
    keys: [',', '.', '-', '=', ';', "'", '/', '\\', '[', ']', ' '],
    length: 50,
    words: [
      '..', '.,', '--', '-=', ';;', "''", '//', '\\\\', '[]', '[\\]',
      ',-', '.;', '/-', '=;', ',.', ';.', './', '\\;', '[-]', '[=]'
    ]
  },
  {
    id: 2,
    name: '课程2 上档符号',
    desc: 'Shift + 数字组合',
    keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', '`', 'shift', ' '],
    length: 50,
    words: [
      '!!', '@@', '##', '$$', '%%', '^^', '&&', '**', '(())', '__',
      '++', '~', '!@', '#$', '%^', '&*', '()', '_+', '~!', '@#',
      '$%', '^&', '*(', ')-', '=+', '!@#', '$%^', '&*()', '~!@'
    ]
  },
  {
    id: 3,
    name: '课程3 括号家族',
    desc: '各种括号与引号组合',
    keys: ['[', ']', '{', '}', '(', ')', '<', '>', ':', '"', ';', "'", ',', '.', 'shift', ' '],
    length: 50,
    words: [
      '{}', '[]', '()', '<>', ':"', '""', "''", '{};', '[];', '();',
      '<>;', '{;}', '(:)', '{":}', '["]', "(')", '{,}', '[;]', '({})',
      '[]{}', '()[]', '<>{}', '{()}', '[()]', '({[]})', '<>[]'
    ]
  }
];

// ---------- Python 3.12 专属课程 ----------
const PYTHON_LESSONS = [
  {
    id: 4,
    name: '课程4 Python 关键词',
    desc: 'Python 核心关键字',
    keys: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
           'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', ' '],
    length: 60,
    words: [
      'def', 'return', 'if', 'elif', 'else', 'for', 'while', 'import',
      'from', 'class', 'try', 'except', 'finally', 'with', 'as', 'lambda',
      'yield', 'global', 'nonlocal', 'pass', 'break', 'continue', 'raise',
      'assert', 'del', 'not', 'and', 'or', 'in', 'is', 'self'
    ]
  },
  {
    id: 5,
    name: '课程5 Python 代码行',
    desc: '单行 Python 语句输入',
    keys: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
           'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
           '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
           '(', ')', '{', '}', '[', ']', '<', '>', '=', ':', ',', '.',
           '+', '-', '*', '/', '%', '!', '_', "'", '"', ' ', 'shift'],
    length: 60,
    words: [
      'x = 10', 'y = x * 2 + 1', 'if x > 5:', 'if x >= 18:',
      'for i in range(10):', 'for ch in word:', 'while True:',
      'def add(a, b):', 'return a + b', 'x += 1', 'import math',
      'from math import sqrt', 'print(x * 2)', 'name = input()',
      'if a == b:', 'result = sum(arr)', 'if not flag:', 'elif x < 0:'
    ]
  },
  {
    id: 6,
    name: '课程6 Python 代码段',
    desc: '小函数与完整片段',
    keys: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
           'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
           '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
           '(', ')', '{', '}', '[', ']', '<', '>', '=', ':', ',', '.',
           '+', '-', '*', '/', '%', '!', '_', "'", '"', ' ', 'shift'],
    length: 80,
    words: [
      'def add(a, b): return a + b',
      'for i in range(5): print(i)',
      'if x > 0: print("positive")',
      'def is_even(n): return n % 2 == 0',
      'result = [i * i for i in range(10)]',
      'squares = {i: i * i for i in range(5)}',
      'with open("a.txt") as f: data = f.read()',
      'try: x = int(input()) except ValueError: print("error")',
      'class Dog: def __init__(self, name): self.name = name',
      'import os; path = os.path.join("a", "b")',
      'def fib(n): return n if n < 2 else fib(n - 1) + fib(n - 2)',
      'if name == "__main__": main()'
    ]
  }
];

// ---------- Java 17 (LTS) 专属课程 ----------
const JAVA_LESSONS = [
  {
    id: 4,
    name: '课程4 Java 关键词',
    desc: 'Java 核心关键字',
    keys: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
           'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', ' '],
    length: 60,
    words: [
      'public', 'private', 'protected', 'static', 'final', 'void', 'int',
      'double', 'boolean', 'class', 'interface', 'extends', 'implements',
      'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break',
      'continue', 'try', 'catch', 'finally', 'throw', 'throws', 'new',
      'this', 'super', 'package', 'import', 'abstract'
    ]
  },
  {
    id: 5,
    name: '课程5 Java 代码行',
    desc: '单行 Java 语句输入',
    keys: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
           'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
           '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
           '(', ')', '{', '}', '[', ']', '<', '>', '=', ';', ':', ',', '.',
           '+', '-', '*', '/', '%', '!', '_', "'", '"', ' ', 'shift'],
    length: 60,
    words: [
      'public class Main {', 'int x = 10;', 'double pi = 3.14;',
      'if (x > 5) {', '} else {', 'for (int i = 0; i < 10; i++) {',
      'while (true) {', 'private int age;', 'return a + b;',
      'import java.util.Scanner;', 'String name = "Tom";',
      'System.out.println("Hello");', 'if (a != b) {',
      'System.out.printf("%d", x);'
    ]
  },
  {
    id: 6,
    name: '课程6 Java 代码段',
    desc: '方法定义与完整片段',
    keys: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
           'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
           '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
           '(', ')', '{', '}', '[', ']', '<', '>', '=', ';', ':', ',', '.',
           '+', '-', '*', '/', '%', '!', '_', "'", '"', ' ', 'shift'],
    length: 80,
    words: [
      'public static int add(int a, int b) { return a + b; }',
      'public boolean isEven(int n) { return n % 2 == 0; }',
      'public static void main(String[] args) { System.out.println("Hi"); }',
      'for (int i = 0; i < 10; i++) { System.out.println(i); }',
      'if (x > 0) { System.out.println("positive"); }',
      'try { int n = Integer.parseInt(s); } catch (NumberFormatException e) { }',
      'class Dog { private String name; public Dog(String n) { name = n; } }',
      'int[] arr = {1, 2, 3}; int sum = 0;',
      'for (String w : words) { System.out.println(w); }'
    ]
  }
];

// ---------- 语言定义 ----------
const CODER_LANGUAGES = [
  {
    id: 'python',
    name: 'Python',
    version: '3.14',
    versionNote: '最新稳定版本',
    icon: '🐍',
    lessons: SHARED_LESSONS.concat(PYTHON_LESSONS)
  },
  {
    id: 'java',
    name: 'Java',
    version: '17 (LTS)',
    versionNote: '企业级广泛部署的长期支持版本',
    icon: '☕',
    lessons: SHARED_LESSONS.concat(JAVA_LESSONS)
  }
];

// 默认语言（保持向后兼容：直接读取课程时使用第一种语言 = Python）
const CODER_LESSONS = CODER_LANGUAGES[0].lessons;

window.CODER_LANGUAGES = CODER_LANGUAGES;
window.CODER_LESSONS = CODER_LESSONS;
window.SHIFT_MAP = SHIFT_MAP;
window.needsShift = needsShift;
window.getBaseKey = getBaseKey;
