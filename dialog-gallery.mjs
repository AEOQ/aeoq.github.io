import {E,Q} from 'https://aeoq.github.io/AEOQ.mjs';
import PointerInteraction from 'https://aeoq.github.io/pointer-interaction/script.js';
const tagName = 'dialog-gallery';
customElements.define(tagName, class extends HTMLElement {
    #counter = 0;
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).append(
            E.link({rel: 'stylesheet',href: 'https://aeoq.github.io/dialog-gallery.css', me: true}),
            this.dialog = E('dialog', {part: 'dialog'}, 
                E('form', {method: 'dialog', part: 'form'}, [
                    E('button.small', '🔎➖'),
                    E('button.close', '關閉'),
                    E('button.large', '➕🔍')
                ])
            )
        );
    }
    connectedCallback() {
        this.arrange();
        this.events();
        setTimeout(() => this.hidden = false);
    }
    arrange() {
        let figures = this.Q('figure', []);
        if (figures.length === 0) return;
        if (this.dialog.Q('figure', []).length === 1) 
            return this.dialog.append(E('slot'));
        this.Q('figure', []).forEach((fig, i) => {
            this.append(...[...fig.children].map(img => E(img).set({
                slot: `slot-${this.#counter + i}`,
                classList: img.classList + (img.alt ? ' lookup' : '')
            })));
            this.dialog.append(E(fig).set([E('slot', {name: `slot-${this.#counter + i}`})]));
            PointerInteraction.events([[fig.firstChild, {scroll: {x: true}}]]);
        });
        this.#counter += figures.length;
    }
    events() {
        new MutationObserver(([{addedNodes}]) => addedNodes?.length > 0 && this.arrange()).observe(this, {childList: true});
        this.ondblclick = ev => ev.target.matches('img.lookup') && open(`https://www.google.com/search?q=${ev.target.alt}&udm=2`);
        this.sQ('form').onclick = ev => 
            ev.target.classList == 'close' ? '' :
            E(this.dialog).set({'--f': (E(this.dialog).get('--f') || 1) + .1 * (ev.target.classList[0] == 'large' ? 1 : -1)}) && false;
        Q(`a[href='#${this.id}']`)?.addEventListener('click', () => this.open());
        this.id && window.location.hash == this.id && this.open();
    }
    open = () => this.dialog.showModal();
});