import { bb } from '@matthewp/beepboop';

let machine = bb
  .model({
    name: bb.string(),
    age: bb.number()
  })
  .states(['idle'] as const)
  .events('idle', ['change-name', 'change-age'] as const)
  .transition('idle', 'change-name', 'idle',
    bb.assign('name', ({ domEvent }) => (domEvent.target as HTMLInputElement).value)
  )
  .transition('idle', 'change-age', 'idle',
    bb.assign('age', ({ domEvent }) => (domEvent.target as HTMLInputElement).valueAsNumber)
  )
  .view(({ model, deliver }) => {
    return (
      <>
        <h2>User Profile</h2>
        <div>Name: <strong id="name">{model.name}</strong></div>
        <div>Age: <strong id="age">{model.age}</strong></div>
        <input
          name="name"
          type="text"
          placeholder="enter your name"
          value={model.name}
          onInput={deliver('change-name')}
        />
        <input
          name="age"
          type="number"
          placeholder="enter your age"
          value={model.age}
          onInput={deliver('change-age')}
        />
      </>
    );
  });

export default bb.actor(machine);
