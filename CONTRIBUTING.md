# 贡献指南

感谢你对 **TypeFlow · 打字练习软件** 感兴趣！任何形式的贡献都欢迎：报告 Bug、提功能建议、改进文档、提交代码。

## 🐛 报告 Bug

在提交 Issue 前，请先搜索是否已有人报告过相同问题。

报告时请尽量包含：

- **软件版本**（如 v0.2.0，可在「成绩记录」页或 `package.json` 查看）
- **操作系统**（Windows 10 / 11，x64？）
- **复现步骤**：怎么操作才会出现该问题
- **期望行为** vs **实际行为**
- 如有报错弹窗，请附上错误信息或截图

## 💡 提功能建议

请说明：

- 想解决什么问题 / 满足什么场景
- 期望的交互方式
- 对现有功能的影响（可选）

## 🔧 开发环境

```bash
# 1. 安装依赖（Electron 二进制建议使用 npmmirror 镜像）
npm install

# 2. 开发模式运行
npm start

# 3. 打包 Windows 安装包 / 便携版
npm run build
npm run build:portable
```

## 📏 代码风格

项目遵循「见名知意、简洁明了」的原则：

- **原生 HTML / CSS / JavaScript**，不引入框架
- 界面文案使用简体中文（练习内容本身按语言区分）
- 变量/函数命名清晰，能表达用途
- 涉及多个文件的大改动，建议先说明思路再动手
- 提交信息使用简洁的英文或中文均可，建议遵循 `<type>: <描述>` 格式（如 `fix: 修复退格计数错误`、`docs: 补充 README`）

## 🧪 测试

改动后请确保原有测试仍通过：

```bash
# 数据完整性校验（文章、代码片段）
node test/final_check.js
node test/validate-snippets.js
node test/validate-codesnippets.js

# 端到端回归（用 Electron 跑，需先 npm install）
node_modules\electron\dist\electron.exe .codex-tests\harness.js
```

## 🚀 提交 Pull Request

1. Fork 本仓库并 clone 到本地
2. 从 `main` 新建分支：`git checkout -b feat/xxx` 或 `fix/xxx`
3. 完成改动并本地验证（`npm start` + 测试通过）
4. 有功能变化时，同步更新 `CHANGELOG.md`
5. 提交并推送，然后创建 Pull Request，描述清楚：
   - 改了什么、为什么改
   - 如何验证
   - 是否涉及破坏性变更

## 📜 其他

- 安全问题请**不要**在 Issue 中公开，参考 [SECURITY.md](SECURITY.md)
- 本仓库行为准则见 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
