import * as Phaser from 'phaser';
import { SCENE_KEYS } from './scene-keys';
import { ASSET_KEYS, HEART_ANIMATIONS, HEART_TEXTURE_FRAME } from '../common/assets';
import { DataManager } from '../common/data-manager';
import { CUSTOM_EVENTS, EVENT_BUS, PLAYER_HEALTH_UPDATE_TYPE, PlayerHealthUpdated } from '../common/event-bus';
import { DEFAULT_UI_TEXT_STYLE } from '../common/common';
import { sendMessageToGemini} from '../services/gemini-service';

export class UiScene extends Phaser.Scene {
  #hudContainer!: Phaser.GameObjects.Container;
  #hearts!: Phaser.GameObjects.Sprite[];
  #dialogContainer!: Phaser.GameObjects.Container;
  #dialogContainerText!: Phaser.GameObjects.Text;
  #interactionHintText!: Phaser.GameObjects.Text;
  
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

    // Create interaction hint text (centered at bottom of screen)
    const { width, height } = this.scale;
    this.#interactionHintText = this.add.text(width / 2, height - 40, 'Press S to talk', {
      ...DEFAULT_UI_TEXT_STYLE,
      fontSize: 10,
      color: '#FFFF00',
      fontStyle: 'bold',
    }).setOrigin(0.5).setVisible(false);
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
    EVENT_BUS.on(CUSTOM_EVENTS.SHOW_INTERACTION_HINT, this.showInteractionHint, this);
    EVENT_BUS.on(CUSTOM_EVENTS.HIDE_INTERACTION_HINT, this.hideInteractionHint, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EVENT_BUS.off(CUSTOM_EVENTS.PLAYER_HEALTH_UPDATED, this.updateHealthInHud, this);
      EVENT_BUS.off(CUSTOM_EVENTS.SHOW_DIALOG, this.showDialog, this);
      EVENT_BUS.off(CUSTOM_EVENTS.SHOW_INTERACTION_HINT, this.showInteractionHint, this);
      EVENT_BUS.off(CUSTOM_EVENTS.HIDE_INTERACTION_HINT, this.hideInteractionHint, this);
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

  public showInteractionHint(): void {
    if (this.#interactionHintText) {
      this.#interactionHintText.setVisible(true);
    }
  }

  public hideInteractionHint(): void {
    if (this.#interactionHintText) {
      this.#interactionHintText.setVisible(false);
  /**
   * Creates the chat icon button in the top-right corner - Enhanced compact design
   */
  #createChatIcon(): void {
    const { width } = this.scale;
    const iconSize = 22;
    const iconX = width - 28;
    const iconY = 28;

    // Enhanced circular background with subtle styling
    const iconBg = this.add.circle(iconX, iconY, iconSize / 2, 0x1a1a2e, 0.95);
    iconBg.setStrokeStyle(1.5, 0x4a90e2, 0.8);
    iconBg.setInteractive({ useHandCursor: true });
    iconBg.setScrollFactor(0); // Fixed to camera

    // Enhanced chat icon using graphics (speech bubble design)
    const iconGraphics = this.add.graphics();
    iconGraphics.fillStyle(0xffffff);
    // Three dots (ellipsis) - smaller and tighter
    iconGraphics.fillCircle(iconX - 3, iconY - 2, 2.5); // Left dot
    iconGraphics.fillCircle(iconX, iconY - 2, 2.5); // Middle dot
    iconGraphics.fillCircle(iconX + 3, iconY - 2, 2.5); // Right dot
    // Small tail dot
    iconGraphics.fillCircle(iconX, iconY + 2, 1.5); // Bottom dot
    iconGraphics.setScrollFactor(0); // Fixed to camera

    // Enhanced hover effects with scale animation
    iconBg.on('pointerover', () => {
      iconBg.setFillStyle(0x2a3a4e, 1);
      iconBg.setStrokeStyle(1.5, 0x6ab0f2, 1);
      this.tweens.add({
        targets: iconBg,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 150,
        ease: 'Power2',
      });
    });
    iconBg.on('pointerout', () => {
      iconBg.setFillStyle(0x1a1a2e, 0.95);
      iconBg.setStrokeStyle(1.5, 0x4a90e2, 0.8);
      this.tweens.add({
        targets: iconBg,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Power2',
      });
    });

    // Click handler
    iconBg.on('pointerdown', () => {
      this.#toggleChat();
    });

    this.#chatIconButton = this.add.container(0, 0, [iconBg, iconGraphics]);
    this.#chatIconButton.setDepth(1000); // Ensure it's always on top
    this.#chatIconButton.setScrollFactor(0); // Fixed to camera
  }

  /**
   * Creates the chat panel UI - Enhanced compact design
   */
  #createChatPanel(): void {
    const { width, height } = this.scale;
    // Reduced panel size for better screen space usage
    const panelWidth = Math.min(width * 0.75, 350);
    const panelHeight = height * 0.65;
    const panelX = width; // Start off-screen to the right
    const panelY = height / 2;

    // Create panel container
    this.#chatPanel = this.add.container(panelX, panelY);
    this.#chatPanel.setDepth(2000); // Above everything
    this.#chatPanel.setVisible(false);
    this.#chatPanel.setScrollFactor(0); // Fixed to camera

    // Enhanced dark background with subtle gradient effect
    this.#chatPanelBackground = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x0a0a1a, 0.98);
    this.#chatPanelBackground.setStrokeStyle(2, 0x4a90e2, 0.8);
    this.#chatPanelBackground.setScrollFactor(0); // Fixed to camera

    // Inner border for depth
    const innerBorder = this.add.rectangle(0, 0, panelWidth - 4, panelHeight - 4, 0x1a1a2e, 0);
    innerBorder.setStrokeStyle(1, 0x2a3a4e, 0.5);
    innerBorder.setScrollFactor(0);

    // Compact title with smaller font
    const titleText = this.add.text(0, -panelHeight / 2 + 12, 'Ancient Guide', {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#6ab0f2',
      fontStyle: 'bold',
      
    }).setOrigin(0.5, 0);
    titleText.setScrollFactor(0); // Fixed to camera

    // Smaller, more compact close button
    const closeButtonBg = this.add.rectangle(panelWidth / 2 - 12, -panelHeight / 2 + 12, 24, 24, 0x2a2a4e, 0.9);
    closeButtonBg.setStrokeStyle(1, 0x4a90e2, 0.6);
    closeButtonBg.setInteractive({ useHandCursor: true });
    closeButtonBg.setScrollFactor(0); // Fixed to camera
    const closeButtonText = this.add.text(panelWidth / 2 - 12, -panelHeight / 2 + 12, '×', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    closeButtonText.setScrollFactor(0); // Fixed to camera
    
    closeButtonBg.on('pointerover', () => {
      closeButtonBg.setFillStyle(0x3a3a5e, 1);
      closeButtonBg.setStrokeStyle(1, 0x6ab0f2, 0.8);
    });
    closeButtonBg.on('pointerout', () => {
      closeButtonBg.setFillStyle(0x2a2a4e, 0.9);
      closeButtonBg.setStrokeStyle(1, 0x4a90e2, 0.6);
    });
    closeButtonBg.on('pointerdown', () => this.#closeChat());

    this.#chatCloseButton = this.add.container(0, 0, [closeButtonBg, closeButtonText]);
    this.#chatCloseButton.setScrollFactor(0); // Fixed to camera

    // Messages container (scrollable area) - more compact
    const messagesAreaHeight = panelHeight - 100;
    const messagesBg = this.add.rectangle(0, -10, panelWidth - 16, messagesAreaHeight, 0x000000, 0.6);
    messagesBg.setStrokeStyle(1, 0x1a2a3a, 0.8);
    messagesBg.setScrollFactor(0); // Fixed to camera
    
    this.#chatMessagesContainer = this.add.container(0, -10);
    this.#chatMessagesContainer.setSize(panelWidth - 16, messagesAreaHeight);
    this.#chatMessagesContainer.setScrollFactor(0); // Fixed to camera

    // Add welcome message with smaller text
    this.#addChatMessage('assistant', 'Greetings, seeker. I am the Ancient Guide, bound to these cursed halls. Ask me of the trials ahead, and I shall guide you...', false);

    // Input field (using DOM element for better text input) - compact design
    const inputY = panelHeight / 2 - 40;
    const inputWidth = panelWidth - 80;
    
    // Create DOM input element with smaller, enhanced styling
    const inputElement = document.createElement('input');
    inputElement.type = 'text';
    inputElement.style.position = 'absolute';
    inputElement.style.width = `${inputWidth}px`;
    inputElement.style.height = '26px';
    inputElement.style.padding = '4px 8px';
    inputElement.style.backgroundColor = '#0f0f1f';
    inputElement.style.color = '#e0e0e0';
    inputElement.style.border = '1px solid #3a4a5e';
    inputElement.style.borderRadius = '3px';
    inputElement.style.fontSize = '11px';
    inputElement.style.fontFamily = 'Arial, sans-serif';
    inputElement.style.outline = 'none';
    inputElement.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.3)';
    inputElement.placeholder = 'Ask the ancient guide...';
    inputElement.maxLength = 200;
    
    // Focus styles
    inputElement.addEventListener('focus', () => {
      inputElement.style.borderColor = '#4a90e2';
      inputElement.style.backgroundColor = '#1a1a2e';
    });
    inputElement.addEventListener('blur', () => {
      inputElement.style.borderColor = '#3a4a5e';
      inputElement.style.backgroundColor = '#0f0f1f';
    });
    
    // Position input element
    const inputX = (width - panelWidth) / 2;
    const inputTop = height / 2 + inputY - 13;
    inputElement.style.left = `${inputX + 25}px`;
    inputElement.style.top = `${inputTop}px`;
    
    this.#chatInputField = inputElement;
    document.body.appendChild(inputElement);
    inputElement.style.display = 'none';

    // Compact Send button
    const sendButtonBg = this.add.rectangle(panelWidth / 2 - 25, inputY, 60, 26, 0x4a90e2, 0.95);
    sendButtonBg.setStrokeStyle(1, 0x5aa0e2, 0.8);
    sendButtonBg.setInteractive({ useHandCursor: true });
    sendButtonBg.setScrollFactor(0); // Fixed to camera
    const sendButtonText = this.add.text(panelWidth / 2 - 25, inputY, 'Send', {
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold',
      
    }).setOrigin(0.5);
    sendButtonText.setScrollFactor(0); // Fixed to camera
    
    sendButtonBg.on('pointerover', () => {
      sendButtonBg.setFillStyle(0x5aa0e2, 1);
      sendButtonBg.setStrokeStyle(1, 0x6ab0f2, 1);
    });
    sendButtonBg.on('pointerout', () => {
      sendButtonBg.setFillStyle(0x4a90e2, 0.95);
      sendButtonBg.setStrokeStyle(1, 0x5aa0e2, 0.8);
    });
    sendButtonBg.on('pointerdown', () => this.#sendMessage());

    this.#chatSendButton = this.add.container(0, 0, [sendButtonBg, sendButtonText]);
    this.#chatSendButton.setScrollFactor(0); // Fixed to camera

    // Compact loading indicator (hidden by default)
    const loadingBg = this.add.rectangle(0, 0, 35, 26, 0x000000, 0.9);
    loadingBg.setStrokeStyle(1, 0x4a90e2, 0.6);
    loadingBg.setScrollFactor(0); // Fixed to camera
    const loadingText = this.add.text(0, 0, '...', {
      fontSize: '14px',
      color: '#6ab0f2',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    loadingText.setScrollFactor(0); // Fixed to camera
    this.#chatLoadingIndicator = this.add.container(panelWidth / 2 - 25, inputY, [loadingBg, loadingText]);
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
      innerBorder,
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
    const panelWidth = Math.min(width * 0.75, 350);
    const panelHeight = height * 0.65;
    const targetX = width / 2;
    const inputY = panelHeight / 2 - 40;
    const inputX = (width - panelWidth) / 2;
    const inputTop = height / 2 + inputY - 13;

    // Update input field position
    this.#chatInputField.style.display = 'block';
    this.#chatInputField.style.left = `${inputX + 25}px`;
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
      const response = await sendMessageToGemini(message );
      
      // Add to conversation history
      
      
      // Add assistant response to UI
      this.#addChatMessage('assistant', response, true);
    } catch (error) {
      console.error('Chat error:', error);
      
      this.#addChatMessage(
        'assistant',
        'The ancient guide grows silent… the arcane connection is disturbed.',
        true
      );

    } finally {
      // Hide loading indicator
      this.#chatLoadingIndicator.setVisible(false);
      this.#chatSendButton.setVisible(true);
      this.#chatInputField.focus();
    }
  }

  /**
   * Adds a message to the chat UI - Enhanced compact design
   */
  #addChatMessage(role: 'user' | 'assistant', content: string, animate: boolean = false): void {
    const { width } = this.scale;
    const panelWidth = Math.min(width * 0.75, 350);
    const messageWidth = panelWidth - 50;
    
    // Calculate position (messages stack from top with compact spacing)
    const existingMessages = this.#chatMessagesContainer.list.filter(
      (obj) => obj instanceof Phaser.GameObjects.Container
    ) as Phaser.GameObjects.Container[];
    const messageY = -this.#chatMessagesContainer.height / 2 + 12 + existingMessages.length * 45;

    // Create message container
    const messageContainer = this.add.container(0, messageY);
    
    // Message background (enhanced colors for better contrast)
    const bgColor = role === 'user' ? 0x2a4a6e : 0x1a2a3a;
    const borderColor = role === 'user' ? 0x4a90e2 : 0x5a8a9a;
    const bgX = role === 'user' ? messageWidth / 2 - 15 : -messageWidth / 2 + 15;
    
    // Compact message bubble
    const messageBg = this.add.rectangle(bgX, 0, messageWidth - 30, 40, bgColor, 0.85);
    messageBg.setStrokeStyle(1, borderColor, 0.6);
    messageBg.setScrollFactor(0); // Fixed to camera

    // Smaller, more readable message text
    const messageText = this.add.text(bgX, 0, content, {
      fontSize: '9px',
      fontFamily: 'Arial, sans-serif',
      color: '#e8e8e8',
      wordWrap: { width: messageWidth - 50 },
      align: 'left',
      lineSpacing: 2,
    }).setOrigin(0.5);
    messageText.setScrollFactor(0); // Fixed to camera

    messageContainer.add([messageBg, messageText]);
    this.#chatMessagesContainer.add(messageContainer);

    // Scroll to bottom
    this.#scrollChatToBottom();

    // Smooth fade-in animation
    if (animate) {
      messageContainer.setAlpha(0);
      this.tweens.add({
        targets: messageContainer,
        alpha: 1,
        duration: 150,
        ease: 'Power1',
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
