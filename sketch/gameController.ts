class GameController {
  private levelFactory: LevelFactory;
  private level: Level;
  private player: Player;
  private collisionDetection: CollisionDetection;
  private score: number;
  private highScore: number;
  private levelNumber: number;
  private isStartingNextLevel: boolean;
  private countDown: number;
  private isStartGame: boolean;
  private isGameOver: boolean;
  private startScreen: StartScreen | undefined;
  private scoreboard: Scoreboard;
  private gameOver: GameOver;


  constructor(showStartScreen: boolean = true) {
    this.score = 0;
    const localStorageHighscore = localStorage.getItem("highscore");
    const highscoreObj = localStorageHighscore
      ? JSON.parse(localStorageHighscore)
      : {};
    const highscoreArray = Object.keys(highscoreObj).map(
      key => highscoreObj[key]
    );
    this.highScore = highscoreArray.length ? Math.max(...highscoreArray) : 0;
    this.levelNumber = 1;
    this.levelFactory = new LevelFactory();
    this.level = this.levelFactory.createLevel(this.levelNumber);
    this.player = new Player(width / 2, height - 100);
    this.collisionDetection = new CollisionDetection();
    this.isStartingNextLevel = false;
    this.countDown = 5;
    this.isStartGame = showStartScreen;
    this.isGameOver = false;
    this.startScreen = showStartScreen ? new StartScreen() : undefined;
    this.scoreboard = new Scoreboard();
    this.gameOver = new GameOver();
  }

  public drawGame(): void {
    if (this.isStartGame && keyIsPressed && keyCode === 13) {
      removeElements();
      this.isStartGame = false;
      buttonSound.play();
    }
    if (this.isStartGame && this.startScreen) {
      this.startScreen.draw();
      return;
    }

    //If player is under game area display Game Over on screen
    if (this.isPlayerDead()) {

      if (!this.isGameOver) {
        console.log("saved");

        this.saveHighscore();
      }
      this.isGameOver = true;
      this.gameOver.displayGameOver();
      return;
    }

    // if level is done and we're not starting a new level
    if (this.level.levelProgress >= 100 && !this.isStartingNextLevel) {
      this.startNextLevel();
    }

    this.player.move();
    gameOverMusic.stop();

    const heightBeforeGameStarts = height / 2;
    if (
      this.player.pos.y < heightBeforeGameStarts ||
      this.level.levelProgress > 0
    ) {
      this.level.updateLevel();
    }

    this.level.updateEffects();

    // moves all level objects down
    this.level.levelObjects.forEach(levelObject => {
      const isblockCollision = this.collisionDetection.playerCollidedWithBlock(
        this.player,
        levelObject
      );
      const isItemCollision = this.collisionDetection.playerCollidedWithItem(
        this.player,
        levelObject
      );

      if (isblockCollision) {
        if (levelObject instanceof Block) {
          const didBounce = this.player.bounceOnBlock(levelObject.pos);
          if (didBounce) jumpSound.play();
        } else if (levelObject instanceof FragileBlock) {
          if (!levelObject.isDestroyed) {
            const didBounce = this.player.bounceOnBlock(levelObject.pos);
            if (didBounce) levelObject.destroy();
          }
        }
      } else if (isItemCollision) {
        if (levelObject instanceof SpeedBoost) {
          levelObject.applySpeedBoost(this.player);
          this.level.pickUpItem(levelObject);
          this.updateScore(levelObject.points);
        } else if (levelObject instanceof Item) {
          this.level.pickUpItem(levelObject);
          this.updateScore(levelObject.points);
        }
      }
    });

    const r: number = map(this.level.levelProgress, 0, 100, 120, 60);
    const b: number = map(this.level.levelProgress, 0, 100, 170, 110);
    const g: number = map(this.level.levelProgress, 0, 100, 235, 200);

    // background("cornflowerblue");
    background(r, b, g);

    this.level.drawLevel();
    this.scoreboard.draw(this.score, this.highScore, this.levelNumber);
    this.player.drawPlayer();

    if (this.isStartingNextLevel) this.displayCountDown();
  }

  private saveHighscore() {
    const localStorageName = localStorage.getItem("name");
    const playerName = localStorageName ? JSON.parse(localStorageName) : undefined;

    if (playerName) {
      const localStorageHighscore = localStorage.getItem("highscore");
      const highscore = localStorageHighscore
        ? JSON.parse(localStorageHighscore)
        : {};
      if (highscore[playerName] && highscore[playerName] < this.score) {
        highscore[playerName] = this.score;
      } else if(!highscore[playerName]){
        highscore[playerName] = this.score;
      }
      localStorage.setItem("highscore", JSON.stringify(highscore));
    }
  }

  private isPlayerDead = (): boolean =>
    this.player.pos.y > height + this.player.radius * 2;

  private startNextLevel() {
    newLevelSound.play();
    this.isStartingNextLevel = true;
    // wait before starting new level
    setTimeout(() => {
      this.levelNumber += 1;
      this.player.pos = new Position(width / 2, height - 100);
      this.level = this.levelFactory.createLevel(this.levelNumber);
      this.isStartingNextLevel = false;
    }, 5000);

    // update the count down until
    const nextLevelTimer: number = setInterval(() => {
      // if countdown is 0, reset the countdown value and clear the interval
      if (this.countDown < 1) {
        this.countDown = 5;
        clearInterval(nextLevelTimer);
      } else this.countDown -= 1;
    }, 1000);
  }

  // view the countdown message
  private displayCountDown() {
    push();
    textAlign(CENTER);
    stroke("rgb(255,171,194)");
    strokeWeight(7);
    textStyle(BOLD);
    textSize(42);
    fill(32);
    text("Next level in " + this.countDown, width / 2, height / 4);
    pop();
  }

  private updateScore(itemScore: number): void {
    pointsSound.play();
    this.score += itemScore; //20;

    if (this.score >= this.highScore) {
      this.highScore = this.score;
    }
  }
}
