class Dragging {
    constructor (el, {what, translate, scroll, drop, hold, click, ...custom}) {
        typeof el == 'string' && (el = Q(el));
        if (!el) return;
        this.what = what, this.translate = translate;
        this.scroll = scroll, this.drop = drop, this.hold = hold;
        this.scroll && (el.onwheel = ev => {
            let scrolled = ev.target.closest(this.scroll.what);
            scrolled && (ev.deltaY < 0 && scrolled.scrollLeft != 0 || ev.deltaY > 0 && scrolled.scrollLeft != scrolled.scrollWidth - scrolled.clientWidth)
                && (scrolled.scrollLeft += ev.deltaY > 0 ? 100 : -100) && ev.preventDefault();
        });
        this.fixedPostioned = Q('aside');
        click === false && el.addEventListener('click', ev => ev.preventDefault());
        el.addEventListener('pointerdown', ev => this.press(ev, custom ?? {}));
    }
    events = new Proxy(
        Object.defineProperty({}, 'remove', {value() {[...new O(this)].forEach(p => removeEventListener(...p))}, enumerable: false}),
        {set: (target, ...p) => addEventListener(...p) ?? Reflect.set(target, ...p)} //window
    )
    press (ev, {press, move, lift}) {
        this.mode = 
            !this.scroll && !this.drop ? 'drag' : 
            this.scroll?.when(ev) ? 'scroll' : this.drop?.when(ev) ? 'drop' : null;
        this.timer ??= this.holdTimer(ev, this.hold);
        if (!this.mode && !this.timer) return;
        this.dragged = ev.target.closest(this[this.mode]?.what || this.what || '*');
        this.#press?.[this.mode]?.();
        [this.pressX, this.pressY] = [ev.x, ev.y];
        press && (typeof press == 'object' ? press[this.mode] : press)?.(this, this.dragged);
        this.events.pointermove = ev => this.move(ev, move);
        this.events.pointerup = this.events.pointercancel = () => this.lift(null, lift);
    }
    #press = {
        scroll: () => this.scrollInitX = this.dragged.scrollLeft,
        drop: () => {
            this.targets = [this.drop.targets].flat().map(el => Q(el, []));
            this.dragged.initial = Dragging.getBoundingPageRect(this.dragged);
            this.scrollInitY = scrollY;
            this.events.scroll = () => this.move();
        }
    }
    move (ev, move) {
        ev && ([this.moveX, this.moveY, this.deltaX, this.deltaY] = [ev.x, ev.y, ev.x-this.pressX, ev.y-this.pressY]) && ev.preventDefault();
        if (!this.dragged || Math.hypot(this.deltaX, this.deltaY) < 5) return;
        this.timer &&= clearTimeout(this.timer);
        if (!this.mode) return;
        this.dragged.classList.add('dragged');
        this.translate !== false && this.mode != 'scroll' && this.#move.move(ev);
        this.#move?.[this.mode]?.(ev);
        move && (typeof move == 'object' ? move[this.mode] : move)?.(this, this.dragged, this.targeted);
    }
    #move = {
        scroll: (ev) => ev.pointerType == 'mouse' && this.dragged.scrollTo(this.scrollInitX - this.deltaX, 0),
        move: (ev) => {
            ev || this.fixedPostioned?.contains(this.dragged) || (this.scrollY = scrollY - this.scrollInitY); //update value only when
            let x = this.translate?.x === false ? 0 : this.deltaX;
            let y = this.translate?.y === false ? 0 : this.deltaY + (this.scrollY ?? 0);
            let min = typeof this.translate?.x?.min == 'function' ? this.translate.x.min(this.dragged) : this.translate?.x?.min ?? -Infinity;
            let max = typeof this.translate?.x?.max == 'function' ? this.translate.x.max(this.dragged) : this.translate?.x?.max ?? Infinity;
            this.dragged.style.transform = `translate(${Math.max(min, Math.min(x, max))}px,${y}px)`;
        },
        drop: () => {
            (this.drop.autoScroll || this.drop.autoScroll == null) && this.autoScroll();
            this.findTarget();
        }
    }
    lift (_, lift) {
        this.timer &&= clearTimeout(this.timer);
        if (lift) {
            (typeof lift == 'function' ? lift : Array.isArray(lift[this.mode]) ? 
                lift[this.mode][this.drop.targets.findIndex(t => this.targeted?.matches(t))] :
                lift[this.mode])?.(this, this.dragged, this.targeted);
            Array.isArray(lift[this.mode]) && lift[this.mode].all?.(this, this.dragged, this.targeted);
        }
        this.dragged?.classList.remove('dragged');
        this.mode == 'drop' ? !this.targeted && this.to.return() : this.reset();
        this.events.remove();
    }

    holdTimer = (ev, action) => action && setTimeout(() => {
        action.to(ev.target);
        this.events.remove();
        action.redispatch && ev.target.dispatchEvent(new MouseEvent('pointerdown', ev));
    }, 500);
    autoScroll () {
        let [proportion, bottomed] = [this.moveY / innerHeight, scrollY + innerHeight >= document.body.offsetHeight + 250];
        proportion < .05 ? scrollBy(0, -4) : 
        proportion > .95 && !bottomed ? scrollBy(0, 4) : null;
    }
    findTarget () {
        this.targeted = null;
        let i = 0;
        if (!Dragging.containsPointer(this.fixedPostioned, this.moveX, this.moveY))
            while (i < this.targets.length && !this.targeted)
                this.targeted = this.targets[i++].find(el => el != this.dragged && Dragging.containsPointer(el, this.moveX, this.moveY));
        if (this.targeted?.matches('.targeted')) return;
        Q('.targeted')?.classList.remove('targeted');
        this.targeted?.classList.add('targeted');      
    }
    reset () {
        this.dragged?.classList.remove('selected');
        this.targeted?.classList.remove('targeted');
        this.dragged = this.targeted = this.mode = null;
        this.scrollY = 0;
    }

    static getBoundingPageRect = el => (({x, y}) => ({
        x: x + scrollX,
        y: y + scrollY,
    }))(el.getBoundingClientRect())
    static containsPointer = (el, moveX, moveY) => el && (({x, y, width, height}) => 
        moveX > x && moveY > y && moveX < x+width && moveY < y+height
    )(el.getBoundingClientRect())

    to = {
        select: (boundary) => {
            this.dragged.Q('.selected')?.classList.remove('selected');
            [...this.dragged.children].find(li => !li.matches(':has(.current),:last-child') &&
                (({x, width}) => Math.round(x) <= boundary && x+width >= boundary)(li.getBoundingClientRect())
            )?.classList.add('selected');
        },
        swap: () => {
            if (!this.targeted) return;
            let {x, y} = Dragging.getBoundingPageRect(this.targeted);
            this.dragged.style.transform = `translate(${x - this.dragged.initial.x}px,${y - this.dragged.initial.y}px)`;
            this.targeted.style.transform = `translate(${this.dragged.initial.x - x}px,${this.dragged.initial.y - y}px)`;
            Dragging.commit.swap(this.dragged, this.targeted);
            Dragging.class.temp(document.body, 'animating');
            setTimeout(() => this.reset(), 500);
        },
        transfer: () => {
            this.to.return(false);
            this.targeted.append(this.dragged, '');
        },
        clone: () => {
            this.dragged.classList.remove('dragged', 'selected');
            this.to.return();
            this.targeted.append(this.dragged.cloneNode(true), '');
        },
        return: (animate = true) => {
            this.dragged.style.transform = null;
            if (!animate) return;
            Dragging.class.temp(document.body, 'animating');
            setTimeout(() => this.reset(), 500);
        }
    }
    static commit = {
        swap: (dragged, targeted) => setTimeout(() => {
            targeted.nextSibling || targeted.after('');
            let place = targeted.nextSibling;
            dragged.before(targeted);
            place.before(dragged);
            dragged.style.transform = targeted.style.transform = null;    
        }, 500)
    }

    static class = {
        temp (el, cl, t)  {
            el = typeof el == 'string' ? Q(el) : el;
            el.classList.add(cl);
            setTimeout(() => el.classList.remove(cl), t ?? 500);
        },
        switch (el, cl) {
            el = typeof el == 'string' ? Q(el) : el;
            el.parentElement.Q(`.${cl}`).classList.remove(cl);
            el.classList.add(cl);
        }
    }
}
const DoubleTapping = (ev, timestore, actionORtarget) => {
    let now = new Date().getTime();
    if (now - timestore.lastTap < 500) {
        ev.preventDefault();
        typeof actionORtarget == 'function' ? actionORtarget(ev) : (actionORtarget || timestore).dispatchEvent(new Event('dblclick'));
    } 
    timestore.lastTap = now;
}
export {Dragging, DoubleTapping};