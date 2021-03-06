interface GreetingProps {
    children: string;
}

const Greeting = HUI.define<GreetingProps, HUI.EmptyStore, TestContext>('Greeting', {
    context: ['target'],
    init(props, store, context) {
        context.set('target', props.children[0]);
    },
    render(props, store, context) {
        return (
            <div id="greeting">

                <h1>
                    Hello,
                    <span style={`color: ${context.get('greeting-color')}`}>
                        {context.get('target')}
                    </span>
                    !
                </h1>

                <button onclick={() => {
                    const newTarget = prompt('New target:', context.get('target'));
                    if (newTarget) {
                        context.trigger('changeTarget', newTarget);
                    }
                }}>Change target</button>

                <br />
                <br />

                This is hyper-ui.

                <RefTest />

                Timer in Greeting:
                <br />
                <Timer />
                <br />

            </div>
        );
    }
});

const ShowTarget = HUI.define<{}, HUI.EmptyStore, TestContext>('ShowTarget', {
    context: ['target'],
    render(props, store, context) {
        return `context.target: ${context.get('target')}`;
    }
});

interface RefTestStore {
    msg: string;
    ref?: HTMLParagraphElement;
}

const RefTest = HUI.define<{}, HUI.Store<RefTestStore>, HUI.EmptyStore>('RefTest', {

    state: ['msg'],

    init(props, store) {
        store.set('msg', 'Fail to set the content!');
    },

    render(props, store) {

        HUI.defer(function (s) {
            s.get('ref')!.innerHTML = 'Reference test passed.';
        }, store);

        return (
            <p ref={store.setter('ref')}>
                <span>{store.get('msg')}</span>
            </p>
        );

    }

});
