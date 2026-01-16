
import * as Phaser from "phaser";


export default class MainLobbyScene extends Phaser.Scene {
  constructor() {
    super("MainLobbyScene");
  }

  create() {
    const { width, height } = this.scale;

    /* =====================
       BACKGROUND
    ====================== */
    this.add.rectangle(width / 2, height / 2, width, height, 0x0f172a);

    // subtle grid / ambience
    this.add.text(width / 2, height - 40, "Cyber Season Active", {
      fontSize: "16px",
      color: "#94a3b8",
    }).setOrigin(0.5);

    /* =====================
       PLAYER AVATAR
    ====================== */
    const player = this.add.circle(width * 0.35, height * 0.55, 36, 0x22d3ee);
    this.add.text(player.x, player.y + 55, "Player", {
      fontSize: "14px",
      color: "#e5e7eb",
    }).setOrigin(0.5);

    // idle animation
    this.tweens.add({
      targets: player,
      y: player.y - 6,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    /* =====================
       PET COMPANION
    ====================== */
    const pet = this.add.circle(width * 0.45, height * 0.55, 26, 0xa855f7);
    this.add.text(pet.x, pet.y + 45, "Rare Pet", {
      fontSize: "12px",
      color: "#c084fc",
    }).setOrigin(0.5);

    this.tweens.add({
      targets: pet,
      y: pet.y - 8,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    /* =====================
       PROFILE CARD
    ====================== */
    const profileBg = this.add.rectangle(120, 70, 220, 90, 0x020617, 0.8)
      .setOrigin(0);

    this.add.text(20, 20, "PlayerName", {
      fontSize: "16px",
      color: "#e5e7eb",
    });

    this.add.text(20, 40, "Level 3 · Sage Tier I", {
      fontSize: "13px",
      color: "#94a3b8",
    });

    this.add.text(20, 60, "Weapon: Lv 2", {
      fontSize: "13px",
      color: "#38bdf8",
    });

    /* =====================
       PRIMARY BUTTONS
    ====================== */
    this.createButton(width * 0.7, height * 0.45, "ENTER WORLD", () => {
      this.scene.start("WorldMapScene");
    });

    this.createButton(width * 0.7, height * 0.52, "TRIAL ROOMS", () => {
      this.scene.start("TrialRoomScene");
    });

    this.createButton(width * 0.7, height * 0.59, "ARENA", () => {
      this.scene.start("ArenaScene");
    });

    /* =====================
       SECONDARY BUTTONS
    ====================== */
    this.createSmallButton(width - 140, 30, "SCROLLS", () => {
      this.scene.start("ScrollLibraryScene");
    });

    this.createSmallButton(width - 140, 65, "SETTINGS", () => {
      console.log("Settings clicked");
    });

    /* =====================
       NARRATIVE LINE
    ====================== */
    this.add.text(width / 2, height - 80,
      "Cyber City stands… but the corruption spreads deeper.",
      {
        fontSize: "14px",
        color: "#cbd5f5",
      }
    ).setOrigin(0.5);
  }

  /* =====================
     BUTTON HELPERS
  ====================== */
  private createButton(x: number, y: number, label: string, onClick: () => void) {
    const btnBg = this.add.rectangle(x, y, 220, 42, 0x1e293b)
      .setInteractive({ useHandCursor: true });

    const btnText = this.add.text(x, y, label, {
      fontSize: "16px",
      color: "#e5e7eb",
    }).setOrigin(0.5);

    btnBg.on("pointerover", () => btnBg.setFillStyle(0x334155));
    btnBg.on("pointerout", () => btnBg.setFillStyle(0x1e293b));
    btnBg.on("pointerdown", onClick);
  }

  private createSmallButton(x: number, y: number, label: string, onClick: () => void) {
    const btnBg = this.add.rectangle(x, y, 110, 28, 0x020617, 0.85)
      .setInteractive({ useHandCursor: true })
      .setOrigin(0);

    const btnText = this.add.text(x + 55, y + 14, label, {
      fontSize: "12px",
      color: "#94a3b8",
    }).setOrigin(0.5);

    btnBg.on("pointerover", () => btnBg.setFillStyle(0x020617, 1));
    btnBg.on("pointerout", () => btnBg.setFillStyle(0x020617, 0.85));
    btnBg.on("pointerdown", onClick);
  }
}
