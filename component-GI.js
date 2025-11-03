import {A,E,O,Q} from './AEOQ.mjs';
import Polygon from "./platonic.js";
customElements.define('great-icosahedron', class extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        [this.face, this.side, this.portion, this.around] = [20, 3, 5, 5];
        setTimeout(() => this.callback());
    }
    get stroke() {
        return this.getAttribute('stroke');
    }
    get elements() {
        const svg = 
        E('svg',
            E(`defs>polygon#${this.side}`, {points: Polygon.points(this.side)})
        );
        const polygons = n => [...new Array(n)].map(_ => 
            E('svg', {viewBox: '-1,-1 2,2'}, 
                E('use', {href: `#${this.side}`})
            )
        );
        const figure = E('figure', [
            ...[...new Array(Math.floor(this.face/this.portion))].map(_ => E('div', polygons(this.portion))),
            ...polygons(this.face%this.portion)
        ]);            
        for (let i = 1; i <= this.around; i++)
            figure.Q(`div svg:nth-child(${i})`, svg => E(svg).set({'--centerA': 360/this.around*i + 'deg'}));
        return [svg, figure];
    }
    callback() {
        this.onclick = () => E(this).set({'--paused': 'paused'});
        this.hasAttribute('paused') && E(this).set({'--paused': 'paused'});
        this.shadowRoot.replaceChildren(E('style', this.css), ...this.elements);
        this.variables();
        setTimeout(() => this.color());
        ['--x', '--y', '--z', '--a'].forEach(p => E(this).set({[p]: Math.random() * 360 + 360}));
    }
    color() {
        let hue = E(this).get('--hue');
        [
            [[1, 1], [2, 1], [3, 4], [4, 4]],
            [[1, 2], [2, 5], [3, 5], [4, 3]],
            [[1, 3], [2, 4], [3, 1], [4, 2]],
            [[1, 4], [2, 3], [3, 2], [4, 1]],
            [[1, 5], [2, 2], [3, 3], [4, 5]]
        ].forEach((colgroup, i) => colgroup.forEach(([g, t]) =>
            E(this.sQ(`div:nth-of-type(${g}) svg:nth-child(${t}) use`)).set({'--c': hue - i * 20})
        ));
    }
    static observedAttributes = ['stroke'];
    attributeChangedCallback() {
        this.sQ('figure') ? this.variables() : this.callback();
    }
    variables() {
        this.gon = new Polygon(this.side, this.stroke);
        this.constants();
        E(this).set({
            '--stroke': this.stroke,
            '--slant': this.constant.slant + 'rad',
            '--inR': this.constant.inR * this.gon.side,
            '--circumR': 1 || this.constant.circumR * this.gon.side,
            '--midSlant': this.constant.foldA - this.constant.slant + 'rad',
        });
    }
    constants() {
        let [inR, circumR] = [(3 * Math.sqrt(3) + Math.sqrt(15)) / 12, Math.sqrt(10 + 2 * Math.sqrt(5)) / 4];
        this.constant = {
            inR: Math.sqrt(3) * (Math.sqrt(5) - 3) / 12,
            circumR: Math.sqrt(11 - 4 * Math.sqrt(5)) / 2,
            foldA: Math.acos(Math.sqrt(5) / -3),
            slant: Math.PI / 2 - Math.asin(inR / circumR),
        }
    }
    css = `*,*::before,*::after {box-sizing:border-box;}
    :host {
        min-width:calc(var(--circumR)*10em); height:calc(var(--circumR)*10em);
    }
    figure,figure::before,figure::after {
        border:.1em dotted var(--ring, yellowgreen); border-radius:9em;
        animation-play-state:var(--paused) !important;
    }
    figure {
        width:100%; height:100%;
        margin:0;
        animation:spin 30s infinite linear;
        transform-style:preserve-3d;
    }
    figure::before,figure::after {
        content:'';
        position:absolute;
        width:100%; height:100%;
        box-sizing:border-box;
    }
    figure::before {animation:before-spin 30s infinite linear alternate-reverse;}
    figure::after  {animation:after-spin 30s infinite linear alternate-reverse;}
    @keyframes spin {100% {transform: rotateX(360deg) rotateY(720deg) rotateZ(1080deg);}}
    @keyframes before-spin {to {transform:rotate3d(var(--x),var(--y),var(--z),calc(1deg*var(--a)));}}
    @keyframes after-spin  {to {transform:rotate3d(var(--x),var(--y),var(--z),calc(-1deg*var(--a)));}}
    div,svg {
        position: absolute;
        width: 10em;
        overflow: visible;
        transform-style: preserve-3d;
    }
    svg:has(defs:only-of-type) {display:none;}
    use {
        stroke: var(--border,hsl(268,100%,50%)); stroke-width: var(--stroke);
        fill: hsl(var(--c),50%,50%,.8);
    }
    div:nth-of-type(odd) {
        transform: translateZ(calc(var(--inR)*10em/2));
    }
    div:nth-of-type(even) {
        transform: rotateY(180deg) translateZ(calc(var(--inR)*10em/2));
    }
    div svg {
        transform-origin: 50% 50% calc(10em*var(--inR)/-2);
        transform: rotate(var(--centerA)) rotateY(calc(-1*var(--slant)));
    }
    div:nth-of-type(n+3) svg {
        transform: rotate(calc(var(--centerA) + 36deg)) rotateY(calc(-1*var(--midSlant)));
    }`;
});
