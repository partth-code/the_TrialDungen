import * as Phaser from 'phaser';
import { ASSET_KEYS } from '../../common/assets';
import { CustomGameObject, Position } from '../../common/types';
import { InteractiveObjectComponent } from '../../components/game-object/interactive-object-component';
import { INTERACTIVE_OBJECT_TYPE } from '../../common/common';
import { DataManager } from '../../common/data-manager';

export class Sage extends Phaser.Physics.Arcade.Sprite implements CustomGameObject {
  #position: Position;
  #roomId: number;
  #hasInteracted: boolean = false;

  constructor(scene: Phaser.Scene, position: Position, roomId: number) {
    super(scene, position.x, position.y, ASSET_KEYS.SAGE);

    // add object to scene and enable phaser physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Set up sprite properties
    this.setOrigin(0, 1).setImmovable(true).setDepth(1);
    
    // Scale down Sage to a smaller size (32x32 pixels max)
    const texture = this.scene.textures.get(ASSET_KEYS.SAGE);
    if (texture) {
      const maxSize = 32; // Maximum size for the sage sprite
      const scale = Math.min(maxSize / texture.source[0].width, maxSize / texture.source[0].height);
      this.setScale(scale);
    } else {
      // Default scale if texture not loaded yet
      this.setScale(0.3);
    }
    
    // Set physics body size to match scaled sprite (24x24 for collision)
    if (this.body) {
      const bodySize = 24;
      (this.body as Phaser.Physics.Arcade.Body).setSize(bodySize, bodySize);
    }

    // keep track of original position
    this.#position = { x: position.x, y: position.y };
    this.#roomId = roomId;

    // add interactive component for player interaction
    new InteractiveObjectComponent(
      this,
      INTERACTIVE_OBJECT_TYPE.AUTO,
      () => true,
      () => {
        this.interact();
      },
    );

    // disable physics body and make game objects inactive/not visible initially
    this.disableObject();
  }

  get roomId(): number {
    return this.#roomId;
  }

  get hasInteracted(): boolean {
    return this.#hasInteracted;
  }

  public disableObject(): void {
    // disable body on game object so we stop triggering the collision
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
    // make not visible until player re-enters room
    this.active = false;
    this.visible = false;
  }

  public enableObject(): void {
    // enable body on game object so we trigger the collision
    (this.body as Phaser.Physics.Arcade.Body).enable = true;
    // make visible to the player
    this.active = true;
    this.visible = true;
  }

  public interact(): void {
    if (this.#hasInteracted) {
      return;
    }

    console.log('Sage interact() called');
    this.#hasInteracted = true;
    
    // Set flag in DataManager that sage has been unlocked
    DataManager.instance.updateSageUnlocked(this.#roomId, true);
    
    // Scene transition is handled by GameScene in the collision callback
  }
}
