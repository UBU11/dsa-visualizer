// lib/algorithms/aesSimulation.ts

import type {
  AlgorithmDefinition,
  DPCell,
  HistoryStep,
  VariableFrame,
  SemanticToken,
} from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

const SBOX = [
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
  0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
  0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
  0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
  0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
  0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
  0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
  0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
  0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
  0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
  0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
  0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
  0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
  0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
  0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
  0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
];

// Galois Field multiplication by 2
function gm2(n: number): number {
  let s = n << 1;
  if (n & 0x80) s ^= 0x1b;
  return s & 0xff;
}

// Galois Field multiplication by 3
function gm3(n: number): number {
  return gm2(n) ^ n;
}

const toHex = (n: number) => n.toString(16).toUpperCase().padStart(2, "0");

export const aesSimulation: AlgorithmDefinition = {
  id: "aes-simulation",
  name: "AES-128 Cryptographic Round",
  category: "Cryptography",
  structure: "dp",
  summary:
    "Step-by-step interactive simulation of one round of the Advanced Encryption Standard (AES-128).",
  pseudocode: [
    { line: 1, text: "State ← AddRoundKey(State, RoundKey[0])" },
    { line: 2, text: "State ← SubBytes(State) via S-Box lookup" },
    { line: 3, text: "State ← ShiftRows(State) cyclic row shifts" },
    { line: 4, text: "State ← MixColumns(State) linear transformation in GF(2^8)" },
    { line: 5, text: "State ← AddRoundKey(State, RoundKey[1])" },
  ],
  configFields: [
    {
      key: "plaintext",
      label: "Plaintext (16 chars)",
      kind: "text",
      default: "SECURE_DSA_AES12",
    },
    {
      key: "secretKey",
      label: "Secret Key (16 chars)",
      kind: "text",
      default: "MY_CRYPT_KEY_123",
    },
  ],
  run(cfg) {
    const rawText = String(cfg.plaintext || "SECURE_DSA_AES12").padEnd(16, " ").slice(0, 16);
    const rawKey = String(cfg.secretKey || "MY_CRYPT_KEY_123").padEnd(16, " ").slice(0, 16);

    // Convert string inputs to 4x4 matrix representation (Column-Major Order)
    const state: number[][] = Array(4)
      .fill(0)
      .map(() => Array(4).fill(0));
    const key0: number[][] = Array(4)
      .fill(0)
      .map(() => Array(4).fill(0));

    for (let i = 0; i < 16; i++) {
      const r = i % 4;
      const c = Math.floor(i / 4);
      state[r][c] = rawText.charCodeAt(i);
      key0[r][c] = rawKey.charCodeAt(i);
    }

    // Generate RoundKey[1] by simply rotating and XORing key0 for simulation
    const key1: number[][] = Array(4)
      .fill(0)
      .map(() => Array(4).fill(0));
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        key1[r][c] = (key0[r][c] ^ 0xac ^ (r + c)) & 0xff;
      }
    }

    const dpRowLabels = ["Row 0", "Row 1", "Row 2", "Row 3"];
    const dpColLabels = ["Col 0", "Col 1", "Col 2", "Col 3"];

    const getCells = (
      matrix: number[][],
      highlights?: Record<string, SemanticToken>,
      deps?: { r: number; c: number }[],
    ): DPCell[] => {
      const list: DPCell[] = [];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const key = `${r},${c}`;
          const hl = highlights?.[key];
          list.push({
            row: r,
            col: c,
            value: toHex(matrix[r][c]),
            highlight: hl,
            isCurrent: hl === "compare" || hl === "mutate",
            isDependency: deps?.some((d) => d.r === r && d.c === c) ?? false,
          });
        }
      }
      return list;
    };

    const makeVars = (descText: string, otherVars: VariableFrame[] = []): VariableFrame[] => {
      return [
        { name: "Plaintext", value: rawText, kind: "string" },
        { name: "Initial Key", value: rawKey, kind: "string" },
        { name: "Action State", value: descText, kind: "state", highlight: true },
        ...otherVars,
      ];
    };

    const rec = createRecorder({
      index: 0,
      title: "Initialize State Matrix",
      description: "Convert the 16-byte plaintext into a 4x4 State matrix (in column-major order).",
      currentLine: 1,
      dpRows: 4,
      dpCols: 4,
      dpCells: getCells(state),
      dpRowLabels,
      dpColLabels,
      variables: makeVars("State Initialized"),
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });

    const snap = (
      matrix: number[][],
      hi: Record<string, SemanticToken>,
      title: string,
      line: number,
      actionText: string,
      details: string,
      deps?: { r: number; c: number }[],
      otherVars: VariableFrame[] = [],
    ) => {
      pushStep(rec, {
        title,
        description: details,
        currentLine: line,
        dpRows: 4,
        dpCols: 4,
        dpCells: getCells(matrix, hi, deps),
        dpRowLabels,
        dpColLabels,
        variables: makeVars(actionText, otherVars),
        comparisons: rec.comparisons,
        swaps: rec.swaps,
        writes: rec.writes,
      });
    };

    // --- STEP 1: AddRoundKey (Key 0) ---
    // XOR the state with Key 0
    rec.comparisons++;
    const key0Hl: Record<string, SemanticToken> = {};
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        key0Hl[`${r},${c}`] = "compare";
      }
    }
    snap(
      state,
      key0Hl,
      "XOR with Initial Key",
      1,
      "AddRoundKey[0] (Prepare)",
      "Loading the initial secret key to XOR with state cells.",
    );

    const xorState: number[][] = Array(4)
      .fill(0)
      .map(() => Array(4).fill(0));
    const postXorHl: Record<string, SemanticToken> = {};

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        xorState[r][c] = state[r][c] ^ key0[r][c];
        postXorHl[`${r},${c}`] = "mutate";
        rec.writes++;
      }
    }
    snap(
      xorState,
      postXorHl,
      "AddRoundKey Output",
      1,
      "AddRoundKey[0] Done",
      "XORed every byte of the state with the corresponding secret key byte.",
    );

    // Update state to XOR state
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        state[r][c] = xorState[r][c];
      }
    }

    // --- STEP 2: SubBytes ---
    // Replace each byte with S-Box value column by column
    for (let c = 0; c < 4; c++) {
      const activeHl: Record<string, SemanticToken> = {};
      for (let r = 0; r < 4; r++) activeHl[`${r},${c}`] = "compare";

      snap(
        state,
        activeHl,
        `SubBytes: Column ${c}`,
        2,
        `SubBytes (Col ${c})`,
        `Inspect bytes in Column ${c} before S-Box lookup.`,
      );

      const lookups: string[] = [];
      for (let r = 0; r < 4; r++) {
        const original = state[r][c];
        const sboxValue = SBOX[original];
        lookups.push(`0x${toHex(original)}→0x${toHex(sboxValue)}`);
        state[r][c] = sboxValue;
        activeHl[`${r},${c}`] = "mutate";
        rec.writes++;
      }

      snap(
        state,
        activeHl,
        `SubBytes Column ${c} Done`,
        2,
        `SubBytes (Col ${c} Complete)`,
        `Substituted column ${c} bytes using S-Box mapping: ${lookups.join(", ")}`,
      );
    }

    // --- STEP 3: ShiftRows ---
    // Row 0: shift 0
    // Row 1: shift 1 left
    // Row 2: shift 2 left
    // Row 3: shift 3 left

    snap(
      state,
      {
        "1,0": "compare",
        "1,1": "compare",
        "1,2": "compare",
        "1,3": "compare",
      },
      "ShiftRows: Row 1",
      3,
      "ShiftRows (Row 1)",
      "Row 1 shifts cyclically left by 1 byte.",
    );

    const r1 = [state[1][1], state[1][2], state[1][3], state[1][0]];
    for (let c = 0; c < 4; c++) {
      state[1][c] = r1[c];
      rec.writes++;
    }

    snap(
      state,
      {
        "1,0": "mutate",
        "1,1": "mutate",
        "1,2": "mutate",
        "1,3": "mutate",
      },
      "ShiftRows: Row 1 Done",
      3,
      "ShiftRows (Row 1 Done)",
      "Row 1 shifted left by 1 position.",
    );

    snap(
      state,
      {
        "2,0": "compare",
        "2,1": "compare",
        "2,2": "compare",
        "2,3": "compare",
      },
      "ShiftRows: Row 2",
      3,
      "ShiftRows (Row 2)",
      "Row 2 shifts cyclically left by 2 bytes.",
    );

    const r2 = [state[2][2], state[2][3], state[2][0], state[2][1]];
    for (let c = 0; c < 4; c++) {
      state[2][c] = r2[c];
      rec.writes++;
    }

    snap(
      state,
      {
        "2,0": "mutate",
        "2,1": "mutate",
        "2,2": "mutate",
        "2,3": "mutate",
      },
      "ShiftRows: Row 2 Done",
      3,
      "ShiftRows (Row 2 Done)",
      "Row 2 shifted left by 2 positions.",
    );

    snap(
      state,
      {
        "3,0": "compare",
        "3,1": "compare",
        "3,2": "compare",
        "3,3": "compare",
      },
      "ShiftRows: Row 3",
      3,
      "ShiftRows (Row 3)",
      "Row 3 shifts cyclically left by 3 bytes.",
    );

    const r3 = [state[3][3], state[3][0], state[3][1], state[3][2]];
    for (let c = 0; c < 4; c++) {
      state[3][c] = r3[c];
      rec.writes++;
    }

    snap(
      state,
      {
        "3,0": "mutate",
        "3,1": "mutate",
        "3,2": "mutate",
        "3,3": "mutate",
      },
      "ShiftRows: Row 3 Done",
      3,
      "ShiftRows (Row 3 Done)",
      "Row 3 shifted left by 3 positions.",
    );

    // --- STEP 4: MixColumns ---
    // Apply Galois Field matrix multiplication to columns
    for (let c = 0; c < 4; c++) {
      const activeHl: Record<string, SemanticToken> = {};
      for (let r = 0; r < 4; r++) activeHl[`${r},${c}`] = "compare";

      snap(
        state,
        activeHl,
        `MixColumns: Column ${c}`,
        4,
        `MixColumns (Col ${c})`,
        `Multiply Column ${c} with MDS Matrix in Galois Field GF(2^8).`,
        [
          { r: 0, c },
          { r: 1, c },
          { r: 2, c },
          { r: 3, c },
        ],
      );

      const s0 = state[0][c];
      const s1 = state[1][c];
      const s2 = state[2][c];
      const s3 = state[3][c];

      // MDS multiplication formula
      const n0 = gm2(s0) ^ gm3(s1) ^ s2 ^ s3;
      const n1 = s0 ^ gm2(s1) ^ gm3(s2) ^ s3;
      const n2 = s0 ^ s1 ^ gm2(s2) ^ gm3(s3);
      const n3 = gm3(s0) ^ s1 ^ s2 ^ gm2(s3);

      state[0][c] = n0;
      state[1][c] = n1;
      state[2][c] = n2;
      state[3][c] = n3;
      rec.writes += 4;

      activeHl[`0,${c}`] = "mutate";
      activeHl[`1,${c}`] = "mutate";
      activeHl[`2,${c}`] = "mutate";
      activeHl[`3,${c}`] = "mutate";

      snap(
        state,
        activeHl,
        `MixColumns Column ${c} Done`,
        4,
        `MixColumns (Col ${c} Complete)`,
        `Computed Column ${c} transformation: [${toHex(s0)}, ${toHex(s1)}, ${toHex(s2)}, ${toHex(
          s3,
        )}] → [${toHex(n0)}, ${toHex(n1)}, ${toHex(n2)}, ${toHex(n3)}]`,
      );
    }

    // --- STEP 5: AddRoundKey (Key 1) ---
    const key1Hl: Record<string, SemanticToken> = {};
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        key1Hl[`${r},${c}`] = "compare";
      }
    }
    snap(
      state,
      key1Hl,
      "XOR with Round Key 1",
      5,
      "AddRoundKey[1] (Prepare)",
      "Loading simulated Round Key 1 to compute the final XOR output.",
    );

    const finalState: number[][] = Array(4)
      .fill(0)
      .map(() => Array(4).fill(0));
    const finalHl: Record<string, SemanticToken> = {};

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        finalState[r][c] = state[r][c] ^ key1[r][c];
        finalHl[`${r},${c}`] = "sorted";
        rec.writes++;
      }
    }

    // Convert output block to readable character array/string
    let outHex = "";
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) {
        outHex += toHex(finalState[r][c]);
      }
    }

    pushStep(rec, {
      title: "AES Round Complete ✓",
      description: `Final encrypted hex output block: ${outHex}`,
      currentLine: 5,
      dpRows: 4,
      dpCols: 4,
      dpCells: getCells(finalState, finalHl),
      dpRowLabels,
      dpColLabels,
      variables: makeVars("AES Round Completed", [
        { name: "Final State Hex", value: outHex, kind: "state", highlight: true },
      ]),
      comparisons: rec.comparisons,
      swaps: rec.swaps,
      writes: rec.writes,
    });

    return rec.steps;
  },
};
