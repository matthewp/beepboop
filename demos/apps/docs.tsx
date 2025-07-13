import { bb } from '@matthewp/beepboop';

let machine = bb
  .model({
    active: bb.number(),
    previous: bb.number(),
    index: bb.number(),
    lastIndex: bb.number(),
    positions: bb.array(bb.array(bb.string()))
  })
  .states(['setup', 'idle', 'findNearest', 'setActive'] as const)
  .events('idle', ['scroll'] as const)
  .immediate('setup', 'idle',
    bb.assign('positions', () => {
      // This would need to be calculated differently in a view-based approach
      // For now, we'll use a static list of chapters
      return [
        ['chapter-1', 0],
        ['chapter-2', 1000],
        ['chapter-3', 2000],
        ['chapter-4', 3000],
        ['chapter-5', 4000],
        ['chapter-6', 5000]
      ];
    })
  )
  .transition('idle', 'scroll', 'findNearest')
  .immediate('findNearest', 'setActive',
    bb.assign('lastIndex', ({ model }) => model.index),
    bb.assign('index', ({ model }) => {
      // Simplified scroll position calculation
      // In a real implementation, this would get the actual scroll position
      const scrollTop = window.scrollY || 0;
      let i = model.positions.length - 1;
      while (i > 0) {
        let [, offset] = model.positions[i];
        if (offset < scrollTop) {
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
    bb.assign('active', ({ model }) => model.index)
  )
  .immediate('setActive', 'idle')
  .view(({ model, send }) => {
    const chapters = [
      { id: 'chapter-1', title: 'Chapter 1' },
      { id: 'chapter-2', title: 'Chapter 2' },
      { id: 'chapter-3', title: 'Chapter 3' },
      { id: 'chapter-4', title: 'Chapter 4' },
      { id: 'chapter-5', title: 'Chapter 5' },
      { id: 'chapter-6', title: 'Chapter 6' }
    ];

    return (
      <div id="docs-app">
        <h2>Documentation</h2>
        
        <article onScroll={() => send('scroll')}>
          <h1 id="chapter-1">Chapter 1</h1>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
          
          <h1 id="chapter-2">Chapter 2</h1>
          <p>Nulla eget velit erat. Suspendisse potenti...</p>
          
          <h1 id="chapter-3">Chapter 3</h1>
          <p>Chapter 3 content...</p>
          
          <h1 id="chapter-4">Chapter 4</h1>
          <p>Chapter 4 content...</p>
          
          <h1 id="chapter-5">Chapter 5</h1>
          <p>Chapter 5 content...</p>
          
          <h1 id="chapter-6">Chapter 6</h1>
          <p>Aliquam felis leo, ultrices sit amet varius ut...</p>
        </article>

        <aside>
          <h3>On this page</h3>
          <ul>
            {chapters.map((chapter, index) => (
              <li class={index === model.active ? 'active' : ''}>
                <a href={`#${chapter.id}`}>{chapter.title}</a>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    );
  })

export default bb.actor(machine);
