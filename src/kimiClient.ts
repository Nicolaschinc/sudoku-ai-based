import type { Board } from './sudoku'

export type SudokuHint = {
  row: number
  col: number
  value: number
  explanation: string
}

type ChatCompletionChoice = {
  message?: {
    content?: string
  }
}

type ChatCompletionResponse = {
  choices?: ChatCompletionChoice[]
}

function formatBoardToString(board: Board): string {
  return board
    .map((row, rIndex) =>
      row
        .map((cell) => (cell === null ? '.' : cell))
        .join(' ')
        .concat(`  (Row ${rIndex})`),
    )
    .join('\n')
}

function listEmptyCells(board: Board): Array<{ row: number; col: number }> {
  const cells: Array<{ row: number; col: number }> = []
  for (let r = 0; r < 9; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      if (board[r][c] === null) cells.push({ row: r, col: c })
    }
  }
  return cells
}

export async function requestSudokuHint(
  board: Board,
  retryCount = 0,
  banned: Array<{ row: number; col: number }> = [],
): Promise<SudokuHint> {
  const apiKey = import.meta.env.VITE_KIMI_API_KEY

  if (!apiKey) {
    throw new Error('缺少 Kimi API Key，请在 .env 中配置 VITE_KIMI_API_KEY')
  }

  const boardString = formatBoardToString(board)

  const emptyCells = listEmptyCells(board)
  const body = {
    model: 'moonshot-v1-8k',
    messages: [
      {
        role: 'system',
        content: `你是一个数独专家。你的任务是根据给定的数独盘面，找到*下一步*最确定的填数位置。

规则：
1. 每一行、每一列、每一个 3x3 宫格内，数字 1-9 必须且只能出现一次。
2. 你推荐的填数必须是根据当前盘面逻辑推导出来的，不能猜测。
3. 请确保填入该数字后，不会与所在的行、列、宫格内的现有数字冲突。
4. **绝对不能**推荐已经有数字的格子（即非 . 的位置），只能推荐空格子（.）进行填数。
5. 返回结果必须是一个 JSON 对象。

JSON 格式要求：
\`\`\`json
{
  "row": 行索引(0-8),
  "col": 列索引(0-8),
  "value": 填入的数字(1-9),
  "explanation": "简短的推理说明，例如：'第3行缺5，且列和宫格排除其他可能'"
}
\`\`\`
`,
      },
      {
        role: 'user',
        content: `当前盘面（. 表示空格，行号 0-8）：\n${boardString}\n\n可选空格坐标列表（仅能从此列表中选择）：${JSON.stringify(
          emptyCells,
        )}\n禁止选择的坐标：${JSON.stringify(banned)}\n\n请分析并给出下一步提示。`,
      },
    ],
    temperature: 0.1,
  }

  try {
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`调用 Kimi 接口失败，状态码：${response.status}`)
    }

    const data = (await response.json()) as ChatCompletionResponse
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('Kimi 返回内容为空，请稍后重试')
    }

    let parsed: SudokuHint
    try {
      // 尝试提取 JSON 部分，以防 AI 输出包含 Markdown 代码块或额外文字
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? jsonMatch[0] : content
      parsed = JSON.parse(jsonStr) as SudokuHint
    } catch (error) {
      console.error('JSON Parse Error:', error, 'Content:', content)
      throw new Error('解析 Kimi 返回的提示失败，请检查提示格式')
    }

    if (
      typeof parsed.row !== 'number' ||
      typeof parsed.col !== 'number' ||
      typeof parsed.value !== 'number'
    ) {
      throw new Error('Kimi 返回的提示字段不完整，请稍后重试')
    }

    // 检查 AI 是否推荐了非空位置或不在可选空格列表中
    const isEmpty = board[parsed.row][parsed.col] === null
    const inEmptyList = emptyCells.some(ec => ec.row === parsed.row && ec.col === parsed.col)
    if (!isEmpty || !inEmptyList) {
      const nextBanned = [...banned, { row: parsed.row, col: parsed.col }]
      console.warn(
        `Kimi 推荐了无效位置 (${parsed.row}, ${parsed.col})，加入禁用列表并重试...`,
      )
      if (retryCount < 2) {
        return requestSudokuHint(board, retryCount + 1, nextBanned)
      }
      throw new Error('AI 多次推荐无效位置，请稍后重试')
    }

    return parsed
  } catch (error) {
    if (retryCount < 2 && !(error instanceof Error && error.message.includes('缺少 Kimi API Key'))) {
      console.warn('请求出错，尝试重试...', error)
      return requestSudokuHint(board, retryCount + 1, banned)
    }
    throw error
  }
}
