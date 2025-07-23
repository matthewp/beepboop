import { bb } from '@matthewp/beepboop';

import counter from './counter';
import profile from './profile';
import darkmode from './darkmode';
import { Component, h } from 'preact';

let machine = bb
  .states(['idle'])
  .view(() => {
    const DarkMode = darkmode.view();
    const Counter = counter.view();
    const Profile = profile.view();
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
      </>
    );
  })

bb.actor(machine).mount(document.querySelector('main'));
