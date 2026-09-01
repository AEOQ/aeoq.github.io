import {E,Q} from 'https://aeoq.github.io/AEOQ.mjs';
import PI from '../pointer-interaction.mjs';
customElements.define('dialog-gallery', class DG extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'}).append(
            E.link({href: 'https://aeoq.github.io/dialog-gallery.css', me: true}),
            this.dialog = E('dialog', {part: 'dialog'}, 
                E('form', {method: 'dialog', part: 'form'}, [
                    E('button#small', '🔎➖'),
                    E('button#close', '關閉'),
                    E('button#large', '➕🔍')
                ]),
                E('slot', {onslotchange: ev => this.#arrange(ev)})
            )
        );
    }
    connectedCallback () {
        let sheets = this.getRootNode().adoptedStyleSheets;
        sheets.includes(DG.#css) || sheets.push(DG.#css);
        this.hidden = false;
        this.ondblclick = ev => ev.target.matches('img[title]') && open(`https://www.google.com/search?q=${ev.target.title}&udm=2`);
        this.sQ('form').onclick = ev => 
            ev.target.id == 'close' ? '' :
            E(this.dialog).set({'--f': (E(this.dialog).get('--f') || 1) + (ev.target.id == 'large' ? .1 : -.1)}) && false;
        if (this.id) {
            Q(`a[href='#${this.id}']`)?.addEventListener('click', () => this.open());
            window.location.hash == this.id && this.open();
        }
    }
    #arrange (ev) {
        let single = !ev.target.assignedElements().some(node => node.tagName == 'FIGURE');
        ev.target.classList.toggle('single', single);
        PI.events({[single ? 'slot' : 'figure']: DG.#config});
    }
    open = () => this.dialog.showModal();
    static #config = {scroll: {x: true}};
    static #css = new CSSStyleSheet()
    static {
        DG.#css.replaceSync(`
            dialog-gallery img {user-select: none; -webkit-user-drag: none;}
            dialog-gallery figure>:not(img) {margin: 1em auto; color: white;}
        `)
    }
});
window.PI=PI