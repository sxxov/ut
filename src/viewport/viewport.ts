import { Store } from '../store/Store.js';
import type { Size } from './Size.js';

const hasWindow = typeof window !== String(undefined);
const initialSize: Size = hasWindow
	? { height: window.innerHeight, width: window.innerWidth }
	: { height: 0, width: 0 };

export const viewport = new Store({
	inner: initialSize,
	outer: initialSize,
	client: initialSize,
	hasTouch: false,
});
export const inner = new Store<Size>(initialSize);
export const outer = new Store<Size>(initialSize);
export const client = new Store<Size>(initialSize);
export const hasTouch = new Store<boolean>(false);

const onResize = () => {
	inner.set({
		height: window.innerHeight,
		width: window.innerWidth,
	});
	outer.set({
		height: window.outerHeight,
		width: window.outerWidth,
	});
	client.set({
		height: document.documentElement.clientHeight,
		width: document.documentElement.clientWidth,
	});
	hasTouch.set('ontouchstart' in document.documentElement);

	viewport.set({
		inner: inner.get(),
		outer: outer.get(),
		client: client.get(),
		hasTouch: hasTouch.get(),
	});
};

if (hasWindow) {
	onResize();
	window.addEventListener('resize', onResize);
}
