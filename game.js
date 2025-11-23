/* =========================================================
   FLAPPY ERAS — CLEAN MVP (Phaser 3) w/ REAL SPRITES
   ---------------------------------------------------------
   UPDATED:
   - Era backgrounds now use voxel PNGs per era
   - Background switches every era change
   - ✅ VOXEL PIPES: pillars built from top/mid/bottom slices per era
   - ✅ SCORE FIX: only TOP pipe scores, so 1 point per pair
   - ✅ WIDTH FIX: voxel pillars render thicker to match old pipes
   - Everything else unchanged
   ========================================================= */

const GAME_W = 420;
const GAME_H = 640;

// --- Easy scale tuning (change these if you want bigger/smaller)
const SCALES = {
  MENU_PREVIEW: 0.28,   // menu center preview
  SELECT_PREVIEW: 0.30, // big preview in select screen
  SELECT_ICON: 0.05,    // small icons row
  PLAYER: 0.15,         // in-game size
  HITBOX: 0.70          // fraction of displayed sprite size
};

// 🔥 Visual pillar thickness boost (fixes thin look from PNG padding)
const PILLAR_WIDTH_MULT = 1.9; 
// If you want even thicker, try 1.7. If too fat, try 1.35.

// --- Game-wide registry keys
const REG = {
  CHARACTER: "character",
  HIGH_SCORE: "highScore",
};

// --- Characters
const CHARACTERS = [
  { key: "dino",  name: "Dino",  file: "small_dino_101.png" },
  { key: "bird",  name: "Bird",  file: "small_duck_101.png" },
  { key: "robot", name: "Robot", file: "small_cyborg_101.png" },
  { key: "cat",   name: "Cat",   file: "small_cat_101.png" },
  { key: "alien", name: "Alien", file: "small_alien_101.png" },
];

// --- Eras (now with voxel background images)
const ERAS = [
  {
    key: "prehistoric",
    name: "Prehistoric",
    bgKey: "bg_prehistoric",
    bgFile: "prehistoric_voxel.png",
    obstacleColor: 0x3f7f2e
  },
  {
    key: "medieval",
    name: "Medieval",
    bgKey: "bg_medieval",
    bgFile: "medieval_voxel.png",
    obstacleColor: 0x6e6e6e
  },
  {
    key: "cyberpunk",
    name: "Cyberpunk",
    bgKey: "bg_cyberpunk",
    bgFile: "cyberpunk_voxel.png",
    obstacleColor: 0x9b4dff
  },
  {
    key: "space",
    name: "Space",
    bgKey: "bg_space",
    bgFile: "space_voxel.png",
    obstacleColor: 0xffffff
  },
];

/* =========================================================
   BOOT SCENE
   ========================================================= */
function BootScene() { Phaser.Scene.call(this, { key: "BootScene" }); }
BootScene.prototype = Object.create(Phaser.Scene.prototype);
BootScene.prototype.constructor = BootScene;

BootScene.prototype.preload = function () {
  // character sprites
  CHARACTERS.forEach(c => this.load.image(c.key, c.file));

  // voxel era backgrounds
  ERAS.forEach(e => this.load.image(e.bgKey, e.bgFile));

  // ✅ voxel pillar slices per era
  ERAS.forEach(e => {
    this.load.image(`${e.key}_pillar_top`,    `${e.key}_pillar_top.png`);
    this.load.image(`${e.key}_pillar_mid`,    `${e.key}_pillar_mid.png`);
    this.load.image(`${e.key}_pillar_bottom`, `${e.key}_pillar_bottom.png`);
  });
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
  physics: { default: "arcade", arcade: { gravity: { y: 900 }, debug: false }},
  scene: [BootScene, MenuScene, CharacterSelectScene, PlayScene, GameOverScene]
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

  this.add.rectangle(width/2, height/2, width, height, 0x0e0e14);

  this.add.text(width/2, 110, "FLAPPY ERAS", {
    fontFamily: "Arial Black", fontSize: "46px", color: "#ffffff",
    stroke: "#7cf5ff", strokeThickness: 6
  }).setOrigin(0.5);

  this.add.text(width/2, 160, "Glide through time.", {
    fontFamily: "Arial", fontSize: "18px", color: "#cfcfe8"
  }).setOrigin(0.5);

  const selectedKey = this.registry.get(REG.CHARACTER);
  const charObj = CHARACTERS.find(c => c.key === selectedKey);

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

  const playBtn = makeButton(this, width/2, 420, 220, 60, 0x44dd77, "PLAY");
  playBtn.on("pointerup", () => this.scene.start("PlayScene"));

  const selectBtn = makeButton(this, width/2, 500, 220, 50, 0x5599ff, "SELECT CHARACTER");
  selectBtn.on("pointerup", () => this.scene.start("CharacterSelectScene"));

  const hs = this.registry.get(REG.HIGH_SCORE);
  this.add.text(width/2, 580, `High Score: ${hs}`, {
    fontFamily: "Arial Black", fontSize: "16px", color: "#ffef85"
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

  this.add.text(width/2, 80, "CHOOSE YOUR CHARACTER", {
    fontFamily: "Arial Black", fontSize: "22px", color: "#ffffff"
  }).setOrigin(0.5);

  let selectedKey = this.registry.get(REG.CHARACTER);
  let selectedObj = CHARACTERS.find(c => c.key === selectedKey);

  const preview = this.add.sprite(width/2, 230, selectedObj.key)
    .setScale(SCALES.SELECT_PREVIEW);

  const nameText = this.add.text(width/2, 330, selectedObj.name, {
    fontFamily: "Arial Black", fontSize: "20px", color: "#ffffff"
  }).setOrigin(0.5);

  const startX = width/2 - 2*60;
  const yRow = 430;
  const iconSprites = [];

  CHARACTERS.forEach((c, i) => {
    const bg = this.add.rectangle(startX + i*60, yRow, 52, 52, 0x000000)
      .setStrokeStyle(c.key === selectedKey ? 4 : 2, 0xffffff);

    const icon = this.add.sprite(bg.x, bg.y, c.key)
      .setScale(SCALES.SELECT_ICON)
      .setInteractive({ useHandCursor: true });

    this.add.text(bg.x, bg.y + 34, c.name, {
      fontFamily: "Arial", fontSize: "10px", color: "#ffffff"
    }).setOrigin(0.5);

    iconSprites.push({ bg, icon });

    icon.on("pointerup", () => {
      selectedKey = c.key;
      selectedObj = c;
      this.registry.set(REG.CHARACTER, selectedKey);

      preview.setTexture(c.key);
      preview.setScale(SCALES.SELECT_PREVIEW);
      nameText.setText(c.name);

      iconSprites.forEach(o => o.bg.setStrokeStyle(2, 0xffffff));
      bg.setStrokeStyle(4, 0xffffff);
    });
  });

  const useBtn = makeButton(this, width/2, 520, 240, 60, 0x44dd77, "USE CHARACTER");
  useBtn.on("pointerup", () => this.scene.start("MenuScene"));

  const backBtn = makeButton(this, width/2, 590, 160, 45, 0x666677, "BACK");
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
  this.score = 0;

  this.pipeSpeed = 200;
  this.pipeGap = 190;
  this.pipeSpawnDelay = 1500;

  this.eraIndex = 0;
  this.applyEraVisuals();

  // ✅ invisible 1x1 texture for physics pipe bodies
  if (!this.textures.exists("pipeBodyTex")) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 1, 1);
    g.generateTexture("pipeBodyTex", 1, 1);
    g.destroy();
  }

  const selectedKey = this.registry.get(REG.CHARACTER);
  const charObj = CHARACTERS.find(c => c.key === selectedKey);

  this.player = this.physics.add.sprite(110, height/2, charObj.key);
  this.player.setScale(SCALES.PLAYER);
  this.player.body.setCollideWorldBounds(true);

  this.player.body.setSize(
    this.player.displayWidth * SCALES.HITBOX,
    this.player.displayHeight * SCALES.HITBOX,
    true
  );

  this.pipes = this.physics.add.group({
    allowGravity: false,
    immovable: true
  });

  this.scoreText = this.add.text(width/2, 40, "0", {
    fontFamily: "Arial Black", fontSize: "40px", color: "#ffffff",
    stroke: "#000000", strokeThickness: 6
  }).setOrigin(0.5);

  this.eraText = this.add.text(width/2, 80, ERAS[this.eraIndex].name, {
    fontFamily: "Arial Black", fontSize: "16px", color: "#ffffff"
  }).setOrigin(0.5).setAlpha(0.8);

  // Input flap (mouse/touch)
  this.input.on("pointerdown", () => {
    if (this.isGameOver) return;
    this.player.body.setVelocityY(-310);
  });

  // Input flap (keyboard)
  this.input.keyboard.on("keydown", (e) => {
    if (this.isGameOver) return;
    if (e.code === "Space" || e.code === "ArrowUp") {
      this.player.body.setVelocityY(-310);
    }
  });

  this.pipeTimer = this.time.addEvent({
    delay: this.pipeSpawnDelay,
    callback: this.spawnPipePair,
    callbackScope: this,
    loop: true
  });

  this.physics.add.overlap(this.player, this.pipes, () => this.triggerGameOver(), null, this);

  this.groundY = height - 40;
  this.ground = this.add.rectangle(width/2, this.groundY, width, 80, 0x000000).setAlpha(0);
  this.physics.add.existing(this.ground, true);
  this.physics.add.collider(this.player, this.ground, () => this.triggerGameOver(), null, this);
};

PlayScene.prototype.update = function () {
  if (this.isGameOver) return;

  const vy = this.player.body.velocity.y;
  this.player.rotation = Phaser.Math.Clamp(vy / 600, -0.6, 0.9);

  this.pipes.getChildren().forEach(pipe => {

    // ✅ move visual container with physics body
    if (pipe.visual) {
      pipe.visual.x = pipe.x;
    }

    // ✅ SCORE ONLY TOP PIPE (1 per pair)
    if (pipe.isTop && !pipe.scored && pipe.x + pipe.displayWidth < this.player.x) {
      pipe.scored = true;
      this.incrementScore();
    }

    if (pipe.x < -100) {
      if (pipe.visual) pipe.visual.destroy();
      pipe.destroy();
    }
  });
};

PlayScene.prototype.incrementScore = function () {
  this.score += 1;
  this.scoreText.setText(this.score);

  if (this.score % 15 === 0) this.switchEra();

  if (this.score % 10 === 0) {
    this.pipeSpeed += 10;
    this.pipeGap = Math.max(120, this.pipeGap - 8);
    this.pipeSpawnDelay = Math.max(1050, this.pipeSpawnDelay - 35);

    this.pipeTimer.remove();
    this.pipeTimer = this.time.addEvent({
      delay: this.pipeSpawnDelay,
      callback: this.spawnPipePair,
      callbackScope: this,
      loop: true
    });
  }
};

PlayScene.prototype.spawnPipePair = function () {
  const { width, height } = this.scale;
  const era = ERAS[this.eraIndex];
  const eraKey = era.key;

  const centerY = Phaser.Math.Between(160, height - 180);
  const halfGap = this.pipeGap / 2;

  const topH = Math.max(centerY - halfGap, 20);
  const botY = centerY + halfGap;
  const botH = Math.max(height - botY - 40, 20);

  const PIPE_W = 60;                 // collision width EXACTLY as old pipes
  const VISUAL_W = PIPE_W * PILLAR_WIDTH_MULT; // thicker visuals

  // --- TOP PIPE physics body (invisible)
  const topBody = this.pipes.create(width + 60, topH / 2, "pipeBodyTex")
    .setDisplaySize(PIPE_W, topH)
    .setOrigin(0.5)
    .setAlpha(0);

  topBody.body.setVelocityX(-this.pipeSpeed);

  // --- BOTTOM PIPE physics body (invisible)
  const bottomBody = this.pipes.create(width + 60, botY + botH / 2, "pipeBodyTex")
    .setDisplaySize(PIPE_W, botH)
    .setOrigin(0.5)
    .setAlpha(0);

  bottomBody.body.setVelocityX(-this.pipeSpeed);

  // ✅ visuals built from slices (wider)
  const topVisual = buildVoxelPipe(this, eraKey, VISUAL_W, topH, true);
  topVisual.x = topBody.x;
  topVisual.y = topH; // because it is flipped

  const bottomVisual = buildVoxelPipe(this, eraKey, VISUAL_W, botH, false);
  bottomVisual.x = bottomBody.x;
  bottomVisual.y = botY;

  // attach visuals to bodies so update() can sync x
  topBody.visual = topVisual;
  bottomBody.visual = bottomVisual;

  // ✅ TAG WHICH PIPE SCORES
  topBody.isTop = true;
  bottomBody.isTop = false;
  topBody.scored = false;
  bottomBody.scored = false;
};

PlayScene.prototype.switchEra = function () {
  this.eraIndex = (this.eraIndex + 1) % ERAS.length;

  const overlay = this.add.rectangle(
    this.scale.width/2, this.scale.height/2,
    this.scale.width, this.scale.height, 0xffffff
  ).setAlpha(0);

  this.tweens.add({
    targets: overlay,
    alpha: 0.7,
    duration: 180,
    yoyo: true,
    onComplete: () => overlay.destroy()
  });

  this.applyEraVisuals();
  this.eraText.setText(ERAS[this.eraIndex].name);
};

// ✅ voxel background per era
PlayScene.prototype.applyEraVisuals = function () {
  const era = ERAS[this.eraIndex];
  const { width, height } = this.scale;

  if (this.bgImage) this.bgImage.destroy();

  this.bgImage = this.add.image(width/2, height/2, era.bgKey)
    .setDisplaySize(width, height)
    .setDepth(-10);
};

PlayScene.prototype.triggerGameOver = function () {
  if (this.isGameOver) return;
  this.isGameOver = true;

  this.physics.pause();
  this.pipeTimer.remove();

  const hs = this.registry.get(REG.HIGH_SCORE);
  if (this.score > hs) this.registry.set(REG.HIGH_SCORE, this.score);

  this.time.delayedCall(600, () => {
    this.scene.start("GameOverScene", { score: this.score });
  });
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
    fontFamily: "Arial Black", fontSize: "30px",
    color: "#ff7777", stroke: "#000000", strokeThickness: 6
  }).setOrigin(0.5);

  const hs = this.registry.get(REG.HIGH_SCORE);

  this.add.text(width/2, 230, `Score: ${this.finalScore}`, {
    fontFamily: "Arial Black", fontSize: "24px", color: "#ffffff"
  }).setOrigin(0.5);

  this.add.text(width/2, 270, `Best: ${hs}`, {
    fontFamily: "Arial Black", fontSize: "18px", color: "#ffef85"
  }).setOrigin(0.5);

  const replayBtn = makeButton(this, width/2, 360, 220, 60, 0x44dd77, "REPLAY");
  replayBtn.on("pointerup", () => this.scene.start("PlayScene"));

  const charBtn = makeButton(this, width/2, 440, 240, 55, 0x5599ff, "CHANGE CHARACTER");
  charBtn.on("pointerup", () => this.scene.start("CharacterSelectScene"));

  const menuBtn = makeButton(this, width/2, 515, 160, 45, 0x666677, "MENU");
  menuBtn.on("pointerup", () => this.scene.start("MenuScene"));

  const adSlot = this.add.rectangle(width/2, height - 30, width, 60, 0x222233)
    .setStrokeStyle(2, 0x444455);

  this.add.text(width/2, height - 30, "AD BANNER SLOT", {
    fontFamily: "Arial", fontSize: "14px", color: "#aaaaaa"
  }).setOrigin(0.5);
};

/* =========================================================
   UI BUTTON HELPER
   ========================================================= */
function makeButton(scene, x, y, w, h, color, label) {
  const btnBg = scene.add.rectangle(x, y, w, h, color)
    .setStrokeStyle(4, 0xffffff)
    .setInteractive({ useHandCursor: true });

  const btnText = scene.add.text(x, y, label, {
    fontFamily: "Arial Black", fontSize: "18px", color: "#000000"
  }).setOrigin(0.5);

  btnBg.on("pointerover", () => btnBg.setScale(1.05));
  btnBg.on("pointerout", () => btnBg.setScale(1));

  btnBg.text = btnText;
  return btnBg;
}

/* =========================================================
   VOXEL PIPE BUILDER (top/mid/bottom tiling)
   ========================================================= */
function buildVoxelPipe(scene, eraKey, targetWidth, height, isTopPipe) {
  const topKey = `${eraKey}_pillar_top`;
  const midKey = `${eraKey}_pillar_mid`;
  const botKey = `${eraKey}_pillar_bottom`;

  const container = scene.add.container(0, 0);

  // create caps once to measure sizes
  const topCap = scene.add.sprite(0, 0, topKey);
  const botCap = scene.add.sprite(0, 0, botKey);

  const wScaleTop = targetWidth / topCap.width;
  const wScaleBot = targetWidth / botCap.width;

  topCap.setScale(wScaleTop);
  botCap.setScale(wScaleBot);

  const topCapH = topCap.displayHeight;
  const botCapH = botCap.displayHeight;

  // place caps in local space
  topCap.y = topCapH / 2;
  botCap.y = height - botCapH / 2;

  container.add(topCap);
  container.add(botCap);

  // mid tile sizing
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

  // flip top pipe so it hangs
  if (isTopPipe) {
    container.scaleY = -1;
  }

  container.setDepth(2);
  return container;
}
