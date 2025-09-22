import { Scene } from 'phaser'

export class Boot extends Scene {
	constructor() {
		super('Boot')
	}

	preload() {
		/**
		 * Boot 씬은 주로 프리로더(Preloader)에서 사용할 로고나 배경 이미지 등
		 * 필요한 에셋을 미리 로드하는 데 사용됩니다.
		 * Boot 씬 자체에는 별도의 로딩 화면이 없으므로,
		 * 이곳에서 불러오는 에셋은 파일 크기가 작을수록 좋습니다.
		 */

		this.load.image('cave_bg', 'assets/cave_bg.png')
	}

	create() {
		this.scene.start('Preloader')
	}
}
