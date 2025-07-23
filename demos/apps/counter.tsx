import { bb } from '@matthewp/beepboop';
import * as s from '@matthewp/beepboop/schema';

let machine = bb
  .model(s.object({
    count: s.number()
  }))
  .states(['setup', 'idle', 'increment', 'decrement'])
  .immediate('setup', 'idle', bb.assign('count', () => 5))
  .events('idle', ['increment', 'decrement'])
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
  .view(({ model, send }) => {
    return (
      <>
        <h2>Counter</h2>
        <div>Count: {model.count}</div>
        <button id="inc" type="button" onClick={() => send('increment')}>Increment</button>
        <button id="dec" type="button" onClick={() => send('decrement')} disabled={model.count <= 0}>Decrement</button>
      </>
    );
  })

export default bb.view(machine);
