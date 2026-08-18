import {E,O,Q} from '../AEOQ.mjs';

class Π { // #private  $data  _user
    #click; #hold = {}; #drop = {}; #scrollable;
    constructor (targets, actions) {
        Object.assign(this, new O(actions).map(([k, v]) => [`_${k}`, v]));
        [targets].flat().flatMap(node => typeof node == 'string' ? Q(node) : node).forEach(node => {
            if (!node) return;
            Π.roots.add(node.getRootNode());
            (this._drag || this._drop) && node.classList.add('PI-draggable');
            this._scroll && this.#setup.scrollable(node);
        });
    }
    #events = new Proxy(
        Object.defineProperty({}, 'remove', {value() {Object.entries(this).forEach(p => removeEventListener(...p))}}),
        {set: (target, ...p) => (addEventListener(...p), Reflect.set(target, ...p))}
    )
    #setup = {
        scrollable (node) {
            node.classList.add('PI-scrollable');
            node.addEventListener('wheel', ev => {
                if (ev.deltaY < 0 && node.scrollLeft > 0 || 
                    ev.deltaY > 0 && Math.ceil(node.scrollLeft) < node.scrollWidth - node.clientWidth) 
                    (node.scrollLeft += ev.deltaY > 0 ? 100 : -100) && ev.preventDefault();
            });
            node.addEventListener('scroll', () => E(node).set({'--scrolledX': node.scrollLeft, '--scrolledY': node.scrollTop}));
        },
        droppable: (node, target = this.target) => {
            this.#drop.onto = typeof node == 'string' ? Q(node, []) : node;
            this.#drop.onto.forEach(el => el.classList.add('PI-droppable'));
            console.log(this.#scrollable = Π.findScrollable(target));
        }
    }
    execute (ev, target) {
        this.target = target ?? ev.target;
        this.#press(ev);
    }
    #snapshot = which => ({
        [which]: {
            transform: new DOMMatrix(E(this[which]).get('transform')),
            ...which == 'target' ? E(this.target).getBoundingPageRect() : {},
            ...which == 'target' ? {sx: this.target.scrollLeft, sy: this.target.scrollTop} : {},
        }
    })
    #press (ev) {
        this.event = ev;
        if (!this.target || this.target.Q('.PI-target') || this._scroll && ev.pointerType != 'mouse') 
            return this.#reset();
        this.target.classList.add('PI-target');

        this.$press = {
            x: ev.clientX, y: ev.clientY, scrollY: window.scrollY,
            snapshot: this.#snapshot('target')
        };
        this._hold && (this.#hold.timer = this._hold(new Hold(this)).schedule());
        this._drop?.onto && this.#setup.droppable(this._drop.onto);
        typeof this._press == 'function' && this._press(this, this.target);

        this.#events.contextmenu = ev => ev.preventDefault();
        this.#events.pointermove = ev => this.#drag(ev);
        this.#events.pointerup = this.#events.pointercancel = ev => this.#lift(ev);
    }
    #drag (ev) {
        this.event = ev;
        ev.preventDefault();
        if (this.target.Q('.PI-target')) return this.#reset();

        this.$drag = {
            ...this.$drag ?? {tx: 0, ty: 0},
            x: ev.clientX, y: ev.clientY, 
            dx: ev.clientX - this.$press.x, dy: ev.clientY - this.$press.y,
        };
        if (Math.hypot(this.$drag.dx, this.$drag.dy) < 5) return;
        this.target.classList.add('PI-dragged');

        this.#hold.timer?.forEach(clearTimeout);
        this._scroll && this.drag.to.scroll(this._scroll === true ? undefined : this._scroll);
        if (this._drop) {
            this.drag.to.translate({x: this._drag?.x, y: this._drag?.y});
            this.drag.to.autoscroll();
            this.drag.to.findOnto();
        }
        typeof this._drag == 'function' && this._drag(this, this.target, this.onto);
    }
    drag = {to: {
        scroll: (axis = {x: true, y: true}) => this.target.scrollTo(
            this.$press.snapshot.target.sx - (axis.x ? this.$drag.dx : 0), 
            this.$press.snapshot.target.sy - (axis.y ? this.$drag.dy : 0)
        ),
        autoscroll: (scrollable = this.#scrollable) => {
            if (scrollable.y) {
                let ratio = this.$drag.y / scrollable.y.clientHeight;
                let bottomed = scrollable.y.scrollTop + scrollable.y.clientHeight >= document.body.offsetHeight + 100;
                let y = ratio < .05 ? -4 : ratio > .95 && !bottomed ? 4 : 0;
                if (!y) return Π.autoscroll &&= cancelAnimationFrame(Π.autoscroll);
                let loop = (() => {
                    scrollable.y.scrollBy(0, y);
                    this.drag.to.translate({y: true});
                    Π.autoscroll = requestAnimationFrame(loop);
                });
                Π.autoscroll || loop();
            }
        },
        select: bullseye => {
            this.target.Q('.PI-selected')?.classList.remove('PI-selected');
            return {from: nodes => {
                typeof nodes == 'function' ? 
                    this._drag.from = [...nodes()] : this._drag.from ??= [...nodes ?? this.target.children];
                this.onto = this._drag.from.find(child => E(child).contains(bullseye));
                this.onto?.classList.add('PI-selected');
            }};
        },
        translate: (axis = {x: true, y: true}, target = this.target) => {
            let bound = (a, f) => typeof axis[a]?.[f] == 'function' ? 
                    axis[a][f](this, this.target, this.onto) : axis[a]?.[f] ?? (f == 'min' ? -Infinity : Infinity);
            let [x, y] = ['x', 'y'].map(a => 
                Math.max(bound(a, 'min'), Math.min(axis[a] === false ? 0 : this.$drag[`d${a}`], bound(a, 'max')))
            );
            this._revert ??= true;
            [this.$drag.tx, this.$drag.ty] = [x, y + (Π.swapping ? 0 : scrollY - this.$press.scrollY)];
            E(target).get('display') == 'inline' && (target.style.display = 'inline-block');
            Π.transform.add(target, this.$press.snapshot.target.transform, {x: this.$drag.tx, y: this.$drag.ty});
        },
        findOnto: () => {
            let below = document.elementFromPoint(this.$drag.x, this.$drag.y);
            if (!below) return;
            below = below.shadowRoot?.elementFromPoint(this.$drag.x, this.$drag.y) ?? below;
            !this.#drop.onto.includes(below) && (below = null);
            this.target.classList.toggle('PI-reached', below ? true : false);
            if (below == this.onto) return; 
            this.onto?.classList.remove('PI-receiving');
            (this.onto = below)?.classList.add('PI-receiving');
        }
    }}
    #lift (ev) {
        this.event = ev;
        this._scroll && ev.pointerType == 'mouse' && Math.hypot(this.$drag?.dx, this.$drag?.dy) >= 5 && ev.stopPropagation();
        if (!this.target) return this.#reset();

        this.onto && (this.$lift = {snapshot: this.#snapshot('onto')});
        this._click && !this.target.matches('.PI-dragged') && this.lift.to.click();

        typeof this._lift == 'function' && this._lift(this, this.target, this.onto);
        this._revert && !Π.swapping && this.lift.to.revert();
        this.#reset();
    }
    lift = {to: {
        click: () => {
            this.#click ??= this._click(new Click(this));
            this.#click.count = new Date() - this.#click.lastClicked <= 350 ? this.#click.count + 1 : 1;
            this.#click.lastClicked = new Date();
            this.#click.fire(this.#click.count);
        },
        transfer: cloned => {
            if (!this.onto || this.onto == this.target.parentElement) return;
            let appended = this.onto.appendChild(cloned ?? this.target);
            appended.classList.remove(...Π.classes.target);
            appended.style.transform = this.$press.snapshot.target.transform;
        },
        clone: () => this.lift.to.transfer(this.target.cloneNode(true)),
        swap: () => {
            if (!this.onto) return;
            Π.swapping = true;
            [this.target, this.onto].forEach(node => node.classList.add('PI-animate'));
            let {x, y} = E(this.onto).getBoundingPageRect();
            x -= this.$press.snapshot.target.x; y -= this.$press.snapshot.target.y;
            Π.transform.add(this.target, this.$press.snapshot.target.transform, {x, y});
            Π.transform.add(this.onto, this.$lift.snapshot.onto.transform, {x: -x, y: -y});
        },
        revert: () => {
            Math.hypot(this.$drag?.dx, this.$drag?.dy) >= 1 && this.target.classList.add('PI-animate');
            Π.transform.revert([this.target, this.$press.snapshot.target]);
        }
    }}
    #reset () {
        Π.autoscroll = cancelAnimationFrame(Π.autoscroll);
        this.#hold.timer?.forEach(clearTimeout);
        let {target, onto} = this;
        this.target = this.onto = this.event = null;
        this.#events.remove();
        this.$drag = null;
        target?.classList.remove(...Π.classes.target);
        this.#drop?.onto?.forEach(el => el.classList.remove(...Π.classes.onto));
        target?.matches('.PI-animate') && setTimeout(() => {
            Π.swapping && this.#commitSwap(target, onto);
            [target, onto].forEach(node => node?.classList.remove('PI-animate'));
            typeof this._callback == 'function' && this._callback(this, target, onto);
        }, 500);
    }
    #commitSwap = (target, onto) => {
        let marker = E('');
        target.before(marker);
        onto.before(target);
        marker.replaceWith(onto);
        Π.transform.revert([target, this.$lift.snapshot.onto], [onto, this.$press.snapshot.target]);
        Π.swapping = false;
    }
    static events (config) {
        Π.config ??= new Map();
        new O(config).each(([targets, conf]) => { // config can be instance O
            let πs = Π.config.get(targets) ?? [];
            πs.length === 0 && Π.config.set(targets, πs);
            πs.push(new Π(targets, conf));
        });
        Π.css.then(css => Π.roots.forEach(root => {
            if (root.adoptedStyleSheets.includes(css)) return;
            root.adoptedStyleSheets.push(css);
            root.addEventListener('pointerdown', ev => ev.stopPropagation() ?? Π.#pointerdown(ev));
        }));
    }
    static #pointerdown = ev => Π.config.forEach((πs, node) => { // map: {[node]: πs}
        if (typeof node == 'string')
            node = ev.target.closest(node);
        else {
            node = [node].flat();
            node = node.includes(ev.target) ? ev.target : node.find(n => n.contains(ev.target));
        }
        node && πs.forEach(π => π.execute(ev, node));
    });
}
Object.assign(Π, {
    roots: new Set(),
    classes: {
        target: ['PI-target', 'PI-dragged', 'PI-reached'],
        onto: ['PI-droppable', 'PI-receiving']
    },
    transform: {
        add: (node, matrix, {x, y}) => node.style.transform = Object.assign(new DOMMatrix(matrix), {e: matrix.e + x, f: matrix.f + y}),
        revert: (...pairs) => pairs.forEach(([node, snapshot]) => node.style.transform = snapshot.transform)
    },
    findScrollable (target) {
        let iterating = (node, axis) => {
            let dimension = axis == 'x' ? 'Width' : 'Height';
            while (node) {
                if (node[`scroll${dimension}`] > node[`client${dimension}`]) return node;
                if (node == document.documentElement) return;
                node = node.parentElement ?? document.documentElement;
            }
        };
        return {
            x: iterating(target.parentElement, 'x'),
            y: iterating(target.parentElement, 'y')
        };
    },
    css: new CSSStyleSheet().replace(`
        .PI-draggable,.PI-target {
            touch-action: none; user-select: none;
            
            a&,img&,a,img {-webkit-user-drag: none;}
        }
        .PI-dragged,.PI-scrollable:has(:is(.PI-dragged,.PI-animate)) {
            z-index: 1; position: relative;
        }
        .PI-animate {
            z-index: 2; position: relative;
            transition: transform .5s;
        }
        .PI-dragged,.PI-animate,.PI-receiving :not(.PI-droppable) {pointer-events: none;}
        .PI-scrollable {
            overflow: scroll; scrollbar-width: none;
            contain: layout;
            
            &:has(.PI-target,.PI-animate) {
                overflow: visible;
                transform: translate(calc(var(--scrolledX,0)*-1px), calc(var(--scrolledY,0)*-1px));
            }
        }
    `)
});
class HoldClick {
    constructor(π) {this.π = π;}
    actions = [];
    for = param => this.actions.push([param]) && this;
    to = action => this.actions.at(-1).push(action) && this;
    chain = func => (func && func(this), this);
}
class Hold extends HoldClick {
    constructor(π) {super(π);}
    schedule = () => this.actions.map(([s, action]) => setTimeout(() => action(this.π, this.π.target), s*1000));
}
class Click extends HoldClick {
    #timers = [];
    constructor(π) {super(π);}
    abort = () => this.actions.at(-1).push(true) && this;
    fire = () => {
        let target = this.π.target;
        this.#timers.forEach(([times, timer]) => times < this.count && clearTimeout(timer));
        this.actions.forEach(([times, action, abort]) => this.count == times && 
            this.#timers.push([this.count, setTimeout(() => action(this.π, target), abort ? 350 : 0)]));
    }
}
const PointerInteraction = Π
export default PointerInteraction