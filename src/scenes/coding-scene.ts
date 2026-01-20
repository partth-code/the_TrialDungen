import Phaser from "phaser";
import * as monaco from "monaco-editor";
import { getProblemById, Problem } from "../problems/problem-bank";
import { runUserCode } from "../systems/code-runner";
import { SCENE_KEYS } from "./scene-keys";

export class CodingScene extends Phaser.Scene {
  private editor!: monaco.editor.IStandaloneCodeEditor;
  private problem!: Problem;
  private outputText!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.CODING_SCENE);
  }

  create(data: { problemId: string }) {
    const problem = getProblemById(data.problemId);
    if (!problem) {
      console.error("Problem not found");
      return;
    }

    this.problem = problem;

    // Background
    this.add.rectangle(640, 360, 1280, 720, 0x0f172a);

    // Problem text
    this.add.text(20, 20, problem.title + "\n\n" + problem.description, {
      color: "#ffffff",
      wordWrap: { width: 500 }
    });

    // Output text
    this.outputText = this.add.text(20, 400, "Output will appear here", {
      color: "#00ff00"
    });

    // Create HTML container for Monaco
    const editorDiv = document.createElement("div");
    editorDiv.style.width = "600px";
    editorDiv.style.height = "400px";
    editorDiv.style.border = "1px solid #555";

    const domElement = this.add.dom(700, 300, editorDiv);

    this.editor = monaco.editor.create(editorDiv, {
      value: problem.starterCode,
      language: "javascript",
      theme: "vs-dark",
      automaticLayout: true
    });

    // Run button
    const runBtn = this.add.text(700, 550, "[ RUN ]", { color: "#00ff00" })
      .setInteractive();

    runBtn.on("pointerdown", () => {
      this.runCode();
    });

    // Submit button
    const submitBtn = this.add.text(800, 550, "[ SUBMIT ]", { color: "#00ffff" })
      .setInteractive();

    submitBtn.on("pointerdown", () => {
      this.submitCode();
    });
  }

  runCode() {
    const code = this.editor.getValue();
    const result = runUserCode(code, this.problem);
    this.outputText.setText(result.message);
  }

  submitCode() {
    const code = this.editor.getValue();
    const result = runUserCode(code, this.problem);

    if (result.success) {
      this.outputText.setText("✅ Quest Completed!");
      // TODO: give XP, return to game scene
      this.time.delayedCall(1500, () => {
        this.scene.start(SCENE_KEYS.GAME_SCENE);
      });
    } else {
      this.outputText.setText("❌ " + result.message);
    }
  }
}
