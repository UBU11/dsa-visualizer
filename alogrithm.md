# Section Implementation Architecture: Algorithm Catalog & Visual Blueprints

This document outlines the comprehensive catalog of algorithms to implement and defines the exact structural layout, canvas representation, and state metadata requirements for each algorithm category.

---

## 1. Arrays & Sorting (Visual Blueprint: Metric Bars / Value Tracks)
* **Target Algorithms:** Bubble Sort, Selection Sort, Insertion Sort, Merge Sort, Quick Sort, Heap Sort, Radix Sort, Shell Sort.
* **Canvas Blueprint:** A horizontal flex container hosting vertical bars or uniform cards. Height represents the relative numerical value; text overlays denote array indices.
* **State Payload Requirements:**
    ```typescript
    interface SortingState {
      array: number[];          // The current layout of elements
      comparing: number[];      // Indices currently under evaluation (e.g., [i, j])
      swapping: number[];       // Indices undergoing active memory migration
      sorted: number[];         // Indices locked into their final positions
      pivotIndex: number | null;// Specific to Quick Sort tracking
    }
    ```

---

## 2. Searching & Two-Pointer Mechanics (Visual Blueprint: Linear Index Tracks)
* **Target Algorithms:** Linear Search, Binary Search, Ternary Search, Two-Pointer Collisions (e.g., Two Sum, Rainwater Trapping), Sliding Window (e.g., Longest Substring Without Repeating Characters).
* **Canvas Blueprint:** A static horizontal grid array. Pointers (`low`, `mid`, `high`, `left`, `right`) are rendered as distinct geometric anchors positioned absolute directly above or below the targeted index cells, interpolating horizontally along the X-axis.
* **State Payload Requirements:**
    ```typescript
    interface SearchingState {
      array: number[];
      pointers: Record<string, number>; // e.g., { low: 0, mid: 4, high: 9 }
      target: number;
      foundIndex: number | null;
      eliminatedRange: [number, number]; // [start, end] indices grayed out from search space
    }
    ```

---

## 3. Linked Lists (Visual Blueprint: Dynamic Node-Link Chains)
* **Target Algorithms:** Singly Linked List (Insertion, Deletion, Reversal), Doubly Linked List Operations, Circular Linked List Management, Floyd’s Cycle Detection (Hare & Tortoise).
* **Canvas Blueprint:** Absolute-positioned node components containing `Value` and `Next` block properties, linked together via dynamic SVG lines (`<path d="..." />`) with arrowheads (`markerEnd`). When links reverse, the SVG path angles transform smoothly using Framer Motion path updates.
* **State Payload Requirements:**
    ```typescript
    interface LinkedListState {
      nodes: Array<{ id: string; value: any; nextId: string | null; prevId?: string | null }>;
      pointers: Record<string, string | null>; // e.g., { head: "n1", tail: "n4", fast: "n3", slow: "n2" }
      activeDeadLinks: string[]; // IDs of links currently being broken or reassigned
    }
    ```

---

## 4. Stacks & Queues (Visual Blueprint: Monotonic Containers)
* **Target Algorithms:** Stack Operations (Push/Pop), Queue Operations (Enqueue/Dequeue), Circular Queue, Monotonic Stack (Next Greater Element), Sliding Window Maximum.
* **Canvas Blueprint:** Stacks are rendered as a vertically walled container where new blocks drop in from the top (`translateY`). Queues are rendered as horizontal linear tracks where elements enter from the right and exit from the left.
* **State Payload Requirements:**
    ```typescript
    interface LinearStructureState {
      elements: any[];
      topPointer?: number;
      frontPointer?: number;
      rearPointer?: number;
      action: 'push' | 'pop' | 'enqueue' | 'dequeue' | 'idle';
    }
    ```

---

## 5. Trees & Tries (Visual Blueprint: Layered Hierarchical Graphs)
* **Target Algorithms:** Binary Tree Traversals (Inorder, Preorder, Postorder, Level-Order), Binary Search Tree (BST - Insert, Delete, Search), AVL Tree / Red-Black Tree (Rotation Mechanics), Trie (Prefix Tree Auto-Complete), Segment Tree / Fenwick Tree.
* **Canvas Blueprint:** Strict depth-layered coordinate tree grids. Node X coordinates are calculated strictly based on structural midpoints of their child node boundaries to prevent node collisions during insertions or structural rotations.
* **State Payload Requirements:**
    ```typescript
    interface TreeState {
      root: TreeNode | null;
      currentNodeId: string | null;
      visitedNodeIds: string[];
      unbalancedNodeIds: string[]; // For highlighting AVL/RBT violation points
      rotationType: 'LL' | 'RR' | 'LR' | 'RL' | null;
    }
    ```

---

## 6. Graphs & Network Topologies (Visual Blueprint: Forced Force-Directed Layouts)
* **Target Algorithms:** Breadth-First Search (BFS), Depth-First Search (DFS), Dijkstra’s Shortest Path, Bellman-Ford, Floyd-Warshall (Matrix view link), Prim’s & Kruskal’s Minimum Spanning Tree (MST), Topological Sort (Kahn’s Algorithm), Kosaraju's/Tarjan's Strongly Connected Components.
* **Canvas Blueprint:** Full open canvas. Node positions are either pre-calculated using standard circular spatial distributions or absolute grid coordinates. Graph edges are weighted SVGs that dynamically color-shift and thicken when traffic weight parameters change or paths are selected.
* **State Payload Requirements:**
    ```typescript
    interface GraphState {
      nodes: Array<{ id: string; x: number; y: number; distance: number | string }>;
      edges: Array<{ from: string; to: string; weight: number; isMst: boolean; isActive: boolean }>;
      queueOrStack: string[];     // Internal processing tracking visible array
      visited: string[];          // Set of fully evaluated node IDs
      shortestPathEdges: string[]; // Path sequence highlighted upon completion
    }
    ```

---

## 7. Dynamic Programming (Visual Blueprint: Dependency Matrix Grids)
* **Target Algorithms:** Fibonacci (Memoization vs Tabulation pipelines), 0/1 Knapsack Problem, Longest Common Subsequence (LCS), Edit Distance, Coin Change Problem, Matrix Chain Multiplication.
* **Canvas Blueprint:** A 2D grid matrix. Active computation steps highlight the targeted cell `DP[i][j]` in a crisp execution color (e.g., Amber) while flashing secondary arrows pointing backward to the specific historical cells (`DP[i-1][j]` or `DP[i][j-w]`) that computed the target value.
* **State Payload Requirements:**
    ```typescript
    interface DPState {
      matrix: number[][];
      currentCell: [number, number] | null;
      dependentCells: [number, number][]; // Cells used to compute the currentCell value
      stringA_CharIndex?: number;         // For LCS/Edit distance string label tracing
      stringB_CharIndex?: number;
    }
    ```

---

## 8. Backtracking (Visual Blueprint: Grid State / Decision Tree Hybrid)
* **Target Algorithms:** N-Queens Placement, Sudoku Solver, Rat in a Maze / Pathfinding, Knight's Tour.
* **Canvas Blueprint:** Split workspace view. Left pane maps a structural 2D grid configuration showing active placement items. Right pane shows an ongoing, micro-scale recursive decision tree logging valid routes vs dead-end rollbacks.
* **State Payload Requirements:**
    ```typescript
    interface BacktrackingState {
      grid: any[][]; // Board state configuration
      currentCell: [number, number] | null;
      isValidAttempt: boolean;
      backtrackingOccurring: boolean; // Triggers a distinct structural warning transition (e.g., Rose fade)
      decisionTreeDepth: number;
    }
    ```

---

## 9. String Algorithms (Visual Blueprint: Sliding Character Masks)
* **Target Algorithms:** Knuth-Morris-Pratt (KMP - Prefix Function evaluation), Rabin-Karp (Rolling Hash visualization).
* **Canvas Blueprint:** Dual stacked horizontal text blocks. The top track contains the static target string; the lower track represents the pattern mask sliding step-by-step from left to right based on fallback prefix indices.
* **State Payload Requirements:**
    ```typescript
    interface StringMatchState {
      text: string;
      pattern: string;
      textIndex: number;
      patternIndex: number;
      lpsTable: number[];           // For KMP state tracing references
      currentHashes?: { textHash: number; patternHash: number }; // For Rabin-Karp evaluations
    }
    ```

---

## 10. Execution Directive for Agent
1. **Routing:** Build a distinct path hierarchy under `/visualizer/[category]/[algorithm]` mapping directly to these defined workspaces.
2. **Component Isolation:** Ensure data state generators are pure functions separate from UI hooks, returning an immutable array sequence of these type-safe historical states for step playback.
