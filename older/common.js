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
String.prototype.setCSS = function(css) {document.querySelector('style').insertAdjacentHTML('beforeend', this.toString() + css);};
    
const cookie = document.cookie.split(/;\s?/).map(o => o.split('=')).reduce( (obj, [k,v]) => ({...obj, [k]:v}) , {});
const parameter = new URL(window.location.href).search.substring(1).split('&').map(o => o.split('=')).reduce( (obj, [k,v]) => ({...obj, [k]:v}) , {});