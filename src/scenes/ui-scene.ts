import * as Phaser from 'phaser';
import { SCENE_KEYS } from './scene-keys';
import { ASSET_KEYS, HEART_ANIMATIONS, HEART_TEXTURE_FRAME } from '../common/assets';
import { DataManager } from '../common/data-manager';
import { CUSTOM_EVENTS, EVENT_BUS, PLAYER_HEALTH_UPDATE_TYPE, PlayerHealthUpdated } from '../common/event-bus';
import { DEFAULT_UI_TEXT_STYLE } from '../common/common';
import { sendMessageToGemini } from '../services/gemini-service';

export class UiScene extends Phaser.Scene {
  #hudContainer!: Phaser.GameObjects.Container;
  #hearts!: Phaser.GameObjects.Sprite[];
  #dialogContainer!: Phaser.GameObjects.Container;
  #dialogContainerText!: Phaser.GameObjects.Text;
  
  // Chat UI elements
  #chatIconButton!: Phaser.GameObjects.Container;
  #chatPanel!: Phaser.GameObjects.Container;
  #chatPanelBackground!: Phaser.GameObjects.Rectangle;
  #chatMessagesContainer!: Phaser.GameObjects.Container;
  #chatInputField!: HTMLInputElement;
  #chatSendButton!: Phaser.GameObjects.Container;
  #chatCloseButton!: Phaser.GameObjects.Container;
  #chatLoadingIndicator!: Phaser.GameObjects.Container;
  #isChatOpen: boolean = false;
 
  #escKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({
      key: SCENE_KEYS.UI_SCENE,
    });
  }

  public create(): void {
    // create main hud
    this.#hudContainer = this.add.container(0, 0, []);
    this.#hearts = [];

    const numberOfHearts = Math.floor(DataManager.instance.data.maxHealth / 2);
    const numberOfFullHearts = Math.floor(DataManager.instance.data.currentHealth / 2);
    const hasHalfHeart = DataManager.instance.data.currentHealth % 2 === 1;
    for (let i = 0; i < 20; i += 1) {
      let x = 157 + 8 * i;
      let y = 25;
      if (i >= 10) {
        x = 157 + 8 * (i - 10);
        y = 33;
      }
      let frame: string = HEART_TEXTURE_FRAME.NONE;
      if (i < numberOfFullHearts) {
        frame = HEART_TEXTURE_FRAME.FULL;
      } else if (i < numberOfHearts) {
        frame = HEART_TEXTURE_FRAME.EMPTY;
      }
      if (hasHalfHeart && i === numberOfFullHearts) {
        frame = HEART_TEXTURE_FRAME.HALF;
      }
      this.#hearts.push(this.add.sprite(x, y, ASSET_KEYS.HUD_NUMBERS, frame).setOrigin(0));
    }
    this.#hudContainer.add(this.#hearts);

    this.#dialogContainer = this.add.container(32, 142, [this.add.image(0, 0, ASSET_KEYS.UI_DIALOG, 0).setOrigin(0)]);
    this.#dialogContainerText = this.add.text(14, 14, '', DEFAULT_UI_TEXT_STYLE).setOrigin(0);
    this.#dialogContainer.add(this.#dialogContainerText);
    this.#dialogContainer.visible = false;

    // Initialize chat UI
    this.#createChatIcon();
    this.#createChatPanel();

    // Setup ESC key for closing chat
    if (this.input.keyboard) {
      this.#escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    }

    // register event listeners
    EVENT_BUS.on(CUSTOM_EVENTS.PLAYER_HEALTH_UPDATED, this.updateHealthInHud, this);
    EVENT_BUS.on(CUSTOM_EVENTS.SHOW_DIALOG, this.showDialog, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EVENT_BUS.off(CUSTOM_EVENTS.PLAYER_HEALTH_UPDATED, this.updateHealthInHud, this);
      EVENT_BUS.off(CUSTOM_EVENTS.SHOW_DIALOG, this.showDialog, this);
    });
  }

  public update(): void {
    // Handle ESC key to close chat
    if (this.#escKey && Phaser.Input.Keyboard.JustDown(this.#escKey) && this.#isChatOpen) {
      this.#closeChat();
    }
  }

  public async updateHealthInHud(data: PlayerHealthUpdated): Promise<void> {
    if (data.type === PLAYER_HEALTH_UPDATE_TYPE.INCREASE) {
      // if player has increased their health, picking up hearts, new heart container, fairy, etc.,
      // need to update their health here
      return;
    }

    // play animation for losing hearts depending on the amount of health lost
    const healthDifference = data.previousHealth - data.currentHealth;
    let health = data.previousHealth;
    for (let i = 0; i < healthDifference; i += 1) {
      const heartIndex = Math.round(health / 2) - 1;
      const isHalfHeart = health % 2 === 1;
      let animationName = HEART_ANIMATIONS.LOSE_LAST_HALF;
      if (!isHalfHeart) {
        animationName = HEART_ANIMATIONS.LOSE_FIRST_HALF;
      }
      await new Promise((resolve) => {
        this.#hearts[heartIndex].play(animationName);
        this.#hearts[heartIndex].once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + animationName, () => {
          resolve(undefined);
        });
      });
      health -= 1;
    }
  }

  public showDialog(message: string): void {
    this.#dialogContainer.visible = true;
    this.#dialogContainerText.setText(message);

    // Auto-close dialog after 5 seconds (or 3 seconds for backward compatibility with other dialogs)
    const timeout = message.includes("You've crossed the second gate") ? 5000 : 3000;
    this.time.delayedCall(timeout, () => {
      this.#dialogContainer.visible = false;
      EVENT_BUS.emit(CUSTOM_EVENTS.DIALOG_CLOSED);
    });
  }

 /**
   * Creates the chat icon button in the top-right corner using the new bot asset
   */
  #createChatIcon(): void {
    const { width } = this.scale;
    const iconX = width - 40; // Shifted slightly for better visibility
    const iconY = 40;

    // 1. Create a Glowing Background Circle (Gemini Style)
    const iconBg = this.add.circle(iconX, iconY, 18, 0x1a73e8, 0.9);
    iconBg.setStrokeStyle(2, 0x4285f4);
    iconBg.setInteractive({ useHandCursor: true });
    iconBg.setScrollFactor(0);

    // 2. Add the Blue Robot Icon Sprite
    const botSprite = this.add.image(iconX, iconY, 'gemini-bot');
    botSprite.setScale(0.12); // Adjust this value based on your image resolution
    botSprite.setScrollFactor(0);

    // 3. Hover effects (Visual Feedback)
    iconBg.on('pointerover', () => {
      this.tweens.add({
        targets: [iconBg, botSprite],
        scale: 1.1,
        duration: 100
      });
      iconBg.setFillStyle(0x4285f4, 1);
    });

    iconBg.on('pointerout', () => {
      this.tweens.add({
        targets: [iconBg, botSprite],
        scale: 1,
        duration: 100
      });
      iconBg.setFillStyle(0x1a73e8, 0.9);
    });

    // 4. Click handler to toggle the panel
    iconBg.on('pointerdown', () => {
      this.#toggleChat();
    });

    this.#chatIconButton = this.add.container(0, 0, [iconBg, botSprite]);
    this.#chatIconButton.setDepth(1000);
    this.#chatIconButton.setScrollFactor(0);
  }

  /**
   * Creates the chat panel UI
   */
  #createChatPanel(): void {
    const { width, height } = this.scale;
    const panelWidth = Math.min(width * 0.85, 400);
    const panelHeight = height * 0.7;
    const panelX = width; // Start off-screen to the right
    const panelY = height / 2;

    // Create panel container
    this.#chatPanel = this.add.container(panelX, panelY);
    this.#chatPanel.setDepth(2000); // Above everything
    this.#chatPanel.setVisible(false);
    this.#chatPanel.setScrollFactor(0); // Fixed to camera

    // Semi-transparent dark background
    this.#chatPanelBackground = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x0a0a1a, 0.95);
    this.#chatPanelBackground.setStrokeStyle(3, 0x4a90e2);
    this.#chatPanelBackground.setScrollFactor(0); // Fixed to camera

    // Title
    const titleText = this.add.text(0, -panelHeight / 2 + 15, 'Ancient Guide', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#4a90e2',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    titleText.setScrollFactor(0); // Fixed to camera

    // Close button
    const closeButtonBg = this.add.rectangle(panelWidth / 2 - 15, -panelHeight / 2 + 15, 30, 30, 0x2a2a4e, 0.8);
    closeButtonBg.setStrokeStyle(2, 0x4a90e2);
    closeButtonBg.setInteractive({ useHandCursor: true });
    closeButtonBg.setScrollFactor(0); // Fixed to camera
    const closeButtonText = this.add.text(panelWidth / 2 - 15, -panelHeight / 2 + 15, '×', {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);
    closeButtonText.setScrollFactor(0); // Fixed to camera
    
    closeButtonBg.on('pointerover', () => closeButtonBg.setFillStyle(0x3a3a5e, 0.9));
    closeButtonBg.on('pointerout', () => closeButtonBg.setFillStyle(0x2a2a4e, 0.8));
    closeButtonBg.on('pointerdown', () => this.#closeChat());

    this.#chatCloseButton = this.add.container(0, 0, [closeButtonBg, closeButtonText]);
    this.#chatCloseButton.setScrollFactor(0); // Fixed to camera

    // Messages container (scrollable area)
    const messagesAreaHeight = panelHeight - 120;
    const messagesBg = this.add.rectangle(0, -20, panelWidth - 20, messagesAreaHeight, 0x000000, 0.5);
    messagesBg.setStrokeStyle(1, 0x333333);
    messagesBg.setScrollFactor(0); // Fixed to camera
    
    this.#chatMessagesContainer = this.add.container(0, -20);
    this.#chatMessagesContainer.setSize(panelWidth - 20, messagesAreaHeight);
    this.#chatMessagesContainer.setScrollFactor(0); // Fixed to camera

    // Add welcome message
    this.#addChatMessage('assistant', 'Greetings, seeker. I am an ancient spirit bound to these halls. Ask me of the trials ahead, and I shall guide you...', false);

    // Input field (using DOM element for better text input)
    const inputY = panelHeight / 2 - 50;
    const inputWidth = panelWidth - 60;
    
    // Create DOM input element
    const inputElement = document.createElement('input');
    inputElement.type = 'text';
    inputElement.style.position = 'absolute';
    inputElement.style.width = `${inputWidth}px`;
    inputElement.style.height = '30px';
    inputElement.style.padding = '5px 10px';
    inputElement.style.backgroundColor = '#1a1a2e';
    inputElement.style.color = '#ffffff';
    inputElement.style.border = '2px solid #4a90e2';
    inputElement.style.borderRadius = '4px';
    inputElement.style.fontSize = '14px';
    inputElement.style.fontFamily = 'Arial';
    inputElement.style.outline = 'none';
    inputElement.placeholder = 'Ask the ancient guide...';
    inputElement.maxLength = 200;
    
    // Position input element
    const inputX = (width - panelWidth) / 2;
    const inputTop = height / 2 + inputY - 15;
    inputElement.style.left = `${inputX + 30}px`;
    inputElement.style.top = `${inputTop}px`;
    
    this.#chatInputField = inputElement;
    document.body.appendChild(inputElement);
    inputElement.style.display = 'none';

    // Send button
    const sendButtonBg = this.add.rectangle(panelWidth / 2 - 30, inputY, 80, 30, 0x4a90e2, 0.9);
    sendButtonBg.setStrokeStyle(2, 0x6ab0f2);
    sendButtonBg.setInteractive({ useHandCursor: true });
    sendButtonBg.setScrollFactor(0); // Fixed to camera
    const sendButtonText = this.add.text(panelWidth / 2 - 30, inputY, 'Send', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    sendButtonText.setScrollFactor(0); // Fixed to camera
    
    sendButtonBg.on('pointerover', () => sendButtonBg.setFillStyle(0x6ab0f2, 1));
    sendButtonBg.on('pointerout', () => sendButtonBg.setFillStyle(0x4a90e2, 0.9));
    sendButtonBg.on('pointerdown', () => this.#sendMessage());

    this.#chatSendButton = this.add.container(0, 0, [sendButtonBg, sendButtonText]);
    this.#chatSendButton.setScrollFactor(0); // Fixed to camera

    // Loading indicator (hidden by default)
    const loadingBg = this.add.rectangle(0, 0, 40, 40, 0x000000, 0.8);
    loadingBg.setScrollFactor(0); // Fixed to camera
    const loadingText = this.add.text(0, 0, '...', {
      fontSize: '20px',
      color: '#4a90e2',
    }).setOrigin(0.5);
    loadingText.setScrollFactor(0); // Fixed to camera
    this.#chatLoadingIndicator = this.add.container(panelWidth / 2 - 30, inputY, [loadingBg, loadingText]);
    this.#chatLoadingIndicator.setVisible(false);
    this.#chatLoadingIndicator.setScrollFactor(0); // Fixed to camera

    // Add Enter key handler for input field
    inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.#isChatOpen) {
        this.#sendMessage();
      }
    });

    // Add all elements to panel container
    this.#chatPanel.add([
      this.#chatPanelBackground,
      titleText,
      this.#chatCloseButton,
      messagesBg,
      this.#chatMessagesContainer,
      this.#chatSendButton,
      this.#chatLoadingIndicator,
    ]);
  }

  /**
   * Toggles the chat panel open/closed
   */
  #toggleChat(): void {
    if (this.#isChatOpen) {
      this.#closeChat();
    } else {
      this.#openChat();
    }
  }

  /**
   * Opens the chat panel with slide animation
   */
  #openChat(): void {
    if (this.#isChatOpen) return;
    
    this.#isChatOpen = true;
    this.#chatPanel.setVisible(true);
    
    const { width, height } = this.scale;
    const panelWidth = Math.min(width * 0.85, 400);
    const panelHeight = height * 0.7;
    const targetX = width / 2;
    const inputY = panelHeight / 2 - 50;
    const inputX = (width - panelWidth) / 2;
    const inputTop = height / 2 + inputY - 15;

    // Update input field position
    this.#chatInputField.style.display = 'block';
    this.#chatInputField.style.left = `${inputX + 30}px`;
    this.#chatInputField.style.top = `${inputTop}px`;
    this.#chatInputField.focus();

    // Slide in animation
    this.tweens.add({
      targets: this.#chatPanel,
      x: targetX,
      duration: 300,
      ease: 'Power2',
    });

    // Emit event for game scene to disable input
    EVENT_BUS.emit(CUSTOM_EVENTS.CHAT_OPENED);
  }

  /**
   * Closes the chat panel with slide animation
   */
  #closeChat(): void {
    if (!this.#isChatOpen) return;
    
    this.#isChatOpen = false;
    this.#chatInputField.style.display = 'none';
    this.#chatInputField.blur();
    this.#chatInputField.value = '';

    const { width } = this.scale;
    const targetX = width + 200; // Slide off-screen

    // Slide out animation
    this.tweens.add({
      targets: this.#chatPanel,
      x: targetX,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.#chatPanel.setVisible(false);
      },
    });

    // Emit event for game scene to enable input
    EVENT_BUS.emit(CUSTOM_EVENTS.CHAT_CLOSED);
  }

  /**
   * Sends a message to the chatbot
   */
  async #sendMessage(): Promise<void> {
    const message = this.#chatInputField.value.trim();
    if (!message || this.#chatLoadingIndicator.visible) return;

    // Add user message to UI
    this.#addChatMessage('user', message, true);
    this.#chatInputField.value = '';

    // Show loading indicator
    this.#chatLoadingIndicator.setVisible(true);
    this.#chatSendButton.setVisible(false);

    try {
      // Send to Gemini API
      const response = await sendMessageToGemini(message);
      
      
      
      // Add assistant response to UI
      this.#addChatMessage('assistant', response, true);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error && error.message.includes('API key')
        ? 'The ancient guide cannot be summoned. The mystical connection requires proper configuration.'
        : 'The ancient spirit seems distant... Try again when the mystical energies align.';
      this.#addChatMessage('assistant', errorMessage, true);
    } finally {
      // Hide loading indicator
      this.#chatLoadingIndicator.setVisible(false);
      this.#chatSendButton.setVisible(true);
      this.#chatInputField.focus();
    }
  }

  /**
   * Adds a message to the chat UI
   */
  #addChatMessage(role: 'user' | 'assistant', content: string, animate: boolean = false): void {
    const { width } = this.scale;
    const panelWidth = Math.min(width * 0.85, 400);
    const messageWidth = panelWidth - 60;
    const messagePadding = 10;
    
    // Calculate position (messages stack from top)
    const existingMessages = this.#chatMessagesContainer.list.filter(
      (obj) => obj instanceof Phaser.GameObjects.Container
    ) as Phaser.GameObjects.Container[];
    const messageY = -this.#chatMessagesContainer.height / 2 + 20 + existingMessages.length * 60;

    // Create message container
    const messageContainer = this.add.container(0, messageY);
    
    // Message background (different colors for user vs assistant)
    const bgColor = role === 'user' ? 0x2a4a6e : 0x1a2a3a;
    const bgX = role === 'user' ? messageWidth / 2 - 20 : -messageWidth / 2 + 20;
    const messageBg = this.add.rectangle(bgX, 0, messageWidth - 40, 50, bgColor, 0.8);
    messageBg.setStrokeStyle(1, role === 'user' ? 0x4a90e2 : 0x6a8a9a);
    messageBg.setScrollFactor(0); // Fixed to camera

    // Message text
    const messageText = this.add.text(bgX, 0, content, {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#e0e0e0',
      wordWrap: { width: messageWidth - 60 },
      align: 'left',
    }).setOrigin(0.5);
    messageText.setScrollFactor(0); // Fixed to camera

    messageContainer.add([messageBg, messageText]);
    this.#chatMessagesContainer.add(messageContainer);

    // Scroll to bottom
    this.#scrollChatToBottom();

    // Animate message appearance
    if (animate) {
      messageContainer.setAlpha(0);
      this.tweens.add({
        targets: messageContainer,
        alpha: 1,
        duration: 200,
      });
    }
  }

  /**
   * Scrolls chat messages to the bottom
   */
  #scrollChatToBottom(): void {
    const messages = this.#chatMessagesContainer.list.filter(
      (obj) => obj instanceof Phaser.GameObjects.Container
    ) as Phaser.GameObjects.Container[];
    
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const containerHeight = this.#chatMessagesContainer.height;
    const lastMessageY = lastMessage.y + 30; // Add some padding
    
    // If messages overflow, adjust container position
    if (lastMessageY > containerHeight / 2) {
      const offset = lastMessageY - containerHeight / 2 + 20;
      messages.forEach((msg) => {
        msg.y -= offset;
      });
    }
  }
}
