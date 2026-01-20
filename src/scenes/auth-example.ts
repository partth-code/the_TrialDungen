/**
 * EXAMPLE: How to use Firebase Authentication in Phaser Scenes
 * 
 * This file demonstrates how to:
 * 1. Check if a user is authenticated
 * 2. Redirect to login scene if not authenticated
 * 3. Listen for auth state changes
 * 4. Access current user information
 * 
 * Copy the relevant patterns into your game scenes.
 */

import * as Phaser from 'phaser';
import { SCENE_KEYS } from './scene-keys';
import {
  isUserAuthenticated,
  getCurrentUser,
  onAuthStateChangedListener,
} from '../services/auth.service';

/**
 * Example Scene: Protected Game Scene
 * 
 * This scene requires authentication before allowing access.
 */
export class ProtectedGameScene extends Phaser.Scene {
  private authUnsubscribe?: () => void;

  constructor() {
    super({ key: 'ProtectedGameScene' });
  }

  create() {
    // Method 1: Check authentication immediately on scene start
    if (!isUserAuthenticated()) {
      console.log('⚠️ User not authenticated, redirecting to login...');
      this.scene.start(SCENE_KEYS.AUTH_SCENE);
      return;
    }

    // User is authenticated, proceed with scene setup
    const user = getCurrentUser();
    console.log('✅ User authenticated:', user?.email);
    
    // Continue with your game scene setup...
    this.setupGame();
  }

  /**
   * Method 2: Listen for auth state changes
   * Useful if you want to handle logout during gameplay
   */
  setupAuthListener() {
    this.authUnsubscribe = onAuthStateChangedListener((user) => {
      if (!user) {
        // User logged out, redirect to login
        console.log('⚠️ User logged out, redirecting to login...');
        this.scene.start(SCENE_KEYS.AUTH_SCENE);
      } else {
        console.log('✅ User authenticated:', user.email);
      }
    });
  }

  /**
   * Method 3: Check auth state in update loop (if needed)
   */
  update() {
    // Only check periodically if needed, not every frame
    // Example: Check every 60 frames (~1 second at 60fps)
    if (this.time.now % 1000 < 16) {
      if (!isUserAuthenticated()) {
        this.scene.start(SCENE_KEYS.AUTH_SCENE);
      }
    }
  }

  /**
   * Cleanup: Remove auth listener when scene shuts down
   */
  shutdown() {
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
      this.authUnsubscribe = undefined;
    }
  }

  private setupGame() {
    // Your game scene initialization code here
    const { width, height } = this.scale;
    
    this.add.text(width / 2, height / 2, 'Protected Game Scene', {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Display user info
    const user = getCurrentUser();
    if (user) {
      this.add.text(width / 2, height / 2 + 40, `Logged in as: ${user.email}`, {
        fontSize: '16px',
        color: '#cccccc',
      }).setOrigin(0.5);
    }
  }
}

/**
 * Example Scene: Main Menu with Auth Check
 * 
 * Shows how to conditionally show content based on auth state
 */
export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Check auth state and show appropriate UI
    if (isUserAuthenticated()) {
      const user = getCurrentUser();
      this.add.text(width / 2, height / 2, `Welcome, ${user?.email}`, {
        fontSize: '20px',
        color: '#ffffff',
      }).setOrigin(0.5);

      // Show game options for authenticated users
      this.createGameButtons();
    } else {
      // Show login prompt for unauthenticated users
      this.add.text(width / 2, height / 2, 'Please log in to play', {
        fontSize: '20px',
        color: '#ffffff',
      }).setOrigin(0.5);

      const loginButton = this.add.rectangle(width / 2, height / 2 + 50, 200, 50, 0x4CAF50)
        .setInteractive({ useHandCursor: true });
      
      this.add.text(width / 2, height / 2 + 50, 'Go to Login', {
        fontSize: '16px',
        color: '#ffffff',
      }).setOrigin(0.5);

      loginButton.on('pointerdown', () => {
        this.scene.start(SCENE_KEYS.AUTH_SCENE);
      });
    }
  }

  private createGameButtons() {
    // Create game menu buttons for authenticated users
    const { width, height } = this.scale;
    
    // Example: Start game button
    const startButton = this.add.rectangle(width / 2, height / 2 + 100, 200, 50, 0x2196F3)
      .setInteractive({ useHandCursor: true });
    
    this.add.text(width / 2, height / 2 + 100, 'Start Game', {
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5);

    startButton.on('pointerdown', () => {
      // Navigate to game scene
      this.scene.start(SCENE_KEYS.GAME_SCENE);
    });
  }
}

/**
 * Example: Preload Scene with Auth Check
 * 
 * Check authentication before loading game assets
 */
export class PreloadWithAuthScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadWithAuthScene' });
  }

  preload() {
    // Check auth before preloading
    if (!isUserAuthenticated()) {
      console.log('⚠️ Authentication required for this content');
      this.scene.start(SCENE_KEYS.AUTH_SCENE);
      return;
    }

    // Proceed with asset loading
    // this.load.image('key', 'path/to/image.png');
  }

  create() {
    // Scene is only created if user is authenticated
    console.log('✅ Loading authenticated content...');
  }
}