// lib/algorithms/kmp.ts

import type { AlgorithmDefinition } from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

export const kmp: AlgorithmDefinition = {
  id: "kmp",
  name: "KMP String Search",
  category: "Strings",
  structure: "string",
  summary: "Knuth-Morris-Pratt: pattern slides along text using LPS (longest proper prefix suffix) table for fallbacks.",
  pseudocode: [
    { line: 1, text: "build lps[] array from pattern" },
    { line: 2, text: "i ← 0; j ← 0" },
    { line: 3, text: "while i < n:" },
    { line: 4, text: "  if P[j] == T[i]: i++; j++" },
    { line: 5, text: "    if j == m: match at i-j; j ← lps[j-1]" },
    { line: 6, text: "  elif i < n and P[j] != T[i]:" },
    { line: 7, text: "    if j != 0: j ← lps[j-1]" },
    { line: 8, text: "    else: i++" },
  ],
  configFields: [
    { key: "text", label: "Text", kind: "text", default: "ABABDABACDABABCABAB" },
    { key: "pattern", label: "Pattern", kind: "text", default: "ABABCABAB" },
  ],
  run(cfg) {
    const T = String(cfg.text || "ABABDABACDABABCABAB");
    const P = String(cfg.pattern || "ABABCABAB");
    const n = T.length;
    const m = P.length;

    const initText = T.split("").map((c, i) => ({ id: `t-${i}`, char: c, index: i }));
    const initPattern = P.split("").map((c, i) => ({ id: `p-${i}`, char: c, index: i }));
    const rec = createRecorder({
      index: 0,
      title: "Init",
      currentLine: 1,
      stringText: initText,
      stringPattern: initPattern,
      stringTextIndex: 0,
      stringPatternIndex: 0,
      variables: [
        { name: "i", value: 0, kind: "number" },
        { name: "j", value: 0, kind: "number" },
      ],
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });

    // Build LPS
    const lps: number[] = Array(m).fill(0);
    let len = 0;
    let i = 1;
    while (i < m) {
      if (P[i] === P[len]) {
        len++;
        lps[i] = len;
        i++;
      } else if (len !== 0) {
        len = lps[len - 1];
      } else {
        lps[i] = 0;
        i++;
      }
    }
    pushStep(rec, {
      title: "LPS built",
      currentLine: 1,
      stringText: T.split("").map((c, k) => ({ id: `t-${k}`, char: c, index: k })),
      stringPattern: P.split("").map((c, k, idx) => ({
          id: `p-${k}`,
          char: c,
          index: k,
          highlight: lps[k] > 0 ? ("sorted" as const) : undefined,
        })),
      variables: [{ name: "lps", value: `[${lps.join(", ")}]`, kind: "pointer" }],
      comparisons: m,
      swaps: 0,
      writes: 0,
    });

    i = 0;
    let j = 0;
    let cmp = 0;
    while (i < n) {
      const match = P[j] === T[i];
      cmp++;
      pushStep(rec, {
        title: match
          ? `match P[${j}]="${P[j]}" == T[${i}]="${T[i]}"`
          : `mismatch P[${j}]="${P[j]}" vs T[${i}]="${T[i]}"`,
        currentLine: 4,
        stringText: T.split("").map((c, k) => ({
          id: `t-${k}`,
          char: c,
          index: k,
          highlight: k === i ? (match ? "sorted" : "compare") : undefined,
        })),
        stringPattern: P.split("").map((c, k) => ({
          id: `p-${k}`,
          char: c,
          index: k,
          highlight: k === j ? "pointer" : undefined,
        })),
        stringTextIndex: i,
        stringPatternIndex: j,
        variables: [
          { name: "i", value: i, kind: "number" },
          { name: "j", value: j, kind: "number" },
        ],
        comparisons: cmp,
        swaps: 0,
        writes: 0,
      });
      if (match) {
        i++;
        j++;
        if (j === m) {
          pushStep(rec, {
            title: `Match found ending at index ${i - 1}`,
            currentLine: 5,
            stringText: T.split("").map((c, k) => ({
              id: `t-${k}`,
              char: c,
              index: k,
              highlight: k >= i - m && k < i ? "sorted" : undefined,
            })),
            stringPattern: P.split("").map((c, k) => ({ id: `p-${k}`, char: c, index: k })),
            stringTextIndex: i - m,
            variables: [
              { name: "match at", value: i - m, kind: "pointer", highlight: true },
            ],
            comparisons: cmp,
            swaps: 0,
            writes: 0,
          });
          j = lps[j - 1];
        }
      } else if (j !== 0) {
        j = lps[j - 1];
      } else {
        i++;
      }
    }
    pushStep(rec, {
      title: "Done ✓",
      currentLine: 8,
      stringText: T.split("").map((c, k) => ({ id: `t-${k}`, char: c, index: k })),
      stringPattern: P.split("").map((c, k) => ({ id: `p-${k}`, char: c, index: k })),
      variables: [{ name: "i", value: i, kind: "number" }],
      comparisons: cmp,
      swaps: 0,
      writes: 0,
    });
    return rec.steps;
  },
};