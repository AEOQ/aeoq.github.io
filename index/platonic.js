import {A,E,O,Q} from '../AEOQ.mjs';
class Polygon {
    constructor(n, stroke = 0, r = 1) {
        this.n = n;
        this.r = r;
        this.stroke = parseFloat(stroke);

        this.angle = {
            half: Math.PI * (1 - 2 / this.n) / 2,
            center: 2 * Math.PI / this.n
        };
        this.normal = this.r * Math.sin(this.angle.half) + this.stroke / 2;
        this.side = this.normal / Math.tan(this.angle.half) * 2;
        this.radius = {
            stroked: this.normal / Math.sin(this.angle.half),
            //truncated: this.r * Math.sin(this.angle.half) / Math.sin(Math.PI - new Polygon(this.n * 2).angle.center / 2 - this.angle.half)
        };
        this.height = this.radius.stroked * (1 + Math.cos(this.angle.center / 2));
    }
    static points(n, r = 1, start = 0, alt = false) {
        const point = i => [Math.cos(2 * Math.PI / n * i + start), Math.sin(2 * Math.PI / n * i + start)].map(c => Math.round(c * r * 100000) / 100000);
        const points = [...Array(n).keys()].map(i => [...point(i), ...n < 6 ? point(i) : []]).flat();
        return (alt ? [...points.slice(2), ...points.slice(0, 2)] : points).join(' ');
    }
    static viewBox(svgs, {stroke}) {
        svgs.forEach(svg => E(svg).set({viewBox: [-1,-1,2,2].map(
            (gon => m => m * gon.radius.stroked)(new Polygon(svg.classList[0].split('-')[0], stroke))
        ).join(' ')}));
    }
    polygon() {
        return E('polygon', {points: Polygon.points(this.n)});
    }
    svg = () => E('svg', this.polygon(), {class: `${this.n}-gon`});
}
customElements.define('hedron-p', class extends HTMLElement {
    constructor(animate) {
        super();
        this.shadow = this.attachShadow( {mode: 'open'} );
        this.animation = animate;
    }
    get stroke()  {return this.getAttribute('stroke');}
    get side()    {return {20:3, 12:5, 8:3, 6:4, 4:3}[this.face];}
    get portion() {return {20:5, 12:6, 8:4, 6:4, 4:3}[this.face];}
    get around()  {return {20:5, 12:5, 8:4, 6:4, 4:3}[this.face];}
    get elements() {
        const defs = E('svg', 
            E(`defs>polygon#${this.side}`, {points: Polygon.points(this.side)}, 
                E('animate', {attributeName: 'points', dur: '1000ms'})
            )
        );
        const uses = n => [...new Array(n)].map(_ => E('svg', {viewBox: '-1,-1 2,2'}, E('use', {href: `#${this.side}`})));
        const figure = E('figure', [
            ...[...new Array(Math.floor(this.face/this.portion))].map(_ => E('div', uses(this.portion))),
            ...uses(this.face%this.portion)
        ]);            
        
        this.color(figure);
        return [defs, figure];
    }
    color(place) {
        place.Q(`use`, gon => E(gon).set({'--c': this.getAttribute('color') || Math.random()*360}));
    }
    connectedCallback() {
        this.face = parseInt(this.getAttribute('face'));
        if (!this.face) return;
        this.animation ??= this.getAttribute('animate') === '' && true;
        this.shadowRoot.replaceChildren(...this.elements, 
            E.link({href: 'https://aeoq.github.io/index/polyhedra.css', me: true})
        );
        this.shadow.Q('figure').part = `f${this.face}`;
        this.variables();
    }
    
    variables() {
        this.gon = new Polygon(this.side, this.stroke);
        Object.assign(this.variable, {
            side: this.gon.side,
            normal: this.gon.normal,
            stroke : this.stroke,
        });
    }
    variable = new Proxy({}, {
        set: (obj, p, v) => {
            let style = this.shadow.Q('style[id|=form]') || this.animation && this.shadow.appendChild(E('style', {
                id: `form-${this.face}`,
                innerHTML: `@keyframes form-${this.face} {100%,95% {--slant:0;--inR:0} 80%,0% {}}`
            }));
            obj[p] = v;
            if (['slant', 'midSlant', 'inR'].includes(p) && this.animation) {
                style.innerHTML = style.innerHTML.replace(/(?=}})/, `--${p}:${v};`);
                v = 2;
            }
            E(this).set({[`--${p}`]: v});
            return true;
        }
    })
    static observedAttributes = ['stroke', 'color'];
    attributeChangedCallback(attr) {
        attr == 'color' ? this.color(this.shadow) : this.variables();
    }
});
export default Polygon