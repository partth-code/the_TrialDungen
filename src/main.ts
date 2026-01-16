import * as Phaser from 'phaser';
import { PreloadScene } from './scenes/preload-scene';
import { GameScene } from './scenes/game-scene';
import { UiScene } from './scenes/ui-scene';
import { GameOverScene } from './scenes/game-over-scene';
import { AuthScene } from './scenes/auth-scene';
import { LoadingScene } from './scenes/loading-scene';
import { IntroScene } from './scenes/intro-scene';

const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  pixelArt: true,
  scale: {
    parent: 'game-container',
    width: 256,
    height: 192,
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [PreloadScene,LoadingScene,AuthScene,IntroScene,GameScene, UiScene, GameOverScene],
  dom: {
    createContainer: true
},
};

new Phaser.Game(gameConfig);
