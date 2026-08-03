class A extends Array {
    constructor(...args) {
        super();
        this.append(...args);
        return this.#proxy;
    }
    #proxy = new Proxy(this, {
        ownKeys: target => Reflect.ownKeys(target).filter(key => typeof key === 'symbol' || isNaN(Number(key))),
        getOwnPropertyDescriptor(target, prop) {
            const desc = Reflect.getOwnPropertyDescriptor(target, prop);
            return typeof prop != 'string' || isNaN(Number(prop)) ? 
                desc : desc ? {...desc, enumerable: false} : undefined;
        },
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop);
            return typeof value === 'function' && A.#copying.has(prop) ? 
                (...p) => new A(value.apply(target, p), {...receiver}) : value;
        }
    })
    append(...args) {
        args.filter(arg => arg != null).forEach(arg => {
            const plain = [null, Object.prototype].includes(Object.getPrototypeOf(arg));
            Array.isArray(arg) ? super.push(...arg) : !plain ? super.push(arg) : ''; //
            (arg instanceof A || plain) && Object.assign(this, {...arg});
        });
        return this;
    }
    push {this.append(...args)} //
    static #copying = new Set(['filter','slice','concat','map','flat','flatMap','with','toReversed','toSorted','toSpliced'])
}

const E = function (tag, ...props) {
    if (!tag) 
        return tag === '' ? E(new Text).set(...props) : undefined;
    if (tag instanceof Node)
        return new.target ? (this.node = tag) && this : new E(tag);
    if (tag.includes('>')) {
        let tags = tag.split(/ ?> ?/);
        return tags.reverse().slice(1).reduce((child, tag) => E(tag, child), E(tags[0], ...props));
    }
    let attrs, node;
    [tag, ...attrs] = tag.split(/(?=[#.])/);
    node = E.SVG.includes(tag) ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
    let {true: id, false: classList} = Object.groupBy(attrs, a => a.startsWith('#'));
    return E(node).set({
        id: id?.[0].substring(1) ?? null, 
        classList: classList?.filter(c => c.length > 1).map(c => c.substring(1)) ?? null,
    }, ...props.map(prop => prop instanceof Node ? [prop] : prop));
}
Object.assign(E.prototype, {
    get (...props) {
        if (props.length > 1)
            return props.reduce((obj, p) => ({...obj, [p]: this.get(p)}), {});
        if (Array.isArray(props[0]))
            return props[0].map(p => this.get(p));
        let value = this.node.getAttribute(props[0]) || getComputedStyle(this.node).getPropertyValue(props[0]);
        return value && isNaN(parseFloat(value)) ? value : parseFloat(value);
    },
    set (...props) {
        props = new A(...props);
        props.length && this.node.replaceChildren(...props.filter(node => node != null));

        Array.isArray(props.classList) && (props.classList = [...new Set(props.classList)].filter(c => c).join(' '));
        this.node.tagName == 'svg' && props.append({xmlns: 'http://www.w3.org/2000/svg'});
        if (this.node.tagName == 'IMG') {
            this.node.alt || (props.alt ||= (this.node.src || props.src)?.match(/([^/.]+)(\.[^/.]+)$/)?.[1]);
            this.node.onerror ?? (props.onerror ??= ev => ev.target.remove());
        }
        Object.entries({...props}).forEach(([a, v]) => {
            a.startsWith('--') ? this.node.style.setProperty(a, v) :
            typeof v == 'object' ? Object.assign(this.node[a], v) : 
            this.node instanceof SVGElement && a != 'classList' || this.node[a] === undefined ? this.node.setAttribute(a, v) : this.node[a] = v
        });
        return this.node;
    },
    contains ({x, y}) {
        let {x: x0, y: y0, width, height} = this.node.getBoundingClientRect();
        return (x != null ? x0 < x && x < x0 + width : true) && (y != null ? y0 < y && y < y0 + height : true);
    },
    getBoundingPageRect () {
        return (({x, y}) => ({x: x + scrollX, y: y + scrollY}))(this.node.getBoundingClientRect())
    }
});
Object.assign(E, {
    SVG: [
        'svg', 'g', 'defs', 'use', 'symbol',
        'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
        'text', 'tspan', 'textPath',
        'linearGradient', 'radialGradient', 'stop', 'pattern', 'clipPath', 'mask', 'filter',
        'image', 'animate', 'animateTransform', 'animateMotion'
    ],
    frag: (...children) => E(new DocumentFragment()).set(...children),
    link: ({rel, href, me, ...props}) => E('link', {
        rel: rel ?? 'stylesheet', ...props,
        href: me && location.hostname == "127.0.0.1" ? href.replace(/^(?:https?:)?\/\/[^\/]+/, '') : href,
        onerror: function() {me && location.hostname == "127.0.0.1" && (this.href = href)}
    }),
    img: src => new Promise(res => E('img', {
        src, crossOrigin: 'anonymous', referrerPolicy: 'no-referrer', 
        onload: function() {res(this)}, onerror: function() {res(this.remove())}
    })),
    labels: labels => [labels].flat().map(l => E('label', [...[l].flat(), E('input', {...l})])),
    ul: lis => E('ul', lis.filter(li => li).map(li => E('li', li))),
    dl: (obj, attr = {}) => E('dl', attr, (obj instanceof O ? obj : new O(obj))
        .flatMap(([dt, dds]) => [E('dt', dt), ...[dds].flat().map(dd => E('dd', dd))])),

    input (...stuff) {
        let {input: order, label, ...other} = new A(...stuff);
        label = new A(label);
        return E('label', {...label}, order == 'last' ? [...label, E('input', {...other})] : [E('input', {...other}), ...label]);
    },
    inputs: contents => contents.map(content => E.input(content)),

    radio: (...stuff) => E.input({type: 'radio'}, ...stuff),
    radios: contents => contents.map(content => E.radio(content)),
    
    checkbox: (...stuff) => E.input({type: 'checkbox'}, ...stuff),
    checkboxes: contents => contents.map(content => E.checkbox(content)),
});

class O extends Map {
    constructor(...objs) {
        super();
        objs.flatMap(obj => [...Symbol.iterator in obj ? obj : Object.entries(obj)])
            .forEach(([k, v]) => this.set(k, v && Object.getPrototypeOf(v) == Object.prototype ? new O(v) : v));
        return this.#proxy;
    }
    #plain;
    #proxy = new Proxy(this, {
        ownKeys: target => [...target.keys()],
        getOwnPropertyDescriptor: (target, prop) => {
            let value = target.get(prop);
            value instanceof O && (this.#plain = {...value});
            return value != null ? {enumerable: true, configurable: true} : Reflect.getOwnPropertyDescriptor(target, prop);
        },
        get: (target, prop) => {
            if (target.has(prop)) {
                let value = this.#plain ?? target.get(prop);
                this.#plain = null;
                return value;
            }
            if (typeof prop == 'string' && /[,\.]/.test(prop))
                return prop.split(/[,\.]/).reduce((obj, key) => obj?.get?.(key) ?? obj?.[key], target);
            if (!(prop in target) && prop in Array.prototype)
                return (...p) => {
                    let result = [...target][prop](...p);
                    return Array.isArray(result) && result.every(pair => Array.isArray(pair) && pair.length == 2) ? 
                        new O(result) : result;
                }
            const value = Reflect.get(target, prop);
            return typeof value === 'function' ? value.bind(target) : value;
        },
        set(target, prop, value) {
            if (/[,\.]/.test(prop)) {
                let path = prop.split(/[,\.]/);
                let obj = path.slice(0, -1).reduce((obj, key) => obj?.get?.(key) ?? obj?.[key], target);
                obj ? obj[path.at(-1)] = value : target.set(prop, value);
            } else
                target.set(prop, value);
            return true;
        }
    });
    [Symbol.toPrimitive](type) {return type == 'string' && [...this.keys()].join('')}
    each(f) {this.forEach((v, k) => f([k, v]))}
    find(...targets) {
        if (targets.length === 1 && typeof targets[0] == 'function') 
            return [...this].find(targets[0]);

        let option = ['evaluate', 'default'].some(p => targets.at(-1)[p]) && targets.pop();
        let found = [targets[0], option?.default];
        for (const [k, v] of this) {
            let result = targets.find(t =>
                k instanceof RegExp && k.test(t) || Array.isArray(k) && k.includes(t) ||
                typeof k === 'function' && k(t) || k == t
            );
            if (result != null) {
                found = [result, v];
                break;
            }
        }
        return typeof found[1] == 'function' && option?.evaluate ? found[1](found[0]) : found[1];
    }
    reshape(transformation) {
        let result = new O({});
        let walk = (value, oldPath = []) => {
            if (value instanceof O || Object.getPrototypeOf(value) == Object.prototype)
                return new O(value).each(([k, v]) => walk(v, [...oldPath, k]));
            let newPath = transformation([...oldPath]).filter(k => k);
            newPath.some(k => k.includes('undefined')) && (newPath = oldPath);
            newPath.reduce((obj, k, i) => obj[k] ??= i < newPath.length - 1 ? {} : value, result);
        }
        walk(this);
        return result;
    }
    add    (...objs) {return this.#proxy.map(([k, v]) => [k, v + objs.reduce((sum, o) => sum + (o?.[k] ?? 0), 0)])}
    minus  (...objs) {return this.#proxy.map(([k, v]) => [k, v - objs.reduce((sum, o) => sum + (o?.[k] ?? 0), 0)])}
    append (...objs) {return this.#proxy.map(([k, v]) => [k, v + objs.reduce((sum, o) => sum + (o?.[k] ?? ''), '')])}
    prepend(...objs) {return this.#proxy.map(([k, v]) => [k, objs.reduce((sum, o) => (o?.[k] ?? '') + sum, '') + v])}

    flatten(transformation) {return this.reshape(transformation)}//
    at(path) {return this.#proxy[path];}//
}

const Q = Node.prototype.Q = function(selector, func) {
    let nodes = this?.querySelectorAll?.(selector) ?? document.querySelectorAll(selector);
    return typeof func == 'function' ? nodes.forEach(func) : Array.isArray(func) || nodes.length > 1 ? [...nodes] : nodes[0];
}
Node.prototype.sQ = function(...p) {return this.shadowRoot.Q(...p);}
export {A,E,O,Q}