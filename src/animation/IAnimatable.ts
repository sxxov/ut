export interface IAnimatable {
	readonly isPlaying: boolean;
	readonly duration: number;
	readonly length: number;
	play(direction: number): void;
	pause(): void;
	stop(): void;
	seekToProgress(progress: number): void;
	seekToTime(time: number): void;
	seekToValue(value: number): void;
	destroy(): void;
}