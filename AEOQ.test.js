import {A} from './AEOQ_.mjs'; 

describe('Class A (Custom Array with Proxy Property Traps)', () => {

    test('initialization with array elements and custom properties', () => {
        let a = new A([1, 2, 3], { foo: 'bar', baz: 42 });

        // Standard array properties
        expect(a.length).toBe(3);
        expect(a[0]).toBe(1);
        expect(a[1]).toBe(2);
        expect(a[2]).toBe(3);

        // Custom properties
        expect(a.foo).toBe('bar');
        expect(a.baz).toBe(42);

        // Spreading assertions
        expect([...a]).toEqual([1, 2, 3]);
        expect({ ...a }).toEqual({ foo: 'bar', baz: 42 });
    });

    test('append() extends array items and merges non-numeric properties', () => {
        let a = new A([1, 2, 3], { foo: 'bar', baz: 42 });

        a.append([-2, 4], { c: 5 });

        expect([...a]).toEqual([1, 2, 3, -2, 4]);
        expect({ ...a }).toEqual({ foo: 'bar', baz: 42, c: 5 });
    });

    test('sorting array elements retains properties and creates upgraded instance of A', () => {
        let a = new A([1, 2, 3], { foo: 'bar', baz: 42 });
        a.append([-2, 4], { c: 5 });

        let b = a.sort((x, y) => y - x);

        expect(b).toBeInstanceOf(A);
        expect([...b]).toEqual([4, 3, 2, 1, -2]);
        expect(b.at(-1)).toBe(-2);
        expect({ ...b }).toEqual({ foo: 'bar', baz: 42, c: 5 });
    });

    describe('various array transformation methods', () => {
        let a;

        beforeEach(() => {
            a = new A([10, 20, 30], { meta: 'info', count: 3 });
        });

        test('map()', () => {
            let mapped = a.map(x => x * 2);

            expect(mapped).toBeInstanceOf(A);
            expect([...mapped]).toEqual([20, 40, 60]);
            expect({ ...mapped }).toEqual({ meta: 'info', count: 3 });
        });

        test('filter()', () => {
            let filtered = a.filter(x => x > 15);

            expect(filtered).toBeInstanceOf(A);
            expect([...filtered]).toEqual([20, 30]);
            expect({ ...filtered }).toEqual({ meta: 'info', count: 3 });
        });

        test('slice()', () => {
            let sliced = a.slice(1);

            expect(sliced).toBeInstanceOf(A);
            expect([...sliced]).toEqual([20, 30]);
            expect({ ...sliced }).toEqual({ meta: 'info', count: 3 });
        });

        test('concat()', () => {
            let concatenated = a.concat([40, 50]);

            expect(concatenated).toBeInstanceOf(A);
            expect([...concatenated]).toEqual([10, 20, 30, 40, 50]);
            expect({ ...concatenated }).toEqual({ meta: 'info', count: 3 });
        });

        test('flat() and flatMap()', () => {
            let nested = new A([[1, 2], [3]], { tag: 'nested' });
            let flattened = nested.flat();

            expect(flattened).toBeInstanceOf(A);
            expect([...flattened]).toEqual([1, 2, 3]);
            expect({ ...flattened }).toEqual({ tag: 'nested' });

            let flatMapped = a.flatMap(x => [x, x + 1]);
            expect(flatMapped).toBeInstanceOf(A);
            expect([...flatMapped]).toEqual([10, 11, 20, 21, 30, 31]);
            expect({ ...flatMapped }).toEqual({ meta: 'info', count: 3 });
        });

        test('ES2023 methods: toReversed(), toSpliced(), with(), toSorted()', () => {
            // toReversed
            let reversed = a.toReversed();
            expect(reversed).toBeInstanceOf(A);
            expect([...reversed]).toEqual([30, 20, 10]);
            expect({ ...reversed }).toEqual({ meta: 'info', count: 3 });

            // toSpliced
            let spliced = a.toSpliced(1, 1, 99);
            expect(spliced).toBeInstanceOf(A);
            expect([...spliced]).toEqual([10, 99, 30]);
            expect({ ...spliced }).toEqual({ meta: 'info', count: 3 });

            // with
            let updated = a.with(0, 5);
            expect(updated).toBeInstanceOf(A);
            expect([...updated]).toEqual([5, 20, 30]);
            expect({ ...updated }).toEqual({ meta: 'info', count: 3 });

            // toSorted
            let sorted = a.toSorted((x, y) => y - x);
            expect(sorted).toBeInstanceOf(A);
            expect([...sorted]).toEqual([30, 20, 10]);
            expect({ ...sorted }).toEqual({ meta: 'info', count: 3 });
        });

        test('scalar return methods pass through standard primitives', () => {
            expect(a.find(x => x > 15)).toBe(20);
            expect(a.findIndex(x => x === 20)).toBe(1);
            expect(a.includes(30)).toBe(true);
            expect(a.reduce((acc, curr) => acc + curr, 0)).toBe(60);
        });
    });
});