import {A,E,O,Q} from './AEOQ.mjs';
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
        const svg = 
        E('svg', [
            E(`defs>polygon#${this.side}`, {points: Polygon.points(this.side)}, 
                E('animate', {attributeName: 'points', dur: '1000ms'})
            )
        ]);
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
        
        this.color(figure);
        return [svg, figure];
    }
    color(place) {
        place.Q(`use`, gon => E(gon).set({'--c': this.getAttribute('color') || Math.random()*360}));
    }
    connectedCallback() {
        this.face = parseInt(this.getAttribute('face'));
        if (!this.face) return;
        this.animation ??= this.getAttribute('animate') === '' && true;
        this.shadow.replaceChildren(E('style', this.#css), ...this.elements);
        this.shadow.Q('figure').part = `f${this.face}`;
        this.variables();
    }
    
    variables(...others) {
        this.gon = new Polygon(this.side, this.stroke);
        this.constants();
        Object.assign(this.variable, {
            stroke : this.stroke,
            slant : this.face == 12 ? Math.PI - this.constant.foldA : this.constant.slantA,
            inR : this.constant.inR*this.gon.side,
            circumR : this.constant.circumR*this.gon.side,
            extendR : this.gon.side/2/Math.cos(this.constant.foldA/2) + this.gon.normal*Math.tan(this.constant.foldA/2),
            midSlant : this.face == 20 ? this.constant.foldA - this.constant.slantA : '',
            ...others
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
    constants() {
        let inR, circumR, foldA;
        if (this.face == 20)
            [inR, circumR, foldA] = [(3*Math.sqrt(3) + Math.sqrt(15))/12, Math.sqrt(10 + 2*Math.sqrt(5))/4, Math.acos(Math.sqrt(5)/-3)];
        else if (this.face == 12)
            [inR, circumR, foldA] = [Math.sqrt(250 + 110*Math.sqrt(5))/20, (Math.sqrt(15) + Math.sqrt(3))/4, Math.acos(Math.sqrt(5)/-5)];
        else if (this.face == 8)
            [inR, circumR, foldA] = [Math.sqrt(6)/6, Math.sqrt(2)/2, Math.acos(1/-3)];
        else if (this.face == 6)
            [inR, circumR, foldA] = [1/2, Math.sqrt(3)/2, Math.PI/2];
        else if (this.face == 4)
            [inR, circumR, foldA] = [Math.sqrt(6)/12, Math.sqrt(6)/4, Math.acos(1/3)];
        this.constant = {
            inR, circumR, foldA,
            slantA: Math.PI/2 - Math.asin(inR/circumR),
        };
    }
    static observedAttributes = ['stroke', 'color'];
    attributeChangedCallback(attr) {
        attr == 'color' ? this.color(this.shadow) : this.variables();
    }
    #css = `
    figure {
        display: inline-flex; justify-content: center; align-items: center;
        margin: 0;
        text-align:left;
        width: calc(var(--circumR)*10em); height :calc(var(--circumR)*10em);
        transform-style: preserve-3d;
    }
    figure.extend {
        --inR: var(--extendR) !important;
    }
    div, svg {
        position: absolute;
        width: 10em; height: 10em;
        overflow: visible;
        transform-style: preserve-3d;
    }
    use {
        stroke: hsl(var(--c),50%,50%); stroke-width: var(--stroke);
        fill: hsla(var(--c),80%,80%,0.85);
        transition: .5s;
    }
    div:nth-of-type(odd) {
        transform: translateZ(calc(var(--inR)*10em/2));
    }
    div:nth-of-type(even) {
        transform: rotateY(180deg) translateZ(calc(var(--inR)*10em/2));
    }
    div svg {
        transform-origin: 50% 50% calc(10em*var(--inR)/-2);
        transform: rotate(var(--centerA)) rotateY(calc(-1rad*var(--slant)));
    }
    div:nth-of-type(n+3) svg {
        transform: rotate(calc(var(--centerA) + 36deg)) rotateY(calc(-1rad*var(--midSlant)));
    }
    figure[part='f12'] svg {
        transform: rotate(var(--centerA)) rotateY(calc(1rad*var(--slant)));

        &:last-child {transform: rotate(36deg);}
    }
    figure[part='f6'] div svg {
        transform: rotate(calc(var(--centerA) - 45deg)) rotateX(45deg) rotateY(90deg);
    }
    figure[part='f6']>svg:first-of-type {
        transform: translateZ(calc(var(--inR)*10em/2));
    }
    figure:is([part='f6'],[part='f4'])>svg:last-of-type {
        transform: translateZ(calc(var(--inR)*10em/-2));
    }`;
});
export default Polygon