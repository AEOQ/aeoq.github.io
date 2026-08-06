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
        this.#arrange();
        this.hidden = false;
        this.ondblclick = ev => ev.target.matches('img[title]') && open(`https://www.google.com/search?q=${ev.target.title}&udm=2`);
        this.sQ('form').onclick = ev => 
            ev.target.classList == 'close' ? '' :
            E(this.dialog).set({'--f': (E(this.dialog).get('--f') || 1) + (ev.target.matches('.large') ? .1 : -.1)}) && false;
        new MutationObserver(([{addedNodes}]) => addedNodes?.length > 0 && this.#arrange()).observe(this, {childList: true});
        if (this.id) {
            Q(`a[href='#${this.id}']`)?.addEventListener('click', () => this.open());
            window.location.hash == this.id && this.open();
        }
    }
    #arrange() {
        this.dialog.Q('figure', []).length === 0 && !this.sQ('slot') && this.dialog.append(E('slot'));
        let figures = this.Q('figure', []);
        if (figures.length === 0) return;
        
        this.Q('figure', []).forEach((fig, i) => {
            this.append(...[...fig.children].map(img => E(img).set({slot: `slot-${this.#counter + i}`})));
            this.dialog.append(E(fig).set([E('slot', {name: `slot-${this.#counter + i}`})]));
            PointerInteraction.events([[fig.firstChild, {scroll: {x: true}}]]);
        });
        this.#counter += figures.length;
    }
    open = () => this.dialog.showModal();
});