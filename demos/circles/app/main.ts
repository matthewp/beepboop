import { bb } from '@matthewp/beepboop';

let box = bb
  .selectors(['.boxes', '.box-view', '.box'] as const)
  .model({
    num: bb.number(),
    count: bb.number(),
    id: bb.string(),
    style: bb.string(),
  })
  .states(['setup', 'idle', 'animate'] as const)
  .immediate('setup', 'idle',
    bb.assign('id', ({ model }) => `box-${model.num}`),
  )
  // hack
  .events('idle', ['go'])
  .transition('idle', 'go', 'animate')
  .after('idle', 1, 'animate')
  .immediate('animate', 'idle',
    bb.assign('count', ({ model }) => {
      return model.count < 1000 ? model.count + 1 : 0;
    }),
    bb.assign('style', ({ model }) => {
      let count = model.count;
      let top = Math.sin(count / 10) * 10;
      let left = Math.cos(count / 10) * 10;
      let color = count % 255;
      return `transform: translate(${top}px, ${left}px); background: rgb(0,0,${color})`;
    })
  )
  .attr('.box', 'id', 'id')
  .attr('.box', 'style', 'style')


let machine = bb
  .selectors(['.boxes'] as const)
  .model({
    boxes: bb.number(),
    count: bb.number(),
  })
  .states(['setup', 'idle'] as const)
  .immediate('setup', 'idle',
    bb.assign('boxes', () => 100)
  )
  .attach('.boxes', 'template', 'boxes')
  .each('.box', bb.spawn(box))

let app = bb.app(machine);
app.mount('#app');