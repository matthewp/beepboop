import { bb } from '@matthewp/beepboop';

let machine = bb
  .selectors(['.box-view', '.box'] as const)
  .model({
    count: bb.number(),

    id: bb.string(),
  })
  .states(['setup', 'idle'] as const)
  .immediate('setup', 'idle',
    bb.assign('id', ({ model }) => `box-${0}`)
  )
  .attr('.box', 'id', 'id');

let app = bb.app(machine);
app.mount('#app');