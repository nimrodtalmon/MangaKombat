import { FightEngine, FIGHT_RESULT } from '../fight/FightEngine.js';
import { AIController }              from '../engine/AIController.js';
import { UIRenderer }                from '../rendering/UIRenderer.js';
import { ROUNDS_TO_WIN, CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';

// Phases within a fight
const PHASE = Object.freeze({
  FIGHTING:    0, // normal combat
  FINISH_HIM:  1, // winner decided, <10% health, show prompt
  FREEZE:      2, // brief freeze after KO before transitioning
});

const FINISH_HIM_THRESHOLD = 10; // % health to trigger "FINISH HIM"
const FINISH_DURATION      = 180; // frames to stay in FINISH_HIM
const FREEZE_DURATION      = 90;  // frames of freeze after KO

export class FightState {
  constructor(assetLoader, inputManager, { isMobile = false } = {}) {
    this.assetLoader  = assetLoader;
    this.inputManager = inputManager;
    this._isMobile    = isMobile;
    this.stateMachine = null;
    this._ui          = new UIRenderer();
    this._engine      = null;
    this._params      = null;
    this._phase       = PHASE.FIGHTING;
    this._phaseTimer  = 0;
  }

  async enter(params) {
    this._params     = params;
    this._phase      = PHASE.FIGHTING;
    this._phaseTimer = 0;

    const { p1CharId, p2CharId, roundWins, round } = params;

    // Load character data + sprites
    const [p1Data, p2Data] = await Promise.all([
      this.assetLoader.loadJSON(`assets/characters/${p1CharId}/character.json`),
      this.assetLoader.loadJSON(`assets/characters/${p2CharId}/character.json`),
    ]);

    const [p1Sprites, p2Sprites] = await Promise.all([
      this.assetLoader.loadCharacterSprites(p1Data, `assets/characters/${p1CharId}`),
      this.assetLoader.loadCharacterSprites(p2Data, `assets/characters/${p2CharId}`),
    ]);

    let stageData = null;
    try {
      stageData = await this.assetLoader.loadJSON('assets/stages/dojo/stage.json');
      stageData._basePath = 'assets/stages/dojo';
    } catch (_) { /* use procedural default */ }

    this._engine = new FightEngine(
      p1Data, p1Sprites, p2Data, p2Sprites,
      stageData, this.inputManager,
      { roundWins, round, aiController: params.vsAI ? new AIController() : null },
    );
  }

  exit() { this._engine = null; }

  update() {
    if (!this._engine) return;

    // Escape returns to character select (desktop only)
    if (!this._isMobile && this.inputManager._justPressed.has('Escape')) {
      this.stateMachine.transition('characterSelect', {});
      return;
    }

    this._engine.update();
    this.inputManager.endFrame();

    if (this._phase === PHASE.FIGHTING && this._engine.isRoundOver()) {
      const result = this._engine.result;
      let showFinishHim = false;

      if (result !== FIGHT_RESULT.DRAW) {
        const loserHealth = result === FIGHT_RESULT.P1_WINS
          ? this._engine.p2.health : this._engine.p1.health;
        showFinishHim = loserHealth <= FINISH_HIM_THRESHOLD;
      }

      this._phase      = showFinishHim ? PHASE.FINISH_HIM : PHASE.FREEZE;
      this._phaseTimer = 0;
      this._engine.freeze();
    }

    if (this._phase === PHASE.FINISH_HIM) {
      this._phaseTimer++;
      if (this._phaseTimer >= FINISH_DURATION) {
        this._phase      = PHASE.FREEZE;
        this._phaseTimer = 0;
      }
    }

    if (this._phase === PHASE.FREEZE) {
      this._phaseTimer++;
      if (this._phaseTimer >= FREEZE_DURATION) {
        this._endRound();
      }
    }
  }

  _endRound() {
    const wins   = [...(this._params.roundWins || [0, 0])];
    const result = this._engine.result;

    if (result === FIGHT_RESULT.P1_WINS) wins[0]++;
    if (result === FIGHT_RESULT.P2_WINS) wins[1]++;

    const matchOver = wins[0] >= ROUNDS_TO_WIN || wins[1] >= ROUNDS_TO_WIN
                   || result === FIGHT_RESULT.DRAW;

    if (matchOver) {
      this.stateMachine.transition('victory', {
        winner: result === FIGHT_RESULT.P1_WINS ? 1
               : result === FIGHT_RESULT.P2_WINS ? 2 : 0,
        p1CharId: this._params.p1CharId,
        p2CharId: this._params.p2CharId,
        roundWins: wins,
      });
    } else {
      this.stateMachine.transition('roundAnnounce', {
        ...this._params,
        round:     (this._params.round || 1) + 1,
        roundWins: wins,
      });
    }
  }

  render(ctx) {
    if (!this._engine) return;

    this._engine.render(ctx);

    // ESC hint (desktop only)
    if (!this._isMobile) {
      ctx.save();
      ctx.fillStyle    = 'rgba(255,255,255,0.35)';
      ctx.font         = '10px monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('ESC: MENU', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 2);
      ctx.restore();
    }

    if (this._phase === PHASE.FINISH_HIM) {
      this._ui.drawDimOverlay(ctx, 0.3);
      this._ui.drawFinishHim(ctx, this._phaseTimer);
    }

    if (this._phase === PHASE.FREEZE) {
      this._ui.drawDimOverlay(ctx, 0.25);
      // Show result text briefly
      const result   = this._engine.result;
      const winnerTxt = result === FIGHT_RESULT.P1_WINS ? 'PLAYER 1 WINS'
                       : result === FIGHT_RESULT.P2_WINS ? 'PLAYER 2 WINS'
                       : 'DRAW';
      const alpha = Math.min(1, this._phaseTimer / 20);
      this._ui.drawAnnouncement(ctx, winnerTxt, { fontSize: 44, color: '#ff0', alpha });
    }
  }
}
