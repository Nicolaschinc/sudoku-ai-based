# AI Sudoku Project Context

## Project Overview
这是一个基于 React + Vite + TypeScript 开发的 AI 辅助数独 Web 应用。核心亮点是集成了 Moonshot AI (Kimi) API，为用户提供智能填数提示。

## Tech Stack
- **Frontend Framework**: React 19
- **Build Tool**: Vite (Rolldown powered)
- **Language**: TypeScript
- **AI Integration**: Kimi (Moonshot AI) via Fetch API

## Core Features & Implementation

### 1. Game Logic (`src/sudoku.ts`)
- **Board Representation**: `Board` 类型 (`(number | null)[][]`)。
- **Validation**:
  - `isValidPlacement`: 检查行、列、宫格冲突。
  - `isBoardComplete`: 检查是否完成。
  - `getCandidates`: 获取某格子的候选数。
- **Puzzle Data**: 目前仅支持一个硬编码的数独盘面 (`puzzle` 常量)。

### 2. UI Components (`src/App.tsx`)
- **State Management**:
  - `board`: 当前盘面状态。
  - `selectedCell`: 当前选中的格子。
  - `status/aiHint/aiError`: UI 反馈信息。
- **Interaction**:
  - 点击选择格子。
  - 虚拟键盘/物理键盘输入数字。
  - 冲突高亮显示。

### 3. AI Integration (`src/kimiClient.ts`)
- **Prompt Engineering**:
  - Role: 数独专家。
  - Input: 当前盘面字符串、空格坐标列表、禁用坐标列表。
  - Output: JSON 格式 `{ row, col, value, explanation }`。
- **Error Handling**:
  - 重试机制 (最多 2 次)。
  - 校验 AI 返回的坐标是否合法（是否为空格）。

## Optimization Roadmap (PM Recommendations)

### P0: Core Gameplay Enhancements (基础体验升级)
1.  **动态数独生成 (Dynamic Puzzle Generation)**
    -   **现状**: 只有一个硬编码盘面，玩一次就没用了。
    -   **优化**: 实现数独生成算法（挖洞法），支持不同难度（简单/中等/困难）。
2.  **笔记模式 (Notes / Pencil Marks)**
    -   **现状**: 只能填最终数字，无法标记候选数。
    -   **优化**: 增加笔记模式开关，允许在格子里记录多个小数字（候选数）。

### P1: AI Value Proposition (AI 价值深化)
1.  **AI 教学模式 (Coaching Mode)**
    -   **现状**: AI 直接给出答案（填什么数字）。
    -   **优化**:
        -   **Step-by-step Hint**: 第一步只提示“关注第 3 行”；第二步提示“缺少数字 5”；第三步才给答案。
        -   **Why is this wrong?**: 当用户填错时，AI 解释错误原因（逻辑冲突点）。
2.  **自然语言对话 (Chat Interface)**
    -   **现状**: 单向请求提示。
    -   **优化**: 允许用户提问（例如：“我现在该怎么办？”），AI 进行多轮对话指导。

### P2: Game Auxiliaries (辅助功能)
1.  **游戏状态管理**
    -   计时器 (Timer)。
    -   撤销/重做 (Undo/Redo)。
    -   历史记录 (History)。
    -   暂停/继续。
2.  **键盘导航优化**
    -   支持方向键移动选中框。

### P3: Technical & Engineering
1.  **API Key Security**: 考虑通过后端代理请求，避免前端暴露 API Key。
2.  **Performance**: 优化 React 渲染（目前每次点击都重渲染整个棋盘，虽然规模小不卡，但架构上可优化）。
3.  **Responsive Design**: 进一步优化移动端触摸体验。
