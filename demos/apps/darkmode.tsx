import { bb } from '@matthewp/beepboop';
import * as s from '@matthewp/beepboop/schema';

let machine = bb
  .model(s.object({
    mode: s.string(),
    dark: s.boolean(),
    emoji: s.string(),
  }))
  .states(['setup', 'idle'])
  .immediate('setup', 'idle', 
    bb.assign('mode', () => 'light'),
    bb.assign('dark', () => false),
    bb.assign('emoji', () => '☀️')
  )
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

export default bb.view(machine);