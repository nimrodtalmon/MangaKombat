import { GameLoop }             from './engine/GameLoop.js';
import { StateMachine }          from './engine/StateMachine.js';
import { InputManager }          from './engine/InputManager.js';
import { AssetLoader }           from './engine/AssetLoader.js';
import { Renderer }              from './rendering/Renderer.js';
import { CharacterSelectState }  from './states/CharacterSelectState.js';
import { RoundAnnouncerState }   from './states/RoundAnnouncerState.js';
import { FightState }            from './states/FightState.js';
import { VictoryState }          from './states/VictoryState.js';
import { TouchControls }         from './ui/TouchControls.js';

async function main() {
  const canvas  = document.getElementById('game');
  const loading = document.getElementById('loading');

  const isMobile = navigator.maxTouchPoints > 0;

  const renderer     = new Renderer(canvas);
  const inputManager = new InputManager();
  const assetLoader  = new AssetLoader();
  const ctx          = renderer.context;

  // Touch joystick — only created on mobile
  const touch = isMobile ? new TouchControls(canvas) : null;

  // On mobile, route canvas taps to character select
  if (isMobile) {
    canvas.addEventListener('touchstart', e => {
      if (sm._current !== charSelect) return;
      e.preventDefault();
      const t   = e.changedTouches[0];
      const r   = canvas.getBoundingClientRect();
      const scl = 800 / r.width;
      charSelect.handleTap((t.clientX - r.left) * scl, (t.clientY - r.top) * scl);
    }, { passive: false });
  }

  // ── Game states ───────────────────────────────────────────────────────────
  const charSelect    = new CharacterSelectState(assetLoader, { defaultVsAI: isMobile, isMobile });
  const roundAnnounce = new RoundAnnouncerState(assetLoader);
  const fight         = new FightState(assetLoader, inputManager, { isMobile });
  const victory       = new VictoryState();

  const sm = new StateMachine();
  sm.register('characterSelect', charSelect);
  sm.register('roundAnnounce',   roundAnnounce);
  sm.register('fight',           fight);
  sm.register('victory',         victory);

  // ── URL shortcut: ?state=fight&p1=dummy&p2=dummy_red ──────────────────────
  const params    = new URLSearchParams(location.search);
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

  // ── Game loop ─────────────────────────────────────────────────────────────
  const loop = new GameLoop(
    // update
    () => {
      // Push touch joystick state — skip during char select (tap handled separately)
      if (touch && sm._current !== charSelect) touch.update(inputManager);

      const p1 = inputManager.getSnapshot(1);
      const p2 = inputManager.getSnapshot(2);

      const cur = sm._current;
      if (cur && cur.handleInput) cur.handleInput(p1, p2);

      sm.update();

      if (cur !== fight) inputManager.endFrame();
    },
    // render
    (interp) => {
      renderer.beginFrame();
      sm.render(ctx, interp);
      // Joystick overlay only during fight/announce/victory
      if (touch && sm._current !== charSelect) touch.render(ctx);
    },
  );

  loop.start();
}

main().catch(err => {
  document.getElementById('loading').textContent = `Error: ${err.message}`;
  console.error(err);
});
