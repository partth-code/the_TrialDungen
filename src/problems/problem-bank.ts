export type TestCase = {
  input: any[];
  output: any;
};

export type Problem = {
  id: string;
  title: string;
  description: string;
  fnName: string;
  starterCode: string;
  tests: TestCase[];
};

export const PROBLEMS: Problem[] = [
  {
    id: "reverse-array",
    title: "Reverse an Array",
    description: "Write a function reverseArray(arr) that returns the reversed array.",
    fnName: "reverseArray",
    starterCode: `function reverseArray(arr) {
  // write your code here
}`,
    tests: [
      { input: [[1, 2, 3]], output: [3, 2, 1] },
      { input: [[5, 6]], output: [6, 5] }
    ]
  }
];

export function getProblemById(id: string): Problem | undefined {
  return PROBLEMS.find(p => p.id === id);
}
