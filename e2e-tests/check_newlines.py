import io, sys, re, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read()

src = load('frontend/en/articles.js')
newlines = re.findall(r'text:\s*"([^"]*)"', src)
print('en articles total:', len(newlines))
print('en articles with \\n:', sum(1 for t in newlines if '\\n' in t))

src2 = load('frontend/zh/articles.js')
newlines2 = re.findall(r'text:\s*"([^"]*)"', src2)
print('zh articles total:', len(newlines2))
print('zh articles with \\n:', sum(1 for t in newlines2 if '\\n' in t))

src3 = load('frontend/code/code-snippets.js')
newlines3 = re.findall(r'text:\s*`([^`]*)`', src3)
print('code snippets total:', len(newlines3))
print('code snippets with \\n:', sum(1 for t in newlines3 if '\\n' in t))
