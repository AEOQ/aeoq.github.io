class A extends Set {
    constructor(...stuff) {
        let {true: objs, false: others} = Object.groupBy(stuff, s => Object.prototype.toString.call(s).includes('Object'));
        super(others?.filter(o => o).flat() ?? []);
        this.assign(...objs?.flat() ?? []);
    }
    assign (...objs) {return Object.assign(this, new O(...objs));}
    apply (el) {
        if (Array.isArray(el)) return el.forEach(el => this.apply(el));
        el.append(...this);
        Array.isArray(this.classList) && (this.classList = this.classList.filter(c => c).join(' '));

        let isSVG = E.SVG.includes(el.tagName);
        let {true: vari, false: attr} = Object.groupBy(new O({...this}), ([a]) => a.includes('--'));
        vari && new O(vari).each(([a, v]) => el.style.setProperty(a, v));
        attr && new O(attr).each(([a, v]) => typeof v == 'object' ? 
            Object.assign(el[a], v) : isSVG ? el.setAttribute(a, v) : el[a] = v
        );
    }
    static already (...stuff) {
        let {true: already, false: others} = Object.groupBy(stuff, s => s instanceof A);
        return already ? already[0].assign(...others ?? []) : new A(...stuff);
    }
}

const E = function (el, ...props) {
    if (el instanceof HTMLElement || el instanceof SVGElement)
        return (this.el = el) && this;
    props = A.already(...props);
    el == 'img' && props.assign({alt: props.src?.match(/([^/.]+)(\.[^/.]+)$/)?.[1], onerror: ev => ev.target.remove()});
    el = E.SVG.includes(el) ? document.createElementNS('http://www.w3.org/2000/svg', el) : document.createElement(el);
    props.apply(el);
    return el;
}
E.prototype.get = function(...props) {return props.length > 1 ? 
    props.map(p => this.get(p)) : 
    parseFloat(getComputedStyle(this.el).getPropertyValue(props[0]));
}
Object.assign(E, {
    SVG: ['svg', 'defs', 'use', 'path', 'line', 'polygon', 'rect', 'circle', 'animate'],

    ul: lis => E('ul', lis.filter(li => li).map(li => E('li', li))),
    dl: (obj, attr = {}) => E('dl', attr, (obj instanceof O ? obj : new O(obj))
        .flatMap(([dt, dds]) => [E('dt', dt), ...[dds].flat().map(dd => E('dd', dd instanceof HTMLElement ? [dd] : dd))])),
    
    input (...stuff) {
        stuff = A.already(...stuff);
        let {input: order, title} = stuff;
        return E('label', title ? {title} : '', order == 'last' ? [...stuff, E('input', {...stuff})] : [E('input', {...stuff}), ...stuff]);
    },
    inputs: contents => contents.map(content => E.input(content)),

    radio: (...stuff) => E.input(...stuff, {type: 'radio'}),
    radios: contents => contents.map(content => E.radio(content)),
    
    checkbox: (...stuff) => E.input(...stuff, {type: 'checkbox'}),
    checkboxes: contents => contents.map(content => E.checkbox(content)),
});

class O extends Map {
    constructor(...objs) {
        super();
        objs.flatMap(obj => typeof obj[Symbol.iterator] == 'function' ? obj : Object.entries(obj))
            .forEach(([k, v]) => [this[k] = v, this.set(k, v)]);
    }
    url () {return new URLSearchParams([...this]).toString();}
    each (f) {this.forEach((v, k) => f([k, v]));}
    prepend (...objs) {return objs.reduce((summed, o) => new O({...summed}).map(([k, v]) => [k, (o[k] ?? '') + v]), this);}
}
['map','filter'].forEach(f => O.prototype[f] = function(...p) {return new O([...this][f](...p));});
['flatMap','find','every'].forEach(f => O.prototype[f] = function(...p) {return [...this][f](...p);});

const Q = Node.prototype.Q = function(el, func) {
    let els = this?.querySelectorAll?.(el) ?? document.querySelectorAll(el);
    return typeof func == 'function' ? els.forEach(func) : Array.isArray(func) || els.length > 1 ? [...els] : els[0];
}
Node.prototype.sQ = function(...p) {return this.shadowRoot.Q(...p);}

export {A,E,O,Q};