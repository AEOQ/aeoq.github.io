import {E,O,Q} from '../AEOQ.mjs';

class Π { // #private  $data  _user
    #click; #hold = {}; #drop = {}; #ancestor;
    constructor (targets, config) {
        this._config = config;
        Object.assign(this, new O(config).map(([k, v]) => [`_${k}`, v]));
        [targets].flat().flatMap(node => typeof node == 'string' ? Q(node) : node).forEach(node => {
            if (!node) return;
            Π.roots.add(node.getRootNode());
            (this._drag || this._drop) && node.classList.add('PI-draggable');
            this._scroll && this.#setup.scrollable(node);
        });
    }
    #events = new Proxy(
        Object.defineProperty({}, 'remove', {value() {Object.entries(this).forEach(p => removeEventListener(...p))}}),
        {set: (target, ...p) => (addEventListener(...p, {passive: true}), Reflect.set(target, ...p))}
    )
    #setup = {
        scrollable (node) {
            node.classList.add('PI-scrollable');
            node.addEventListener('wheel', ev => {
                if (ev.deltaY < 0 && node.scrollLeft > 0 || 
                    ev.deltaY > 0 && Math.ceil(node.scrollLeft) < node.scrollWidth - node.clientWidth) 
                    (node.scrollLeft += ev.deltaY > 0 ? 100 : -100) && ev.preventDefault();
            });
            node.addEventListener('scroll', () => {
                let {e, f} = new DOMMatrix(E(node).get('transform'));
                E(node).set({'--tx': e - node.scrollLeft, '--ty': f - node.scrollTop});
            });
        },
        droppable: node => {
            this.#drop.onto = [typeof node == 'string' ? Q(node) : node].flat();
            this.#drop.onto.forEach(el => el.classList.add('PI-droppable'));
        }
    }
    execute = (ev, target) => (this.target = target ?? ev.target) && this.#press(ev)
    #snapshot = (...what) => Object.fromEntries(what.map(w => [w, {
        transform: this[w] ? new DOMMatrix(E(this[w]).get('transform')) : {},
        ...w == 'target' ? {sx: this.target.scrollLeft, sy: this.target.scrollTop, ...E(this.target).getBoundingPageRect()} : {},
        ...w == 'ancestor' ? {sx: this.#ancestor.x?.scrollLeft, sy: this.#ancestor.y?.scrollTop} : {}
    }]))
    #press (ev) {
        if (!this.target || this.target.Q('.PI-target') || this._scroll && ev.pointerType != 'mouse') 
            return this.#reset();
        this.target.classList.add('PI-target');

        this.#ancestor = Π.findScrollable(this.target);
        this.$press = {
            event: ev, x: ev.clientX, y: ev.clientY, scrollX, scrollY,
            snapshot: this.#snapshot('target', 'ancestor')
        };
        this._hold && (this.#hold.timer = this._hold(new Hold(this)).schedule());
        this._drop?.onto && this.#setup.droppable(this._drop.onto);
        typeof this._press == 'function' && this._press(this, this.target);

        this.#events.contextmenu = ev => ev.preventDefault();
        this.#events.pointermove = ev => this.#drag(ev);
        this.#events.pointerup = this.#events.pointercancel = ev => this.#lift(ev);
    }
    #drag (ev) {
        if (this.target.Q('.PI-target')) return this.#reset();

        this.$drag = {
            ...this.$drag ?? {tx: 0, ty: 0},
            event: ev, x: ev.clientX, y: ev.clientY, 
            dx: ev.clientX - this.$press.x, dy: ev.clientY - this.$press.y,
        };
        if (Math.hypot(this.$drag.dx, this.$drag.dy) < 5) return;
        this.target.classList.add('PI-dragged');

        this.#hold.timer?.forEach(clearTimeout);
        this._scroll && this.drag.to.scroll.self(this._scroll === true ? undefined : this._scroll);
        if (this._drop) {
            this.drag.to.translate({x: this._drag?.x, y: this._drag?.y});
            this.drag.to.scroll.ancestor(true);
            this.drag.to.findOnto();
        }
        typeof this._drag == 'function' && this._drag(this, this.target, this.onto);
    }
    drag = {to: {
        scroll: {
            self: (axis = {x: true, y: true}) => this.target.scrollTo(
                this.$press.snapshot.target.sx - (axis.x ? this.$drag.dx : 0), 
                this.$press.snapshot.target.sy - (axis.y ? this.$drag.dy : 0)
            ),
            ancestor: (auto = false, ancestor = this.#ancestor) => {
                if (!auto) {
                    let {$press: {snapshot: {ancestor: snapshot}}} = this;
                    ancestor.x && (ancestor.x.scrollLeft = snapshot.sx + this.$press.x - this.$drag.x);
                    ancestor.y && (ancestor.y.scrollTop = snapshot.sy + this.$press.y - this.$drag.y);
                    return;
                }
                let d = {x: ['Width', 'Left'], y: ['Height', 'Top']};
                let s = new O(['x', 'y'].map(a => {
                    if (!ancestor[a]) return [a, undefined];
                    let {[`scroll${d[a][1]}`]: scrollPos, [`scroll${d[a][0]}`]: scrollSize, [`client${d[a][0]}`]: clientSize} = ancestor[a];
                    let ratio = this.$drag[a] / clientSize;
                    let ended = Math.abs(scrollSize - clientSize - scrollPos) <= 1;
                    return [a, ratio < .05 ? -4 : ratio > .95 && !ended ? 4 : 0];
                }));
                if (!s.x && !s.y) return Π.autoscroll &&= cancelAnimationFrame(Π.autoscroll);
                let loop = (() => {
                    s.x && ancestor.x.scrollBy(s.x, 0);
                    s.y && ancestor.y.scrollBy(0, s.y);
                    this.drag.to.translate({x: true, y: true});
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
            [this.$drag.tx, this.$drag.ty] = ['x', 'y'].map(a => 
                Math.max(bound(a, 'min'), Math.min(axis[a] === false ? 0 : this.$drag[`d${a}`], bound(a, 'max')))
                + (Π.swapping ? 0 : window[`scroll${a.toUpperCase()}`] - this.$press[`scroll${a.toUpperCase()}`])
            );
            this._revert ??= true;
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
        this._scroll && ev.pointerType == 'mouse' && Math.hypot(this.$drag?.dx, this.$drag?.dy) >= 5 && ev.stopPropagation();
        if (!this.target) return this.#reset();
        
        this.$lift = {event: ev, ...this.onto ? {snapshot: this.#snapshot('onto')} : {}};
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
        this.target = this.onto = this.$drag = null; //keep $press for swap snapshot
        this.#events.remove();
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
    static events (...configs) {
        Π.config ??= new Map();
        configs.flatMap(confs => Array.isArray(confs) ? confs : Object.entries(confs)).forEach(([targets, conf]) => {
            let πs = Π.config.get(targets) ?? [];
            πs.length === 0 && Π.config.set(targets, πs);
            πs.some(π => π._config == conf) || πs.push(new Π(targets, conf));
        });
        Π.css.then(css => Π.roots.forEach(root => {
            if (root.adoptedStyleSheets.includes(css)) return;
            root.adoptedStyleSheets.push(css);
            root.addEventListener('pointerdown', ev => ev.stopPropagation() ?? Π.#pointerdown(ev), {passive: true});
        }));
    }
    static #pointerdown = ev => {
        let nodes = [ev.target, ev.target.assignedSlot].filter(n => n);
        Π.config.forEach((πs, target) => { // map: {[node]: πs}
            typeof target == 'string' || (target = [target].flat());
            for (let node of nodes) {
                let targetNode = typeof target == 'string' ? node.closest(target) : 
                    target.includes(node) ? node : target.find(n => n?.contains(node));
                targetNode && πs.forEach(π => π.execute(ev, targetNode));
                if (targetNode) break;
            }
        });
    }
}
Object.assign(Π, {
    roots: new Set([document]),
    classes: {
        target: ['PI-target', 'PI-dragged', 'PI-reached', 'PI-held'],
        onto: ['PI-droppable', 'PI-receiving']
    },
    transform: {
        add: (node, matrix, {x, y}) => node.style.transform = Object.assign(new DOMMatrix(matrix), {e: matrix.e + x, f: matrix.f + y}),
        revert: (...pairs) => pairs.forEach(([node, snapshot]) => node.style.transform = snapshot.transform)
    },
    findScrollable (target) {
        let iterate = (node, axis) => {
            let dimension = axis == 'x' ? 'Width' : 'Height';
            while (node) {
                let oversize = node[`scroll${dimension}`] > node[`client${dimension}`];
                if (node == document.documentElement) return oversize ? node : null;
                let overflow = getComputedStyle(node)[`overflow${axis.toUpperCase()}`];
                if (oversize && ['auto', 'scroll'].includes(overflow)) return node;
                node = node.parentElement ?? document.documentElement;
            }
        };
        return Object.fromEntries(['x', 'y'].map(a => [a, iterate(target.parentElement, a)]));
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
                transform: translate(calc(var(--tx,0)*1px), calc(var(--ty,0)*1px)) !important;
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
    schedule = () => this.actions.map(([t, action]) => setTimeout(() => {
        this.π.target.classList.add('PI-held');
        typeof action == 'function' ? 
            action(this.π, this.π.target) : new Π(this.π.target, action).execute(this.π.$press.event, this.π.target);
    }, t*1000));
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
export default Π