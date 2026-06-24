// lib/algorithms/bpeTokenization.ts

import type {
  AlgorithmDefinition,
  ArrayCell,
  HistoryStep,
  VariableFrame,
  SemanticToken,
} from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

export const bpeTokenization: AlgorithmDefinition = {
  id: "bpe-tokenization",
  name: "LLM Tokenization (Byte-Pair Encoding)",
  category: "Machine Learning",
  structure: "array",
  summary:
    "Simulates BPE tokenization (e.g. GPT). Iteratively finds and merges the most frequent adjacent token pair to build a vocabulary.",
  pseudocode: [
    { line: 1, text: "Initialize sequence: split text into character tokens" },
    { line: 2, text: "Repeat until no pair frequency > 1:" },
    { line: 3, text: "  Count frequencies of all adjacent token pairs" },
    { line: 4, text: "  Find the most frequent adjacent pair (t1, t2)" },
    { line: 5, text: "  Merge all occurrences of (t1, t2) into a single token" },
    { line: 6, text: "Output final tokenized sequence" },
  ],
  configFields: [
    {
      key: "text",
      label: "Input Text (max 15 chars)",
      kind: "text",
      default: "abababc",
    },
  ],
  run(cfg) {
    const rawText = String(cfg.text || "abababc").slice(0, 15).trim();

    // Initial state: array of single characters
    let tokens = rawText.split("");

    const makeCells = (tokenList: string[]): ArrayCell[] => {
      return tokenList.map((t, idx) => ({
        id: `bpe-cell-${idx}-${t}`,
        value: t,
      }));
    };

    const makeVars = (
      stepTitle: string,
      pairCounts: { pair: string; freq: number }[] = [],
      mergedPair?: string,
    ): VariableFrame[] => {
      const list: VariableFrame[] = [
        { name: "Original Text", value: rawText, kind: "string" },
        { name: "Vocabulary Size", value: new Set(tokens).size, kind: "number" },
        { name: "Action State", value: stepTitle, kind: "state", highlight: true },
      ];

      if (mergedPair) {
        list.push({ name: "Merging Pair", value: `"${mergedPair}"`, kind: "state", highlight: true });
      }

      if (pairCounts.length > 0) {
        list.push({ name: "Pair Frequencies", value: "----------------", kind: "state" });
        pairCounts.slice(0, 5).forEach((p, idx) => {
          list.push({
            name: `Pair "${p.pair}"`,
            value: `Freq: ${p.freq}`,
            kind: "number",
            highlight: idx === 0,
          });
        });
      }

      return list;
    };

    const rec = createRecorder({
      index: 0,
      title: "Initialize Character Tokens",
      description: `Input text "${rawText}" is split into individual character tokens.`,
      currentLine: 1,
      arrayCells: makeCells(tokens),
      arrayHighlights: {},
      variables: makeVars("Initialized Sequence"),
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });

    const snap = (
      tokenList: string[],
      hi: Record<string, SemanticToken>,
      title: string,
      line: number,
      actionText: string,
      desc: string,
      pairCounts: { pair: string; freq: number }[] = [],
      mergedPair?: string,
    ) => {
      pushStep(rec, {
        title,
        description: desc,
        currentLine: line,
        arrayCells: makeCells(tokenList),
        arrayHighlights: hi,
        variables: makeVars(actionText, pairCounts, mergedPair),
        comparisons: rec.comparisons,
        swaps: rec.swaps,
        writes: rec.writes,
      });
    };

    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      if (tokens.length < 2) break;

      // 1. Count frequencies of adjacent pairs
      const pairFreqs: Record<string, number> = {};
      for (let i = 0; i < tokens.length - 1; i++) {
        const pair = `${tokens[i]} ${tokens[i + 1]}`;
        pairFreqs[pair] = (pairFreqs[pair] || 0) + 1;
        rec.comparisons++;
      }

      const sortedPairs = Object.entries(pairFreqs)
        .map(([pair, freq]) => ({ pair, freq }))
        .sort((a, b) => b.freq - a.freq);

      if (sortedPairs.length === 0 || sortedPairs[0].freq <= 1) {
        // No pairs occur more than once, BPE ends
        break;
      }

      const topPair = sortedPairs[0];
      const [t1, t2] = topPair.pair.split(" ");
      const mergedText = t1 + t2;

      // 2. Highlight the occurrences of the top pair
      const matchHl: Record<string, SemanticToken> = {};
      for (let i = 0; i < tokens.length - 1; i++) {
        if (tokens[i] === t1 && tokens[i + 1] === t2) {
          matchHl[`bpe-cell-${i}-${tokens[i]}`] = "compare";
          matchHl[`bpe-cell-${i + 1}-${tokens[i + 1]}`] = "compare";
        }
      }

      snap(
        tokens,
        matchHl,
        `Iteration ${iterations + 1}: Find Pairs`,
        3,
        `Counting adjacent pairs`,
        `Identified "${topPair.pair}" as the most frequent adjacent pair (occurs ${topPair.freq} times).`,
        sortedPairs,
      );

      // 3. Merge the occurrences
      const nextTokens: string[] = [];
      const mergeHl: Record<string, SemanticToken> = {};
      let i = 0;
      let writeIdx = 0;

      while (i < tokens.length) {
        if (i < tokens.length - 1 && tokens[i] === t1 && tokens[i + 1] === t2) {
          nextTokens.push(mergedText);
          mergeHl[`bpe-cell-${writeIdx}-${mergedText}`] = "mutate";
          i += 2;
          rec.writes++;
        } else {
          nextTokens.push(tokens[i]);
          i++;
        }
        writeIdx++;
      }

      snap(
        nextTokens,
        mergeHl,
        `Iteration ${iterations + 1}: Merge Pair`,
        5,
        `Merge "${t1}" + "${t2}" → "${mergedText}"`,
        `Merged all occurrences of adjacent tokens "${t1}" and "${t2}" into a new token "${mergedText}".`,
        sortedPairs,
        mergedText,
      );

      tokens = nextTokens;
      iterations++;
    }

    // Finished
    const finalHl: Record<string, SemanticToken> = {};
    tokens.forEach((t, idx) => {
      finalHl[`bpe-cell-${idx}-${t}`] = "sorted";
    });

    pushStep(rec, {
      title: "BPE Tokenization Complete ✓",
      description: `BPE completed after ${iterations} merges. Sequence tokenized into ${tokens.length} tokens: [${tokens.map(t => `"${t}"`).join(", ")}].`,
      currentLine: 6,
      arrayCells: makeCells(tokens),
      arrayHighlights: finalHl,
      variables: makeVars("Tokenization Complete"),
      comparisons: rec.comparisons,
      swaps: 0,
      writes: rec.writes,
    });

    return rec.steps;
  },
};
