class A extends Set {
    constructor(...stuff) {
        let {true: objs, false: others} = Object.groupBy(stuff, s => Object.prototype.toString.call(s).includes('Object'));
        super([...others?.filter(o => o).flat() ?? []]);
        this.assign(...objs?.flat() ?? []);
    }
    assign (...objs) {return Object.assign(this, new O(...objs));}
    static already (...stuff) {
        let {true: already, false: others} = Object.groupBy(stuff, s => s instanceof A);
        return already ? already[0].assign(...others ?? []) : new A(...stuff);
    }
}

const E = function (el, ...props) {
    if (typeof el == 'object')
        return new.target ? (this.el = el) && this : new E(el);
    el = E.SVG.includes(el) ? document.createElementNS('http://www.w3.org/2000/svg', el) : document.createElement(el);
    return E(el).set(...props);
}
Object.assign(E.prototype, {
    get (...props) {
        return props.length > 1 ? 
            props.map(p => this.get(p)) : 
            /^--/.test(props[0]) ? parseFloat(getComputedStyle(this.el).getPropertyValue(props[0])) : this.getAttribute(props[0]);
    },
    set (...props) {
        props = new A(...props);
        props.size && this.el.replaceChildren(...props);

        this.el.tagName == 'IMG' && props.assign({
            alt: (this.el.alt || props.alt) ?? props.src?.match(/([^/.]+)(\.[^/.]+)$/)?.[1], 
            onerror: ev => ev.target.remove()
        });
        Array.isArray(props.classList) && (props.classList = props.classList.filter(c => c).join(' '));

        let isSVG = E.SVG.includes(this.el.tagName);
        let {true: vari, false: attr} = new O({...props}).groupBy(([a]) => a.includes('--'));
        vari?.each(([a, v]) => this.el.style.setProperty(a, v));
        attr?.each(([a, v]) => typeof v == 'object' ? 
            Object.assign(this.el[a], v) : isSVG ? this.el.setAttribute(a, v) : this.el[a] = v
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
        objs.flatMap(obj => [...typeof obj[Symbol.iterator] == 'function' ? obj : Object.entries(obj)])
            .forEach(([k, v]) => [this[k] = v, this.set(k, v)]);
    }
    get (props) {return props.split(/[-.]/).reduce((obj, prop) => obj?.[prop], this);}
    url () {return new URLSearchParams([...this]).toString();}
    each (f) {this.forEach((v, k) => f([k, v]));}
    groupBy (...arg) {return new O(Object.groupBy(this, ...arg)).map(([k, v]) => [k, new O(v)]);}
    add (...objs) {return objs.reduce((summed, o) => new O({...summed}).map(([k, v]) => [k, v + (o?.[k] ?? 0)]), this);}
    minus (...objs) {return objs.reduce((summed, o) => new O({...summed}).map(([k, v]) => [k, v - (o?.[k] ?? 0)]), this);}
    prepend (...objs) {return objs.reduce((summed, o) => new O({...summed}).map(([k, v]) => [k, (o?.[k] ?? '') + v]), this);}
}
['map','filter'].forEach(f => O.prototype[f] = function(...p) {return new O([...this][f](...p));});
['flatMap','find','every'].forEach(f => O.prototype[f] = function(...p) {return [...this][f](...p);});

const Q = Node.prototype.Q = function(el, func) {
    let els = this?.querySelectorAll?.(el) ?? document.querySelectorAll(el);
    return typeof func == 'function' ? els.forEach(func) : Array.isArray(func) || els.length > 1 ? [...els] : els[0];
}
Node.prototype.sQ = function(...p) {return this.shadowRoot.Q(...p);}

export {A,E,O,Q};
