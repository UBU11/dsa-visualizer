// lib/algorithms/rsaSimulation.ts

import type {
  AlgorithmDefinition,
  ArrayCell,
  HistoryStep,
  VariableFrame,
  SemanticToken,
} from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

// Extended Euclidean Algorithm to find modular inverse
function extGCD(a: number, b: number): { gcd: number; x: number; y: number } {
  if (b === 0) return { gcd: a, x: 1, y: 0 };
  const { gcd, x: x1, y: y1 } = extGCD(b, a % b);
  return {
    gcd,
    x: y1,
    y: x1 - Math.floor(a / b) * y1,
  };
}

function modInverse(e: number, phi: number): number {
  const { gcd, x } = extGCD(e, phi);
  if (gcd !== 1) return -1;
  return ((x % phi) + phi) % phi;
}

// Modular Exponentiation (base^exp % mod)
function modPow(base: number, exp: number, mod: number): number {
  if (mod === 1) return 0;
  let res = 1;
  let b = base % mod;
  let e = exp;
  while (e > 0) {
    if (e % 2 === 1) {
      res = (res * b) % mod;
    }
    b = (b * b) % mod;
    e = Math.floor(e / 2);
  }
  return res;
}

export const rsaSimulation: AlgorithmDefinition = {
  id: "rsa-simulation",
  name: "RSA Asymmetric Encryption",
  category: "Cryptography",
  structure: "array",
  summary:
    "Simulates key generation, encryption (C = M^e mod n) and decryption (M = C^d mod n) for a character array.",
  pseudocode: [
    { line: 1, text: "Keys: n = p*q, totient φ = (p-1)*(q-1), d = e^-1 mod φ" },
    { line: 2, text: "Convert message characters to Unicode numbers (M)" },
    { line: 3, text: "Encrypt: for each cell, compute C = M^e mod n" },
    { line: 4, text: "Decrypt: for each cell, compute M = C^d mod n" },
    { line: 5, text: "Convert Unicode numbers back to characters" },
  ],
  configFields: [
    {
      key: "message",
      label: "Message (max 8 chars)",
      kind: "text",
      default: "HELLODSA",
    },
    {
      key: "p",
      label: "Prime Number p",
      kind: "number",
      min: 11,
      max: 150,
      default: 61,
    },
    {
      key: "q",
      label: "Prime Number q",
      kind: "number",
      min: 11,
      max: 150,
      default: 53,
    },
    {
      key: "e",
      label: "Public Exponent e",
      kind: "number",
      min: 3,
      max: 999,
      default: 17,
    },
  ],
  run(cfg) {
    const rawMsg = String(cfg.message || "HELLODSA").slice(0, 8);
    const p = Number(cfg.p || 61);
    const q = Number(cfg.q || 53);
    const e = Number(cfg.e || 17);

    // 1. Key Calculation
    const n = p * q;
    const phi = (p - 1) * (q - 1);
    const d = modInverse(e, phi);

    const makeVars = (
      stepTitle: string,
      otherVars: VariableFrame[] = [],
    ): VariableFrame[] => {
      const list: VariableFrame[] = [
        { name: "Public Key (e, n)", value: `(${e}, ${n})`, kind: "state" },
        { name: "Private Key (d, n)", value: d === -1 ? "INVALID (gcd(e,φ) ≠ 1)" : `(${d}, ${n})`, kind: "state" },
        { name: "Action", value: stepTitle, kind: "state", highlight: true },
      ];
      return [...list, ...otherVars];
    };

    const makeCells = (vals: (string | number)[]): ArrayCell[] => {
      return vals.map((v, idx) => ({
        id: `rsa-cell-${idx}`,
        value: v,
      }));
    };

    const initialVals = rawMsg.split("");
    const rec = createRecorder({
      index: 0,
      title: "Key Generation & Init",
      description:
        d === -1
          ? `Error: e = ${e} and φ = ${phi} are not coprime. Choose another exponent.`
          : `Computed Modulus n = p*q = ${n}, Totient φ = ${phi}, and Private Key d = e^-1 mod φ = ${d}.`,
      currentLine: 1,
      arrayCells: makeCells(initialVals),
      arrayHighlights: {},
      variables: makeVars("Init"),
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });

    if (d === -1) {
      return rec.steps; // Return early if key generation failed
    }

    const snap = (
      vals: (string | number)[],
      hi: Record<string, SemanticToken>,
      title: string,
      line: number,
      actionText: string,
      desc: string,
      otherVars: VariableFrame[] = [],
    ) => {
      pushStep(rec, {
        title,
        description: desc,
        currentLine: line,
        arrayCells: makeCells(vals),
        arrayHighlights: hi,
        variables: makeVars(actionText, otherVars),
        comparisons: rec.comparisons,
        swaps: rec.swaps,
        writes: rec.writes,
      });
    };

    // Step 2: Convert to Numbers
    const codes = initialVals.map((c) => c.charCodeAt(0));
    const codeHl: Record<string, SemanticToken> = {};
    for (let i = 0; i < codes.length; i++) codeHl[`rsa-cell-${i}`] = "mutate";
    rec.writes += codes.length;
    snap(
      codes,
      codeHl,
      "Convert to Unicode Values",
      2,
      "Unicode Conversion",
      `Converts string characters into numerical message values (M): ${codes.join(", ")}.`,
    );

    // Step 3: Encrypt value-by-value
    const ciphers: number[] = [...codes];
    for (let i = 0; i < codes.length; i++) {
      const original = codes[i];
      const encrypted = modPow(original, e, n);
      ciphers[i] = encrypted;
      rec.writes++;

      const activeHl: Record<string, SemanticToken> = {};
      for (let k = 0; k < i; k++) activeHl[`rsa-cell-${k}`] = "sorted";
      activeHl[`rsa-cell-${i}`] = "compare";

      snap(
        [...ciphers.slice(0, i), ...codes.slice(i)],
        activeHl,
        `Encrypting Character ${i}`,
        3,
        `Encrypting Cell ${i}`,
        `Computing C = M^e mod n: ${original}^${e} mod ${n} = ${encrypted}.`,
        [
          { name: "Current Char M", value: original, kind: "number" },
          { name: "Encrypted C", value: encrypted, kind: "number", highlight: true },
        ],
      );
    }

    // Fully encrypted
    const encryptedHl: Record<string, SemanticToken> = {};
    for (let i = 0; i < ciphers.length; i++) encryptedHl[`rsa-cell-${i}`] = "sorted";
    snap(
      ciphers,
      encryptedHl,
      "Encryption Complete",
      3,
      "Ciphertext State",
      `All values have been successfully encrypted using the public key: [${ciphers.join(", ")}].`,
    );

    // Step 4: Decrypt value-by-value
    const decrypts: number[] = [...ciphers];
    for (let i = 0; i < ciphers.length; i++) {
      const encrypted = ciphers[i];
      const decrypted = modPow(encrypted, d, n);
      decrypts[i] = decrypted;
      rec.writes++;

      const activeHl: Record<string, SemanticToken> = {};
      for (let k = 0; k < i; k++) activeHl[`rsa-cell-${k}`] = "sorted";
      activeHl[`rsa-cell-${i}`] = "compare";

      snap(
        [...decrypts.slice(0, i), ...ciphers.slice(i)],
        activeHl,
        `Decrypting Character ${i}`,
        4,
        `Decrypting Cell ${i}`,
        `Computing M = C^d mod n: ${encrypted}^${d} mod ${n} = ${decrypted}.`,
        [
          { name: "Current Cipher C", value: encrypted, kind: "number" },
          { name: "Decrypted M", value: decrypted, kind: "number", highlight: true },
        ],
      );
    }

    // Fully decrypted numbers
    const decryptedHl: Record<string, SemanticToken> = {};
    for (let i = 0; i < decrypts.length; i++) decryptedHl[`rsa-cell-${i}`] = "sorted";
    snap(
      decrypts,
      decryptedHl,
      "Decryption Complete",
      4,
      "Decrypted State (Numeric)",
      `All values have been successfully decrypted back to numerical codes: [${decrypts.join(", ")}].`,
    );

    // Step 5: Convert back to characters
    const finalChars = decrypts.map((code) => String.fromCharCode(code));
    const finalHl: Record<string, SemanticToken> = {};
    for (let i = 0; i < finalChars.length; i++) finalHl[`rsa-cell-${i}`] = "sorted";
    rec.writes += finalChars.length;

    pushStep(rec, {
      title: "RSA Sequence Finished ✓",
      description: `Decrypted back to message string: "${finalChars.join("")}"`,
      currentLine: 5,
      arrayCells: makeCells(finalChars),
      arrayHighlights: finalHl,
      variables: makeVars("Completed", [
        { name: "Decrypted String", value: finalChars.join(""), kind: "string", highlight: true },
      ]),
      comparisons: rec.comparisons,
      swaps: rec.swaps,
      writes: rec.writes,
    });

    return rec.steps;
  },
};
