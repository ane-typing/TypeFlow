/* ============================================================
   速度测试 - 代码片段库（新手 vs 老手）
   真实可读的代码片段：同一任务，用新手风格和老手风格各写一份，
   练习输入真实代码，并感受不同代码风格。
   语言：Python / Java（全部为 ASCII，可逐键输入）
   分级：新手 / 老手
   ============================================================ */

const CODE_SNIPPETS = [
  // ==================== Python ====================
  // 新手：冗长、逐步打印、每一步都注释
  {
    id: 1, lang: 'Python', level: '新手',
    title: 'Python · 求平均分（新手）',
    text: '# A beginner wrote this to compute an average, step by step\n' +
      'scores = [89, 92, 78, 85, 91, 87]\n' +
      'total = 0\n' +
      'for score in scores:\n' +
      '    total = total + score\n' +
      '    print("adding", score, "the total is", total)\n' +
      'count = len(scores)\n' +
      'average = total / count\n' +
      'print("the average score is", average)'
  },
  // 老手：简洁、类型标注、f-string
  {
    id: 2, lang: 'Python', level: '老手',
    title: 'Python · 求平均分（老手）',
    text: '# An expert expresses the same idea in just a few lines\n' +
      'from statistics import mean\n' +
      '\n' +
      'def average(values: list[float]) -> float:\n' +
      '    """Return the arithmetic mean of a numeric list."""\n' +
      '    return mean(values)\n' +
      '\n' +
      'scores = [89.0, 92.0, 78.0, 85.0, 91.0, 87.0]\n' +
      'print(f"average: {average(scores):.2f}")'
  },
  // 老手：缓存装饰器
  {
    id: 3, lang: 'Python', level: '老手',
    title: 'Python · 斐波那契缓存（老手）',
    text: '# An expert caches repeated computation with a decorator\n' +
      'from functools import lru_cache\n' +
      '\n' +
      '@lru_cache(maxsize=None)\n' +
      'def fib(n: int) -> int:\n' +
      '    if n < 2:\n' +
      '        return n\n' +
      '    return fib(n - 1) + fib(n - 2)\n' +
      '\n' +
      'print([fib(i) for i in range(12)])'
  },
  // 新手：while 循环冗长实现
  {
    id: 4, lang: 'Python', level: '新手',
    title: 'Python · 阶乘（新手）',
    text: '# A beginner calculates a factorial with a while loop\n' +
      'number = 6\n' +
      'result = 1\n' +
      'i = 1\n' +
      'while i <= number:\n' +
      '    result = result * i\n' +
      '    print("multiply by", i, "now", result)\n' +
      '    i = i + 1\n' +
      'print("the factorial of", number, "is", result)'
  },

  // ==================== Java ====================
  // 新手：逐行打印
  {
    id: 5, lang: 'Java', level: '新手',
    title: 'Java · 问候程序（新手）',
    text: '// A beginner prints a greeting line by line\n' +
      'public class Hello {\n' +
      '    public static void main(String[] args) {\n' +
      '        String name = "World";\n' +
      '        System.out.println("Hello");\n' +
      '        System.out.println("Welcome to Java");\n' +
      '        System.out.println("Nice to meet you, " + name + "!");\n' +
      '    }\n' +
      '}'
  },
  // 新手：简单循环找最大值
  {
    id: 6, lang: 'Java', level: '新手',
    title: 'Java · 求最大值（新手）',
    text: '// A beginner finds the largest number with a simple loop\n' +
      'public class MaxFinder {\n' +
      '    public static void main(String[] args) {\n' +
      '        int[] nums = { 12, 45, 23, 67, 8, 90, 34 };\n' +
      '        int max = nums[0];\n' +
      '        for (int i = 1; i < nums.length; i++) {\n' +
      '            if (nums[i] > max) {\n' +
      '                max = nums[i];\n' +
      '            }\n' +
      '        }\n' +
      '        System.out.println("The largest number is " + max);\n' +
      '    }\n' +
      '}'
  },
  // 老手：stream 一行解决
  {
    id: 7, lang: 'Java', level: '老手',
    title: 'Java · 求最大值（老手）',
    text: '// An expert reduces the same task to one expressive line\n' +
      'import java.util.Arrays;\n' +
      '\n' +
      'public class MaxFinder {\n' +
      '    public static void main(String[] args) {\n' +
      '        int[] nums = { 12, 45, 23, 67, 8, 90, 34 };\n' +
      '        int max = Arrays.stream(nums).max().orElseThrow();\n' +
      '        System.out.println("The largest number is " + max);\n' +
      '    }\n' +
      '}'
  },
  // 老手：record 紧凑数据模型
  {
    id: 8, lang: 'Java', level: '老手',
    title: 'Java · 记录类型（老手）',
    text: '// An expert models immutable data with a compact record\n' +
      'public record Person(String name, int age) {\n' +
      '    public Person {\n' +
      '        if (age < 0) {\n' +
      '            throw new IllegalArgumentException("age must be positive");\n' +
      '        }\n' +
      '    }\n' +
      '\n' +
      '    public String introduce() {\n' +
      '        return name + " is " + age + " years old";\n' +
      '    }\n' +
      '}'
  },
  // ==================== Python（扩充） ====================
  {
    id: 9, lang: 'Python', level: '新手',
    title: 'Python · 冒泡排序（新手）',
    text: '# A beginner sorts a list with nested loops\n' +
      'def bubble_sort(nums):\n' +
      '    n = len(nums)\n' +
      '    for i in range(n):\n' +
      '        for j in range(n - i - 1):\n' +
      '            if nums[j] > nums[j + 1]:\n' +
      '                nums[j], nums[j + 1] = nums[j + 1], nums[j]\n' +
      '    return nums\n' +
      '\n' +
      'data = [5, 2, 9, 1, 7]\n' +
      'print(bubble_sort(data))'
  },
  {
    id: 10, lang: 'Python', level: '新手',
    title: 'Python · 统计字符（新手）',
    text: '# A beginner counts letters one by one\n' +
      'sentence = "the quick brown fox"\n' +
      'letters = {}\n' +
      'for ch in sentence:\n' +
      '    if ch in letters:\n' +
      '        letters[ch] = letters[ch] + 1\n' +
      '    else:\n' +
      '        letters[ch] = 1\n' +
      'for key in letters:\n' +
      '    print(key, letters[key])'
  },
  {
    id: 11, lang: 'Python', level: '老手',
    title: 'Python · 排序与推导（老手）',
    text: '# An expert sorts and transforms in one expressive line\n' +
      'def summarize(words: list[str]) -> dict[str, int]:\n' +
      '    return {w: len(w) for w in sorted(set(words))}\n' +
      '\n' +
      'words = ["apple", "kiwi", "fig", "kiwi"]\n' +
      'print(summarize(words))'
  },
  {
    id: 12, lang: 'Python', level: '老手',
    title: 'Python · 安全读取文件（老手）',
    text: '# An expert reads a file safely and formats output\n' +
      'from pathlib import Path\n' +
      '\n' +
      'def count_lines(path: str) -> int:\n' +
      '    return len(Path(path).read_text().splitlines())\n' +
      '\n' +
      'lines = count_lines("data.txt")\n' +
      'print(f"the file has {lines} lines")'
  },
  {
    id: 13, lang: 'Python', level: '老手',
    title: 'Python · 数据类 Point（老手）',
    text: '# An expert models data with a dataclass\n' +
      'from dataclasses import dataclass\n' +
      '\n' +
      '@dataclass\n' +
      'class Point:\n' +
      '    x: float\n' +
      '    y: float\n' +
      '\n' +
      '    def distance(self, other: "Point") -> float:\n' +
      '        return ((self.x - other.x) ** 2 + (self.y - other.y) ** 2) ** 0.5\n' +
      '\n' +
      'a = Point(0.0, 0.0)\n' +
      'b = Point(3.0, 4.0)\n' +
      'print(round(a.distance(b), 2))'
  },
  {
    id: 25, lang: 'Python', level: '老手',
    title: 'Python · 计时装饰器（老手）',
    text: '# An expert times a function with a decorator\n' +
      'import time\n' +
      '\n' +
      'def timer(fn):\n' +
      '    def wrapper(*args, **kwargs):\n' +
      '        start = time.perf_counter()\n' +
      '        result = fn(*args, **kwargs)\n' +
      '        print(f"took {time.perf_counter() - start:.4f}s")\n' +
      '        return result\n' +
      '    return wrapper\n' +
      '\n' +
      '@timer\n' +
      'def work():\n' +
      '    return sum(range(1000000))'
  },

  // ==================== Java（扩充） ====================
  {
    id: 14, lang: 'Java', level: '新手',
    title: 'Java · 数组求和（新手）',
    text: '// A beginner sums an array with a loop\n' +
      'public class Sum {\n' +
      '    public static void main(String[] args) {\n' +
      '        int[] nums = { 4, 8, 15, 16, 23, 42 };\n' +
      '        int total = 0;\n' +
      '        for (int i = 0; i < nums.length; i++) {\n' +
      '            total = total + nums[i];\n' +
      '        }\n' +
      '        System.out.println("The sum is " + total);\n' +
      '    }\n' +
      '}'
  },
  {
    id: 15, lang: 'Java', level: '新手',
    title: 'Java · 字符串反转（新手）',
    text: '// A beginner reverses a string the long way\n' +
      'public class Reverse {\n' +
      '    public static void main(String[] args) {\n' +
      '        String word = "harness";\n' +
      '        String result = "";\n' +
      '        for (int i = word.length() - 1; i >= 0; i--) {\n' +
      '            result = result + word.charAt(i);\n' +
      '        }\n' +
      '        System.out.println(result);\n' +
      '    }\n' +
      '}'
  },
  {
    id: 16, lang: 'Java', level: '老手',
    title: 'Java · 数组求和（老手）',
    text: '// An expert reduces a sum to a single stream line\n' +
      'import java.util.Arrays;\n' +
      '\n' +
      'public class Sum {\n' +
      '    public static void main(String[] args) {\n' +
      '        int[] nums = { 4, 8, 15, 16, 23, 42 };\n' +
      '        int total = Arrays.stream(nums).sum();\n' +
      '        System.out.println("The sum is " + total);\n' +
      '    }\n' +
      '}'
  },
  {
    id: 17, lang: 'Java', level: '老手',
    title: 'Java · 字符串反转（老手）',
    text: '// An expert reverses with a StringBuilder\n' +
      'public class Reverse {\n' +
      '    public static void main(String[] args) {\n' +
      '        String word = "harness";\n' +
      '        String result = new StringBuilder(word).reverse().toString();\n' +
      '        System.out.println(result);\n' +
      '    }\n' +
      '}'
  },
  {
    id: 18, lang: 'Java', level: '老手',
    title: 'Java · 过滤记录（老手）',
    text: '// An expert filters a list with a stream\n' +
      'import java.util.List;\n' +
      'import java.util.stream.Collectors;\n' +
      '\n' +
      'record Person(String name, int age) {}\n' +
      '\n' +
      'public class Main {\n' +
      '    public static void main(String[] args) {\n' +
      '        List<Person> people = List.of(\n' +
      '            new Person("Ann", 34),\n' +
      '            new Person("Ben", 17)\n' +
      '        );\n' +
      '        List<String> adults = people.stream()\n' +
      '            .filter(p -> p.age() >= 18)\n' +
      '            .map(Person::name)\n' +
      '            .collect(Collectors.toList());\n' +
      '        System.out.println(adults);\n' +
      '    }\n' +
      '}'
  },
  {
    id: 26, lang: 'Java', level: '老手',
    title: 'Java · 线程池（老手）',
    text: '// An expert runs tasks on a thread pool\n' +
      'import java.util.concurrent.Executors;\n' +
      '\n' +
      'public class Pool {\n' +
      '    public static void main(String[] args) {\n' +
      '        var pool = Executors.newFixedThreadPool(4);\n' +
      '        for (int i = 1; i <= 8; i++) {\n' +
      '            int n = i;\n' +
      '            pool.submit(() -> System.out.println(n * n));\n' +
      '        }\n' +
      '        pool.shutdown();\n' +
      '    }\n' +
      '}'
  },


];

// 从代码池中随机抽取 n 段（用于刷新功能）
function shuffleCodeSnippets(n = 6) {
  const copy = [...CODE_SNIPPETS];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

window.CODE_SNIPPETS = CODE_SNIPPETS;
window.shuffleCodeSnippets = shuffleCodeSnippets;
