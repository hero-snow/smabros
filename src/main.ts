import Phaser from 'phaser';
import { CharSelectScene } from './scenes/CharSelectScene';
import { StageSelectScene } from './scenes/StageSelectScene';
import { MainScene } from './scenes/MainScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 600,
  parent: 'app',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 600
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 800 },
      debug: false
    }
  },
  scene: [CharSelectScene, StageSelectScene, MainScene]
};

new Phaser.Game(config);
