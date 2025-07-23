import { bb } from '@matthewp/beepboop';

import Counter from './counter';
import Profile from './profile';
import DarkMode from './darkmode';
import { Component, h } from 'preact';

let machine = bb
  .states(['idle'])
  .view(() => {
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
