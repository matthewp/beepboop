import { bb } from '@matthewp/beepboop';

let machine = bb
  .selectors(['#name', '#age', '[name=name]', '[name=age]'] as const)
  .model({
    name: bb.string(),
    age: bb.number()
  })
  .states(['idle', 'updating-name', 'updating-age'] as const)
  .events('idle', ['change-name', 'change-age'] as const)
  .transition('idle', 'change-name', 'updating-name')
  .transition('idle', 'change-age', 'updating-age')
  .immediate(
    'updating-name',
    'idle',
    bb.assign('name', ({ domEvent }) => (domEvent.target as HTMLInputElement).value)
  )
  .immediate(
    'updating-age',
    'idle',
    bb.assign('age', ({ domEvent }) => (domEvent.target as HTMLInputElement).valueAsNumber)
  )
  .on('[name=name]', 'input', 'change-name')
  .on('[name=age]', 'input', 'change-age')
  .text('#name', 'name')
  .text('#age', 'age');

export default bb.app(machine);