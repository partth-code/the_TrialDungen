import * as Phaser from "phaser";
import { ASSET_KEYS } from "../common/assets";
import { SCENE_KEYS } from "./scene-keys";
import { GeminiApiService, MCQQuestion } from "../services/gemini-api";

export default class SageTrialScene extends Phaser.Scene {
  private currentQuestionIndex = 0;
  private selectedAnswer: number | null = null;
  private questionsAnswered = 0;
  private weaponLevel = 1;
  private weaponText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private questionText!: Phaser.GameObjects.Text;
  private optionButtons: Phaser.GameObjects.Rectangle[] = [];
  private optionTexts: Phaser.GameObjects.Text[] = [];
  private submitButton!: Phaser.GameObjects.Rectangle;
  private submitText!: Phaser.GameObjects.Text;
  private loadingText!: Phaser.GameObjects.Text;

  private questions: MCQQuestion[] = [];

  constructor() {
    super("SageTrialScene");
  }

  create() {
    console.log('SageTrialScene: create() called');
    
    try {
      const { width, height } = this.scale;
      console.log(`SageTrialScene: width=${width}, height=${height}`);

      /* =====================
         BACKGROUND - Black
      ====================== */
      // Black background
      this.add.rectangle(width / 2, height / 2, width, height, 0x000000);

      /* =====================
         SAGE (BOTTOM CENTER)
      ====================== */
      const sageX = width / 2;
      const sageY = height - 10;
      
      // Check if SAGE asset exists
      if (this.textures.exists(ASSET_KEYS.SAGE)) {
        const sageImage = this.add.image(sageX, sageY, ASSET_KEYS.SAGE);
        
        // Scale the sage to fit nicely (smaller size)
        const sageScale = Math.min(40 / sageImage.width, 40 / sageImage.height);
        sageImage.setScale(sageScale);
        sageImage.setOrigin(0.5, 1); // Anchor at bottom center
      } else {
        console.warn(`SAGE asset ${ASSET_KEYS.SAGE} not found, using placeholder`);
        // Use a placeholder if asset not loaded
        this.add.rectangle(sageX, sageY, 30, 40, 0xa855f7);
      }
      /* =====================
         QUESTION (TOP)
      ====================== */
      const questionX = width / 2;
      const questionY = 20;
      const questionWidth = width * 0.85;
      const questionHeight = 35;
      
      // Question panel
      this.add.rectangle(questionX, questionY, questionWidth, questionHeight, 0x1a1a2e, 0.9);
      
      // Question text
      this.questionText = this.add.text(
        questionX,
        questionY,
        "",
        {
          fontSize: "9px",
          color: "#ffffff",
          align: "center",
          wordWrap: { width: questionWidth - 15 },
        }
      ).setOrigin(0.5);

      /* =====================
         OPTIONS (BELOW QUESTION)
      ====================== */
      const optionsStartY = 60;
      const optionsX = width / 2;
      const optionsWidth = width * 0.75;
      
      // Create option buttons
      this.createOptionButtons(optionsX, optionsStartY, optionsWidth);

      /* =====================
         SUBMIT BUTTON (BELOW OPTIONS)
      ====================== */
      const submitY = optionsStartY + 115;
      this.createSubmitButton(optionsX, submitY);

      // Loading text (will be hidden after questions load)
      this.loadingText = this.add.text(optionsX, optionsStartY, "Generating questions...", {
        fontSize: "10px",
        color: "#ffffff",
      }).setOrigin(0.5);

      // Generate questions from Gemini API
      this.generateQuestions();

      /* =====================
         BLACKBOARD (RIGHT SIDE) - Shows Weapon Level
      ====================== */
      const blackboardX = width * 0.8;
      const blackboardY = height * 0.5;
      const blackboardWidth = 60;
      const blackboardHeight = 50;
      
      // Blackboard background (dark green/black)
      this.add.rectangle(blackboardX, blackboardY, blackboardWidth, blackboardHeight, 0x1a4d2e, 0.95);
      this.add.rectangle(blackboardX, blackboardY, blackboardWidth - 3, blackboardHeight - 3, 0x0d2818, 0.98);
      
      // Blackboard label
      this.add.text(blackboardX, blackboardY - 30, "Weapon", {
        fontSize: "8px",
        color: "#ffffff",
      }).setOrigin(0.5);
      
      // Weapon level text (white chalk-like)
      this.weaponText = this.add.text(blackboardX, blackboardY + 5, "", {
        fontSize: "12px",
        color: "#ffffff",
        align: "center",
      }).setOrigin(0.5);
      
      this.updateWeaponBoard();

      /* =====================
         HINT POT (LEFT SIDE)
      ====================== */
      const potX = width * 0.2;
      const potY = height * 0.4;
      
      // Use the POT asset image
      let potImage: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
      if (this.textures.exists(ASSET_KEYS.POT)) {
        potImage = this.add.image(potX, potY, ASSET_KEYS.POT);
        potImage.setScale(0.4);
        potImage.setOrigin(0.5, 1);
      } else {
        console.warn(`POT asset ${ASSET_KEYS.POT} not found, using placeholder`);
        potImage = this.add.rectangle(potX, potY, 20, 20, 0x475569);
        potImage.setOrigin(0.5, 1);
      }
      
      // Hint count text below pot (shows questions answered)
      this.hintText = this.add.text(potX, potY + 3, "0/3", {
        fontSize: "8px",
        color: "#ffffff",
        fontStyle: "bold",
      }).setOrigin(0.5, 0);
      
      console.log('SageTrialScene: Successfully created');
    } catch (error) {
      console.error('SageTrialScene: Error in create()', error);
    }
  }

  /* =====================
     GENERATE QUESTIONS FROM GEMINI API
  ====================== */
  private async generateQuestions(): Promise<void> {
    console.log('Generating questions from Gemini API...');
    
    try {
      // Show loading state
      if (this.loadingText) {
        this.loadingText.setVisible(true);
      }
      
      // Disable UI while loading
      this.optionButtons.forEach((btn) => btn.setVisible(false));
      this.submitButton.setVisible(false);

      // Generate 3 questions from Gemini API
      const generatedQuestions = await GeminiApiService.generateMCQQuestions(3, 'computer science algorithms');
      
      if (generatedQuestions.length > 0) {
        this.questions = generatedQuestions;
        console.log(`Successfully generated ${this.questions.length} questions from Gemini API`);
        
        // Hide loading text
        if (this.loadingText) {
          this.loadingText.setVisible(false);
        }
        
        // Show UI
        this.optionButtons.forEach((btn) => btn.setVisible(true));
        this.submitButton.setVisible(true);
        
        // Display first question
        this.displayQuestion();
      } else {
        throw new Error('No questions generated from API');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      
      // Use fallback questions if API fails
      this.questions = [
        {
          question: "What is the time complexity of binary search?",
          options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
          correctAnswer: 1,
        },
        {
          question: "Which data structure uses LIFO (Last In First Out)?",
          options: ["Queue", "Stack", "Tree", "Graph"],
          correctAnswer: 1,
        },
        {
          question: "What is the time complexity of finding an element in a hash table?",
          options: ["O(n)", "O(log n)", "O(1)", "O(n log n)"],
          correctAnswer: 2,
        },
      ];
      
      // Hide loading text
      if (this.loadingText) {
        this.loadingText.setText('Using fallback questions');
        this.time.delayedCall(2000, () => {
          this.loadingText.setVisible(false);
          this.optionButtons.forEach((btn) => btn.setVisible(true));
          this.submitButton.setVisible(true);
          this.displayQuestion();
        });
      } else {
        this.displayQuestion();
      }
    }
  }

  /* =====================
     CREATE OPTION BUTTONS
  ====================== */
  private createOptionButtons(centerX: number, startY: number, buttonWidth: number): void {
    const optionSpacing = 24;
    const optionHeight = 20;

    for (let i = 0; i < 4; i++) {
      const optionY = startY + i * optionSpacing;
      const optionButton = this.add.rectangle(
        centerX,
        optionY,
        buttonWidth,
        optionHeight,
        0x2c3e50
      )
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(1, 0x7f8c8d);

      const optionText = this.add.text(centerX, optionY, "", {
        fontSize: "8px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: buttonWidth - 12 },
      }).setOrigin(0.5);

      this.optionButtons.push(optionButton);
      this.optionTexts.push(optionText);

      optionButton.on("pointerdown", () => {
        this.selectAnswer(i);
      });
    }
  }

  /* =====================
     CREATE SUBMIT BUTTON
  ====================== */
  private createSubmitButton(x: number, y: number): void {
    this.submitButton = this.add.rectangle(x, y, 80, 24, 0x27ae60)
      .setInteractive({ useHandCursor: true });

    this.submitText = this.add.text(x, y, "SUBMIT", {
      fontSize: "9px",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.submitButton.on("pointerdown", () => {
      this.submitAnswer();
    });

    // Initially disable submit button
    this.submitButton.setAlpha(0.5);
    this.submitButton.disableInteractive();
  }

  /* =====================
     DISPLAY QUESTION
  ====================== */
  private displayQuestion(): void {
    console.log(`Displaying question ${this.currentQuestionIndex + 1} of ${this.questions.length}`);
    
    if (this.currentQuestionIndex >= this.questions.length) {
      console.log('All questions answered, completing trial');
      this.completeTrial();
      return;
    }

    // Check if text objects exist before using them
    if (!this.questionText) {
      console.error('questionText is not initialized');
      return;
    }

    const question = this.questions[this.currentQuestionIndex];
    this.questionText.setText(question.question);

    // Display options
    for (let i = 0; i < 4; i++) {
      if (question.options[i] && this.optionTexts[i] && this.optionButtons[i]) {
        this.optionTexts[i].setText(`${String.fromCharCode(65 + i)}. ${question.options[i]}`);
        this.optionButtons[i].setAlpha(1);
        this.optionButtons[i].setFillStyle(0x2c3e50);
        this.optionButtons[i].setStrokeStyle(1, 0x7f8c8d);
        this.optionButtons[i].setInteractive({ useHandCursor: true });
        this.optionButtons[i].setVisible(true);
        this.optionTexts[i].setVisible(true);
      } else if (this.optionButtons[i] && this.optionTexts[i]) {
        // Hide unused option slots
        this.optionButtons[i].setVisible(false);
        this.optionTexts[i].setVisible(false);
      }
    }

    // Reset selection
    this.selectedAnswer = null;
    if (this.submitButton) {
      this.submitButton.setAlpha(0.5);
      this.submitButton.disableInteractive();
    }

    // Update questions counter - show current question number
    if (this.hintText) {
      this.hintText.setText(`Q: ${this.currentQuestionIndex + 1}/3`);
    }
  }

  /* =====================
     SELECT ANSWER
  ====================== */
  private selectAnswer(optionIndex: number): void {
    // Reset all buttons
    this.optionButtons.forEach((btn, idx) => {
      btn.setStrokeStyle(2, 0x7f8c8d);
      btn.setAlpha(1);
    });

    // Highlight selected button
    this.optionButtons[optionIndex].setStrokeStyle(3, 0x3498db);
    this.optionButtons[optionIndex].setAlpha(0.8);
    
    this.selectedAnswer = optionIndex;

    // Enable submit button
    this.submitButton.setAlpha(1);
    this.submitButton.setInteractive({ useHandCursor: true });
  }

  /* =====================
     SUBMIT ANSWER
  ====================== */
  private submitAnswer(): void {
    if (this.selectedAnswer === null) {
      return;
    }

    console.log(`Submitting answer for question ${this.currentQuestionIndex + 1}, selected: ${this.selectedAnswer}`);

    // Disable submit button to prevent multiple submissions
    this.submitButton.disableInteractive();
    this.submitButton.setAlpha(0.5);

    const question = this.questions[this.currentQuestionIndex];
    const isCorrect = this.selectedAnswer === question.correctAnswer;

    // Visual feedback - show result
    if (isCorrect) {
      this.optionButtons[this.selectedAnswer].setFillStyle(0x27ae60);
      this.questionsAnswered++;
      console.log(`Correct answer! Total correct: ${this.questionsAnswered}`);
    } else {
      this.optionButtons[this.selectedAnswer].setFillStyle(0xe74c3c);
      // Show correct answer
      this.optionButtons[question.correctAnswer].setFillStyle(0x27ae60);
      console.log(`Wrong answer. Correct was: ${question.correctAnswer}`);
    }

    // Disable all buttons to prevent further interaction
    this.optionButtons.forEach((btn) => {
      btn.disableInteractive();
    });

    // ALWAYS move to next question after delay (regardless of correct/incorrect)
    this.time.delayedCall(1500, () => {
      console.log(`Moving to next question. Current index: ${this.currentQuestionIndex}, Total questions: ${this.questions.length}`);
      
      // Increment question index (will move to next question or complete trial)
      this.currentQuestionIndex++;
      
      // Reset button colors and states for next question
      this.optionButtons.forEach((btn) => {
        btn.setFillStyle(0x2c3e50);
        btn.setStrokeStyle(1, 0x7f8c8d);
        btn.setAlpha(1);
        btn.setInteractive({ useHandCursor: true });
      });
      
      // Reset selected answer
      this.selectedAnswer = null;
      
      // Display next question (or complete trial if all questions done)
      this.displayQuestion();
    });
  }

  /* =====================
     COMPLETE TRIAL
  ====================== */
  private completeTrial(): void {
    // Determine weapon level based on correct answers
    if (this.questionsAnswered >= 3) {
      this.weaponLevel = 3;
    } else if (this.questionsAnswered >= 2) {
      this.weaponLevel = 2;
    } else {
      this.weaponLevel = 1;
    }

    // Show completion message
    this.questionText.setText("Trial Complete! Weapon Granted!");
    this.hintText.setText(`Weapon Level: ${this.weaponLevel}`);

    // Hide option buttons and submit button
    this.optionButtons.forEach((btn) => btn.setVisible(false));
    this.optionTexts.forEach((txt) => txt.setVisible(false));
    this.submitButton.setVisible(false);
    this.submitText.setVisible(false);

    // Return to game scene after delay
    this.time.delayedCall(3000, () => {
      this.scene.start(SCENE_KEYS.GAME_SCENE);
    });
  }

  /* =====================
     WEAPON LOGIC
  ====================== */
  private updateWeaponBoard() {
    if (this.weaponText) {
      this.weaponText.setText(`Lv ${this.weaponLevel}`);
    }
  }
}
