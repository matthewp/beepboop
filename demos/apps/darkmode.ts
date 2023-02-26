import { bb } from '@matthewp/beepboop';

let machine = bb
  .selectors(['body', '#darkmode'] as const)
  .model({
    mode: bb.string(),
    dark: bb.boolean(),
    emoji: bb.string(),
  })
  .states(['idle'] as const)
  .events('idle', ['toggle'] as const)
  .transition(
    'idle',
    'toggle',
    'idle',
    bb.assign('mode', ({ model }) => (model.mode === 'dark' ? 'light' : 'dark')),
    bb.assign('dark', ({ model }) => model.mode === 'dark'),
    bb.assign('emoji', ({ model }) => model.dark ? '🌛' : '☀️')
  )
  .on('#darkmode', 'click', 'toggle')
  .attr('body', 'data-mode', 'mode')
  .class('body', 'dark-mode', 'dark')
  .text('#darkmode', 'emoji')

export default bb.app(machine);