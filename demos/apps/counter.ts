import { bb } from '@matthewp/beepboop';

let machine = bb
  .selectors(['#count', '#inc', '#dec'])
  .model({
    count: bb.number()
  })
  .states(['idle', 'increment', 'decrement'] as const)
  .events('idle', ['increment', 'decrement'] as const)
  .transition('idle', 'increment', 'increment')
  .transition(
    'idle',
    'decrement',
    'decrement',
    bb.guard(({ model }) => model.count > 0)
  )
  .immediate(
    'increment',
    'idle',
    bb.assign('count', ({ model }) => model.count + 1)
  )
  .immediate(
    'decrement',
    'idle',
    bb.assign('count', ({ model }) => model.count - 1)
  )
  .on('#inc', 'click', 'increment')
  .on('#dec', 'click', 'decrement')
  .text('#count', 'count')

export default bb.actor(machine);
