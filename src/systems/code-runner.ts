import { Problem } from "../problems/problem-bank";

export type RunResult = {
  success: boolean;
  message: string;
  failedTestIndex?: number;
};

function deepEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function runUserCode(code: string, problem: Problem): RunResult {
  try {
    // Create isolated function scope
    const fn = new Function(`
      ${code}
      return typeof ${problem.fnName} === "function" ? ${problem.fnName} : null;
    `)();

    if (!fn) {
      return {
        success: false,
        message: `Function "${problem.fnName}" is not defined.`
      };
    }

    for (let i = 0; i < problem.tests.length; i++) {
      const test = problem.tests[i];
      const result = fn(...test.input);

      if (!deepEqual(result, test.output)) {
        return {
          success: false,
          message: "Wrong answer",
          failedTestIndex: i
        };
      }
    }

    return {
      success: true,
      message: "All test cases passed!"
    };

  } catch (err: any) {
    return {
      success: false,
      message: "Runtime Error: " + err.message
    };
  }
}
