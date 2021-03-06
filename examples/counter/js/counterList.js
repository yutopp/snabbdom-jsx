/** @jsx html */

import { html } from '../../../snabbdom-jsx';
import Type from 'union-type';
import Counter from './counter';

const Action = Type({
  Add     : [],
  Remove  : [Number],
  Reset   : [],
  Update  : [Number, Counter.Action],
});


/*  model : {
      counters: [{id: Number, counter: counter.model}],
      nextID  : Number
    }
*/
const view = ({model, handler})  =>
  <div>
    <button
      on-click={[handler, Action.Add()]}>Add</button>
    <button
      on-click={[handler, Action.Reset()]}>Reset</button>
    <hr/>
    <div>
      { model.counters.map(item => <CounterItem item={item} handler={handler} />) }
    </div>
  </div>;
  
const CounterItem = ({item, handler}) =>
  <div key={item.id}>
    <button
      on-click={ [handler, Action.Remove(item.id)] }>Remove</button>
    <Counter 
      model={item.counter} 
      handler={ a => handler(Action.Update(item.id, a))  } />
  </div>;


function init() {
  return  { nextID: 1, counters: [] };
}

function addCounter(model) {
  const newCounter = {id: model.nextID, counter: Counter.init() };
  return {
    counters  : [...model.counters, newCounter],
    nextID    : model.nextID + 1
  };
}

function resetCounters(model) {
  
  return {...model,
    counters  : model.counters.map(item => ({...item, 
      counter: Counter.init()
    }))
  };
}

function removeCounter(model, id) {
  return {...model,
    counters : model.counters.filter( item => item.id !== id )
  };
}

function updateCounter(model, id, action) {
  return {...model,
    counters  : model.counters.map(item => 
      item.id !== id ? 
          item
        : { ...item, 
            counter : Counter.update(item.counter, action)
          }
    )
  };
}


function update(model, action) {
  
  return Action.case({
    Add     : () => addCounter(model),
    Remove  : id => removeCounter(model, id),
    Reset   : () => resetCounters(model), 
    Update  : (id, action) => updateCounter(model, id, action)
  }, action);
}

export default { view, init, update, Action };