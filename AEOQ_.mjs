class A extends Array {
    constructor(...args) {
        super();
        this.append(...args);
        return new Proxy(this, this.#proxy);
    }
    #proxy = {
        ownKeys(target) {
            return Reflect.ownKeys(target).filter(key => typeof key === 'symbol' || isNaN(Number(key)));
        },
        getOwnPropertyDescriptor(target, prop) {
            const desc = Reflect.getOwnPropertyDescriptor(target, prop);
            return typeof prop != 'string' || isNaN(Number(prop)) ? desc : desc ? {...desc, enumerable: false} : undefined;
        },
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);
            return typeof value === 'function' && prop in Array.prototype ?
                (...p) => {
                    const result = value.apply(receiver, p);
                    return Array.isArray(result) && receiver !== result && !receiver.includes(result) ? 
                        new A(result, {...receiver}) : result;
                } : value;
        }
    }
    append(...args) {
        args.forEach(arg => {
            Array.isArray(arg) ? super.push(...arg) : ['string', 'number'].includes(typeof arg) ? super.push(arg) : '';
            (arg instanceof A || [null, Object.prototype].includes(Object.getPrototypeOf(arg))) && Object.assign(this, {...arg});
        });
    }
}

const E = function (tag, ...props) {
    if (!tag) 
        return tag == null ? undefined : new Text();
    if (tag instanceof Node)
        return new.target ? (this.el = tag) && this : new E(tag);
    if (tag.includes('>')) {
        let tags = tag.split(/ ?> ?/);
        return tags.reverse().slice(1).reduce((child, tag) => E(tag, child), E(tags[0], ...props));
    }
    let attrs;
    [tag, ...attrs] = tag.split(/(?=[#.])/);
    tag = E.SVG.includes(tag) ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
    let {true: id, false: classList} = Object.groupBy(attrs, a => a.startsWith('#'));
    return E(tag).set({
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
        let value = this.el.getAttribute(props[0]) || getComputedStyle(this.el).getPropertyValue(props[0]);
        return value && isNaN(parseFloat(value)) ? value : parseFloat(value);
    },
    set (...props) {
        props = new A(...props);
        props.length && this.el.replaceChildren(...props.filter(el => el));

        Array.isArray(props.classList) && (props.classList = [...new Set(props.classList)].filter(c => c).join(' '));
        this.el.tagName == 'svg' && props.append({xmlns: 'http://www.w3.org/2000/svg'});
        if (this.el.tagName == 'IMG') {
            this.el.alt || (props.alt ||= (this.el.src || props.src)?.match(/([^/.]+)(\.[^/.]+)$/)?.[1]);
            this.el.onerror ?? (props.onerror ??= ev => ev.target.remove());
        }
        Object.entries({...props}).forEach(([a, v]) => {
            a.startsWith('--') ? this.el.style.setProperty(a, v) :
            typeof v == 'object' ? Object.assign(this.el[a], v) : 
            !a.startsWith('#') && this.el[a] === undefined ? this.el.setAttribute(a, v) : this.el[a] = v
        });
        return this.el;
    },
    contains ({x, y}) {
        let {x: x0, y: y0, width, height} = this.el.getBoundingClientRect();
        return (x != null ? x0 < x && x < x0 + width : true) && (y != null ? y0 < y && y < y0 + height : true);
    },
    getBoundingPageRect () {
        return (({x, y}) => ({x: x + scrollX, y: y + scrollY}))(this.el.getBoundingClientRect())
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
    F: (...children) => E(new DocumentFragment()).set(...children),
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
        stuff = A.already(...stuff);
        let {input: order, label, ...other} = stuff;
        label = A.already(label);
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
    objs.flatMap(obj => [...obj[Symbol.iterator] ? obj : Object.entries(obj)])
      .forEach(([p, v]) => super.set(p, v && Object.getPrototypeOf(v) == Object.prototype ? new O(v) : v));

    return new Proxy(this, {
      get: (target, p) =>
        typeof p === 'string' && !Reflect.has(target, p) ? target.get(p) :
          [Symbol.iterator, 'entries', 'keys', 'values', 'forEach'].includes(p) ?
            Reflect.get(target, p).bind(target) : Reflect.get(target, p),

      set: (target, p, v) =>
        typeof p === 'string' && !Reflect.has(target, p) ?
          super.set(p, v) : Reflect.set(target, p, v),

      ownKeys: target => [...target.keys()],

      getOwnPropertyDescriptor: (target, p) => {
        target.get(p) instanceof O && (target[p] = {...target.get(p)});
        return Reflect.getOwnPropertyDescriptor(target, p) || typeof p === 'string' && target.has(p) ? {
          enumerable: true,
          configurable: true
        } : null
      }
    });
  }
  [Symbol.toPrimitive] (type) {return type == 'string' && [...this.keys()].join('');}
  at(path) {
    return (typeof path == 'string' ? path.split('.') : path.filter(p => p)).reduce((obj, key) => obj?.[key], this);
  }
  set(path, v) {
    path = typeof path == 'string' ? path.split('.') : path;
    path.length > 1 ? this.at(path.slice(0, -1))[path.at(-1)] = v : super.set(path[0], v);
    return this;
  }
  find(...targets) {
    if (targets.length === 1 && targets[0] instanceof Function) //.find(([k,v]))
            return [...this].find(targets[0]);

    let options = (targets.at(-1).evaluate || targets.at(-1).default) && targets.pop(), found = {};
    found.v = [...this].find(([k]) => (found.k = targets.find(t =>
      k instanceof RegExp && k.test(t) || k instanceof Array && k.find(item => item == t) ||
      k instanceof Function && k(t) || k == t
    )) != null)?.[1];
    found.k ??= targets[0];
    found.v ??= options?.default;
    return found.v instanceof Function && options?.evaluate ? found.v(found.k) : found.v;
  }
  flatten(transformation) {
    let result = new O({});
    let enter = (current, oldPath = []) => {
      if (current && (current instanceof O || Object.getPrototypeOf(current) == Object.prototype)) {
        new O(current).each(([key, value]) => enter(value, oldPath.push(key)));
      } else {
        let newPath = transformation([...oldPath]).filter(k => k);
        newPath.some(k => k.includes('undefined')) && (newPath = oldPath);
        let level = result;
        newPath.forEach((key, i) => level = level[key] ??= i == newPath.length - 1 ? current : new O({}));
      }
    }
    enter(this);
    return result;
  }
  each(f) { this.forEach((v, k) => f([k, v])); }
  groupBy(...arg) { return new O(Object.groupBy(this, ...arg)).map(([k, v]) => [k, new O(v)]); }

  add(...objs) { return this.map(([k, v]) => [k, v + objs.reduce((sum, o) => sum += o?.[k] ?? 0, 0)]); }
  minus(...objs) { return this.map(([k, v]) => [k, v - objs.reduce((sum, o) => sum += o?.[k] ?? 0, 0)]); }
  append(...objs) { return this.map(([k, v]) => [k, v + objs.reduce((sum, o) => sum += o?.[k] ?? '', '')]); }
  prepend(...objs) { return this.map(([k, v]) => [k, objs.reduce((sum, o) => (o?.[k] ?? '') + sum, '') + v]); }

  url() { return new URLSearchParams(this).toString(); }
}
['map','filter'].forEach(f => O.prototype[f] = function(...p) {return new O([...this][f](...p));});
['flatMap','every'].forEach(f => O.prototype[f] = function(...p) {return [...this][f](...p);});

const Q = Node.prototype.Q = function(selector, func) {
    let nodes = this?.querySelectorAll?.(selector) ?? document.querySelectorAll(selector);
    return typeof func == 'function' ? nodes.forEach(func) : Array.isArray(func) || nodes.length > 1 ? [...nodes] : nodes[0];
}
Node.prototype.sQ = function(...p) {return this.shadowRoot.Q(...p);}
export {A,E,O,Q}