class A {
  #arr; #obj;
  constructor(...stuff) {
    let { true: objs, false: others } = Object.groupBy(stuff, s => s && Object.getPrototypeOf(s) == Object.prototype);
    this.#arr = [...others ?? []].flat();
    this.#obj = Object.assign({}, ...objs ?? []);

    return new Proxy(this, {
      get: (target, p) =>
        p === Symbol.iterator ? function* () { yield* target.#arr; } :
        /^\d+$/.test(p) ? target.#arr[Number(p)] :
        p in target.#obj ? target.#obj[p] :
        p == 'length' ? target.#arr[p] : Reflect.get(target, p)
      ,
      set: (target, p, v) => 
        /^\d+$/.test(p) ? (target.#arr[Number(p)] = v, true) :
        typeof p === 'string' ? (target.#obj[p] = v, true) : Reflect.set(target, p, v)
      ,
      ownKeys: target => Object.keys(target.#obj),
      getOwnPropertyDescriptor: (target, p) =>
        p in target.#obj ? {
          enumerable: true,
          configurable: true
        } : null
    });
  }
  push(...objs) { return Object.assign(this, ...objs); }
  static already(...stuff) {
    let { true: already, false: others } = Object.groupBy(stuff, s => s instanceof A);
    return already ? Object.assign(already[0], ...others ?? []) : new A(...stuff);
  }
}
['map', 'filter'].forEach(f => A.prototype[f] = function (...p) { return new A([...this][f](...p), { ...this }); });

const E = function (el, ...props) {
    if (el instanceof Element)
        return new.target ? (this.el = el) && this : new E(el);
    if (el.includes('>'))
        return (tags => tags.reverse().slice(1).reduce((tree, tag) => E(tag, tree), E(tags[0], ...props)))(el.split(/ ?> ?/));
    let attrs;
    [el, ...attrs] = el.split(/(?=[#.])/);
    let {true: id, false: classList} = Object.groupBy(attrs, attr => attr.startsWith('#'));
    el = E.SVG.includes(el) ? document.createElementNS('http://www.w3.org/2000/svg', el) : document.createElement(el);
    return E(el).set(
        id?.[0].length > 1 ? {id: id[0].substring(1)} : {}, 
        classList ? {classList: classList.filter(c => c.length > 1).map(c => c.substring(1))} : {},
        ...props.map(prop => prop instanceof HTMLElement ? [prop] : prop)
    );
}
Object.assign(E.prototype, {
    get (...props) {
        if (props.length > 1)
            return props.reduce((obj, p) => ({...obj, [p]: this.get(p)}), {});
        if (Array.isArray(props[0]))
            return props[0].map(p => this.get(p));
        let value = this.el.getAttribute(props[0]) || getComputedStyle(this.el).getPropertyValue(props[0]);
        return isNaN(parseFloat(value)) ? value : parseFloat(value);
    },
    set (...props) {
        props = new A(...props);
        props.length && this.el.replaceChildren(...props.filter(el => el));

        this.el.tagName == 'IMG' && props.push({
            alt: (this.el.alt || props.alt) ?? (this.el.src || props.src)?.match(/([^/.]+)(\.[^/.]+)$/)?.[1], 
            onerror: ev => ev.target.remove()
        });
        Array.isArray(props.classList) && (props.classList = [...new Set(props.classList)].filter(c => c).join(' '));

        let {true: vari, false: attr} = new O({...props}).groupBy(([a]) => a.includes('--'));
        vari?.each(([a, v]) => this.el.style.setProperty(a, v));
        attr?.each(([a, v]) => 
            typeof v == 'object' ? Object.assign(this.el[a], v) : 
            this.el instanceof SVGElement && a != 'classList' ? this.el.setAttribute(a, v) : this.el[a] = v
        );
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
    SVG: ['svg', 'defs', 'use', 'path', 'line', 'polygon', 'rect', 'circle', 'animate'],

    ul: lis => E('ul', lis.filter(li => li).map(li => E('li', li))),
    dl: (obj, attr = {}) => E('dl', attr, (obj instanceof O ? obj : new O(obj))
        .flatMap(([dt, dds]) => [E('dt', dt), ...[dds].flat().map(dd => E('dd', dd instanceof HTMLElement ? [dd] : dd))])),

    fieldset: (obj, attr = {}) => E('fieldset', attr, (obj instanceof O ? obj : new O(obj))
        .flatMap(([legend, labels]) => [E('legend', legend), ...labels])),
    
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
        new O(current).each(([key, value]) => enter(value, oldPath.concat(key)));
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

const Q = Node.prototype.Q = function(el, func) {
    let els = this?.querySelectorAll?.(el) ?? document.querySelectorAll(el);
    return typeof func == 'function' ? els.forEach(func) : Array.isArray(func) || els.length > 1 ? [...els] : els[0];
}
Node.prototype.sQ = function(...p) {return this.shadowRoot.Q(...p);}

export {A,E,O,Q};
