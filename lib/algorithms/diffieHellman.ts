// lib/algorithms/diffieHellman.ts

import type {
  AlgorithmDefinition,
  GraphEdgeSnapshot,
  GraphNodeSnapshot,
  VariableFrame,
  SemanticToken,
} from "@/lib/engine/types";
import { createRecorder, pushStep } from "@/lib/engine/runner";

function modPow(base: number, exp: number, mod: number): number {
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

export const diffieHellman: AlgorithmDefinition = {
  id: "diffie-hellman",
  name: "Diffie-Hellman Key Exchange",
  category: "Cryptography",
  structure: "graph",
  summary:
    "Simulates public-key exchange over an insecure channel. Alice and Bob establish a shared secret key while Eve monitors the channel.",
  pseudocode: [
    { line: 1, text: "Alice agrees on public parameters: g (base), p (prime)" },
    { line: 2, text: "Alice chooses secret a; Bob chooses secret b" },
    { line: 3, text: "Alice computes A = g^a mod p; Bob computes B = g^b mod p" },
    { line: 4, text: "Alice & Bob exchange public values A and B over public channel" },
    { line: 5, text: "Alice computes shared secret: S = B^a mod p" },
    { line: 6, text: "Bob computes shared secret: S = A^b mod p (S matches!)" },
  ],
  configFields: [
    {
      key: "prime",
      label: "Public Prime (p)",
      kind: "number",
      min: 11,
      max: 999,
      default: 23,
    },
    {
      key: "base",
      label: "Public Generator (g)",
      kind: "number",
      min: 2,
      max: 99,
      default: 5,
    },
    {
      key: "secretA",
      label: "Alice's Secret (a)",
      kind: "number",
      min: 1,
      max: 50,
      default: 6,
    },
    {
      key: "secretB",
      label: "Bob's Secret (b)",
      kind: "number",
      min: 1,
      max: 50,
      default: 15,
    },
  ],
  run(cfg) {
    const p = Number(cfg.prime || 23);
    const g = Number(cfg.base || 5);
    const a = Number(cfg.secretA || 6);
    const b = Number(cfg.secretB || 15);

    const nodes: GraphNodeSnapshot[] = [
      { id: "Alice", label: "Alice", x: 0.15, y: 0.4, subLabel: `g = ${g}, p = ${p}` },
      { id: "Bob", label: "Bob", x: 0.85, y: 0.4, subLabel: `g = ${g}, p = ${p}` },
      { id: "Eve", label: "Eve (Channel)", x: 0.5, y: 0.8, subLabel: "Eavesdropping..." },
    ];

    const getEdges = (
      e_ae_w?: string | number,
      e_eb_w?: string | number,
      e_be_w?: string | number,
      e_ea_w?: string | number,
    ): GraphEdgeSnapshot[] => [
      { id: "e_ae", fromId: "Alice", toId: "Eve", directed: true, weight: e_ae_w },
      { id: "e_eb", fromId: "Eve", toId: "Bob", directed: true, weight: e_eb_w },
      { id: "e_be", fromId: "Bob", toId: "Eve", directed: true, weight: e_be_w },
      { id: "e_ea", fromId: "Eve", toId: "Alice", directed: true, weight: e_ea_w },
    ];

    const makeVars = (
      stepTitle: string,
      aliceSecret: number | string = "-",
      bobSecret: number | string = "-",
      alicePub: number | string = "-",
      bobPub: number | string = "-",
      shared: number | string = "-",
    ): VariableFrame[] => [
      { name: "Public prime p", value: p, kind: "number" },
      { name: "Public base g", value: g, kind: "number" },
      { name: "Alice's Secret (a)", value: aliceSecret, kind: "pointer", highlight: aliceSecret !== "-" },
      { name: "Bob's Secret (b)", value: bobSecret, kind: "pointer", highlight: bobSecret !== "-" },
      { name: "Alice Public (A)", value: alicePub, kind: "number", highlight: alicePub !== "-" },
      { name: "Bob Public (B)", value: bobPub, kind: "number", highlight: bobPub !== "-" },
      { name: "Shared Secret Key (S)", value: shared, kind: "state", highlight: shared !== "-" },
    ];

    const rec = createRecorder({
      index: 0,
      title: "Agree on Public Parameters",
      description: `Alice and Bob agree to use public generator base g = ${g} and prime modulus p = ${p}.`,
      currentLine: 1,
      graphNodes: nodes,
      graphEdges: getEdges(),
      graphHighlights: {},
      variables: makeVars("Init"),
      comparisons: 0,
      swaps: 0,
      writes: 0,
    });

    const snap = (
      hi: Record<string, SemanticToken>,
      edgesList: GraphEdgeSnapshot[],
      title: string,
      line: number,
      vars: VariableFrame[],
      desc: string,
      nodeState: { alice: string; bob: string; eve: string },
    ) => {
      pushStep(rec, {
        title,
        description: desc,
        currentLine: line,
        graphNodes: [
          { ...nodes[0], subLabel: nodeState.alice },
          { ...nodes[1], subLabel: nodeState.bob },
          { ...nodes[2], subLabel: nodeState.eve },
        ],
        graphEdges: edgesList,
        graphHighlights: hi,
        variables: vars,
        comparisons: rec.comparisons,
        swaps: 0,
        writes: rec.writes,
      });
    };

    // Step 2: Choose Secret Keys
    snap(
      { Alice: "pointer" },
      getEdges(),
      "Alice Choose Secret",
      2,
      makeVars("Secrets Selection", a, "-"),
      `Alice selects her private secret exponent a = ${a}. This value remains completely secret.`,
      {
        alice: `secret a = ${a}`,
        bob: `g = ${g}, p = ${p}`,
        eve: "Eavesdropping...",
      },
    );

    snap(
      { Bob: "pointer" },
      getEdges(),
      "Bob Choose Secret",
      2,
      makeVars("Secrets Selection", a, b),
      `Bob selects his private secret exponent b = ${b}. This value remains completely secret.`,
      {
        alice: `secret a = ${a}`,
        bob: `secret b = ${b}`,
        eve: "Eavesdropping...",
      },
    );

    // Step 3: Compute Public Keys
    const A = modPow(g, a, p);
    snap(
      { Alice: "mutate" },
      getEdges(),
      "Alice Computes Public Key (A)",
      3,
      makeVars("Compute Public", a, b, A, "-"),
      `Alice computes her public value A = g^a mod p = ${g}^${a} mod ${p} = ${A}.`,
      {
        alice: `secret a = ${a} | A = ${A}`,
        bob: `secret b = ${b}`,
        eve: "Eavesdropping...",
      },
    );

    const B = modPow(g, b, p);
    snap(
      { Bob: "mutate" },
      getEdges(),
      "Bob Computes Public Key (B)",
      3,
      makeVars("Compute Public", a, b, A, B),
      `Bob computes his public value B = g^b mod p = ${g}^${b} mod ${p} = ${B}.`,
      {
        alice: `secret a = ${a} | A = ${A}`,
        bob: `secret b = ${b} | B = ${B}`,
        eve: "Eavesdropping...",
      },
    );

    // Step 4: Exchange Public Keys
    // Alice sends to Bob (via Eve)
    snap(
      { Alice: "compare", Eve: "pointer", e_ae: "mutate" },
      getEdges(`A = ${A}`, undefined, undefined, undefined),
      "Alice Transmits Key A",
      4,
      makeVars("Exchanging A", a, b, A, B),
      `Alice transmits her public value A = ${A} across the public network.`,
      {
        alice: `secret a = ${a} | Transmitted A = ${A}`,
        bob: `secret b = ${b}`,
        eve: `Intercepted: A = ${A}`,
      },
    );

    snap(
      { Eve: "compare", Bob: "mutate", e_eb: "mutate" },
      getEdges(undefined, `A = ${A}`, undefined, undefined),
      "Bob Receives Key A",
      4,
      makeVars("Bob Receives A", a, b, A, B),
      `The public channel forwards Alice's key A = ${A} to Bob.`,
      {
        alice: `secret a = ${a} | Transmitted A = ${A}`,
        bob: `secret b = ${b} | Received A = ${A}`,
        eve: `Intercepted: A = ${A}`,
      },
    );

    // Bob sends to Alice (via Eve)
    snap(
      { Bob: "compare", Eve: "pointer", e_be: "mutate" },
      getEdges(undefined, undefined, `B = ${B}`, undefined),
      "Bob Transmits Key B",
      4,
      makeVars("Exchanging B", a, b, A, B),
      `Bob transmits his public value B = ${B} across the public network.`,
      {
        alice: `secret a = ${a} | Received A = ${A}`,
        bob: `secret b = ${b} | Transmitted B = ${B}`,
        eve: `Intercepted: A = ${A}, B = ${B}`,
      },
    );

    snap(
      { Eve: "compare", Alice: "mutate", e_ea: "mutate" },
      getEdges(undefined, undefined, undefined, `B = ${B}`),
      "Alice Receives Key B",
      4,
      makeVars("Alice Receives B", a, b, A, B),
      `The public channel forwards Bob's key B = ${B} to Alice.`,
      {
        alice: `secret a = ${a} | Received B = ${B}`,
        bob: `secret b = ${b} | Transmitted B = ${B}`,
        eve: `Intercepted: A = ${A}, B = ${B}`,
      },
    );

    // Step 5: Alice Computes Shared Secret
    const sa = modPow(B, a, p);
    snap(
      { Alice: "mutate" },
      getEdges(),
      "Alice Computes Shared Secret",
      5,
      makeVars("Alice Shared Secret", a, b, A, B, sa),
      `Alice computes the shared secret: S = B^a mod p = ${B}^${a} mod ${p} = ${sa}.`,
      {
        alice: `Shared Secret S = ${sa}`,
        bob: `secret b = ${b} | Received A = ${A}`,
        eve: `Intercepted: A = ${A}, B = ${B}`,
      },
    );

    // Step 6: Bob Computes Shared Secret & Verify
    const sb = modPow(A, b, p);
    snap(
      { Bob: "mutate" },
      getEdges(),
      "Bob Computes Shared Secret",
      6,
      makeVars("Bob Shared Secret", a, b, A, B, sb),
      `Bob computes the shared secret: S = A^b mod p = ${A}^${b} mod ${p} = ${sb}.`,
      {
        alice: `Shared Secret S = ${sa}`,
        bob: `Shared Secret S = ${sb}`,
        eve: `Intercepted: A = ${A}, B = ${B}`,
      },
    );

    pushStep(rec, {
      title: "Shared Secret Established ✓",
      description: `Alice and Bob successfully established shared secret key S = ${sa}. Eve is left with only public keys A and B, unable to solve the Discrete Logarithm Problem to find secrets 'a' or 'b'.`,
      currentLine: 6,
      graphNodes: [
        { ...nodes[0], subLabel: `Shared Key S = ${sa}` },
        { ...nodes[1], subLabel: `Shared Key S = ${sb}` },
        { ...nodes[2], subLabel: `Has only A=${A}, B=${B} (Cannot find secret keys!)` },
      ],
      graphEdges: getEdges(),
      graphHighlights: { Alice: "sorted", Bob: "sorted", Eve: "visited" },
      variables: makeVars("Success", a, b, A, B, sa),
      comparisons: rec.comparisons,
      swaps: 0,
      writes: 2,
    });

    return rec.steps;
  },
};
