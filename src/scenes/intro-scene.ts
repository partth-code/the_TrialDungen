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

    // 1. Setup Backgrounds
    this.cameras.main.setBackgroundColor('#050510');
    this.createStarfield(width, height);
    this.createNeonGrid(width, height);

    // 2. COMPACT CARD (Reduced height to 50% to ensure space for title/button)
    const cardWidth = width * 0.65;
    const cardHeight = height * 0.50; 
    const cardX = width / 2;
    const cardY = height / 2;

    const card = this.add.graphics();
    card.fillStyle(0x0a0a1a, 0.9);
    card.fillRoundedRect(cardX - cardWidth / 2, cardY - cardHeight / 2, cardWidth, cardHeight, 12);
    card.lineStyle(2, 0x00ffff, 1);
    card.strokeRoundedRect(cardX - cardWidth / 2, cardY - cardHeight / 2, cardWidth, cardHeight, 12);

    // 3. TITLE: Anchored ABOVE the card (Top)
    const title = this.add.text(
      width / 2,
      cardY - cardHeight / 2 - 30, // Fixed 45px gap above card
      'THE TRIALDUNGEON',
      {
        fontFamily: 'Arial Black',
        fontSize: '15px', 
        padding: { top: 4},
        color: '#00ff88',
        align: 'center',
        lineSpacing: 2
      }
    ).setOrigin(0.5);
    title.setShadow(0, 0, '#00ff88', 8, true, true);

    // 4. INSTRUCTIONS: Centered INSIDE the card
    const instructions = [
      '• Arrows to Move',
      '• Arr+X to pick and throw the pot',
      '• Z to attack',
      '• Talk to Sages with S',
      '• Gain Knowledge & Power',
      '• Defeat the Darkness'
    ];

    // FontSize reduced to 10px to fit without bleeding out
    this.add.text(cardX, cardY, instructions.join('\n\n'), {
      fontFamily: 'Courier New',
      fontSize: '10px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: -4
    }).setOrigin(0.5);

    // 5. BUTTON: Anchored BELOW the card (Bottom)
    const startBtn = this.createNeonButton(
      width / 2,
      cardY + cardHeight / 2 + 30, // Fixed 45px gap below card
      'START JOURNEY'
    );

    // 6. Navigation
    const startAction = () => this.startGame();
    startBtn.on('pointerdown', startAction);
    if (this.input.keyboard) {
        this.input.keyboard.once('keydown-SPACE', startAction);
    }

    // Add a simple footer
    this.add.text(width / 2, height - 10, '(Press SPACE to Begin)', {
      fontFamily: 'Arial',
      fontSize: '9px',
      color: '#444466'
    }).setOrigin(0.5);
  }

  // 🔘 Neon Style Button
  private createNeonButton(x: number, y: number, label: string) {
    const btnWidth = 140;
    const btnHeight = 30;
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 1);
    bg.lineStyle(2, 0xff00ff, 1);
    bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10);
    bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10);

    const btnText = this.add.text(0, 0, label, {
      fontFamily: 'Arial Black',
      fontSize: '10px',
      color: '#ffffff'
    }).setOrigin(0.5);

    container.add([bg, btnText]);
    container.setSize(btnWidth, btnHeight);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      container.setScale(1.05);
      bg.lineStyle(3, 0x00ffff, 1).strokeRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, 10);
    });

    container.on('pointerout', () => {
      container.setScale(1);
      bg.clear().fillStyle(0x000000, 1).lineStyle(2, 0xff00ff, 1);
      bg.fillRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, 10);
      bg.strokeRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, 10);
    });

    return container;
  }

  // ✨ Animated Starfield
  private createStarfield(width: number, height: number): void {
    for (let i = 0; i < 60; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 2),
        0xffffff,
        0.7
      );
      this.tweens.add({
        targets: star,
        alpha: 0.2,
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1
      });
    }
  }

  // 🔷 Neon Background Grid
  private createNeonGrid(width: number, height: number): void {
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x00ffff, 0.05);
    for (let x = 0; x < width; x += 60) grid.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 60) grid.lineBetween(0, y, width, y);
  }

  private startGame(): void {
    const sceneData: LevelData = {
      level: DataManager.instance.data.currentArea.name || 'Level 1',
      roomId: DataManager.instance.data.currentArea.startRoomId || 'room-01',
      doorId: DataManager.instance.data.currentArea.startDoorId || 'door-01',
    } as any;
    this.scene.start(SCENE_KEYS.GAME_SCENE, sceneData);
    this.scene.launch(SCENE_KEYS.UI_SCENE);
  }
}
