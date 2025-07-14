import { bb } from '@matthewp/beepboop';

let machine = bb
  .model({
    mode: bb.string(),
    dark: bb.boolean(),
    emoji: bb.string(),
  })
  .states(['idle'])
  .events('idle', ['toggle'])
  .transition(
    'idle',
    'toggle',
    'idle',
    bb.assign('mode', ({ model }) => (model.mode === 'dark' ? 'light' : 'dark')),
    bb.assign('dark', ({ model }) => model.mode === 'dark'),
    bb.assign('emoji', ({ model }) => model.dark ? '🌛' : '☀️')
  )
  .view(({ model, send }) => {
    return (
      <aside class="brightness-toggle">
        <button type="button" id="darkmode" onClick={() => send('toggle')}>
          {model.emoji}
        </button>
      </aside>
    );
  })

export default bb.actor(machine);