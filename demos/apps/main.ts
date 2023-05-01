import { bb } from '@matthewp/beepboop';

import counter from './counter';
import profile from './profile';
import docs from './docs';
import darkmode from './darkmode';

let machine = bb
  .selectors(['html', '#counter-app', '#profile-app', '#docs-app'] as const)
  .model({
    counter: bb.actor(),
    darkmode: bb.actor(),
    docs: bb.actor(),
    profile: bb.actor(),
  })
  .states(['idle'] as const)
  .spawn('#counter-app', 'counter', counter)
  .spawn('#profile-app', 'profile', profile)
  .spawn('#docs-app', 'docs', docs)
  .spawn('html', 'darkmode', darkmode);

bb.actor(machine).mount(document);