import Phaser from 'phaser';
import { SCENE_KEYS } from './scene-keys';
import { DataManager } from '../common/data-manager';
import { LevelData } from '../common/types';

export class IntroScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.INTRO_SCENE);
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    this.cameras.main.setBackgroundColor('#2c3e50');

    // Title
    const titleText = this.add.text(width / 2, height * 0.3, 'THE TRIAL DUNGEON', {
      fontFamily: 'Arial Black',
      fontSize: '64px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8,
      align: 'center',
    }).setOrigin(0.5);

    // Animation
    this.tweens.add({
      targets: titleText,
      scale: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Play Button
    const playButton = this.createButton(width / 2, height * 0.6, 'PLAY GAME');

    playButton.on('pointerdown', () => {
      // ✅ 1. Prepare Data (Optional, if you have DataManager set up)
      const sceneData: LevelData = {
          level: DataManager.instance.data.currentArea.name || 'Level 1',
          roomId: DataManager.instance.data.currentArea.startRoomId || 'room-01',
          doorId: DataManager.instance.data.currentArea.startDoorId || 'door-01',
      } as any;

      // ✅ 2. Start Game
      this.scene.start(SCENE_KEYS.GAME_SCENE, sceneData);
      
      // ✅ 3. Launch UI Overlay
      this.scene.launch(SCENE_KEYS.UI_SCENE); 
    });
  }

  private createButton(x: number, y: number, text: string): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, text, {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 },
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      button.setBackgroundColor('#555555');
      button.setScale(1.1);
    });

    button.on('pointerout', () => {
      button.setBackgroundColor('#333333');
      button.setScale(1);
    });

    return button;
  }
}