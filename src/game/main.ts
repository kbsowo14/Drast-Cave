import { Boot } from './scenes/Boot'
import { MainMenu } from './scenes/MainMenu'
import { AUTO, Game } from 'phaser'
import { Preloader } from './scenes/Preloader'
import { Cave } from './scenes/Cave'

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Phaser.Types.Core.GameConfig = {
	type: AUTO,
	width: 1024,
	height: 768,
	parent: 'game-container',
	scene: [Boot, Preloader, MainMenu, Cave],
}

const StartGame = (parent: string) => {
	return new Game({ ...config, parent })
}

export default StartGame
