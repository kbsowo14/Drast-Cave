import { useLayoutEffect } from 'react'

import StartGame from './game/main'

function App() {
	/**
	 * @description
	 * 게임 시작 및 생성
	 */
	useLayoutEffect(() => {
		StartGame('game-container')
	}, [])

	return (
		<div id="app">
			<div id="game-container" className="rounded-lg overflow-hidden"></div>
		</div>
	)
}

export default App
