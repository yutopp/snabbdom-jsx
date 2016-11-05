/** @jsx html */

import test from 'tape';
import { html } from './snabbdom-jsx';

test('jsx -> html vnode 1', (assert) => {

    const div1 =
        <div class="c1 c2">
            <label for="someid">label</label>
        </div>;

    assert.equal(div1.sel, 'div');
    assert.equal(div1.data.ns, undefined);
    assert.deepEqual(div1.children, [
        {
            sel: 'label',
            data: {
                ns: undefined,
                attrs: { 'for': 'someid' }
            },
            children: [{ text: 'label'}],
            key: undefined
        }
    ]);

    function callback() {};
    const style = { fontWeight: 'bold' };

    const div2 =
        <div>
            <input
                type="text"
                key="key"
                style={style}
                style-color='red'
                on-click={callback}/>
        </div>;

    assert.deepEqual(div2.children[0], {
        sel: 'input',
        data: {
            ns: undefined,
            attrs: { type: 'text' },
            on: { click: callback },
            style: { fontWeight: 'bold', color: 'red' },
        },
        children: [],
        key: 'key'
    });

    const div3 = <div id="id" class="c1 c2"></div>;
    assert.deepEqual(div3, {
        sel: 'div',
        data: {
            ns: undefined,
            attrs: {
                'id': "id",
                'class': "c1 c2"
            }
        },
        children: [],
        key: undefined
    });

    const div4 = <div id="yo" role="aa" aria-controls="bb"></div>;
    assert.deepEqual(div4, {
        sel: 'div',
        data: {
            ns: undefined,
            attrs: {
                'id': 'yo',
                'aria-controls': 'bb',
                'role': 'aa'
            },
        },
        children: [],
        key: undefined,
    });

    const div5 = <div hook={({a: 'b'})} style={{c: 'd'}}></div>;
    assert.deepEqual(div5, {
        sel: 'div',
        data: {
            ns: undefined,
            hook: {
                a: 'b'
            },
            style: {
                c: 'd'
            },
        },
        children: [],
        key: undefined,
    });

    class Hook { insert(_) {} }
    const hook = new Hook();
    const div6 = <div hook={hook} style={{c: 'd'}}></div>;
    assert.deepEqual(div6, {
        sel: 'div',
        data: {
            ns: undefined,
            hook: hook,
            style: {
                c: 'd'
            },
        },
        children: [],
        key: undefined,
    });

    assert.end();
});

test('jsx components', (assert) => {

    const MyDiv = ({color, fontWeight}) =>
        <div
            style={ ({color, fontWeight}) }>
        </div>;

    const mydiv1 = <MyDiv key="key" color="red" fontWeight="bold" />;

    assert.deepEqual(mydiv1,
                     {
                         sel: 'div',
                         data: {
                             ns: undefined,
                             style: { fontWeight: 'bold', color: 'red' }
                         },
                         children: [],
                         key: 'key'
                     }
                    );

    assert.end();
});
