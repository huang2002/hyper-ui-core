import { _Map, _splice, _entries } from "../utils/refCache";
import { HNode } from "./HNode";
import { mark } from "../ticker/ticker";
import { HUI } from "./HUI";
import { SpliceArgs } from "../utils/helpers";

type AssertArray<T> = T extends any[] ? T : never;
type MapOf<T> = Map<keyof T, Pick<T, keyof T>>;
type InjectThis<F extends (...args: any[]) => any, T> = (this: T, ...args: Parameters<F>) => ReturnType<F>;

export type Setter<T = unknown> = (value: T) => void;
export type SetterRecord = [Setter | undefined, Setter | undefined];

export interface HandlerMap<T extends object = any> {
    [name: string]: (this: Store<T, HandlerMap<T>>, ...args: any[]) => any;
}

export type PartialHandlers<H extends HandlerMap, T> = { [K in keyof H]?: InjectThis<H[K], T> | null };

export interface Store<T extends object = any, H extends HandlerMap<T> = any> {

    valueMap: MapOf<T>;
    bindingMap: Map<keyof T, HNode<any>[]>;
    setterMap: Map<keyof T, SetterRecord>;
    handlerMap: MapOf<H>;

    bind(hNode: HNode<any>, subscriptions: Array<keyof T>): this;

    get<K extends keyof T>(key: K): T[K] | undefined;
    set<K extends keyof T>(key: K, value: T[K], force?: boolean): this;
    setter<K extends keyof T>(key: K, force?: boolean): Setter<T[K]>;
    setSome(pairs: Partial<T>, forces?: boolean): this;

    toggle(key: keyof T): this;

    inc(key: keyof T, addition?: any): this;

    push<K extends keyof T>(key: K, ...items: AssertArray<T[K]>): this;
    unshift<K extends keyof T>(key: K, ...items: AssertArray<T[K]>): this;
    slice(key: keyof T, start: number, end: number): this;
    splice<K extends keyof T>(key: K, start: number, deleteCount?: number): this;
    splice<K extends keyof T>(key: K, start: number, deleteCount: number, ...items: AssertArray<T[K]>): this;

    handle<N extends keyof H>(name: N, handler?: InjectThis<H[N], this> | null): this;
    handleSome(handlers: PartialHandlers<H, this>): this;
    getHandler<N extends keyof H>(name: N): InjectThis<H[N], this> | undefined;
    trigger<N extends keyof H>(name: N, ...args: Parameters<H[N]>): ReturnType<H[N]> | undefined;

}

export const createStore = function <T extends object = any, H extends HandlerMap<T> = any>(): Store<T, H> {

    const valueMap = new _Map<keyof T, any>(),
        bindingMap = new _Map<keyof T, HNode<any>[]>(),
        setterMap = new _Map<keyof T, SetterRecord>(),
        handlerMap = new _Map<keyof H, any>();

    const store: Store<T, H> = {

        valueMap,
        bindingMap,
        setterMap,
        handlerMap,

        bind: function store_bind(hNode, subscriptions) {
            subscriptions.forEach(key => {
                if (bindingMap.has(key)) {
                    bindingMap.get(key)!.push(hNode);
                } else {
                    bindingMap.set(key, [hNode]);
                }
            });
            return this;
        },

        get: function store_get(key) {
            return valueMap.get(key);
        },

        set: function store_set(key, value, force) {

            if (force || !HUI.cmp(value, store.get(key))) {

                valueMap.set(key, value);

                if (bindingMap.has(key)) {
                    bindingMap.get(key)!.forEach(hNode => {
                        if (hNode.active) {
                            mark(hNode);
                        }
                    });
                }

            }

            return store;

        },

        setter: function store_setter(key, force) {

            const index = +!force;

            if (setterMap.has(key)) {

                const setters = setterMap.get(key)!,
                    setter = setters[index];

                if (setter) {
                    return setter;
                } else {
                    return setters[index] = function setter(value: any) {
                        store.set(key, value, force);
                    };
                }

            } else {

                const setters = new Array<Setter>();

                setterMap.set(key, setters as SetterRecord);

                return setters[index] = function setter(value: any) {
                    store.set(key, value, force);
                };

            }

        },

        setSome: function store_setSome(pairs, force) {
            _entries(pairs).forEach(pair => {
                store.set(pair[0] as keyof T, pair[1], force);
            });
            return this;
        },

        toggle: function store_toggle(key) {
            return store.set(key, !store.get(key) as any);
        },

        inc: function store_inc(key, addition = 1) {
            return store.set(key, store.get(key) + addition);
        },

        push: function store_push(key, ...items) {
            return store.set(key, (store.get(key) as unknown as any[]).concat(items) as any);
        },

        unshift: function store_unshift(key, ...items) {
            return store.set(key, items.concat(store.get(key)) as any);
        },

        slice: function store_slice(key, start, end) {
            return store.set(key, (store.get(key) as unknown as any[]).slice(start, end) as any);
        },

        splice: function store_splice(key: keyof T, start: number, deleteCount: number, ...items: any[]) {
            const arr = (store.get(key) as unknown as any[]).slice();
            _splice.apply(arr, [start, deleteCount].concat(items) as SpliceArgs);
            return store.set(key, arr as any);
        },

        handle: function store_handle(name, handler) {
            if (handler) {
                handlerMap.set(name, handler.bind(store));
            } else {
                handlerMap.delete(name);
            }
            return this;
        },

        handleSome: function store_handleSome(handlers) {
            _entries(handlers).forEach(pair => {
                store.handle(pair[0], pair[1]);
            });
            return this;
        },

        getHandler: function store_getHandler(name) {
            return handlerMap.get(name) as any;
        },

        trigger: function store_trigger(name, ...args) {
            const handler = handlerMap.get(name);
            if (handler) {
                return handler.apply(store, args);
            }
        }

    };

    return store;

};
