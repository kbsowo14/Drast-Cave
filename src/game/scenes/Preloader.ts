import { Scene } from 'phaser'

export class Preloader extends Scene {
	constructor() {
		super('Preloader')
	}

	init() {
		// Boot Scene에서 로드한 이미지를 여기서 표시할 수 있습니다
		this.add.image(512, 384, 'drast-cave_intro')

		// 간단한 진행률 바입니다. 이것은 바의 외곽선입니다.
		this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff)

		// 이것은 진행률 바 자체입니다. 진행률 %에 따라 왼쪽부터 크기가 증가합니다.
		const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff)

		// LoaderPlugin에서 방출하는 'progress' 이벤트를 사용하여 로딩 바를 업데이트합니다
		this.load.on('progress', (progress: number) => {
			// 진행률 바를 업데이트합니다 (우리 바는 464px 너비이므로, 100% = 464px)
			bar.width = 4 + 460 * progress
		})
	}

	preload() {
		// 게임용 에셋을 로드합니다 - 여러분의 에셋으로 교체하세요
		this.load.setPath('assets')

		this.load.image('soil-01', 'soil-01.png')
		this.load.image('rock-01', 'rock-01.png')
		this.load.image('rock-02', 'rock-02.png')
		this.load.image('rock-03', 'rock-03.png')
		this.load.image('rock-04', 'rock-04.png')
		this.load.image('dark', 'dark.png') // 횃불 모서리 어둠 에셋

		// 플레이어 캐릭터 에셋 로드 (현재는 stop 이미지만 사용)
		this.load.spritesheet('player-stop', 'player-stop.png', {
			frameWidth: 32,
			frameHeight: 32,
		}) // 4방향 정지 상태 스프라이트시트

		// running 에셋은 나중에 필요할 때 추가
		// this.load.spritesheet('player-running', 'player-running.gif', {
		// 	frameWidth: 32,
		// 	frameHeight: 32,
		// })
	}

	create() {
		// 모든 에셋이 로드되었을 때, 게임의 나머지 부분에서 사용할 수 있는 전역 객체들을 여기서 생성하는 것이 좋습니다.
		// 예를 들어, 다른 씬에서 사용할 수 있도록 전역 애니메이션을 여기서 정의할 수 있습니다.

		// MainMenu로 이동합니다. 카메라 페이드와 같은 씬 전환 효과로 바꿀 수도 있습니다.
		this.scene.start('MainMenu')
	}
}
