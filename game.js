/* =========================================================
   FLAPPY ERAS — CLEAN MVP (Phaser 3) w/ REAL SPRITES
   + COINS (coin.png) + REAL SHOP SCREEN (buy/unlock characters)

   ✅ THIS UPDATE:
   - REMOVED moving clouds
   - SHOP: no REFRESH button (only BACK)
   - SHOP: characters a bit smaller (preview + card icons)
   - Coins: collect when ANY part of character touches coin (sensor)
   ========================================================= */

const GAME_W = 420;
const GAME_H = 640;

// --- Easy scale tuning
const SCALES = {
  MENU_PREVIEW: 0.28,
  SELECT_PREVIEW: 0.30,
  SELECT_ICON: 0.05,
  PLAYER: 0.15,
  HITBOX: 0.70
};

// Thicker voxel pipes
const PILLAR_WIDTH_MULT = 1.9;

// Registry keys
const REG = {
  CHARACTER: "character",
  HIGH_SCORE: "highScore",
  COINS: "coins",
  UNLOCKED: "unlocked",
};

// Characters
const CHARACTERS = [
  { key: "dino",  name: "Dino",  file: "small_dino_101.png" },
  { key: "bird",  name: "Bird",  file: "small_duck_101.png" },
  { key: "robot", name: "Robot", file: "small_cyborg_101.png" },
  { key: "cat",   name: "Cat",   file: "small_cat_101.png" },
  { key: "alien", name: "Alien", file: "small_alien_101.png" },
];

// Shop prices
const CHARACTER_COSTS = {
  dino: 0,
  bird: 25,
  robot: 60,
  cat: 40,
  alien: 80
};

// LocalStorage keys
const LS_KEYS = {
  COINS: "flappyEras_coins",
  UNLOCKED: "flappyEras_unlocked",
};

function loadCoins() {
  return Number(localStorage.getItem(LS_KEYS.COINS) || 0);
}
function saveCoins(n) {
  localStorage.setItem(LS_KEYS.COINS, String(n));
}
function loadUnlocked() {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_KEYS.UNLOCKED) || '["dino"]');
    return Array.isArray(arr) && arr.length ? arr : ["dino"];
  } catch {
    return ["dino"];
  }
}
function saveUnlocked(arr) {
  localStorage.setItem(LS_KEYS.UNLOCKED, JSON.stringify(arr));
}

// Eras
const ERAS = [
  { key: "prehistoric", name: "Prehistoric", bgKey: "bg_prehistoric", bgFile: "prehistoric_voxel.png" },
  { key: "medieval",    name: "Medieval",    bgKey: "bg_medieval",    bgFile: "medieval_voxel.png" },
  { key: "cyberpunk",   name: "Cyberpunk",   bgKey: "bg_cyberpunk",   bgFile: "cyberpunk_voxel.png" },
  { key: "space",       name: "Space",       bgKey: "bg_space",       bgFile: "space_voxel.png" }
];

/* =========================================================
   BOOT SCENE
   ========================================================= */
function BootScene() { Phaser.Scene.call(this, { key: "BootScene" }); }
BootScene.prototype = Object.create(Phaser.Scene.prototype);
BootScene.prototype.constructor = BootScene;

BootScene.prototype.preload = function () {
  CHARACTERS.forEach(c => this.load.image(c.key, c.file));
  ERAS.forEach(e => this.load.image(e.bgKey, e.bgFile));

  ERAS.forEach(e => {
    this.load.image(`${e.key}_pillar_top`,    `${e.key}_pillar_top.png`);
    this.load.image(`${e.key}_pillar_mid`,    `${e.key}_pillar_mid.png`);
    this.load.image(`${e.key}_pillar_bottom`, `${e.key}_pillar_bottom.png`);
  });

  this.load.image("coin", "coin.png");
};

BootScene.prototype.create = function () {
  this.scene.start("MenuScene");
};

/* =========================================================
   PHASER CONFIG
   ========================================================= */
const config = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_W,
    height: GAME_H
  },

  physics: {
    default: "arcade",
    arcade: { gravity: { y: 900 }, debug: false }
  },

  scene: [BootScene, MenuScene, CharacterSelectScene, ShopScene, PlayScene, GameOverScene]
};
new Phaser.Game(config);

/* =========================================================
   MENU SCENE
   ========================================================= */
function MenuScene() { Phaser.Scene.call(this, { key: "MenuScene" }); }
MenuScene.prototype = Object.create(Phaser.Scene.prototype);
MenuScene.prototype.constructor = MenuScene;

MenuScene.prototype.create = function () {
  const { width, height } = this.scale;

  if (!this.registry.has(REG.CHARACTER)) this.registry.set(REG.CHARACTER, "dino");
  if (!this.registry.has(REG.HIGH_SCORE)) this.registry.set(REG.HIGH_SCORE, 0);
  if (!this.registry.has(REG.COINS)) this.registry.set(REG.COINS, loadCoins());
  if (!this.registry.has(REG.UNLOCKED)) this.registry.set(REG.UNLOCKED, loadUnlocked());

  this.add.rectangle(width/2, height/2, width, height, 0x0e0e14);

  this.add.text(width/2, 110, "FLAPPY ERAS", {
    fontFamily: "Arial Black", fontSize: "46px", color: "#ffffff",
    stroke: "#7cf5ff", strokeThickness: 6
  }).setOrigin(0.5);

  this.add.text(width/2, 160, "Glide through time.", {
    fontFamily: "Arial", fontSize: "18px", color: "#cfcfe8"
  }).setOrigin(0.5);

  const selectedKey = this.registry.get(REG.CHARACTER);
  const charObj = CHARACTERS.find(c => c.key === selectedKey) || CHARACTERS[0];

  const preview = this.add.sprite(width/2, 270, charObj.key)
    .setScale(SCALES.MENU_PREVIEW);

  this.tweens.add({
    targets: preview,
    y: preview.y + 8,
    duration: 700,
    yoyo: true,
    repeat: -1
  });

  this.add.text(width/2, 330, `Selected: ${charObj.name}`, {
    fontFamily: "Arial Black", fontSize: "18px", color: "#ffffff"
  }).setOrigin(0.5);

  const playBtn = makeButton(this, width/2, 405, 220, 60, 0x44dd77, "PLAY");
  playBtn.on("pointerup", () => this.scene.start("PlayScene"));

  const selectBtn = makeButton(this, width/2, 480, 220, 50, 0x5599ff, "SELECT");
  selectBtn.on("pointerup", () => this.scene.start("CharacterSelectScene"));

  const shopBtn = makeButton(this, width/2, 540, 220, 50, 0xffd34d, "SHOP");
  shopBtn.on("pointerup", () => this.scene.start("ShopScene"));

  const hs = this.registry.get(REG.HIGH_SCORE);
  this.add.text(width/2, 595, `High Score: ${hs}`, {
    fontFamily: "Arial Black", fontSize: "16px", color: "#ffef85"
  }).setOrigin(0.5);

  const coins = this.registry.get(REG.COINS) || 0;
  this.add.text(width/2, 620, `Coins: ${coins}`, {
    fontFamily: "Arial Black", fontSize: "14px", color: "#ffd66b"
  }).setOrigin(0.5);
};

/* =========================================================
   CHARACTER SELECT SCENE
   ========================================================= */
function CharacterSelectScene() { Phaser.Scene.call(this, { key: "CharacterSelectScene" }); }
CharacterSelectScene.prototype = Object.create(Phaser.Scene.prototype);
CharacterSelectScene.prototype.constructor = CharacterSelectScene;

CharacterSelectScene.prototype.create = function () {
  const { width, height } = this.scale;

  this.add.rectangle(width/2, height/2, width, height, 0x13131b);

  this.add.text(width/2, 80, "SELECT CHARACTER", {
    fontFamily: "Arial Black", fontSize: "24px", color: "#ffffff"
  }).setOrigin(0.5);

  const unlocked = this.registry.get(REG.UNLOCKED) || ["dino"];
  const ownedChars = CHARACTERS.filter(c => unlocked.includes(c.key));
  const coins = this.registry.get(REG.COINS) || 0;

  this.add.text(width/2, 120, `Coins: ${coins}`, {
    fontFamily: "Arial Black", fontSize: "18px", color: "#ffd66b"
  }).setOrigin(0.5);

  let selectedKey = this.registry.get(REG.CHARACTER);
  if (!unlocked.includes(selectedKey)) selectedKey = "dino";
  let selectedObj = CHARACTERS.find(c => c.key === selectedKey) || CHARACTERS[0];

  const preview = this.add.sprite(width/2, 230, selectedObj.key)
    .setScale(SCALES.SELECT_PREVIEW);

  const nameText = this.add.text(width/2, 330, selectedObj.name, {
    fontFamily: "Arial Black", fontSize: "20px", color: "#ffffff"
  }).setOrigin(0.5);

  const msg = this.add.text(width/2, 360, "Only owned characters show here.", {
    fontFamily: "Arial", fontSize: "12px", color: "#cfcfe8"
  }).setOrigin(0.5).setAlpha(0.9);

  const iconSprites = [];
  const count = ownedChars.length;
  const spacing = 60;
  const startX = width/2 - ((count - 1) * spacing)/2;
  const yRow = 440;

  ownedChars.forEach((c, i) => {
    const bg = this.add.rectangle(startX + i*spacing, yRow, 52, 52, 0x000000)
      .setStrokeStyle(c.key === selectedKey ? 4 : 2, 0xffffff);

    const icon = this.add.sprite(bg.x, bg.y, c.key)
      .setScale(SCALES.SELECT_ICON)
      .setInteractive({ useHandCursor: true });

    iconSprites.push({ bg, icon });

    icon.on("pointerup", () => {
      selectedKey = c.key;
      selectedObj = c;
      this.registry.set(REG.CHARACTER, selectedKey);

      preview.setTexture(c.key);
      nameText.setText(c.name);

      iconSprites.forEach(o => o.bg.setStrokeStyle(2, 0xffffff));
      bg.setStrokeStyle(4, 0xffffff);
      msg.setText(`Selected ${c.name}`);
    });
  });

  const shopBtn = makeButton(this, width/2, 520, 240, 60, 0xffd34d, "GO TO SHOP");
  shopBtn.on("pointerup", () => this.scene.start("ShopScene"));

  const backBtn = makeButton(this, width/2, 590, 160, 45, 0x666677, "BACK");
  backBtn.on("pointerup", () => this.scene.start("MenuScene"));
};

/* =========================================================
   SHOP SCENE (NO REFRESH BUTTON)
   ========================================================= */
function ShopScene() { Phaser.Scene.call(this, { key: "ShopScene" }); }
ShopScene.prototype = Object.create(Phaser.Scene.prototype);
ShopScene.prototype.constructor = ShopScene;

ShopScene.prototype.create = function () {
  const { width, height } = this.scale;

  this.add.rectangle(width/2, height/2, width, height, 0x101016);

  this.add.text(width/2, 58, "SHOP", {
    fontFamily: "Arial Black", fontSize: "34px", color: "#ffffff",
    stroke: "#000000", strokeThickness: 6
  }).setOrigin(0.5);

  const coinsText = this.add.text(width/2, 95, "", {
    fontFamily: "Arial Black", fontSize: "18px", color: "#ffd66b"
  }).setOrigin(0.5);

  const msg = this.add.text(width/2, 120, "", {
    fontFamily: "Arial", fontSize: "14px", color: "#cfcfe8"
  }).setOrigin(0.5).setAlpha(0.95);

  const refreshHud = () => {
    const coins = this.registry.get(REG.COINS) || 0;
    coinsText.setText(`Coins: ${coins}`);
  };
  refreshHud();

  // Preview (smaller)
  const selectedKey = this.registry.get(REG.CHARACTER) || "dino";
  const selectedObj = CHARACTERS.find(c => c.key === selectedKey) || CHARACTERS[0];

  const preview = this.add.sprite(width/2, 235, selectedObj.key);

  const PREVIEW_BOX_W = width * 0.66;
  const PREVIEW_BOX_H = 170;
  const fitPreview = () => {
    const s = Math.min(PREVIEW_BOX_W / preview.width, PREVIEW_BOX_H / preview.height);
    preview.setScale(s);
  };
  fitPreview();

  const previewName = this.add.text(width/2, 328, selectedObj.name, {
    fontFamily: "Arial Black", fontSize: "20px", color: "#ffffff"
  }).setOrigin(0.5);

  // Grid
  const cols = 3;
  const cellW = 132;
  const cellH = 105;
  const cardW = 118;
  const cardH = 100;
  const gridTop = 395;

  const renderCard = (c, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx = width/2 + (col - 1) * cellW;
    const cy = gridTop + row * cellH;

    const card = this.add.rectangle(cx, cy, cardW, cardH, 0x000000, 0.35)
      .setStrokeStyle(2, 0xffffff);

    // icon (smaller)
    const icon = this.add.sprite(cx, cy - 25, c.key);
    const iconMaxW = cardW * 0.50;
    const iconMaxH = cardH * 0.38;
    const iconScale = Math.min(iconMaxW / icon.width, iconMaxH / icon.height);
    icon.setScale(iconScale);

    // name
    this.add.text(cx, cy + 4, c.name, {
      fontFamily: "Arial Black", fontSize: "12px", color: "#ffffff"
    }).setOrigin(0.5);

    const cost = CHARACTER_COSTS[c.key] ?? 0;

    // price
    const priceText = this.add.text(cx, cy + 22, "", {
      fontFamily: "Arial Black", fontSize: "12px", color: "#ffd66b"
    }).setOrigin(0.5);

    // button inside card (no hover grow)
    const btn = makeButton(this, cx, cy + 42, 92, 22, 0xffd34d, "BUY", {
      fontSize: 12,
      hoverScale: 1.0
    });

    const updateCard = () => {
      const coins = this.registry.get(REG.COINS) || 0;
      const unlocked = this.registry.get(REG.UNLOCKED) || ["dino"];
      const owned = unlocked.includes(c.key);

      if (owned) {
        icon.clearTint();
        card.setStrokeStyle(2, 0x44dd77);
        btn.text.setText("SELECT");
        priceText.setText("OWNED");
      } else {
        icon.setTint(0x777777);
        card.setStrokeStyle(2, 0xffffff);
        btn.text.setText("BUY");
        priceText.setText(`${cost} coins`);
      }

      btn.setAlpha(!owned && coins < cost ? 0.7 : 1);
    };

    btn.on("pointerup", () => {
      let coins = this.registry.get(REG.COINS) || 0;
      let unlocked = this.registry.get(REG.UNLOCKED) || ["dino"];
      const owned = unlocked.includes(c.key);

      if (owned) {
        this.registry.set(REG.CHARACTER, c.key);
        preview.setTexture(c.key);
        fitPreview();
        previewName.setText(c.name);
        msg.setText(`Selected ${c.name}`);
        return;
      }

      if (coins < cost) {
        msg.setText(`Not enough coins. Need ${cost - coins} more.`);
        return;
      }

      coins -= cost;
      unlocked = [...unlocked, c.key];

      this.registry.set(REG.COINS, coins);
      this.registry.set(REG.UNLOCKED, unlocked);
      saveCoins(coins);
      saveUnlocked(unlocked);

      msg.setText(`Unlocked ${c.name}!`);
      refreshHud();
      updateCard();
    });

    const previewThis = () => {
      preview.setTexture(c.key);
      fitPreview();
      previewName.setText(c.name);
      msg.setText(`Previewing ${c.name}`);
    };

    card.setInteractive({ useHandCursor: true }).on("pointerup", previewThis);
    icon.setInteractive({ useHandCursor: true }).on("pointerup", previewThis);

    updateCard();
    return updateCard;
  };

  CHARACTERS.forEach((c, i) => renderCard(c, i));

  // ONLY BACK button
  const backBtn = makeButton(this, width/2, 623, 170, 34, 0x666677, "BACK", {
    fontSize: 16,
    hoverScale: 1.02
  });

  backBtn.on("pointerup", () => this.scene.start("MenuScene"));
};

/* =========================================================
   PLAY SCENE
   ========================================================= */
function PlayScene() { Phaser.Scene.call(this, { key: "PlayScene" }); }
PlayScene.prototype = Object.create(Phaser.Scene.prototype);
PlayScene.prototype.constructor = PlayScene;

PlayScene.prototype.create = function () {
  const { width, height } = this.scale;

  this.isGameOver = false;
  this.hasStarted = false;
  this.score = 0;

  this.basePipeSpeed = 185;
  this.maxPipeSpeed = 255;
  this.basePipeGap = 200;
  this.minPipeGap = 150;
  this.basePipeSpawnDelay = 1500;
  this.minPipeSpawnDelay = 1200;
  this.firstPipeDelay = 1100;
  this.jumpVelocity = -305;
  this.fallJumpVelocity = -335;

  this.pipeSpeed = this.basePipeSpeed;
  this.pipeGap = this.basePipeGap;
  this.pipeSpawnDelay = this.basePipeSpawnDelay;
  this.pipeTimer = null;

  this.eraIndex = 0;
  this.applyEraVisuals();

  // Pipe body texture for invisible collision boxes
  if (!this.textures.exists("pipeBodyTex")) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 1, 1);
    g.generateTexture("pipeBodyTex", 1, 1);
    g.destroy();
  }

  const selectedKey = this.registry.get(REG.CHARACTER) || "dino";
  const charObj = CHARACTERS.find(c => c.key === selectedKey) || CHARACTERS[0];

  this.player = this.physics.add.sprite(110, height/2, charObj.key);
  this.player.setScale(SCALES.PLAYER);
  this.player.body.setCollideWorldBounds(true);
  this.player.body.setAllowGravity(false);
  this.player.body.setVelocity(0, 0);

  // pipes: slightly smaller hitbox
  this.player.body.setSize(
    this.player.displayWidth * SCALES.HITBOX,
    this.player.displayHeight * SCALES.HITBOX,
    true
  );

  // coin sensor: FULL character size so ANY part touching coin collects it
  this.coinSensor = this.physics.add.sprite(this.player.x, this.player.y, "pipeBodyTex").setAlpha(0);
  this.coinSensor.body.setAllowGravity(false);
  this.coinSensor.body.setImmovable(true);
  this.coinSensor.body.setSize(this.player.displayWidth, this.player.displayHeight, true);

  this.pipes = this.physics.add.group({ allowGravity: false, immovable: true });
  this.coins = this.physics.add.group({ allowGravity: false, immovable: true });

  this.scoreText = this.add.text(width/2, 40, "0", {
    fontFamily: "Arial Black", fontSize: "40px", color: "#ffffff",
    stroke: "#000000", strokeThickness: 6
  }).setOrigin(0.5);

  this.eraText = this.add.text(width/2, 80, ERAS[this.eraIndex].name, {
    fontFamily: "Arial Black", fontSize: "16px", color: "#ffffff"
  }).setOrigin(0.5).setAlpha(0.8);

  this.coinCount = this.registry.get(REG.COINS) || 0;
  this.coinText = this.add.text(14, 14, `Coins: ${this.coinCount}`, {
    fontFamily: "Arial Black", fontSize: "18px", color: "#ffd66b",
    stroke: "#000000", strokeThickness: 4
  }).setOrigin(0, 0);

  this.startPromptBg = this.add.rectangle(width/2, height - 120, 280, 80, 0x000000, 0.42)
    .setStrokeStyle(2, 0xffffff, 0.35);

  this.startPrompt = this.add.text(width/2, height - 120, "Tap to Start\nPress Space to Start", {
    fontFamily: "Arial Black",
    fontSize: "22px",
    color: "#ffffff",
    align: "center",
    stroke: "#000000",
    strokeThickness: 6
  }).setOrigin(0.5);

  this.startPromptBg.setDepth(4);
  this.startPrompt.setDepth(5);

  this.idleFloatTween = this.tweens.add({
    targets: this.player,
    y: this.player.y + 12,
    duration: 900,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut"
  });

  this.startPromptTween = this.tweens.add({
    targets: [this.startPromptBg, this.startPrompt],
    alpha: 0.72,
    duration: 850,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut"
  });

  this.input.on("pointerdown", () => {
    this.handleFlapInput();
  });

  this.input.keyboard.on("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
      this.handleFlapInput();
    }
  });

  this.physics.add.overlap(this.player, this.pipes, () => this.triggerGameOver(), null, this);
  this.physics.add.overlap(this.coinSensor, this.coins, this.collectCoin, null, this);

  this.groundY = height - 40;
  this.ground = this.add.rectangle(width/2, this.groundY, width, 80, 0x000000).setAlpha(0);
  this.physics.add.existing(this.ground, true);
  this.physics.add.collider(this.player, this.ground, () => this.triggerGameOver());
};

PlayScene.prototype.update = function () {
  if (this.isGameOver) return;

  // keep sensor glued to player
  this.coinSensor.x = this.player.x;
  this.coinSensor.y = this.player.y;

  if (!this.hasStarted) {
    this.player.rotation = -0.12;
    return;
  }

  const vy = this.player.body.velocity.y;
  this.player.rotation = Phaser.Math.Clamp(vy / 700, -0.5, 0.85);

  this.pipes.getChildren().forEach(pipe => {
    if (pipe.visual) pipe.visual.x = pipe.x;

    if (pipe.isTop && !pipe.scored && pipe.x + pipe.displayWidth < this.player.x) {
      pipe.scored = true;
      this.incrementScore();
    }

    if (pipe.x < -100) {
      if (pipe.visual) pipe.visual.destroy();
      pipe.destroy();
    }
  });

  this.coins.getChildren().forEach(c => {
    if (c.x < -120) {
      if (c._bobTween) c._bobTween.stop();
      c.destroy();
    }
  });
};

PlayScene.prototype.handleFlapInput = function () {
  if (this.isGameOver) return;

  if (!this.hasStarted) this.startRun();

  const currentVelocity = this.player.body.velocity.y;
  let nextVelocity = this.jumpVelocity;

  if (currentVelocity > 140) {
    nextVelocity = this.fallJumpVelocity;
  } else if (currentVelocity < -180) {
    nextVelocity = -285;
  }

  this.player.body.setVelocityY(nextVelocity);

  if (this.player.y > this.player.displayHeight / 2 + 10) {
    this.player.y -= 2;
  }
};

PlayScene.prototype.startRun = function () {
  if (this.hasStarted) return;
  this.hasStarted = true;

  if (this.idleFloatTween) {
    this.idleFloatTween.stop();
    this.idleFloatTween = null;
  }

  if (this.startPromptTween) {
    this.startPromptTween.stop();
    this.startPromptTween = null;
  }

  this.player.body.reset(this.player.x, this.player.y);
  this.player.body.setAllowGravity(true);

  this.tweens.add({
    targets: [this.startPromptBg, this.startPrompt],
    alpha: 0,
    duration: 180,
    onComplete: () => {
      if (this.startPromptBg) this.startPromptBg.destroy();
      if (this.startPrompt) this.startPrompt.destroy();
      this.startPromptBg = null;
      this.startPrompt = null;
    }
  });

  this.scheduleNextPipe(this.firstPipeDelay);
};

PlayScene.prototype.scheduleNextPipe = function (delay) {
  if (!this.hasStarted || this.isGameOver) return;

  if (this.pipeTimer) {
    this.pipeTimer.remove();
    this.pipeTimer = null;
  }

  this.pipeTimer = this.time.delayedCall(delay, () => {
    this.pipeTimer = null;
    if (this.isGameOver) return;
    this.spawnPipePair();
    this.scheduleNextPipe(this.pipeSpawnDelay);
  });
};

PlayScene.prototype.refreshDifficulty = function () {
  const rampProgress = Phaser.Math.Clamp((this.score - 5) / 30, 0, 1);
  const easedProgress = 1 - Math.pow(1 - rampProgress, 1.35);

  this.pipeSpeed = Math.round(Phaser.Math.Linear(this.basePipeSpeed, this.maxPipeSpeed, easedProgress));
  this.pipeGap = Math.round(Phaser.Math.Linear(this.basePipeGap, this.minPipeGap, easedProgress));
  this.pipeSpawnDelay = Math.round(Phaser.Math.Linear(this.basePipeSpawnDelay, this.minPipeSpawnDelay, easedProgress));

  this.pipes.getChildren().forEach(pipe => {
    if (pipe.body) pipe.body.setVelocityX(-this.pipeSpeed);
  });

  this.coins.getChildren().forEach(coin => {
    if (coin.body) coin.body.setVelocityX(-this.pipeSpeed);
  });
};

PlayScene.prototype.incrementScore = function () {
  this.score++;
  this.scoreText.setText(this.score);

  if (this.score % 15 === 0) this.switchEra();
  this.refreshDifficulty();
};

PlayScene.prototype.spawnPipePair = function () {
  const { width, height } = this.scale;
  const era = ERAS[this.eraIndex];
  const eraKey = era.key;

  const halfGap = this.pipeGap / 2;
  const centerY = Phaser.Math.Between(130 + halfGap, height - 140 - halfGap);

  const topH = Math.max(centerY - halfGap, 20);
  const botY = centerY + halfGap;
  const botH = Math.max(height - botY - 40, 20);

  const PIPE_W = 60;
  const VISUAL_W = PIPE_W * PILLAR_WIDTH_MULT;

  const topBody = this.pipes.create(width + 60, topH / 2, "pipeBodyTex")
    .setDisplaySize(PIPE_W, topH)
    .setOrigin(0.5)
    .setAlpha(0);
  topBody.body.setVelocityX(-this.pipeSpeed);

  const bottomBody = this.pipes.create(width + 60, botY + botH / 2, "pipeBodyTex")
    .setDisplaySize(PIPE_W, botH)
    .setOrigin(0.5)
    .setAlpha(0);
  bottomBody.body.setVelocityX(-this.pipeSpeed);

  const topVisual = buildVoxelPipe(this, eraKey, VISUAL_W, topH, true);
  topVisual.x = topBody.x;
  topVisual.y = topH;

  const bottomVisual = buildVoxelPipe(this, eraKey, VISUAL_W, botH, false);
  bottomVisual.x = bottomBody.x;
  bottomVisual.y = botY;

  topBody.visual = topVisual;
  bottomBody.visual = bottomVisual;

  topBody.isTop = true;
  bottomBody.isTop = false;
  topBody.scored = false;
  bottomBody.scored = false;

  const coinSpawnChance = 0.7;
  if (Math.random() < coinSpawnChance) {
    const coinYMin = topH + 45;
    const coinYMax = botY - 45;

    if (coinYMax > coinYMin) {
      const coinY = Phaser.Math.Between(coinYMin, coinYMax);

      const coin = this.coins.create(width + 60, coinY, "coin");
      coin.setScale(0.10);
      coin.body.setAllowGravity(false);

      coin.body.setSize(
        Math.max(40, coin.displayWidth * 2.0),
        Math.max(40, coin.displayHeight * 2.0),
        true
      );

      coin.body.setVelocityX(-this.pipeSpeed);

      coin._bobTween = this.tweens.add({
        targets: coin,
        y: coin.y - 8,
        duration: 600,
        yoyo: true,
        repeat: -1
      });
    }
  }
};

PlayScene.prototype.collectCoin = function (sensor, coin) {
  if (!coin || !coin.active) return;

  if (coin._bobTween) {
    coin._bobTween.stop();
    coin._bobTween = null;
  }

  coin.destroy();

  this.coinCount = (this.coinCount || 0) + 1;
  this.registry.set(REG.COINS, this.coinCount);
  saveCoins(this.coinCount);

  if (this.coinText) {
    this.coinText.setText(`Coins: ${this.coinCount}`);
  }
};

PlayScene.prototype.applyEraVisuals = function () {
  const { width, height } = this.scale;
  const era = ERAS[this.eraIndex];

  if (this.bg) {
    this.bg.destroy();
  }

  this.bg = this.add.image(width / 2, height / 2, era.bgKey);

  const scaleX = width / this.bg.width;
  const scaleY = height / this.bg.height;
  const scale = Math.max(scaleX, scaleY);

  this.bg.setScale(scale);
  this.bg.setDepth(-10);

  if (this.eraText) {
    this.eraText.setText(era.name);
  }
};

PlayScene.prototype.switchEra = function () {
  this.eraIndex = (this.eraIndex + 1) % ERAS.length;
  this.applyEraVisuals();
};

PlayScene.prototype.triggerGameOver = function () {
  if (this.isGameOver) return;
  this.isGameOver = true;

  this.physics.pause();
  if (this.pipeTimer) this.pipeTimer.remove();

  const hs = this.registry.get(REG.HIGH_SCORE);
  if (this.score > hs) this.registry.set(REG.HIGH_SCORE, this.score);

  this.time.delayedCall(600, () => {
    this.scene.start("GameOverScene", { score: this.score });
  });
};

PlayScene.prototype.applyEraVisuals = function () {
  const { width, height } = this.scale;
  const era = ERAS[this.eraIndex];

  if (this.bg) {
    this.bg.destroy();
  }

  this.bg = this.add.image(width / 2, height / 2, era.bgKey);

  const scaleX = width / this.bg.width;
  const scaleY = height / this.bg.height;
  const scale = Math.max(scaleX, scaleY);

  this.bg.setScale(scale);
  this.bg.setDepth(-10);

  if (this.eraText) {
    this.eraText.setText(era.name);
  }
};

PlayScene.prototype.switchEra = function () {
  this.eraIndex = (this.eraIndex + 1) % ERAS.length;
  this.applyEraVisuals();

if (this.eraText) {
  this.eraText.setText(era.name);
}
};
/* =========================================================
   GAME OVER SCENE
   ========================================================= */
function GameOverScene() { Phaser.Scene.call(this, { key: "GameOverScene" }); }
GameOverScene.prototype = Object.create(Phaser.Scene.prototype);
GameOverScene.prototype.constructor = GameOverScene;

GameOverScene.prototype.init = function (data) {
  this.finalScore = data.score || 0;
};

GameOverScene.prototype.create = function () {
  const { width, height } = this.scale;

  this.add.rectangle(width/2, height/2, width, height, 0x0d0d12);

  this.add.text(width/2, 140, "YOU TIME-LAPSED!", {
    fontFamily: "Arial Black",
    fontSize: "30px",
    color: "#ff7777",
    stroke: "#000000",
    strokeThickness: 6
  }).setOrigin(0.5);

  const hs = this.registry.get(REG.HIGH_SCORE);
  const coins = this.registry.get(REG.COINS) || 0;

  this.add.text(width/2, 230, `Score: ${this.finalScore}`, {
    fontFamily: "Arial Black", fontSize: "24px", color: "#ffffff"
  }).setOrigin(0.5);

  this.add.text(width/2, 270, `Best: ${hs}`, {
    fontFamily: "Arial Black", fontSize: "18px", color: "#ffef85"
  }).setOrigin(0.5);

  this.add.text(width/2, 300, `Coins: ${coins}`, {
    fontFamily: "Arial Black", fontSize: "16px", color: "#ffd66b"
  }).setOrigin(0.5);

  const replayBtn = makeButton(this, width/2, 360, 220, 60, 0x44dd77, "REPLAY");
  replayBtn.on("pointerup", () => this.scene.start("PlayScene"));

  const charBtn = makeButton(this, width/2, 435, 240, 55, 0x5599ff, "SELECT");
  charBtn.on("pointerup", () => this.scene.start("CharacterSelectScene"));

  const shopBtn = makeButton(this, width/2, 500, 240, 55, 0xffd34d, "SHOP");
  shopBtn.on("pointerup", () => this.scene.start("ShopScene"));

  const menuBtn = makeButton(this, width/2, 565, 160, 45, 0x666677, "MENU");
  menuBtn.on("pointerup", () => this.scene.start("MenuScene"));
};

/* =========================================================
   BUTTON MAKER (supports options)
   ========================================================= */
function makeButton(scene, x, y, w, h, color, label, opts = {}) {
  const hoverScale = typeof opts.hoverScale === "number" ? opts.hoverScale : 1.05;
  const fontSize = typeof opts.fontSize === "number" ? opts.fontSize : 18;
  const textColor = opts.textColor || "#000000";

  const btnBg = scene.add.rectangle(x, y, w, h, color)
    .setStrokeStyle(4, 0xffffff)
    .setInteractive({ useHandCursor: true });

  const btnText = scene.add.text(x, y, label, {
    fontFamily: "Arial Black",
    fontSize: `${fontSize}px`,
    color: textColor
  }).setOrigin(0.5);

  if (hoverScale !== 1.0) {
    btnBg.on("pointerover", () => btnBg.setScale(hoverScale));
    btnBg.on("pointerout", () => btnBg.setScale(1));
  }

  btnBg.text = btnText;
  return btnBg;
}

/* =========================================================
   VOXEL PIPE BUILDER
   ========================================================= */
function buildVoxelPipe(scene, eraKey, targetWidth, height, isTopPipe) {
  const topKey = `${eraKey}_pillar_top`;
  const midKey = `${eraKey}_pillar_mid`;
  const botKey = `${eraKey}_pillar_bottom`;

  const container = scene.add.container(0, 0);

  const topCap = scene.add.sprite(0, 0, topKey);
  const botCap = scene.add.sprite(0, 0, botKey);

  const wScaleTop = targetWidth / topCap.width;
  const wScaleBot = targetWidth / botCap.width;

  topCap.setScale(wScaleTop);
  botCap.setScale(wScaleBot);

  const topCapH = topCap.displayHeight;
  const botCapH = botCap.displayHeight;

  topCap.y = topCapH / 2;
  botCap.y = height - botCapH / 2;

  container.add(topCap);
  container.add(botCap);

  const midProbe = scene.add.sprite(0, 0, midKey);
  const wScaleMid = targetWidth / midProbe.width;
  midProbe.setScale(wScaleMid);
  const midH = midProbe.displayHeight;
  midProbe.destroy();

  const yStart = topCapH;
  const yEnd = height - botCapH;

  for (let y = yStart; y < yEnd; y += midH) {
    const mid = scene.add.sprite(0, y + midH / 2, midKey).setScale(wScaleMid);
    container.add(mid);
  }

  if (isTopPipe) container.scaleY = -1;

  container.setDepth(2);
  return container;
}
