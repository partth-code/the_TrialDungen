import * as Phaser from 'phaser';
import { auth } from '../firebase/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { SCENE_KEYS } from './scene-keys';

export class AuthScene extends Phaser.Scene {
  private isLoginMode: boolean = true;

  constructor() {
    super(SCENE_KEYS.AUTH_SCENE);
  }

  create() {
    const { width, height } = this.scale;

    // -------------------------------
    // 1️⃣ Add Responsive Title
    // -------------------------------
    const titleFontSize = Math.floor(width / 20); 
    this.add
      .text(width / 2, height * 0.15, 'THE TRIAL DUNGEON', {
        fontSize: `${titleFontSize}px`,
        color: '#fff',
        fontFamily: 'Arial',
        align: 'center'
      })
      .setOrigin(0.5);

    // -------------------------------
    // 2️⃣ Create Responsive HTML Form
    // -------------------------------
    const formWidth = Math.min(300, width * 0.35);
    const inputPadding = Math.floor(width / 200);
    const fontSize = Math.floor(width / 80);
    const buttonPadding = Math.floor(width / 100);
    const buttonFontSize = Math.floor(width / 70);

    const element = this.add.dom(width / 2, height * 0.45).createFromHTML(`
      <div style="
        color: white;
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: ${formWidth}px;
      ">
        <input type="email" id="email" placeholder="Email" style="padding: ${inputPadding}px; font-size: ${fontSize}px;">
        <input type="password" id="password" placeholder="Password" style="padding: ${inputPadding}px; font-size: ${fontSize}px;">
        <button id="submitBtn" style="
          padding: ${buttonPadding}px;
          font-size: ${buttonFontSize}px;
          cursor: pointer;
          background: #4CAF50;
          color: white;
          border: none;
        ">Login</button>
        <p id="toggleText" style="
          cursor: pointer;
          text-align: center;
          text-decoration: underline;
          font-size: ${fontSize}px;
        ">Need an account? Register</p>
        <p id="errorMessage" style="
          color: red;
          font-size: ${Math.floor(fontSize * 0.8)}px;
          text-align: center;
        "></p>
      </div>
    `);

    // -------------------------------
    // 3️⃣ Cache DOM Elements
    // -------------------------------
    const emailInput = element.getChildByID('email') as HTMLInputElement;
    const passwordInput = element.getChildByID('password') as HTMLInputElement;
    const submitBtn = element.getChildByID('submitBtn') as HTMLButtonElement;
    const toggleText = element.getChildByID('toggleText') as HTMLElement;
    const errorDisplay = element.getChildByID('errorMessage') as HTMLElement;

    // -------------------------------
    // 4️⃣ Mode Toggle (Login <-> Register)
    // -------------------------------
    toggleText.addEventListener('click', () => {
      this.isLoginMode = !this.isLoginMode;
      submitBtn.innerText = this.isLoginMode ? 'Login' : 'Register';
      toggleText.innerText = this.isLoginMode
        ? 'Need an account? Register'
        : 'Have an account? Login';
      errorDisplay.innerText = '';
    });

    // -------------------------------
    // 5️⃣ Firebase Logic
    // -------------------------------
    submitBtn.addEventListener('click', async () => {
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      errorDisplay.innerText = '';

      if (!email || !password) {
        errorDisplay.innerText = 'Please enter email and password.';
        return;
      }

      submitBtn.disabled = true; 
      submitBtn.innerText = this.isLoginMode ? 'Logging in...' : 'Registering...';

      try {
        if (this.isLoginMode) {
          await signInWithEmailAndPassword(auth, email, password);
        } else {
          await createUserWithEmailAndPassword(auth, email, password);
        }

        // ✅ UPDATED FLOW: Success -> Go to Main Menu (Intro)
        this.scene.start(SCENE_KEYS.INTRO_SCENE);

      } catch (error: any) {
        errorDisplay.innerText = error.message;
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = this.isLoginMode ? 'Login' : 'Register';
      }
    });
  }
}