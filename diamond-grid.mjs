import {E,Q} from '../AEOQ.mjs';
class DG extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'}).append(
            E('link', {rel: 'stylesheet',href: 'https://aeoq.github.io/diamond-grid.css', me: true}),
            E('slot', {onslotchange: () => this.arrange(null)}) //for removal
        );
    }
    connectedCallback() {
        let sheets = this.getRootNode().adoptedStyleSheets;
        sheets.includes(DG.#css) || sheets.push(DG.#css);
        let E_this = E(this);
        let [side, gap] = E_this.get(['--side', '--gap']).map(p => parseFloat(p));
        E_this.set(isNaN(side) ? {'--side': '20em'} : {}, isNaN(gap) ? {'--gap': '.5em'} : {});
        this.hidden = false;
        DG.ReOb.observe(this);
    }
    static ReOb = new ResizeObserver(entries => {
        let [grid, child] = [true, false].map(b => entries.find(en => en.target instanceof DG === b));
        let width = child ? null : grid.borderBoxSize[0].inlineSize;
        (entries.length === 1 || grid) && entries[0].target.closest(DG.tagName)?.arrange(width);
    })
    #W; #w; #g;
    arrange (W, g = E(this).get('gap')) {
        let nodes = [...this.children].filter(node => node.offsetWidth);
        let w = nodes[0].offsetWidth;
        if (!nodes.length || !W && !this.#W || W === this.#W && w === this.#w && g === this.#g) return;
        nodes.forEach(node => {
            node.classList.remove('DG-left', 'DG-right', 'DG-center', 'DG-next');
            node.matches('img,:has(.DG-textShaping)') || node.prepend(E('span.DG-textShaping'), E('span.DG-textShaping'));
            DG.ReOb.observe(node);
        });

        this.#w = w, this.#g = g;
        W ? this.#W = W : W = this.#W;
        let more = Math.floor((W + g) / (w + g)),
            less = Math.floor((2 * W - w + g) / 2 / (w + g));
        if (more === less)
            return nodes.forEach((node, i) => node.classList.add(Math.ceil((i + 1) / more) % 2 === 0 ? 'DG-right' : 'DG-left'));

        let n = 1, i;
        while (nodes[i = (more + less) * n - less]) {
            let j = 0;
            while (j <= more - 1 && nodes[i + j]) {
                nodes[i + j].classList.add(j < more - 1 ? 'DG-center' : 'DG-next');
                j++;
            }
            n++;
        }
    }
    static tagName = 'diamond-grid'
    static #css = new CSSStyleSheet()
    static {
        this.#css.replaceSync(`
            span.DG-textShaping {width: 50%; height: 100%;}
            span:nth-child(1 of .DG-textShaping) {float: left; shape-outside: polygon(0 0,100% 0,0 50%,100% 100%,0 100%);}
            span:nth-child(2 of .DG-textShaping) {float: right; shape-outside: polygon(100% 0,0 0,100% 50%,0 100%,100% 100%);}
        `)
    }
}
customElements.define(DG.tagName, DG);
//nw+(n-1)g=W, n=(W+g)/(w+g)
//nw+(n-1)g=W-(w+g/2), n=(2W-w+g)/2(w+g)  
