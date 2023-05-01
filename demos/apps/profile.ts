import { bb } from '@matthewp/beepboop';

let machine = bb
  .selectors(['#name', '#age', '[name=name]', '[name=age]'] as const)
  .model({
    name: bb.string(),
    age: bb.number()
  })
  .states(['idle'] as const)
  .events('idle', ['change-name', 'change-age'] as const)
  .transition('idle', 'change-name', 'idle',
    bb.assign('name', ({ domEvent }) => (domEvent.target as HTMLInputElement).value)
  )
  .transition('idle', 'change-age', 'idle',
    bb.assign('age', ({ domEvent }) => (domEvent.target as HTMLInputElement).valueAsNumber)
  )
  .on('[name=name]', 'input', 'change-name')
  .on('[name=age]', 'input', 'change-age')
  .text('#name', 'name')
  .text('#age', 'age');

export default bb.actor(machine);