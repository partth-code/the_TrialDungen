import Phaser from 'phaser';
import { SCENE_KEYS } from './scene-keys';
import { DataManager } from '../common/data-manager';
import { LevelData } from '../common/types';

export class IntroScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.INTRO_SCENE);
  }

  create(): void {
    const { width, height } = this.scale;

    // 1. Background
    this.cameras.main.setBackgroundColor('#1a1a2e');
    
    // 2. Add the UI Image (bg-image.png)
    // Positioned in the middle-upper section
    const introImg = this.add.image(width / 2, height * 0.38, 'bg-image');
    introImg.setOrigin(0.5);
    
    // Scale image to fit canvas width with padding
    const maxWidth = width * 0.8;
    const maxHeight = height * 0.3;
    const scaleX = maxWidth / introImg.width;
    const scaleY = maxHeight / introImg.height;
    const scale = Math.min(scaleX, scaleY);
    introImg.setScale(scale);


    // 3. Title - Scaled down from 72px to 38px to fit the width
    const titleText = this.add.text(width / 2, height * 0.18, 'THE TRIAL\nDUNGEON', {
  fontFamily: 'Arial Black',
  fontSize: '30px',
  fontStyle: 'bold',
  color: '#00ff88',
  stroke: '#000000',
  strokeThickness: 5,
  align: 'center',
  lineSpacing: 4,
}).setOrigin(0.5);


    // 4. Subtitle - Positioned below the image
   this.add.text(width / 2, height * 0.62, 'Descend into the darkness...', {
  fontFamily: 'Arial',
  fontSize: '9px',
  color: '#aaaaaa',
  fontStyle: 'italic',
}).setOrigin(0.5);


    // 5. Play Button - Positioned near the bottom
    const playButton = this.createButton(width / 2, height * 0.78, 'PLAY GAME');


    playButton.on('pointerdown', () => {
      const sceneData: LevelData = {
        level: DataManager.instance.data.currentArea.name || 'Level 1',
        roomId: DataManager.instance.data.currentArea.startRoomId || 'room-01',
        doorId: DataManager.instance.data.currentArea.startDoorId || 'door-01',
      } as any;

      this.scene.start(SCENE_KEYS.GAME_SCENE, sceneData);
      this.scene.launch(SCENE_KEYS.UI_SCENE);
    });

    // Subtler pulse animation
    this.tweens.add({
      targets: titleText,
      scale: 1.04,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
  

  private createButton(x: number, y: number, text: string): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, text, {
      fontFamily: 'Arial Black',
      fontSize: '9px', 
      color: '#ffffff',
      backgroundColor: '#aac5b5',
      padding: { x: 20, y: 10 },
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      button.setBackgroundColor('#be6937').setColor('#000000').setScale(1.05);
    });

    button.on('pointerout', () => {
      button.setBackgroundColor('#81bd22').setColor('#ffffff').setScale(1);
    });

    return button;
  }
}