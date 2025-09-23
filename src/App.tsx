import { useEffect, useLayoutEffect } from 'react'

import StartGame from './game/main'
import { EventBus } from './game/EventBus'

function App() {
	/**
	 * @description
	 * 게임 시작 및 생성
	 */
	useLayoutEffect(() => {
		StartGame('game-container')
	}, [])

	useEffect(() => {
		EventBus.on('current-scene-ready', (scene_instance: Phaser.Scene) => {
			console.log('씬 준비 완료 : ', scene_instance)
		})
		return () => {
			EventBus.removeListener('current-scene-ready')
		}
	}, [])

	return (
		<div id="app">
			<div id="game-container" className="rounded-lg overflow-hidden"></div>
		</div>
	)
}

export default App
