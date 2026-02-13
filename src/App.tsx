import { useState, useRef } from "react";
import "./App.css";
import {
  createInitialBoard,
  generateSudoku,
  isBoardComplete,
  isFixedCell,
  isValidPlacement,
  setCell,
  getCandidates,
} from "./sudoku";
import type { Board, CellValue, Difficulty } from "./sudoku";
import { requestSudokuHint } from "./kimiClient";

function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [initialBoard, setInitialBoard] = useState<Board>(() =>
    createInitialBoard("easy")
  );
  const [board, setBoard] = useState<Board>(initialBoard);
  const [notes, setNotes] = useState<Record<string, number[]>>({});
  const [isNoteMode, setIsNoteMode] = useState<boolean>(false);

  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [status, setStatus] = useState<string>("");
  const [aiHint, setAiHint] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startNewGame = (diff: Difficulty) => {
    const newBoard = generateSudoku(diff);
    setInitialBoard(newBoard);
    setBoard(newBoard);
    setNotes({});
    setSelectedCell(null);
    setStatus("");
    setAiHint("");
    setAiError("");
    setDifficulty(diff);
  };

  const handleCellClick = (row: number, col: number) => {
    if (isFixedCell(initialBoard, row, col)) {
      return;
    }
    
    // Focus immediately to trigger keyboard before state update
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    setSelectedCell({ row, col });
    setStatus("");
  };

  const handleNumberInput = (value: number) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    const key = `${row}-${col}`;

    if (isNoteMode) {
      // Note Mode Logic
      if (board[row][col] !== null) return; // Don't add notes if cell is filled

      setNotes((prev) => {
        const currentNotes = prev[key] || [];
        const newNotes = currentNotes.includes(value)
          ? currentNotes.filter((n) => n !== value)
          : [...currentNotes, value].sort((a, b) => a - b);
        
        if (newNotes.length === 0) {
          const next = { ...prev };
          delete next[key];
          return next;
        }
        return { ...prev, [key]: newNotes };
      });
    } else {
      // Normal Mode Logic
      const next = setCell(board, row, col, value as CellValue);
      setBoard(next);

      // Clear notes for this cell when a number is placed
      setNotes((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });

      if (!isValidPlacement(next, row, col, value)) {
        setStatus("该位置有冲突，请调整");
      } else if (isBoardComplete(next)) {
        setStatus("恭喜，你完成了这个数独！");
      } else {
        setStatus("");
      }
    }
  };

  const handleDelete = () => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    
    // If there is a value, clear it
    if (board[row][col] !== null) {
      const next = setCell(board, row, col, null);
      setBoard(next);
      setStatus("");
    } else {
      // If no value, clear notes
      const key = `${row}-${col}`;
      setNotes((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!selectedCell) return;

    if (
      event.key === "Backspace" ||
      event.key === "Delete" ||
      event.key === "0"
    ) {
      handleDelete();
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;
    if (!val) return;

    // Get the last character typed
    const lastChar = val.slice(-1);
    const num = parseInt(lastChar, 10);

    if (!isNaN(num) && num >= 1 && num <= 9) {
      handleNumberInput(num);
    }

    // Always clear the input so we can detect the next change
    event.target.value = "";
  };

  const handleReset = () => {
    setBoard(initialBoard);
    setNotes({});
    setSelectedCell(null);
    setStatus("");
    setAiHint("");
    setAiError("");
  };

  const handleAiHint = async () => {
    try {
      setAiLoading(true);
      setAiError("");
      setStatus("");

      const hint = await requestSudokuHint(board);

      if (
        hint.row < 0 ||
        hint.row > 8 ||
        hint.col < 0 ||
        hint.col > 8 ||
        hint.value < 1 ||
        hint.value > 9
      ) {
        setAiError("AI 返回的提示超出棋盘范围");
        return;
      }

      if (isFixedCell(initialBoard, hint.row, hint.col)) {
        setAiError("AI 提示的位置是题目固定格子，已忽略");
        return;
      }

      setSelectedCell({ row: hint.row, col: hint.col });
      const candidates = getCandidates(board, hint.row, hint.col);
      if (candidates.length === 0) {
        setAiHint(`该位置目前无任何合法数字，可尝试选择其他空格或重试 AI`);
        return;
      }
      if (!candidates.includes(hint.value)) {
        if (candidates.length === 1) {
          setAiHint(`AI 提示与规则冲突。该格唯一可填为 ${candidates[0]}`);
        } else {
          setAiHint(
            `AI 提示与规则冲突。该格可选数字：${candidates.join(", ")}`
          );
        }
        return;
      }
      setAiHint(
        hint.explanation ||
          `建议在第 ${hint.row + 1} 行第 ${hint.col + 1} 列填入 ${
            hint.value
          }（该格可选：${candidates.join(", ")}）`
      );
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "调用 AI 提示失败");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>数独</h1>
        <div className="game-controls">
          <select
            value={difficulty}
            onChange={(e) => startNewGame(e.target.value as Difficulty)}
            className="difficulty-select"
          >
            <option value="easy">简单</option>
            <option value="medium">中等</option>
            <option value="hard">困难</option>
          </select>
          <button
            className="btn-new-game"
            onClick={() => startNewGame(difficulty)}
          >
            新游戏
          </button>
        </div>
      </header>

      <main className="game-area">
        <div className="board-container">
          <div className="board">
            {board.map((row, rowIndex) => (
              <div key={rowIndex} className="board-row">
                {row.map((value, colIndex) => {
                  const fixed = isFixedCell(initialBoard, rowIndex, colIndex);
                  const isSelected =
                    selectedCell?.row === rowIndex &&
                    selectedCell?.col === colIndex;
                  const hasConflict =
                    value !== null &&
                    !isValidPlacement(board, rowIndex, colIndex, value);

                  // Highlight logic: highlight all cells with the same number as selected
                  const selectedValue =
                    selectedCell && board[selectedCell.row][selectedCell.col];
                  const isSameValue =
                    selectedValue && value === selectedValue && value !== null;
                  
                  const cellNotes = notes[`${rowIndex}-${colIndex}`] || [];

                  const classNames = [
                    "cell",
                    fixed ? "cell-fixed" : "cell-editable",
                    isSelected ? "cell-selected" : "",
                    hasConflict ? "cell-conflict" : "",
                    isSameValue && !isSelected ? "cell-highlight" : "",
                    (colIndex + 1) % 3 === 0 && colIndex !== 8
                      ? "border-right-thick"
                      : "",
                    (rowIndex + 1) % 3 === 0 && rowIndex !== 8
                      ? "border-bottom-thick"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <div
                      key={colIndex}
                      className={classNames}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                    >
                      {value !== null ? (
                        <span>{value}</span>
                      ) : (
                        <div className="notes-grid">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                            <div key={n} className="note-item">
                              {cellNotes.includes(n) ? n : ""}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="controls-area">
          <div className="status-area">
            {status && <div className="status-message">{status}</div>}
            {aiHint && (
              <div className="status-message ai-hint-msg">💡 {aiHint}</div>
            )}
            {aiError && (
              <div className="status-message ai-error-msg">⚠️ {aiError}</div>
            )}
          </div>

          <div className="action-buttons">
            <button
              className={`btn-secondary ${isNoteMode ? "active-mode" : ""}`}
              type="button"
              onClick={() => setIsNoteMode(!isNoteMode)}
            >
              {isNoteMode ? "📝 笔记模式: 开" : "📝 笔记模式: 关"}
            </button>
            <button
              className="btn-secondary"
              type="button"
              onClick={handleReset}
            >
              重置
            </button>
            <button
              className="btn-primary"
              type="button"
              onClick={handleAiHint}
              disabled={aiLoading}
            >
              {aiLoading ? "思考中..." : "AI 提示"}
            </button>
          </div>
        </div>

        
        {/* Hidden input to trigger mobile keyboard */}
        <input
          ref={inputRef}
          className="hidden-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          value=""
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onBlur={() => {
            // Optional: Deselect cell on blur?
            // For now, let's keep it selected visually even if keyboard closes
          }}
        />
      </main>
    </div>
  );
}

export default App;
