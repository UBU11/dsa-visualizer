Here is the complete, high-fidelity `agent.md` file designed to serve as a strict specification for your AI agent. It avoids generic, low-effort dashboard clichés and mandates a clean, hyper-functional interactive tool.

```markdown
# Specification & Design System: Modern DSA Visualizer

## 1. Core Philosophy: Functional Minimalism
This product is a highly functional educational workspace, not a flashy marketing landing page. Avoid generic AI dashboard clichés: no neon purple glowing drop shadows, no arbitrary glassmorphism grids, and no decorative micro-animations that delay user interactions. 

### Core Rules
* **UI Invisibility:** The user interface layout must retreat into the background, ensuring maximum visual focus on the canvas area displaying the data structures.
* **Color as Code:** Color must never be used purely for decoration. Every hue variation must carry strict semantic meaning representing a data structure state or a step in execution.
* **Spatial Continuity:** When elements swap positions, mutate, or shift addresses, the user must physically see them slide, scale, or transform dynamically. No abrupt blinking out of existence.

---

## 2. Layout & Workspace Architecture
Implement a strict, full-window layout fixed to the boundaries of the viewport screen (`100vh`/`100vw`) to eliminate chaotic body scroll behaviors.


```

+-----------------------------------------------------------------------+
|  Global Top Bar: Algorithm Selector, Global Controls, Meta Status     |
+-----------------------------------------------------------------------+
|                 |                                      |              |
|                 |                                      |  Code Trace  |
|  Structure      |          Interactive Canvas          |  & State     |
|  Configuration  |          (Viewport Focused)          |  Inspector   |
|  Sidebar        |                                      |              |
|                 |                                      |              |
+-----------------------------------------------------------------------+
|  Playback Timeline: Step-by-Step Control, Speed Slider, Event Logs   |
+-----------------------------------------------------------------------+

```

* **Global Top Bar:** Height fixed at `3rem` (`h-12`). Houses the structural categorization dropdown and global resets.
* **Left Panel (Configuration Sidebar):** Width fixed at `16rem` (`w-64`). Contains controls for data generation parameters (e.g., array size, random vs. inverted sorting constraints, custom edge inserts).
* **Center Panel (Interactive Canvas):** Flex-grow region allocating the majority of the screen space. Uses a dark neutral background, optional toggleable faint dot-grid overlay (`bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]`).
* **Right Panel (Code Trace & State Inspector):** Width fixed at `20rem` (`w-80`). Displays line-by-line execution syntax using a fixed-width code container stack next to an evaluation tracker demonstrating current variable assignments (e.g., `i`, `j`, `low`, `high`, `pivot`).
* **Bottom Panel (Playback Timeline):** Discrete controls containing: Play/Pause, Step Backward, Step Forward, and a linear timeline scrubber tracking the complete execution scope.

---

## 3. Typography & Grids
Enforce highly structured text treatments to ensure index parameters and tracking pointers match code execution layouts effortlessly.

* **Primary Sans-Serif:** Inter or Geist Sans for standard control text, descriptions, and structural labels.
* **Monospace Variant:** JetBrains Mono or Geist Mono applied to values inside data boxes, array index indicators, execution variable pointers, and line text stacks.
* **Scale Constraints:**
  * UI Buttons/Controls: `text-xs font-medium tracking-tight`
  * Node/Data Labels: `text-sm font-semibold tracking-normal`
  * Headings/Titles: `text-base font-semibold tracking-tight`
* **Grid Controls:** Use Tailwind absolute placement alignments with strict 4px grid steps (`gap-1`, `gap-2`, `gap-4`). Avoid loose, arbitrary whitespace padding.

---

## 4. Color System Design Tokens
Implement a refined, industrial color strategy using dark zinc frames mixed with crisp, high-contrast structural accents.

### Foundation Archetypes
* **Canvas Surface:** Zinc-950 (`#09090b`)
* **Sidebar/Panel Frames:** Zinc-900 (`#18181b`)
* **Borders/Dividers:** Zinc-800 (`#27272a`)
* **Standard Text:** Zinc-100 (`#f4f4f5`)
* **Secondary Labels:** Zinc-400 (`#a1a1aa`)

### Semantic Execution Tokens
Color variations inside the canvas component view are reserved exclusively for execution tracing updates:
* **Default State Component:** Zinc-800 background, Slate-200 border. Standard element untouched by algorithm.
* **Active Pointer / Compare State:** Amber-500 background, Amber-200 text. Indicates index read execution.
* **Mutation State (Swapping/Writing):** Rose-600 background, White text. Highlights memory overwrite locations.
* **Evaluated / Sorted Elements:** Emerald-600 background, Emerald-100 text. Represents fully locked arrays or valid node positions.
* **Secondary Pointers (e.g., Pivot, Target Search Value):** Indigo-600 background. Dedicated marker highlight.

---

## 5. Animation & Motion Choreography (Framer Motion Specs)
Do not use standard layout fade configurations during code cycles. State changes must happen via physical, directional motion constraints.

### Layout Continuity Rules
* Use Framer Motion’s `<motion.div layoutId="..." />` to manage element swaps automatically (e.g., sorting array transformations). Ensure matching `layoutId` tags follow array element unique values to prevent broken cross-fading glitches.
* **Transition Settings:** Avoid using elastic bouncy physics spring defaults for sorting metrics. Use crisp structural spring models instead:
  ```javascript
  transition={{ type: "spring", stiffness: 300, damping: 30 }}

```

* **Pointer Interpolation:** When displaying a memory pointer target (such as array markers `i` or `j`), render it as an absolute marker position sliding smoothly along an X/Y grid track using layout movement updates rather than destruction/recreation rendering steps.

### Node/Edge Mutation Guidelines (Trees & Graphs)

* **Node Insertion:** Animate opacity scaling outward from the structural center coordinates (`scale: [0, 1]`) instead of dropping vertically from above.
* **Edge/Link Generation:** Render vector SVG connection lines via an unrolling stroke animation:
```javascript
initial={{ pathLength: 0 }}
animate={{ pathLength: 1 }}
transition={{ duration: 0.25, ease: "easeInOut" }}

```



---

## 6. Implementation Directives for the AI Agent

When constructing Next.js application routes and React layout workflows, fulfill the following runtime infrastructure parameters:

1. **Decouple Visual States from Computation:** Do not calculate the steps dynamically inside the visualization loops. Compute the algorithm lifecycle ahead of time inside a standard execution engine utility, saving each intermediate state mutation layout directly into a serialized array frame step log:
```typescript
interface HistoryStep {
  arrayState: number[];
  activeIndices: number[];
  comparingIndices: number[];
  mutatedIndices: number[];
  variables: Record<string, any>;
  currentLine: number;
}

```


2. **Synchronized Playback Index Control:** Ensure your canvas layouts, component changes, code highlights, and state tracking displays update simultaneously inside a unified centralized execution index tracker (`currentStepIndex`).
3. **Optimized Structural Execution:** Set fixed node sizes and enable CSS transform layer rendering via hardware-accelerated Tailwind parameters (`transform-gpu`) to prevent browser frame-drops when processing high array element allocations.
4. **Isolated Canvas Scale:** Enforce strict canvas container setups using absolute hidden boundaries (`overflow-hidden`) to ensure that dynamic layout transformations stay correctly contained away from global system sidebars.

```

```
