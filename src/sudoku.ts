export type CellValue = number | null

export type Board = CellValue[][]

export type Difficulty = 'easy' | 'medium' | 'hard'

const BLANK: CellValue = null

function getEmptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array(9).fill(BLANK))
}

function shuffle<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

function solve(board: Board): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === BLANK) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
        for (const num of nums) {
          if (isValidPlacement(board, row, col, num)) {
            board[row][col] = num
            if (solve(board)) return true
            board[row][col] = BLANK
          }
        }
        return false
      }
    }
  }
  return true
}

export function generateSudoku(difficulty: Difficulty = 'easy'): Board {
  // 1. Start with an empty board
  const board = getEmptyBoard()
  
  // 2. Fill it completely
  solve(board)
  
  // 3. Remove numbers based on difficulty
  // Clues count: Easy ~36-45, Medium ~30-35, Hard ~24-29
  let cluesCount: number
  switch (difficulty) {
    case 'easy':
      cluesCount = 40
      break
    case 'medium':
      cluesCount = 32
      break
    case 'hard':
      cluesCount = 25
      break
  }
  
  let attempts = 81 - cluesCount
  while (attempts > 0) {
    const row = Math.floor(Math.random() * 9)
    const col = Math.floor(Math.random() * 9)
    
    if (board[row][col] !== BLANK) {
      board[row][col] = BLANK
      attempts--
      // Note: Ideally we should check for unique solution here, 
      // but for MVP we skip it to ensure performance.
    }
  }
  
  return board
}

export function createInitialBoard(difficulty: Difficulty = 'easy'): Board {
  return generateSudoku(difficulty)
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
