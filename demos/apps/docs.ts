import { bb } from '@matthewp/beepboop';

let machine = bb
  .selectors(['.active', 'article'] as const)
  .model({
    active: bb.type<HTMLElement>(),
    previous: bb.type<HTMLElement>(),
    index: bb.number(),
    lastIndex: bb.number(),
    positions: bb.array(bb.array(bb.string()))
  })
  .states(['setup', 'idle', 'findNearest', 'setActive'] as const)
  .events('idle', ['scroll'] as const)
  .immediate('setup', 'idle',
    bb.assign('positions', ({ root }) => {
      return Array.from(root.querySelectorAll('h1')).map(el => {
        return [el.id, el.offsetTop]
      });
    })
  )
  .transition('idle', 'scroll', 'findNearest')
  .immediate('findNearest', 'setActive',
    bb.assign('lastIndex', ({ model }) => model.index),
    bb.assign('index', ({ model, domEvent }) => {
      let target = domEvent.target as any;
      let top = target.scrollTop + target.getBoundingClientRect().y;
      let i = model.positions.length - 1;
      while (i > 0) {
        let [, offset] = model.positions[i];
        if (offset < top) {
          break;
        }
        i--;
      }
      return i;
    })
  )
  .immediate('setActive', 'idle',
    bb.guard(({ model }) => model.index !== model.lastIndex),
    bb.assign('previous', ({ model }) => model.active),
    bb.assign('active', ({ model, root }) => {
      let id = model.positions[model.index][0];
      let el = root.querySelector(`a[href="#${id}"]`)!.parentNode as HTMLElement;
      return el;
    })
  )
  .immediate('setActive', 'idle')
  .on('article', 'scroll', 'scroll')
  .effect('active', ev => {
    console.log('effect');
    ev.model.previous?.classList.remove('active');
    ev.model.active.classList.add('active');
  });

export default bb.app(machine);
