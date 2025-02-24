class Inputs {
    constructor(selector, checked = true) {
        this.selector = selector;
        this.checked = checked;
    }
    get ids() {
        return [...document.querySelectorAll(`${this.selector}`)].map(input => input.id);
    }
    get stated() {
        return this.ids.map(id => `${/\d/.test(id[0])? `[id='${id}']` : `#${id}`}${this.checked? ':checked' : ':not(:checked)'}`);
    }
    following(elements, pseudo = '') {
        return this.stated.map((input, i) => input + `~* ${elements}:nth-of-type(${i+1})${pseudo}`).join();
    }
    labels(pseudo = '') {
        return this.stated.map((input, i) => input + `~* label[for=${this.ids[i]}]${pseudo}`).join();
    }
}
String.prototype.setCSS = function(css) {Q('style').insertAdjacentHTML('beforeend', this.toString() + css);};
    
const cookie = document.cookie.split(/;\s?/).map(o => o.split('=')).reduce( (obj, [k,v]) => ({...obj, [k]:v}) , {});
const parameter = new URL(window.location.href).search.substring(1).split('&').map(o => o.split('=')).reduce( (obj, [k,v]) => ({...obj, [k]:v}) , {});

typeof Polygon == 'undefined' && (Polygon = class {
    constructor(n, stroke = 0, r = 1) {
        this.n = n, this.stroke = stroke, this.r = r;

        this.angle = {
            half: Math.PI * (1 - 2 / this.n) / 2,
            center: 2 * Math.PI / this.n
        };
        this.normal = this.r * Math.sin(this.angle.half) + this.stroke / 2;
        this.side = this.normal / Math.tan(this.angle.half) * 2;
        this.radius = {
            stroked: this.normal / Math.sin(this.angle.half),
            //truncated: this.r * Math.sin(this.angle.half) / Math.sin(Math.PI - new Gon(this.n * 2).angle.center / 2 - this.angle.half)
        };
        this.height = this.radius.stroked * (1 + Math.cos(this.angle.center / 2));
    }
    static points(n) {
        let points = '';
        for (let i = 0; i <= n - 1; i++)
            points += Math.cos(2 * Math.PI / n * i) + ',' + Math.sin(2 * Math.PI / n * i) + ' ';
        return points;
    }
    static viewBox(svgs, {stroke}) {
        svgs.forEach(svg => E(svg, {viewBox: [-1,-1,2,2].map(
            (gon => m => m * gon.radius.stroked)(new Polygon(svg.classList[0].split('-')[0], stroke))
        ).join(' ')}));
    }
    polygon() {
        return E('polygon', {points: Polygon.points(this.n)});
    }
    svg = () => E('svg', [this.polygon()], {classList: `${this.n}-gon`});
})
