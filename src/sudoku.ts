export type CellValue = number | null

export type Board = CellValue[][]

const puzzle: number[][] = [
  [0, 0, 0, 2, 6, 0, 7, 0, 1],
  [6, 8, 0, 0, 7, 0, 0, 9, 0],
  [1, 9, 0, 0, 0, 4, 5, 0, 0],
  [8, 2, 0, 1, 0, 0, 0, 4, 0],
  [0, 0, 4, 6, 0, 2, 9, 0, 0],
  [0, 5, 0, 0, 0, 3, 0, 2, 8],
  [0, 0, 9, 3, 0, 0, 0, 7, 4],
  [0, 4, 0, 0, 5, 0, 0, 3, 6],
  [7, 0, 3, 0, 1, 8, 0, 0, 0],
]

export function createInitialBoard(): Board {
  return puzzle.map(row => row.map(value => (value === 0 ? null : value)))
}

export function isFixedCell(initialBoard: Board, row: number, col: number): boolean {
  return initialBoard[row][col] !== null
}

export function setCell(board: Board, row: number, col: number, value: CellValue): Board {
  return board.map((r, rIndex) =>
    r.map((c, cIndex) => {
      if (rIndex === row && cIndex === col) {
        return value
      }
      return c
    }),
  )
}

export function isValidPlacement(board: Board, row: number, col: number, value: number): boolean {
  for (let c = 0; c < 9; c += 1) {
    if (c !== col && board[row][c] === value) {
      return false
    }
  }

  for (let r = 0; r < 9; r += 1) {
    if (r !== row && board[r][col] === value) {
      return false
    }
  }

  const boxRowStart = Math.floor(row / 3) * 3
  const boxColStart = Math.floor(col / 3) * 3

  for (let r = boxRowStart; r < boxRowStart + 3; r += 1) {
    for (let c = boxColStart; c < boxColStart + 3; c += 1) {
      if ((r !== row || c !== col) && board[r][c] === value) {
        return false
      }
    }
  }

  return true
}

export function isBoardComplete(board: Board): boolean {
  for (let r = 0; r < 9; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      const value = board[r][c]
      if (value === null || !isValidPlacement(board, r, c, value)) {
        return false
      }
    }
  }
  return true
}

export function getCandidates(board: Board, row: number, col: number): number[] {
  if (board[row][col] !== null) {
    return []
  }
  const result: number[] = []
  for (let v = 1; v <= 9; v += 1) {
    if (isValidPlacement(board, row, col, v)) {
      result.push(v)
    }
  }
  return result
}
