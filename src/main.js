import { GameLoop }             from './engine/GameLoop.js';
import { StateMachine }          from './engine/StateMachine.js';
import { InputManager }          from './engine/InputManager.js';
import { AssetLoader }           from './engine/AssetLoader.js';
import { Renderer }              from './rendering/Renderer.js';
import { CharacterSelectState }  from './states/CharacterSelectState.js';
import { RoundAnnouncerState }   from './states/RoundAnnouncerState.js';
import { FightState }            from './states/FightState.js';
import { VictoryState }          from './states/VictoryState.js';

function setupTouchButtons(inputManager) {
  const pad = document.getElementById('touch-pad');
  if (!pad) return;
  pad.style.display = 'flex';

  const btns = pad.querySelectorAll('.tbtn');
  btns.forEach(btn => {
    const action = btn.dataset.action;

    btn.addEventListener('touchstart', e => {
      e.preventDefault();
      btn.classList.add('pressed');
      inputManager.setTouchP1(action, true);
    }, { passive: false });

    btn.addEventListener('touchend', e => {
      e.preventDefault();
      btn.classList.remove('pressed');
      inputManager.setTouchP1(action, false);
    }, { passive: false });

    btn.addEventListener('touchcancel', () => {
      btn.classList.remove('pressed');
      inputManager.setTouchP1(action, false);
    });
  });
}

async function main() {
  const canvas   = document.getElementById('game');
  const loading  = document.getElementById('loading');

  const isMobile = navigator.maxTouchPoints > 0;

  const renderer     = new Renderer(canvas);
  const inputManager = new InputManager();
  const assetLoader  = new AssetLoader();
  const ctx          = renderer.context;

  // ── Game states ──────────────────────────────────────────────────────────
  const charSelect    = new CharacterSelectState(assetLoader, { defaultVsAI: isMobile });
  const roundAnnounce = new RoundAnnouncerState(assetLoader);
  const fight         = new FightState(assetLoader, inputManager);
  const victory       = new VictoryState();

  const sm = new StateMachine();
  sm.register('characterSelect', charSelect);
  sm.register('roundAnnounce',   roundAnnounce);
  sm.register('fight',           fight);
  sm.register('victory',         victory);

  // ── URL shortcut: ?state=fight&p1=ben&p2=warrior ─────────────────────────
  const params  = new URLSearchParams(location.search);
  const initState = params.get('state');
  if (initState === 'fight') {
    await sm.transition('roundAnnounce', {
      p1CharId:  params.get('p1')    || 'dummy',
      p2CharId:  params.get('p2')    || 'dummy_red',
      round:     parseInt(params.get('round') || '1', 10),
      roundWins: [0, 0],
      vsAI:      params.get('ai') === '1',
    });
  } else {
    await sm.transition('characterSelect', {});
  }

  loading.style.display = 'none';
  canvas.style.display  = 'block';

  // ── Mobile touch controls ────────────────────────────────────────────────
  if (isMobile) setupTouchButtons(inputManager);

  // ── Game loop ─────────────────────────────────────────────────────────────
  const loop = new GameLoop(
    // update
    () => {
      const p1 = inputManager.getSnapshot(1);
      const p2 = inputManager.getSnapshot(2);

      // CharacterSelect and Victory manage input themselves
      const cur = sm._current;
      if (cur && cur.handleInput) cur.handleInput(p1, p2);

      sm.update();

      // endFrame is called inside FightState.update(); call it here for non-fight states
      if (cur !== fight) inputManager.endFrame();
    },
    // render
    (interp) => {
      renderer.beginFrame();
      sm.render(ctx, interp);
    },
  );

  loop.start();
}

main().catch(err => {
  document.getElementById('loading').textContent = `Error: ${err.message}`;
  console.error(err);
});
