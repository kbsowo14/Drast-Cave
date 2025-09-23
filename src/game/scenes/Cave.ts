import { Scene } from 'phaser'
import { EventBus } from '../EventBus'

interface RegionInfo {
	id: number
	startX: number
	startY: number
	endX: number
	endY: number
	pixelX: number
	pixelY: number
}

export class Cave extends Scene {
	private readonly SCREEN_WIDTH = 1024
	private readonly SCREEN_HEIGHT = 768
	private readonly BLOCK_SIZE = 32

	// 구역 설정
	private readonly REGION_WIDTH = 16 // 블럭 개수
	private readonly REGION_HEIGHT = 12 // 블럭 개수
	private readonly REGIONS_X = 2 // 가로 구역 수
	private readonly REGIONS_Y = 2 // 세로 구역 수

	private gameMap: number[][]
	private playerRegionId: number

	/**
	 * @description
	 * 맵 초기화
	 */
	private initializeMap(): void {
		const totalWidth = this.SCREEN_WIDTH / this.BLOCK_SIZE // 32
		const totalHeight = this.SCREEN_HEIGHT / this.BLOCK_SIZE // 24

		// 2차원 배열 초기화
		this.gameMap = Array(totalHeight)
			.fill(null)
			.map(() => Array(totalWidth).fill(0))
	}

	/**
	 * @description
	 * 플레이어 구역 선택
	 */
	private selectPlayerRegion(): void {
		// 0~3 중 랜덤 선택 (구역 ID)
		this.playerRegionId = Math.floor(Math.random() * 4)
		console.log(`오늘의 플레이어 구역: ${this.playerRegionId}`)
	}

	// private stringToSeed(str: string): number {
	// 	let hash = 0
	// 	for (let i = 0; i < str.length; i++) {
	// 		const char = str.charCodeAt(i)
	// 		hash = (hash << 5) - hash + char
	// 		hash = hash & hash
	// 	}
	// 	return Math.abs(hash)
	// }

	private getRegionCoordinates(regionId: number): RegionInfo {
		const regionX = regionId % this.REGIONS_X // 0 or 1
		const regionY = Math.floor(regionId / this.REGIONS_X) // 0 or 1

		return {
			id: regionId,
			startX: regionX * this.REGION_WIDTH, // 0 or 16
			startY: regionY * this.REGION_HEIGHT, // 0 or 12
			endX: (regionX + 1) * this.REGION_WIDTH, // 16 or 32
			endY: (regionY + 1) * this.REGION_HEIGHT, // 12 or 24
			pixelX: regionX * this.REGION_WIDTH * this.BLOCK_SIZE, // 0 or 512
			pixelY: regionY * this.REGION_HEIGHT * this.BLOCK_SIZE, // 0 or 384
		}
	}

	/**
	 * @description
	 * 랜덤으로 칸의 형태 넘버 생성
	 */
	private generateRandomRegion(region: RegionInfo): void {
		console.log('🚀 generateRandomRegion', region)
		for (let y = region.startY; y < region.endY; y++) {
			for (let x = region.startX; x < region.endX; x++) {
				// 4가지 블럭 타입 중 랜덤 선택 (0~3)
				const blockType = Math.floor(Math.random() * 4)
				this.gameMap[y][x] = blockType
			}
		}
	}

	/**
	 * @description
	 * 플레이어 구역 로드
	 */
	private loadPlayerRegion(region: RegionInfo): void {
		try {
			const saved = localStorage.getItem(`player-region`)
			if (saved) {
				const savedRegionData = JSON.parse(saved)
				// savedRegionData는 12행 16열(16x12)의 2차원 배열
				for (let y = 0; y < region.endY - region.startY; y++) {
					for (let x = 0; x < region.endX - region.startX; x++) {
						this.gameMap[region.startY + y][region.startX + x] = savedRegionData[y][x]
					}
				}
			} else {
				// 첫 방문 시 기본 방 생성
				this.generateRandomRegion(region)
			}
		} catch (error) {
			console.error('플레이어 구역 로드 실패:', error)
		}
	}

	/**
	 * @description
	 * 구역 생성
	 */
	private generateRegions(): void {
		for (let regionId = 0; regionId < 4; regionId++) {
			const region = this.getRegionCoordinates(regionId)

			if (regionId === this.playerRegionId) {
				// 플레이어 구역일 경우 저장되어 있던 구역 형태 불러오기
				this.loadPlayerRegion(region)
			} else {
				// 탐험 구역일 경우 랜덤으로 구역 형태 생성하기
				this.generateRandomRegion(region)
			}
		}
	}

	/**
	 * @description
	 * 블럭 타입에 따라 블럭 텍스처 반환
	 */
	private getBlockTexture(blockType: number): string {
		switch (blockType) {
			case 0:
				return 'soil-01' // 흙 블럭
			case 1:
				return 'rock-01' // 돌 블럭
			case 2:
				return 'rock-02' // 바위 블럭
			case 3:
				return 'rock-03' // 광물 블럭
			case 4:
				return 'rock-04' // 광물 블럭
			default:
				return 'soil-01'
		}
	}

	// private savePlayerRegion(): void {
	// 	const region = this.getRegionCoordinates(this.playerRegionId)
	// 	const regionData = this.extractRegionData(region)

	// 	localStorage.setItem(`player-region-${this.playerRegionId}`, JSON.stringify(regionData))
	// }

	private isInPlayerRegion(x: number, y: number): boolean {
		const region = this.getRegionCoordinates(this.playerRegionId)
		return x >= region.startX && x < region.endX && y >= region.startY && y < region.endY
	}

	/**
	 * @description
	 * 맵 렌더링
	 */
	private renderMap(): void {
		for (let y = 0; y < 24; y++) {
			for (let x = 0; x < 32; x++) {
				const blockType = this.gameMap[y][x]
				const texture = this.getBlockTexture(blockType)

				if (texture) {
					const pixelX = x * this.BLOCK_SIZE
					const pixelY = y * this.BLOCK_SIZE

					const block = this.add.image(pixelX, pixelY, texture)
					block.setOrigin(0, 0)
					block.setDisplaySize(this.BLOCK_SIZE, this.BLOCK_SIZE)

					// 플레이어 구역 표시
					if (this.isInPlayerRegion(x, y)) {
						block.setTint(0xffff99) // 노란색 틴트
					}
				}
			}
		}
	}

	constructor() {
		super('Cave')
	}

	create() {
		this.cameras.main.setBackgroundColor('#636363')

		this.initializeMap() // 1) 맵 초기화
		this.selectPlayerRegion() // 2) 플레이어 구역 선택
		this.generateRegions() // 3) 구역 생성
		this.renderMap() // 4) 맵 렌더링

		console.log('🚀 gameMap', this.gameMap)
		EventBus.emit('current-scene-ready', this)

		// 씬 시작 시 페이드인
		this.cameras.main.fadeIn(500, 0, 0, 0) // 500ms 동안 페이드인
	}
}
