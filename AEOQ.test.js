import {A,E,O,Q} from './AEOQ.mjs'; 

describe('Class A (Associative Array)', () => {
    let aa;

    beforeEach(() => {
        aa = new A([5, 7, 'er'], { a: 90, b: { c: false } });
    });

    describe('Initialization & Spreading', () => {
        test('spread array [...aa] returns only the array elements', () => {
            expect([...aa]).toEqual([5, 7, 'er']);
            expect(aa.length).toBe(3);
        });

        test('spread object {...aa} returns only non-numeric object properties', () => {
            expect({ ...aa }).toEqual({
                a: 90,
                b: { c: false }
            });
        });

        test('handles primitive args and multiple arrays during construction', () => {
            const custom = new A(1, 2, [3, 4], { key: 'val' });
            expect([...custom]).toEqual([1, 2, 3, 4]);
            expect({ ...custom }).toEqual({ key: 'val' });
        });
    });

    describe('Read and Write Operations', () => {
        test('reads numeric indices correctly', () => {
            expect(aa[0]).toBe(5);
            expect(aa[1]).toBe(7);
            expect(aa[2]).toBe('er');
            expect(aa[3]).toBeUndefined();
        });

        test('reads named object properties correctly', () => {
            expect(aa.a).toBe(90);
            expect(aa['b']).toEqual({ c: false });
            expect(aa.nonExistent).toBeUndefined();
        });

        test('writes to numeric indices and updates array length', () => {
            aa[0] = 100;
            aa[3] = 'newElement';

            expect([...aa]).toEqual([100, 7, 'er', 'newElement']);
            expect(aa.length).toBe(4);
            // Ensure newly added array indices remain hidden from object spread
            expect({ ...aa }).toEqual({ a: 90, b: { c: false } });
        });

        test('writes to named object properties', () => {
            aa.a = 999;
            aa['customKey'] = 'hello';

            expect(aa.a).toBe(999);
            expect(aa.customKey).toBe('hello');
            expect({ ...aa }).toEqual({
                a: 999,
                b: { c: false },
                customKey: 'hello'
            });
            // Ensure array portion remains unchanged
            expect([...aa]).toEqual([5, 7, 'er']);
        });
    });

    describe('Array Transformations & Method Delegation', () => {
        test('map() returns a new instance of A with cloned object properties', () => {
            const mapped = aa.map(x => (typeof x === 'number' ? x * 2 : x));

            expect(mapped).toBeInstanceOf(A);
            expect([...mapped]).toEqual([10, 14, 'er']);
            expect({ ...mapped }).toEqual({ a: 90, b: { c: false } });
        });

        test('filter() returns a new instance of A with cloned object properties', () => {
            const filtered = aa.filter(x => typeof x === 'number');

            expect(filtered).toBeInstanceOf(A);
            expect([...filtered]).toEqual([5, 7]);
            expect({ ...filtered }).toEqual({ a: 90, b: { c: false } });
        });

        test('slice() produces a new A instance with cloned metadata', () => {
            const sliced = aa.slice(1, 3);

            expect(sliced).toBeInstanceOf(A);
            expect([...sliced]).toEqual([7, 'er']);
            expect({ ...sliced }).toEqual({ a: 90, b: { c: false } });
        });

        test('modifying cloned object part on transformed array does not mutate the original', () => {
            const mapped = aa.map(x => x);
            mapped.a = 1000;

            expect(mapped.a).toBe(1000);
            expect(aa.a).toBe(90);
        });

        test('array non-transformation methods work as expected', () => {
            expect(aa.includes(7)).toBe(true);
            expect(aa.indexOf('er')).toBe(2);
            
            const joined = aa.join('-');
            expect(joined).toBe('5-7-er');
        });
    });

    describe('append() Method', () => {
        test('appends primitives and array elements to array portion', () => {
            aa.append(10, [20, 30]);

            expect([...aa]).toEqual([5, 7, 'er', 10, 20, 30]);
        });

        test('appends object properties to non-numeric object portion', () => {
            aa.append({ x: 1, y: 2 });

            expect({ ...aa }).toEqual({
                a: 90,
                b: { c: false },
                x: 1,
                y: 2
            });
        });

        test('supports chaining on append()', () => {
            aa.append('text').append({ flag: true });

            expect([...aa]).toEqual([5, 7, 'er', 'text']);
            expect(aa.flag).toBe(true);
        });
    });
});

// Import or include your class implementation here
// const O = require('./O');

describe('Class O Unit Tests', () => {
  
  describe('Constructor & Property Access', () => {
    test('initializes from multiple objects and allows dot/bracket access', () => {
      const data = new O({ a: 10 }, { b: 20 });
      expect(data.a).toBe(10);
      expect(data.b).toBe(20);
    });

    test('supports nested key traversal with dot/comma notation', () => {
      const data = new O({ c: { nested: { val: 42 } } });
      expect(data['c.nested.val']).toBe(42);
      expect(data['c,nested,val']).toBe(42);
    });

    test('allows setting values via nested path notation', () => {
      const data = new O({ a: new O({ b: 1 }) });
      data['a.b'] = 99;
      expect(data['a.b']).toBe(99);
    });
  });

  describe('Object Spreading ({...data})', () => {
    test('returns plain object version even for deeply nested O instances', () => {
      const data = new O(
        { a: 10, b: 20 },
        { c: { nested: new O({ f: 3, g: { h: 2 } }) } }
      );

      // Perform shallow spread at top-level
      const spread = { ...data };

      // Verification
      expect(spread.a).toBe(10);
      expect(spread.b).toBe(20);
      expect(spread.c.nested).toBeDefined();

      // Deeply nested O instance should spread into a plain object structure
      const nestedSpread = { ...spread.c.nested };
      expect(nestedSpread).not.toBeInstanceOf(O);
      expect(nestedSpread).toEqual({
        f: 3,
        g: { h: 2 }
      });
    });
  });

  describe('.find() method', () => {
    test('matches using predicate function parameter', () => {
      const data = new O({ x: 5, y: 12, z: 8 });
      const result = data.find(([k, v]) => v > 10);
      expect(result).toEqual(['y', 12]);
    });

    test('matches keys using RegExp, Array inclusion, and Function matchers', () => {
      const data = new O([
        [/^abc/, 1],
        [['z', 'y', 'x'], 2],
        [str => typeof str === 'string' && str.endsWith('rr'), 3]
      ]);

      // Regex Key Matcher
      expect(data.find('abcdef')).toEqual(1);

      // Array Inclusion Key Matcher
      expect(data.find('y')).toEqual(2);

      // Function Key Matcher
      expect(data.find('foobar')).toBeUndefined();
      expect(data.find('foobarr')).toEqual(3);
    });


    test('returns default fallback when key is not found', () => {
      const data = new O({ a: 1 });
      const result = data.find('missingKey', { default: 'fallback' });
      expect(result).toBe('fallback');
    });
  });

  describe('.reshape() method', () => {
    test('transforms nested key paths based on transformation function', () => {
      const data = new O({
        user: {
          profile: {
            name: 'Alice'
          }
        }
      });

      // Transform path [k1, k2, k3] => [k1, k2 + '_' + k3]
      const reshaped = data.reshape(([k1, k2, k3]) => [k1, `${k2}_${k3}`]);

      expect(reshaped.user).toBeDefined();
      expect(reshaped.user.profile_name).toBe('Alice');
    });

    test('reverts to original path if transformed key contains "undefined"', () => {
      const data = new O({ short: 'path' });
      // Path length is 1, so k2 and k3 will be undefined stringified
      const reshaped = data.reshape(([k1, k2, k3]) => [k1, `${k2}_${k3}`]);

      expect(reshaped.short).toBe('path');
    });
  });

  describe('Array Delegation & Chaining (.map, .filter, etc.)', () => {
    test('.map() transforms key-value pairs and returns a new O instance', () => {
      const data = new O({ a: 10, b: 20 });
      
      const mapped = data.map(([k, v]) => [k.toUpperCase(), v * 2]);

      expect(mapped).toBeInstanceOf(O);
      expect(mapped.A).toBe(20);
      expect(mapped.B).toBe(40);
    });

    test('returns standard non-O values when array method output is not key-value pairs', () => {
      const data = new O({ a: 10, b: 20 });
      
      // reduce returns a scalar primitive
      const sum = data.reduce((acc, [, v]) => acc + v, 0);
      expect(sum).toBe(30);

      // map returning single elements rather than [key, value] pairs
      const keysOnly = data.map(([k]) => k);
      expect(Array.isArray(keysOnly)).toBe(true);
      expect(keysOnly).not.toBeInstanceOf(O);
      expect(keysOnly).toEqual(['a', 'b']);
    });
  });

  describe('Vector / Math / String Operations', () => {
    test('.add() performs element-wise addition across objects', () => {
      const stats1 = new O({ hp: 100, mp: 50 });
      const stats2 = { hp: 20, mp: 10 };
      
      const result = stats1.add(stats2);
      expect(result.hp).toBe(120);
      expect(result.mp).toBe(60);
    });

    test('.minus() performs element-wise subtraction', () => {
      const stats1 = new O({ hp: 100, mp: 50 });
      const stats2 = { hp: 30 };

      const result = stats1.minus(stats2);
      expect(result.hp).toBe(70);
      expect(result.mp).toBe(50); // o?.[k] defaults to 0 if missing
    });

    test('.append() and .prepend() concatenate strings element-wise', () => {
      const words = new O({ greeting: 'Hello', target: 'World' });
      
      const appended = words.append({ greeting: '!', target: '!!!' });
      expect(appended.greeting).toBe('Hello!');
      expect(appended.target).toBe('World!!!');

      const prepended = words.prepend({ greeting: 'Say ', target: 'Brave ' });
      expect(prepended.greeting).toBe('Say Hello');
      expect(prepended.target).toBe('Brave World');
    });
  });

});