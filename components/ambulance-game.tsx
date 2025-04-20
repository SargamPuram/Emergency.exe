"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Ambulance, Building2, Cone, RotateCcw, Play, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Cell types
enum CellType {
  EMPTY = 0,
  START = 1,
  GOAL = 2,
  OBSTACLE = 3,
  PATH = 4,
}

// Cell colors
const CELL_COLORS = {
  [CellType.EMPTY]: "bg-white",
  [CellType.START]: "bg-green-500",
  [CellType.GOAL]: "bg-blue-500",
  [CellType.OBSTACLE]: "bg-yellow-500",
  [CellType.PATH]: "bg-red-200",
}

// Cell icons
const CELL_ICONS = {
  [CellType.START]: <Ambulance className="w-6 h-6 text-white" />,
  [CellType.GOAL]: <Building2 className="w-6 h-6 text-white" />,
  [CellType.OBSTACLE]: <Cone className="w-6 h-6 text-white" />,
}

// Tool types
enum ToolType {
  START = 1,
  GOAL = 2,
  OBSTACLE = 3,
  ERASER = 4,
}

// A* algorithm node
interface Node {
  x: number
  y: number
  g: number // Cost from start to current node
  h: number // Heuristic (estimated cost from current to goal)
  f: number // Total cost (g + h)
  parent: Node | null
}

export default function AmbulanceGame() {
  const GRID_SIZE = 10
  const [grid, setGrid] = useState<CellType[][]>([])
  const [selectedTool, setSelectedTool] = useState<ToolType>(ToolType.START)
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [goalPos, setGoalPos] = useState<{ x: number; y: number } | null>(null)
  const [path, setPath] = useState<{ x: number; y: number }[]>([])
  const [ambulancePos, setAmbulancePos] = useState<{ x: number; y: number } | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [pathIndex, setPathIndex] = useState(0)
  // Add a new state for tracking when no path is found
  const [noPathFound, setNoPathFound] = useState(false)

  // Initialize grid
  useEffect(() => {
    initializeGrid()
  }, [])

  const initializeGrid = () => {
    const newGrid = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(CellType.EMPTY))
    setGrid(newGrid)
    setStartPos(null)
    setGoalPos(null)
    setPath([])
    setAmbulancePos(null)
    setIsAnimating(false)
    setPathIndex(0)
  }

  // Handle cell click
  const handleCellClick = (x: number, y: number) => {
    if (isAnimating) return

    // Reset the no path found state when grid changes
    setNoPathFound(false)

    const newGrid = [...grid.map((row) => [...row])]

    // Handle eraser
    if (selectedTool === ToolType.ERASER) {
      if (newGrid[y][x] === CellType.START) {
        setStartPos(null)
      } else if (newGrid[y][x] === CellType.GOAL) {
        setGoalPos(null)
      }
      newGrid[y][x] = CellType.EMPTY
      setGrid(newGrid)
      return
    }

    // Handle other tools
    switch (selectedTool) {
      case ToolType.START:
        // Remove previous start position
        if (startPos) {
          newGrid[startPos.y][startPos.x] = CellType.EMPTY
        }
        newGrid[y][x] = CellType.START
        setStartPos({ x, y })
        break
      case ToolType.GOAL:
        // Remove previous goal position
        if (goalPos) {
          newGrid[goalPos.y][goalPos.x] = CellType.EMPTY
        }
        newGrid[y][x] = CellType.GOAL
        setGoalPos({ x, y })
        break
      case ToolType.OBSTACLE:
        // Don't place obstacle on start or goal
        if ((startPos && startPos.x === x && startPos.y === y) || (goalPos && goalPos.x === x && goalPos.y === y)) {
          return
        }
        newGrid[y][x] = CellType.OBSTACLE
        break
    }

    setGrid(newGrid)
    // Clear path when grid changes
    setPath([])
  }

  // Calculate heuristic (Manhattan distance)
  const calculateHeuristic = (x: number, y: number, goalX: number, goalY: number): number => {
    return Math.abs(x - goalX) + Math.abs(y - goalY)
  }

  // A* pathfinding algorithm
  const findPath = useCallback(() => {
    if (!startPos || !goalPos) return []

    const openSet: Node[] = []
    const closedSet: boolean[][] = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(false))

    // Create start node
    const startNode: Node = {
      x: startPos.x,
      y: startPos.y,
      g: 0,
      h: calculateHeuristic(startPos.x, startPos.y, goalPos.x, goalPos.y),
      f: 0,
      parent: null,
    }
    startNode.f = startNode.g + startNode.h
    openSet.push(startNode)

    // Directions: up, right, down, left
    const dx = [0, 1, 0, -1]
    const dy = [-1, 0, 1, 0]

    while (openSet.length > 0) {
      // Find node with lowest f score
      let lowestIndex = 0
      for (let i = 0; i < openSet.length; i++) {
        if (openSet[i].f < openSet[lowestIndex].f) {
          lowestIndex = i
        }
      }

      const current = openSet[lowestIndex]

      // Check if reached goal
      if (current.x === goalPos.x && current.y === goalPos.y) {
        const path: { x: number; y: number }[] = []
        let temp: Node | null = current
        while (temp) {
          path.push({ x: temp.x, y: temp.y })
          temp = temp.parent
        }
        return path.reverse()
      }

      // Remove current from openSet and add to closedSet
      openSet.splice(lowestIndex, 1)
      closedSet[current.y][current.x] = true

      // Check neighbors
      for (let i = 0; i < 4; i++) {
        const nx = current.x + dx[i]
        const ny = current.y + dy[i]

        // Check if valid position
        if (
          nx < 0 ||
          nx >= GRID_SIZE ||
          ny < 0 ||
          ny >= GRID_SIZE ||
          closedSet[ny][nx] ||
          grid[ny][nx] === CellType.OBSTACLE
        ) {
          continue
        }

        const g = current.g + 1
        const h = calculateHeuristic(nx, ny, goalPos.x, goalPos.y)
        const f = g + h

        // Check if already in openSet with better path
        let inOpenSet = false
        for (let j = 0; j < openSet.length; j++) {
          if (openSet[j].x === nx && openSet[j].y === ny) {
            inOpenSet = true
            if (g < openSet[j].g) {
              openSet[j].g = g
              openSet[j].f = f
              openSet[j].parent = current
            }
            break
          }
        }

        // Add to openSet if not already there
        if (!inOpenSet) {
          const neighbor: Node = {
            x: nx,
            y: ny,
            g,
            h,
            f,
            parent: current,
          }
          openSet.push(neighbor)
        }
      }
    }

    // No path found
    return []
  }, [grid, startPos, goalPos])

  // Update the startSimulation function to handle the no path case
  const startSimulation = () => {
    if (!startPos || !goalPos || isAnimating) return

    const newPath = findPath()
    setNoPathFound(newPath.length === 0)

    if (newPath.length === 0) return

    setPath(newPath)
    setAmbulancePos(startPos)
    setPathIndex(0)
    setIsAnimating(true)
  }

  // Animate ambulance movement
  useEffect(() => {
    if (!isAnimating || !path.length) return

    const timer = setTimeout(() => {
      if (pathIndex < path.length - 1) {
        setPathIndex(pathIndex + 1)
        setAmbulancePos(path[pathIndex + 1])
      } else {
        setIsAnimating(false)
      }
    }, 500) // Animation speed

    return () => clearTimeout(timer)
  }, [isAnimating, pathIndex, path])

  // Add a reset for noPathFound in clearObstacles
  const clearObstacles = () => {
    if (isAnimating) return

    setNoPathFound(false)

    const newGrid = [...grid.map((row) => [...row])]
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (newGrid[y][x] === CellType.OBSTACLE) {
          newGrid[y][x] = CellType.EMPTY
        }
      }
    }
    setGrid(newGrid)
    setPath([])
  }

  // Add a reset for noPathFound in resetGame
  const resetGame = () => {
    if (isAnimating) return
    setNoPathFound(false)
    initializeGrid()
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 flex space-x-4">
        <Button
          onClick={() => setSelectedTool(ToolType.START)}
          variant={selectedTool === ToolType.START ? "default" : "outline"}
          className={cn(
            "flex items-center gap-2",
            selectedTool === ToolType.START && "bg-green-500 hover:bg-green-600",
          )}
        >
          <Ambulance className="w-4 h-4" />
          Ambulance
        </Button>
        <Button
          onClick={() => setSelectedTool(ToolType.GOAL)}
          variant={selectedTool === ToolType.GOAL ? "default" : "outline"}
          className={cn("flex items-center gap-2", selectedTool === ToolType.GOAL && "bg-blue-500 hover:bg-blue-600")}
        >
          <Building2 className="w-4 h-4" />
          Hospital
        </Button>
        <Button
          onClick={() => setSelectedTool(ToolType.OBSTACLE)}
          variant={selectedTool === ToolType.OBSTACLE ? "default" : "outline"}
          className={cn(
            "flex items-center gap-2",
            selectedTool === ToolType.OBSTACLE && "bg-yellow-500 hover:bg-yellow-600",
          )}
        >
          <Cone className="w-4 h-4" />
          Obstacle
        </Button>
        <Button
          onClick={() => setSelectedTool(ToolType.ERASER)}
          variant={selectedTool === ToolType.ERASER ? "default" : "outline"}
          className={cn("flex items-center gap-2", selectedTool === ToolType.ERASER && "bg-red-500 hover:bg-red-600")}
        >
          <Trash2 className="w-4 h-4" />
          Eraser
        </Button>
      </div>

      <div className="mb-6 flex space-x-4">
        <Button
          onClick={startSimulation}
          disabled={!startPos || !goalPos || isAnimating}
          className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          Start Simulation
        </Button>
        <Button onClick={clearObstacles} disabled={isAnimating} variant="outline" className="flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          Clear Obstacles
        </Button>
        <Button onClick={resetGame} disabled={isAnimating} variant="outline" className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          Reset Game
        </Button>
      </div>

      <div className="grid grid-cols-10 gap-1 p-2 bg-gray-200 rounded-lg shadow-lg">
        {grid.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              onClick={() => handleCellClick(x, y)}
              className={cn(
                "w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-200 rounded-md shadow-sm border border-gray-300",
                CELL_COLORS[cell],
                // Highlight path cells
                path.some((p) => p.x === x && p.y === y) &&
                  cell !== CellType.START &&
                  cell !== CellType.GOAL &&
                  "bg-red-200",
              )}
            >
              {/* Show ambulance at current position during animation */}
              {ambulancePos && ambulancePos.x === x && ambulancePos.y === y && (
                <div className="absolute">
                  <Ambulance className="w-8 h-8 text-red-600 animate-pulse" />
                </div>
              )}

              {/* Show cell icons */}
              {CELL_ICONS[cell]}
            </div>
          )),
        )}
      </div>
      {noPathFound && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>No path found! The hospital is completely blocked by obstacles. Try removing some obstacles.</span>
        </div>
      )}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg max-w-2xl">
        <h2 className="text-xl font-bold mb-2 text-blue-800">How to Play</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Select the <strong>Ambulance</strong> tool and place it on the grid.
          </li>
          <li>
            Select the <strong>Hospital</strong> tool and place it on the grid.
          </li>
          <li>
            Select the <strong>Obstacle</strong> tool and place obstacles on the grid.
          </li>
          <li>
            Click <strong>Start Simulation</strong> to watch the ambulance find the shortest path!
          </li>
        </ol>
        <p className="mt-4 text-sm text-gray-600">
          The A* algorithm calculates the optimal path by considering both the distance from the start and the estimated
          distance to the goal.
        </p>
      </div>
    </div>
  )
}
