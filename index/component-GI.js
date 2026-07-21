import {A,E,O,Q} from '../AEOQ.mjs';
import Polygon from "./platonic.js";
customElements.define('great-icosahedron', class extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        [this.face, this.side, this.portion, this.around] = [20, 3, 5, 5];
    }
    connectedCallback() {
        this.onclick = () => E(this).set({'--paused': 'paused'});
        this.hasAttribute('paused') && E(this).set({'--paused': 'paused'});
        this.shadowRoot.replaceChildren(...this.elements, 
            E.link({href: 'https://aeoq.github.io/index/polyhedra.css', me: true})
        );
        this.variables();
        this.color();
    }
    get stroke() {return this.getAttribute('stroke');}
    get elements() {
        const defs = E('svg', E(`defs>polygon#${this.side}`, {points: Polygon.points(this.side)}));
        const uses = n => [...new Array(n)].map(_ => E('svg', {viewBox: '-1,-1 2,2'}, E('use', {href: `#${this.side}`})));
        const figure = E('figure', [
            ...[...new Array(Math.floor(this.face / this.portion))].map(_ => E('div', uses(this.portion))),
            ...uses(this.face % this.portion)
        ]);            
        return [defs, figure];
    }
    variables = () => E(this).set({
        '--side': new Polygon(this.side, this.stroke).side,
        '--stroke': this.stroke,
        ...Object.fromEntries(['x', 'y', 'z', 'a'].map(p => [`--${p}`, Math.random() * 360 + 360]))
    });
    color = (hue = E(this).get('--hue')) => [
        [[1, 1], [2, 1], [3, 4], [4, 4]],
        [[1, 2], [2, 5], [3, 5], [4, 3]],
        [[1, 3], [2, 4], [3, 1], [4, 2]],
        [[1, 4], [2, 3], [3, 2], [4, 1]],
        [[1, 5], [2, 2], [3, 3], [4, 5]]
    ].forEach((colgroup, i) => colgroup.forEach(([g, t]) =>
        E(this.sQ(`div:nth-of-type(${g}) svg:nth-child(${t}) use`)).set({'--c': hue - i * 20})
    ));
    static observedAttributes = ['stroke'];
    attributeChangedCallback() {this.sQ('figure') ? this.variables() : this.connectedCallback();}
});
