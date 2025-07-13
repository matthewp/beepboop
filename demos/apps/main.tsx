import { bb } from '@matthewp/beepboop';

import counter from './counter';
import profile from './profile';
import docs from './docs';
import darkmode from './darkmode';
import { Component, h } from 'preact';

let machine = bb
  .model({
    counter,
    darkmode,
    docs,
    profile,
  })
  .states(['idle'] as const)
  .view(({ model }) => {
    const DarkMode = darkmode.view();
    const Counter = counter.view();
    const Profile = profile.view();
    const Docs = docs.view();
    return (
      <>
        <DarkMode />
        <div id="counter-app">
          <Counter />
        </div>
        <hr />
        <div id="profile-app">
          <Profile />
        </div>
        <hr />
        <div id="docs-app">
          <Docs />
        </div>
      </>
    );
  })

bb.actor(machine).mount(document);