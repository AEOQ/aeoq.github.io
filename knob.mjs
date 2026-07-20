import {A,E,O,Q} from 'https://aeoq.github.io/AEOQ.mjs';
import PointerInteraction from 'https://aeoq.github.io/pointer-interaction/script.js';
CSS.registerProperty({
    name: "--angle",
    syntax: "<number>",
    inherits: true,
    initialValue: "180",
});
class Knob extends HTMLElement {
    #internals; #θ; #v;
    constructor(props = {}) {
        super();
        this.#internals = this.attachInternals();
        this.attachShadow({mode: 'open'}).append(
            E('svg', {viewBox: '-1 -1 2 2'}, [E('circle#track'), E('circle#fill')]),
            this.output = E('output', {part: 'output'}),
            this.input = E('input', {
                type: 'number',
                onchange: ev => this.value = ev.target.value === '' ? ev.target.getAttribute('value') : ev.target.value,
                onblur: ev => (this.shadowRoot.append(ev.target), ev.target.onchange(ev)),
            }),
            E('link', {rel: 'stylesheet', href: `https://aeoq.github.io/knob.css`}),
            E('slot'), 
	    );
        Object.assign(this, props);
    }
    setup () {
        this.name = this.get('name');
        let range = this.get('range') || '0/100/.01';
        if (Array.isArray(range)) {
            this.classList.add('discrete');
            this.list = range;
            this.sQ('#track').style.strokeDasharray = Array(this.list.length - 1).fill(`0 var(--arc-length)`).join(' ')
                + ` 0 calc(2 * var(--start) / 360 * var(--circum))`;
            E(this).set({'--min': this.minθ ??= 90, '--count-1': this.list.length - 1});
            this.maxθ ??= 360 - this.minθ;
            [this.minV, this.maxV, this.step] = [0, this.list.length - 1, 1];
            this.initialValue = Math.max(this.list.indexOf(this.get('value')), 0);
        } else {
            E(this).set({'--min': this.minθ ??= 40});
            this.maxθ ??= 360 - this.minθ;
            [this.minV, this.maxV, this.step, this.unit] = range.split('/').map(v => Knob.toFloat(v));
            this.minV == this.maxV * -1 && this.classList.add('symmetric');
            this.initialValue = this.get('value') ?? (this.minV === 0 ? 0 : this.maxV < 1 ? this.minV : Math.max(1, this.minV));
        }
        requestAnimationFrame(() => this.value = this.initialValue);
    }
    connectedCallback() {
        this.setup();
        PointerInteraction.events([[this, {
            press: PI => {
                PI.$press.θ = this.#θ;
                this.press?.(PI);
            },
            drag: PI => {
                this.output.Q('input') || Math.abs(PI.$drag.dy) >= 1 && (this.angle = PI);
                this.drag?.(PI);
            },
            lift: PI => {
                PI.animate = false;
                this.angle = this.convert.from.value;
                this.lift?.(PI);
            },
            click: this.list ? null : click => click.for(2).to(() => this.#snap()),
            hold: this.list ? null : hold => hold.for(1).to(() => this.#edit())
        }]]);
	}
    attributeChangedCallback(_, v0, v1) {v1 != v0 && (this.value = v1);}
    formResetCallback() {this.value = this.initialValue;}
    static observedAttributes = ['value'];
    static formAssociated = true;

    get (attr) {
        if (this[attr] !== undefined)
            return typeof this[attr] === 'function' ? null : this[attr];
        let str = this.getAttribute(attr);
        try {return JSON.parse(str);} 
        catch {return str;}
    }
    get value () {return this.list?.[this.#v] ?? this.#v;}
    set value (v) {
        if (v == this.convert.from.angle) {
            this.#v = this.round({value: this.convert.from.angle(this.#θ)});
        } else {
            this.#v = v;
            this.angle = this.convert.from.value;
        }
        this.#internals.setFormValue(this.value);
        this.output.Q('input') || (this.output.value = this.value + (this.unit || ''));
        this.dispatchEvent(new InputEvent('input', {bubbles: true}));
    }
    set angle (_) {
        if (_ == this.convert.from.value) {
            this.#animate();
            this.#θ = Math.max(0, Math.min(this.convert.from.value(this.round()), 360));
        } else {
            let PI = _;
            this.#θ = Math.max(this.minθ, Math.min(PI.$press.θ - PI.$drag.dy * (this.matches('.fine') ? .1 : 1), this.maxθ));
            (this.#θ == this.minθ || this.#θ == this.maxθ) && ([PI.$press.y, PI.$press.θ] = [PI.$drag.y, this.#θ]);
            this.value = this.convert.from.angle;
        } 
        this.matches('.symmetric') && this.classList.toggle('negative', this.#θ < 180);
        E(this).set({'--angle': this.#θ});
    }
    round ({value, step} = {}) {
        value ??= this.#v, step ??= this.step;
        value = Math.round(value / step) * step;
        return parseFloat(value.toFixed(`${step}`.split('.')[1]?.length ?? 0));
    }
    convert = {from: { 
        value: value => (value - this.minV) / (this.maxV - this.minV) * (this.maxθ - this.minθ) + this.minθ,
        angle: angle => (angle - this.minθ) / (this.maxθ - this.minθ) * (this.maxV - this.minV) + this.minV
    }}
    #snap () {
        this.snap ??= this.get('snap') || [Math.max(0, this.minV)];
        this.value = typeof this.snap == 'number' ? 
            this.round({step: this.snap}) : 
            this.snap.reduce((diff, curr) => Math.abs(curr - this.#v) <= Math.abs(diff - this.#v) ? curr : diff);
    }
    #edit () {
        this.input.setAttribute('value', parseFloat(this.output.value));
        this.input.step = this.step;
        this.output.replaceChildren(this.input);
        this.input.focus();
    }
    #animate () {
        this.classList.add('animate');
        setTimeout(() => this.classList.remove('animate'), 500);
    }
    static toFloat = str => str && str.trim() && !isNaN(Number(str)) ? parseFloat(str) : str;
}
customElements.define('drag-knob', Knob);
export default Knob;