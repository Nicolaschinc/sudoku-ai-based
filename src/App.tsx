import { useMemo, useState } from 'react'
import './App.css'
import { createInitialBoard, isBoardComplete, isFixedCell, isValidPlacement, setCell, getCandidates } from './sudoku'
import type { Board, CellValue } from './sudoku'
import { requestSudokuHint } from './kimiClient'

function App() {
  const initialBoard = useMemo(() => createInitialBoard(), [])
  const [board, setBoard] = useState<Board>(initialBoard)
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [status, setStatus] = useState<string>('')
  const [aiHint, setAiHint] = useState<string>('')
  const [aiLoading, setAiLoading] = useState<boolean>(false)
  const [aiError, setAiError] = useState<string>('')

  const handleCellClick = (row: number, col: number) => {
    if (isFixedCell(initialBoard, row, col)) {
      return
    }
    setSelectedCell({ row, col })
    setStatus('')
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!selectedCell) {
      return
    }

    if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') {
      const next = setCell(board, selectedCell.row, selectedCell.col, null)
      setBoard(next)
      setStatus('')
      return
    }

    const value = Number.parseInt(event.key, 10)
    if (!Number.isNaN(value) && value >= 1 && value <= 9) {
      const next = setCell(board, selectedCell.row, selectedCell.col, value as CellValue)
      setBoard(next)
      if (!isValidPlacement(next, selectedCell.row, selectedCell.col, value)) {
        setStatus('该位置有冲突，请调整')
      } else if (isBoardComplete(next)) {
        setStatus('恭喜，你完成了这个数独！')
      } else {
        setStatus('')
      }
    }
  }

  const handleReset = () => {
    setBoard(createInitialBoard())
    setSelectedCell(null)
    setStatus('')
    setAiHint('')
    setAiError('')
  }

  const handleAiHint = async () => {
    try {
      setAiLoading(true)
      setAiError('')
      setStatus('')

      const hint = await requestSudokuHint(board)

      if (
        hint.row < 0 ||
        hint.row > 8 ||
        hint.col < 0 ||
        hint.col > 8 ||
        hint.value < 1 ||
        hint.value > 9
      ) {
        setAiError('AI 返回的提示超出棋盘范围')
        return
      }

      if (isFixedCell(initialBoard, hint.row, hint.col)) {
        setAiError('AI 提示的位置是题目固定格子，已忽略')
        return
      }

      setSelectedCell({ row: hint.row, col: hint.col })
      const candidates = getCandidates(board, hint.row, hint.col)
      if (candidates.length === 0) {
        setAiHint(`该位置目前无任何合法数字，可尝试选择其他空格或重试 AI`)
        return
      }
      if (!candidates.includes(hint.value)) {
        if (candidates.length === 1) {
          setAiHint(`AI 提示与规则冲突。该格唯一可填为 ${candidates[0]}`)
        } else {
          setAiHint(`AI 提示与规则冲突。该格可选数字：${candidates.join(', ')}`)
        }
        return
      }
      setAiHint(
        hint.explanation ||
          `建议在第 ${hint.row + 1} 行第 ${hint.col + 1} 列填入 ${hint.value}（该格可选：${candidates.join(', ')}）`,
      )
    } catch (error) {
      setAiError(error instanceof Error ? error.message : '调用 AI 提示失败')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="app" onKeyDown={handleKeyDown} tabIndex={0}>
      <h1>数独游戏</h1>
      <p className="subtitle">点击格子后通过键盘输入 1-9 填数，Delete 删除</p>
      <div className="board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((value, colIndex) => {
              const fixed = isFixedCell(initialBoard, rowIndex, colIndex)
              const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex
              const hasConflict =
                value !== null && !isValidPlacement(board, rowIndex, colIndex, value)
              const classNames = [
                'cell',
                fixed ? 'cell-fixed' : 'cell-editable',
                isSelected ? 'cell-selected' : '',
                hasConflict ? 'cell-conflict' : '',
                (colIndex + 1) % 3 === 0 && colIndex !== 8 ? 'cell-border-right' : '',
                (rowIndex + 1) % 3 === 0 && rowIndex !== 8 ? 'cell-border-bottom' : '',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <button
                  key={colIndex}
                  type="button"
                  className={classNames}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {value ?? ''}
                </button>
              )
            })}
          </div>
        ))}
      </div>
      <div className="actions">
        <button type="button" onClick={handleReset}>
          重开这一局
        </button>
        <button type="button" onClick={handleAiHint} disabled={aiLoading}>
          {aiLoading ? 'AI 正在思考...' : 'AI 提示下一步'}
        </button>
      </div>
      {status && <div className="status">{status}</div>}
      {aiHint && <div className="status ai-hint">AI 提示：{aiHint}</div>}
      {aiError && <div className="status ai-error">{aiError}</div>}
    </div>
  )
}

export default App
