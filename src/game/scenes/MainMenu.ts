import { GameObjects, Scene } from 'phaser'
import { EventBus } from '../EventBus'

export class MainMenu extends Scene {
	background: GameObjects.Image
	title: GameObjects.Text
	creatureButton: GameObjects.Container

	constructor() {
		super('MainMenu')
	}

	createStartButton() {
		const buttonWidth = 200
		const buttonHeight = 60

		// 버튼 배경
		const buttonBg = this.add
			.rectangle(0, 0, buttonWidth, buttonHeight, 0x222222, 0.5)
			.setStrokeStyle(3, 0xffffff)

		// 버튼 텍스트
		const buttonText = this.add
			.text(0, 0, '시작하기', {
				fontFamily: 'Arial Black',
				fontSize: 24,
				color: '#ffffff',
				align: 'center',
			})
			.setOrigin(0.5)

		// 컨테이너로 묶기
		const startButton = this.add.container(0, 0, [buttonBg, buttonText])

		// 버튼 크기 설정
		startButton.setSize(buttonWidth, buttonHeight)

		// 버튼 위치 설정
		startButton.setPosition(512, 540)

		// 버튼 클릭 가능하도록 설정
		startButton.setInteractive(
			new Phaser.Geom.Rectangle(0, 0, buttonWidth, buttonHeight),
			Phaser.Geom.Rectangle.Contains
		)

		startButton.setDepth(101)

		startButton.on('pointerover', () => {
			buttonBg.setFillStyle(0x444444, 1)
		})
		startButton.on('pointerout', () => {
			buttonBg.setFillStyle(0x222222, 0.8)
		})
		startButton.on('pointerdown', () => {
			// 페이드아웃 시작
			this.cameras.main.fadeOut(500, 0, 0, 0) // 500ms 동안 검은색으로 페이드아웃

			// 페이드아웃 완료 후 씬 전환
			this.cameras.main.once('camerafadeoutcomplete', () => {
				this.scene.start('Cave')
			})
		})
	}

	create() {
		this.background = this.add.image(512, 384, 'drast-cave_intro')

		this.title = this.add
			.text(512, 320, 'Drast Cave', {
				fontFamily: 'Arial Black',
				fontSize: 38,
				color: '#ffffff',
				stroke: '#000000',
				strokeThickness: 8,
				align: 'center',
			})
			.setOrigin(0.5)
			.setDepth(100)

		this.createStartButton()

		EventBus.emit('current-scene-ready', this)
	}
}
