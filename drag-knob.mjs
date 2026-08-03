import {E} from 'https://aeoq.github.io/AEOQ_.mjs';
import PointerInteraction from 'https://aeoq.github.io/pointer-interaction/script.js';
CSS.registerProperty({
    name: "--knob-angle",
    syntax: "<number>",
    inherits: true,
    initialValue: "180",
});
class Knob extends HTMLElement {
    #internals; #θ; #v; #preV; #snap;
    constructor(props = {}) {
        super();
        Knob.isSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
            navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 || 
            /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || this.matches('.no-svg');

        this.#internals = this.attachInternals();
        this.attachShadow({mode: 'open'}).append(
            this.output = E('output', {part: 'output'}),
            this.input = E('input', {type: 'hidden'}),
            Knob.isSafari ? '' : E('svg', {viewBox: '-1 -1 2 2'},
                [E('circle#track', {pathLength: 360*.9}), E('circle#fill', {pathLength: 360*.9})]
            ),
            E.link({
                href: 'https://aeoq.github.io/drag-knob.css',
                style: Knob.isSafari ? {display: 'block'} : {},
                me: true
            }),
            E('slot'), 
	    );
        this.temp ??= {};
        Object.assign(this, props);
    }
    static observedAttributes = ['name', 'range', 'value'];
    attributeChangedCallback(attr, v0, v1) {
        if (v1 === v0) return;
        if (attr == 'name') return this.name = v1;
        if (this.#v != null) return attr == 'value' ? this.value = Knob.parse(v1) : attr == 'range' ? this.setup({range: v1}) : '';
        this.temp[attr] = Knob.parse(v1);
    }
    connectedCallback() {
        this.setup();
        this.hidden = false;
        E(this.sQ('input')).set({
            onchange: ev => this.edit('change'),
            onblur: ev => this.edit('finish'),
            onkeydown: ev => ev.key == 'Enter' ? ev.target.blur() : '',
        });
        this.addEventListener('contextmenu', ev => ev.preventDefault());
        PointerInteraction.events([[this, {
            press: PI => (PI.$press.θ = this.#θ, this.press?.(PI)),
            drag: PI => (this.output.Q('input') || Math.abs(PI.$drag.dy) >= 1 && (this.angle = PI), this.drag?.(PI)),
            lift: PI => (PI.animate = false, this.lift?.(PI)),
            click: this.list ? null : click => click.for(2).to(() => this.snap()),
            hold: this.list ? null : hold => hold.for(1).to(() => this.edit())
        }]]);
	}
    setup (attrs = this.temp) {
        let range = attrs.range || this.get('range') || '0/100/.01';
        let value = attrs.value ?? this.get('value');
        if (Array.isArray(range)) {
            this.classList.add('discrete');
            this.list = range;
            this.sQ('#track') && (this.sQ('#track').style.strokeDasharray = 
                Array(this.list.length - 1).fill(`0 var(--sector-angle)`).join(' ') + ` 0 calc(2 * var(--start))`);
            E(this).set({'--min': this.minθ ??= 90, '--count-1': this.list.length - 1});
            this.maxθ ??= 360 - this.minθ;
            [this.minV, this.maxV, this.step] = [0, this.list.length - 1, 1];
            this.iniV = Math.max(this.list.indexOf(value), 0);
        } else {
            E(this).set({'--min': this.minθ ??= 40 - (Knob.isSafari ? 2.5 : 0)});
            this.maxθ ??= 360 - this.minθ;
            [this.minV, this.maxV, this.step, this.unit] = range.split('/').map(v => Knob.parse(v));
            this.minV == this.maxV * -1 && (this.symmetric = true) && this.classList.add('symmetric');
            this.iniV = value ?? (this.symmetric || this.minV === 0 ? 0 : this.maxV < 1 ? this.minV : Math.max(1, this.minV));
        }
        requestAnimationFrame(() => this.value = this.#v ?? this.iniV);
        delete this.temp;
    }
    formResetCallback() {this.value = this.iniV;}
    static formAssociated = true;

    get = attr => Knob.parse(this.getAttribute(attr))
    get value () {return this.list?.[this.#v] ?? this.#v;}
    set value (v) {
        if (v == this.convert.from.angle) {
            v = this.#round({value: this.convert.from.angle(this.#θ)});
            if (v === this.#v) return; 
            this.#v = v;
        } else {
            this.symmetric && (this.#preV = this.#v);
            this.#v = this.#round({value: v});
            this.angle = this.convert.from.value;
        }
        this.#internals.setFormValue(this.value);
        this.output.Q('input') || (this.output.value = this.value + (this.unit || ''));
        this.pause || this.dispatchEvent(new InputEvent('input', {bubbles: true}));
    }
    set angle (_) {
        let flipDelay;
        if (_ == this.convert.from.value) {
            flipDelay = this.#animate();
            this.#θ = Math.max(0, Math.min(this.convert.from.value(this.#round()), 360));
        } else {
            let PI = _;
            this.#θ = Math.max(this.minθ, Math.min(PI.$press.θ - PI.$drag.dy * (this.matches('.fine') ? .1 : 1), this.maxθ));
            (this.#θ == this.minθ || this.#θ == this.maxθ) && ([PI.$press.y, PI.$press.θ] = [PI.$drag.y, this.#θ]);
            this.value = this.convert.from.angle;
        } 
        this.symmetric && setTimeout(() => this.classList.toggle('negative', this.#θ < 180), flipDelay || 0);
        E(this).set({'--knob-angle': this.#θ});
    }
    #round ({value, step} = {}) {
        value ??= this.#v, step ??= this.step;
        value = Math.round(value / step) * step;
        return parseFloat(value.toFixed(`${step}`.split('.')[1]?.length ?? 0));
    }
    convert = {from: { 
        value: value => (value - this.minV) / (this.maxV - this.minV) * (this.maxθ - this.minθ) + this.minθ,
        angle: angle => (angle - this.minθ) / (this.maxθ - this.minθ) * (this.maxV - this.minV) + this.minV
    }}
    snap () {
        this.#snap ??= this.get('snap') || [Math.max(0, this.minV)];
        this.value = typeof this.#snap == 'number' ? 
            this.#round({step: this.#snap}) : 
            this.#snap.reduce((diff, curr) => Math.abs(curr - this.#v) <= Math.abs(diff - this.#v) ? curr : diff);
    }
    edit (state = 'begin') {
        if (state == 'begin') {
            this.input.setAttribute('value', this.value);
            this.input.type = 'number';
            this.input.step = this.step;
            this.output.replaceChildren(this.input);
            this.input.focus();
        } else if (state == 'change') {
            this.value = this.input.value;
        } else if (state == 'finish') {
            this.shadowRoot.append(this.input);
            this.input.value === '' ? this.input.getAttribute('value') : this.edit('change');
        }
    }
    #animate () {
        this.classList.add('animate');
        setTimeout(() => this.classList.remove('animate'), 500);
        return this.symmetric && this.#preV != null ? 500 * cubicBezierTime(this.#preV / (this.#preV - this.#v)) : null;
    }
    static parse (str) {
        try {return JSON.parse(str);} 
        catch {return str && str.trim() && !isNaN(Number(str)) ? parseFloat(str) : str;}
    }
}
customElements.define('drag-knob', Knob);
export default Knob;
const cubicBezierTime = (Y, x1 = 0.25, y1 = 0.1, x2 = 0.25, y2 = 1.0) => {
    let to = (what, t) => 3 * (1 - t) ** 2 * t * (what == 'x' ? x1 : y1) + 3 * (1 - t) * t ** 2 * (what == 'x' ? x2 : y2) + t ** 3;
    Y = Math.max(0, Math.min(1, Y));
    let lower = 0, upper = 1, t = 0.5;
    for (let i = 0; i < 20; i++) {
        let y = to('y', t);
        if (Math.abs(y - Y) < 1e-7) break;
        y < Y ? lower = t : upper = t;
        t = (lower + upper) / 2;
    }
    return to('x', t);
}
