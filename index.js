import {A,E,O,Q} from './AEOQ.mjs';
import Polygon from "./platonic.js";
const Knob = {
    init (knob) {
        knob.oninput = ev => {
            let progress = Q('progress');
            progress.value = ev.target.value;
            E(progress.parentElement).set({'--value': progress.value});
        }
    }
};
const Fader = {
    init (input) {
        input.value = Math.random()*100;
        let pillar = Q(`#faders p:nth-child(${input.tabIndex})`);
        E(pillar).set({'--w-size': 5.5 - input.tabIndex + 1 + '%'});
        
        input.oninput = ev => Fader.move(input, pillar);
        input.onpointerup = ev => Fader.confirm();
        setTimeout(() => input.dispatchEvent(new InputEvent('input')));
    },
    move (input, pillar) {
        E(pillar).set({'--w-pos': 100 - input.value + '%'});
        E(input).set({'--value': input.value});
        let until = Fader.penetrated();
        E(Q('#faders')).set({'--laser': until === 0 ? '5000px' : Q(`#faders p:nth-child(${until})`).getBoundingClientRect().x+'px'});
    },
    confirm: () => Q('#faders').classList.toggle('done', Fader.penetrated() === 0),
    penetrated: () => Q('#faders p').findIndex(p => {
        let [pos, size] = E(p).get(['--w-pos', '--w-size']);
        return pos < 10 - (2*size/5 - .35) || pos > 10 + (2*size/5 - .35);
    }) + 1
}
const BD =  {
    init (diverter) {
        BD.diverter = diverter;
        BD.control = Q('continuous-knob'), BD.meter = Q('meter');
    },
    get angle() {return E(BD.diverter).get('--angle');},
    set angle(angle) {E(BD.diverter).set({'--angle': angle + 'deg'})},
    spin (time) {
        if (Q('#bd.seeing:not(.blurred)')) {
            let speed = BD.meter.value = Math.max(.05, BD.control.value || 0) + (Math.random() - .5)/100;
            E(BD.diverter).set({'--tilt': Math.max(0, (speed - .5 + Math.random()*speed/3)*90) + 'deg'});
            BD.angle += Math.min(100, time - BD.last)*speed*2;
        }
        BD.last = time;
        requestAnimationFrame(BD.spin);
    },
};
const Drum = {
    pattern: {
        kick:    [[1,0,0,0,1,0],[0,0,0,0,0,0],[1,0,0,0,1,0],[0,0,0,0,0,0],[1,0,0,0,1,0],[0,0,0,0,0,0],[1,0,1,0,0,0],[0,0,1,0,0,0]],
        snare:   [[0,0,0,0,0,0],[1,0,0,0,1,0],[0,0,0,0,0,0],[1,0,0,0,0,0],[0,0,0,0,0,0],[1,0,0,0,1,0],[0,0,0,0,0,0],[0,0,0,0,0,0]],
        crash:   [[1,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[1,0,1,0,0,0],[0,0,1,0,0,0]],
        ride:    [[0,0,0,0,0,0],[0,0,0,0,0,0],[1,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]],
        'hi-hat':[[0,0,1,0,1,0],[1,0,1,0,1,0],[1,0,1,0,1,0],[1,0,1,0,1,0],[1,0,1,0,1,0],[1,0,1,0,1,0],[0,0,0,0,0,0],[0,0,0,0,0,0]],
        'tom-h': [[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,1,1],[0,0,0,0,0,0]],
        'tom-m': [[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[1,1,0,0,0,0]],
        'tom-l': [[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,1,1]],
    },
    lastHit: {},
    playback: function(time, BPM) {
        Drum.playback.DPM ??= 1000*60 / BPM / Drum.pattern.kick[0].length;
        Drum.playback.beat ??= 0, Drum.playback.div ??= 0;
        if (!Q('#drum.seeing'))
            return Drum.playback.stop();

        new O(Drum.lastHit).each(([piece, lastHit]) => time - lastHit > 100 && Drum.playback.set(piece, 0));

        if (!Drum.playback.last || time - Drum.playback.last > Drum.playback.DPM) {
            let [beat, div] = Drum.playback.progress();
            new O(Drum.pattern).each(([piece, pattern]) => pattern[beat][div] && Drum.playback.set(piece, 1, time));
            Drum.playback.div++;
            Drum.playback.last = time;
        }
        requestAnimationFrame(Drum.playback);
    }
}
Drum.playback.progress = function() {
    Drum.pattern.kick[this.beat][this.div] == null && (this.beat++, this.div = 0);
    Drum.pattern.kick[this.beat] == null && (this.beat = this.div = 0);
    return [this.beat, this.div];
}
Drum.playback.stop = function() {
    this.beat = this.div = 0;
    requestAnimationFrame(this);
}
Drum.playback.set = function(piece, on, time) {
    Q(`#${piece}`).classList[on ? 'add':'remove']('on');
    Drum.lastHit[piece] = on ? time : null;
}
const Scroll = {
    inited: false,
    init () {
        Q('#drum h2').onclick = () => {
            Q('aside').hidden = false;
            if (!Scroll.inited) {
                Scroll.inited = true;
                Q('style:empty').textContent = ['slant','midSlant','inR'].map(p => `@property --${p} {syntax:'<number>'; inherits:true; initial-value:1;}`).join('');
                Scroll.truncated = [];
                Scroll.merge(6,8);
                Scroll.merge(12,20);
                onscroll = () => {
                    let progress = Q('html').scrollTop/(Q('html').scrollHeight-Q('html').clientHeight);
                    progress <= .5  && !Scroll.truncated[0] && Scroll.truncate(0);
                    progress <= .15 && !Scroll.truncated[1] && Scroll.truncate(1);
                }
            }
        }
        Q('aside').onclick = () => Q('aside').hidden = true;
    },
    truncate (which) {
        Scroll.truncated[which] = true;
        Q(`aside div:nth-of-type(${which+1}) hedron-p`).sQ('polygon', polygon => {
            let side = parseInt(polygon.id), stroke = E(polygon).get('--stroke');
            const r = new Polygon(side, stroke).normal;
            const strokeAdjusted = r - (new Polygon(side, stroke, r).radius.stroked - r);
            const points = Polygon.points(side, strokeAdjusted, -Math.PI / side, true);
    
            const animate = polygon.Q(`animate`);
            E(animate).set({
                from: animate.getAttribute('to') || animate.parentNode.getAttribute('points'),
                to: points
            });
            E(animate.parentNode).set({points});
            animate.beginElement();
        });
    },
    merge (transfer, receive) {
        let [trS, reS] = [Q(`hedron-p[face="${transfer}"]`), Q(`hedron-p[face="${receive}"]`)].map(hedron => hedron.shadowRoot);
        [trS, reS].forEach(shadow => E(shadow.Q('polygon'), {stroke: shadow.host.stroke}));
        reS.Q('figure').style.fontSize = reS.host.getAttribute('scale') + 'em';
        reS.append(trS.Q('figure'), trS.Q('style[id]'), trS.host.parentElement.Q('style').cloneNode(true));
        reS.Q('defs').append(trS.Q('defs>*'));
        trS.host.remove();
    }  
}
export {Knob, Fader, BD, Drum, Scroll}
