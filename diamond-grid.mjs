import {A,E,O,Q} from '../AEOQ.mjs';
const tagName = 'diamond-grid';
Q('head').append(E('style', {id: tagName}, `
    ${tagName} .textShaping {
        width:50%; height:100%;

        &:nth-child(1) {
            float:left;    
            shape-outside:polygon(0% 0%,100% 0%,0% 50%,100% 100%,0% 100%);
        }
        &:nth-child(2) {
            float:right; 
            shape-outside:polygon(100% 0%,0% 0%,100% 50%,0% 100%,100% 100%);
        }
    }`
));
customElements.define(tagName, class extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'}).append(
            E.link({href: 'https://aeoq.github.io/diamond-grid.css', me: true}),
            this.slot = E('slot')
        );
    }
    #oldWidth;
    connectedCallback() {
        let E_this = E(this);
        isNaN(E_this.get('--side')) && E_this.set({'--side': '20em'});
        isNaN(E_this.get('--gap')) && E_this.set({'--gap': '.5em'});
        this.#shapeText();
        new ResizeObserver(([entry]) => {
            let newWidth = entry.borderBoxSize[0].inlineSize;
            if (!newWidth || newWidth === this.#oldWidth) return;
            this.#rearrange();
            this.#oldWidth = newWidth;
            this.style.opacity = 1;
        }).observe(this);
        new MutationObserver(() => this.#rearrange()).observe(this, {attributeFilter: ['hidden'], subtree: true});
    }
    #shapeText = () => [...this.children].forEach(el => 
        el.matches('img,:has(.textShaping)') || el.prepend(E('span.textShaping'), E('span.textShaping'))
    );
    #rearrange () {
        let items = [...this.children];
        items.forEach(item => item.classList.remove('DG-left','DG-right','DG-center','DG-next'));
        items = items.filter(item => !item.hidden);
        if (!items.length) return;

        let W = this.getBoundingClientRect().width,
            g = E(this).get('gap'),
            w = items[0].getBoundingClientRect().width;
        let more = Math.floor((W + g) / (w + g)),
            less = Math.floor((2 * W - w + g) / 2 / (w + g));
        if (more === less)
            return items.forEach((item, i) => item.classList.add(Math.ceil((i + 1) / more) % 2 === 0 ? 'DG-right' : 'DG-left'));

        let n = 1, i;
        while (items[i = (more + less) * n - less]) {
            let j = 0;
            while (j <= more - 1 && items[i + j]) {
                items[i + j].classList.add(j < more - 1 ? 'DG-center' : 'DG-next');
                j++;
            }
            n++;
        }
    }
});
//nw+(n-1)g=W, n=(W+g)/(w+g)
//nw+(n-1)g=W-(w+g/2), n=(2W-w+g)/2(w+g)  
