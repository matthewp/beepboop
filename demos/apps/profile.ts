import { bb } from '@matthewp/beepboop';

let machine = bb
  .selectors(['#name', 'input'] as const)
  .model({
    name: bb.string()
  })
  .states(['idle', 'updating'] as const)
  .events('idle', ['change'] as const)
  .transition('idle', 'change', 'updating')
  .immediate(
    'updating',
    'idle',
    bb.assign('name', ({ domEvent }) => (domEvent.target as HTMLInputElement).value)
  )
  .on('input', 'input', 'change')
  .text('#name', 'name')

export default bb.app(machine);