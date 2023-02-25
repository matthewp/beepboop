import { bb } from '@matthewp/beepboop';

let ui = bb.ui().selectors(['#name', 'input'] as const)

let machine = bb
  .selectors(['#name', 'input'] as const)
  .model(() => ({
    name: '',
  }))
  .states(['idle', 'updating'] as const)
  .events('idle', ['change'] as const)
  .transition('idle', 'change', 'updating')
  .immediate(
    'updating',
    'idle',
    bb.assign('name', ({ domEvent }) => domEvent.target.value)
  );

let blueprint = bb
  .connect(machine, ui)
  .text('#name', 'name')
  .on('input', 'input', 'change');

export default bb.app(blueprint);
