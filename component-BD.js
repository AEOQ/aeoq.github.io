customElements.define('bird-diverter', class extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML = this.css;
        this.shadowRoot.append(E('article', [
            E('div', {classList: 'darken'}, [
                E('svg', {class: 'darken', viewBox: '10 0 2 17.5'}, [
                    E('path', {d: 'M10,1 L10,17.5 L11,17.5 A1,1 0 0,0 11.75,16.5 Z'})
                ]),
                E('p', {classList: 'dim'}),
                E('p', {classList: 'glow'})
            ])
        ]))
    }
    connectedCallback() {
        this.sQ('article').append(this.sQ('div').cloneNode(true));
    }
    css = `
    <style>
    :host {
        transform-style:preserve-3d;
        margin-top:1em;
        transform-origin:center -3em; transform:rotate(var(--tilt));
    }
    article {
        perspective:100em;
        width:10em; height:17.5em;
        transform-style:inherit;
    }
    div {
        width:100%; height:100%;
        position:absolute;
        border-top-left-radius:1em; border-top-right-radius:1em;
        background:#e3e5ec;
        backface-visibility:hidden;
        transform-style:inherit; will-change:transform;
        --dark-s:.3em; --light-s:.15em;
    }
    div:first-child {
        transform:rotateY(var(--angle));
        --dark-c:#a0c900; --light-c:#dfed04;
    }
    div:last-child {
        transform:rotateY(calc(var(--angle) + 180deg));
        --dark-c:#f74608; --light-c:#fd5a1b;
    }
    svg {
        position:absolute; left:100%; bottom:0;
        width:2em; 
        fill:#ddd;
        transform:rotateY(-45deg); transform-origin:left;
    }
    p {
        width:9em; height:5.5em;
        border-radius:.5em;
        box-shadow:0 0 .3em #00000055;
        margin:auto;
    }
    p:first-of-type {
        background: repeating-linear-gradient(45deg,
            transparent, transparent var(--dark-s),
            var(--light-c) var(--dark-s), var(--light-c) calc(var(--dark-s) + var(--light-s))
        ), repeating-linear-gradient(-45deg,
            transparent, transparent var(--dark-s),
            var(--light-c) var(--dark-s), var(--light-c) calc(var(--dark-s) + var(--light-s))
        ), var(--dark-c);
        border:var(--light-s) solid var(--light-c);
        margin:3em auto 1.7em auto;
    }
    p:last-of-type {
        background:#edede1;
    }

    :host::after,:is(article,div)::before,:is(article,div)::after {
        content:'';
        position:absolute; left:50%;
    }
    :host::after {
        bottom:calc(100% + 1em); transform:translate(-50%,0);
        width:.5em; height:2.5em;
        border-radius:9em;
        background:linear-gradient(to right,black,silver,silver,black);
        --ani:dim; will-change:filter;
    }
    article::before,article::after {
        top:-1.8em; transform:translateX(-50%) rotateY(calc(var(--angle) + 89deg));
        width:2em; height:2em;
        border-radius:9em; border:.2em solid gray;
        --ani:dim; will-change:filter;
    }
    article::after {transform:translateX(-50%) rotateY(calc(var(--angle) + 91deg));}
    div::before,div::after {
        top:.9em; transform:translate(-50%,-50%);
        width:1em; height:1em;
        border-radius:9em;
    }
    div::before {
        outline:.2em solid darkgoldenrod;
        --ani:dim; will-change:filter;
    }
    div::after {
        background:var(--sky);
        --ani:no; will-change:filter;
    }
    .dim {--ani:dim; will-change:filter !important;}
    div  {--ani:lapse-div; will-change:background;}
    svg  {--ani:lapse-svg; will-change:fill;}

    :host {
        animation-play-state:var(--paused) !important;
    }
    :host::before,:host::after,:host *,:host *::before,:host *::after {
        animation-play-state:inherit !important;
    }
    :host::after,:host *::before,:host *::after,:host [class] {
        animation:var(--ani) var(--day) infinite alternate linear;
    }
    :host .glow {
        animation:glow var(--day) infinite linear;
        will-change:background, box-shadow;
    }
    @keyframes lapse-div {
        20%,80% {background:#e3e5ec;}
        30%,70% {background:#2d2e2f;}
    }
    @keyframes lapse-svg {
        20%,80% {fill:#ddd;}
        30%,70% {fill:#2d2e2f;}
    }
    @keyframes dim {
        20%,80% {filter:none;}
        30%,70% {filter:brightness(.2);}
    }
    @keyframes glow {
        20%,80% {background:#edede1;box-shadow:0 0 .3em #00000055;}
        25%,30% {background:#60c473;box-shadow:0 0 1em #28e896;}
        70% {background:#2f2f2d;box-shadow:0 0 .3em #00000055;}
    }
    </style>`
});
