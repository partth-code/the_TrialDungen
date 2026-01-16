import Phaser from 'phaser';
import { SCENE_KEYS } from './scene-keys';
import { ASSET_PACK_KEYS } from '../common/assets';

export class LoadingScene extends Phaser.Scene {
    private progressBar!: Phaser.GameObjects.Graphics;
    private progressBox!: Phaser.GameObjects.Graphics;
    private loadingText!: Phaser.GameObjects.Text;
    private percentText!: Phaser.GameObjects.Text;
    private assetText!: Phaser.GameObjects.Text;

    constructor() {
        super(SCENE_KEYS.LOADING);
    }

    preload(): void {
        this.createLoadingUI();

        // -----------------------------------
        // ✅ LOAD REAL GAME ASSETS
        // -----------------------------------
        // Using your asset pack from previous code
        this.load.pack(ASSET_PACK_KEYS.MAIN, 'assets/data/assets.json');
        
        // (Optional) Keep a fallback if you don't have the json yet:
        // this.load.image('player', 'assets/sprites/player.png');

        // -----------------------------------
        // EVENTS
        // -----------------------------------
        this.load.on('progress', (value: number) => {
            this.percentText.setText(Math.floor(value * 100) + '%');
            this.progressBar.clear();
            this.progressBar.fillStyle(0xffffff, 1);
            this.progressBar.fillRect(this.cameras.main.width / 4 + 10, this.cameras.main.height / 2 - 20, (this.cameras.main.width / 2 - 20) * value, 30);
        });

        this.load.on('fileprogress', (file: Phaser.Loader.File) => {
            this.assetText.setText('Loading asset: ' + file.key);
        });

        this.load.on('complete', () => {
            this.cleanup();
            
            // ✅ FLOW: Go to Auth Scene next
            this.scene.start(SCENE_KEYS.AUTH_SCENE); 
        });
    }

    private createLoadingUI(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.progressBar = this.add.graphics();
        this.progressBox = this.add.graphics();
        this.progressBox.fillStyle(0x222222, 0.8);
        this.progressBox.fillRect(width / 4, height / 2 - 30, width / 2, 50);

        this.loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: { font: '20px monospace', color: '#ffffff' }
        }).setOrigin(0.5);

        this.percentText = this.make.text({
            x: width / 2,
            y: height / 2 - 5,
            text: '0%',
            style: { font: '18px monospace', color: '#ffffff' }
        }).setOrigin(0.5);

        this.assetText = this.make.text({
            x: width / 2,
            y: height / 2 + 50,
            text: '',
            style: { font: '18px monospace', color: '#ffffff' }
        }).setOrigin(0.5);
    }

    private cleanup(): void {
        this.progressBar.destroy();
        this.progressBox.destroy();
        this.loadingText.destroy();
        this.percentText.destroy();
        this.assetText.destroy();
    }
}