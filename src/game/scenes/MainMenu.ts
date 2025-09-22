import { GameObjects, Scene } from 'phaser'
import { EventBus } from '../EventBus'

export class MainMenu extends Scene {
	background: GameObjects.Image
	title: GameObjects.Text
	creatureButton: GameObjects.Container

	constructor() {
		super('MainMenu')
	}

	create() {
		this.background = this.add.image(512, 384, 'cave_bg')

		this.title = this.add
			.text(512, 460, 'Drast Cave', {
				fontFamily: 'Arial Black',
				fontSize: 38,
				color: '#ffffff',
				stroke: '#000000',
				strokeThickness: 8,
				align: 'center',
			})
			.setOrigin(0.5)
			.setDepth(100)

		EventBus.emit('current-scene-ready', this)
	}
}
