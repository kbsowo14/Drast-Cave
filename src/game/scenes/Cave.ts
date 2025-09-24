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

	// 플레이어 관련 속성
	private player: Phaser.GameObjects.Sprite
	private playerGridX: number = 1 // 그리드 좌표
	private playerGridY: number = 1

	// 연속 이동을 위한 속성
	private moveTimer: Phaser.Time.TimerEvent | null = null
	private currentDirection: string | null = null
	private readonly MOVE_DELAY = 150 // 150ms마다 이동
	private readonly ANIMATION_DURATION = 150 // 150ms 애니메이션

	// 플레이어 애니메이션 관련
	private playerDirection: 'down' | 'left' | 'up' | 'right' = 'down' // 현재 바라보는 방향
	private isPlayerMoving: boolean = false // 현재 이동 중인지 여부
	private readonly DIRECTION_FRAMES = {
		down: 0, // 하 (첫번째 프레임)
		left: 1, // 좌 (두번째 프레임)
		up: 2, // 상 (세번째 프레임)
		right: 3, // 우 (네번째 프레임)
	}

	// 횃불 시스템 속성 (사각형 방식)
	private darknessTop: Phaser.GameObjects.Graphics
	private darknessBottom: Phaser.GameObjects.Graphics
	private darknessLeft: Phaser.GameObjects.Graphics
	private darknessRight: Phaser.GameObjects.Graphics
	private readonly LIGHT_SIZE = 400 // 횃불 빛의 사각형 크기 (200x200)

	// 모서리 둥글게 만들기 위한 이미지들
	private cornerTopLeft: Phaser.GameObjects.Image
	private cornerTopRight: Phaser.GameObjects.Image
	private cornerBottomLeft: Phaser.GameObjects.Image
	private cornerBottomRight: Phaser.GameObjects.Image

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
	 * 랜덤으로 칸의 형태 넘버 생성 (화면 끝은 벽으로 처리)
	 */
	private generateRandomRegion(region: RegionInfo): void {
		console.log('🚀 generateRandomRegion', region)
		for (let y = region.startY; y < region.endY; y++) {
			for (let x = region.startX; x < region.endX; x++) {
				// 전체 맵의 경계와 닿아있는지 체크
				const isMapBoundary = x === 0 || x === 31 || y === 0 || y === 23

				if (isMapBoundary) {
					// 화면 끝쪽은 무조건 rock-01로 벽 처리
					this.gameMap[y][x] = 1 // rock-01
				} else {
					// 내부는 4가지 블럭 타입 중 랜덤 선택 (0~3)
					const blockType = Math.floor(Math.random() * 4)
					this.gameMap[y][x] = blockType
				}
			}
		}
	}

	/**
	 * @description
	 * 특정 방향에 입구 생성
	 */
	private createEntrance(
		region: RegionInfo,
		direction: 'top' | 'bottom' | 'left' | 'right'
	): void {
		switch (direction) {
			case 'top':
				// 상단 중앙에 입구 (1칸)
				const topCenterX = region.startX + Math.floor(this.REGION_WIDTH / 2)
				this.gameMap[region.startY][topCenterX] = 0 // soil-01
				console.log(`🚪 상단 입구 생성: (${topCenterX}, ${region.startY})`)
				break

			case 'bottom':
				// 하단 중앙에 입구 (1칸)
				const bottomCenterX = region.startX + Math.floor(this.REGION_WIDTH / 2)
				this.gameMap[region.endY - 1][bottomCenterX] = 0 // soil-01
				console.log(`🚪 하단 입구 생성: (${bottomCenterX}, ${region.endY - 1})`)
				break

			case 'left':
				// 좌측 중앙에 입구 (1칸)
				const leftCenterY = region.startY + Math.floor(this.REGION_HEIGHT / 2)
				this.gameMap[leftCenterY][region.startX] = 0 // soil-01
				console.log(`🚪 좌측 입구 생성: (${region.startX}, ${leftCenterY})`)
				break

			case 'right':
				// 우측 중앙에 입구 (1칸)
				const rightCenterY = region.startY + Math.floor(this.REGION_HEIGHT / 2)
				this.gameMap[rightCenterY][region.endX - 1] = 0 // soil-01
				console.log(`🚪 우측 입구 생성: (${region.endX - 1}, ${rightCenterY})`)
				break
		}
	}

	/**
	 * @description
	 * 구역 위치에 따라 적절한 입구들 생성
	 */
	private createRoomEntrances(region: RegionInfo): void {
		// 현재 구역이 화면의 어느 위치에 있는지 파악
		const isAtTop = region.startY === 0 // 화면 상단
		const isAtBottom = region.endY === 24 // 화면 하단
		const isAtLeft = region.startX === 0 // 화면 좌측
		const isAtRight = region.endX === 32 // 화면 우측

		console.log(
			`🚪 구역 ${region.id} 위치: 상단=${isAtTop}, 하단=${isAtBottom}, 좌측=${isAtLeft}, 우측=${isAtRight}`
		)

		// 각 면이 다른 구역과 연결되는지 확인하고 입구 생성

		// 상단 입구 (화면 상단이 아닐 때만)
		if (!isAtTop) {
			this.createEntrance(region, 'top')
		}

		// 하단 입구 (화면 하단이 아닐 때만)
		if (!isAtBottom) {
			this.createEntrance(region, 'bottom')
		}

		// 좌측 입구 (화면 좌측이 아닐 때만)
		if (!isAtLeft) {
			this.createEntrance(region, 'left')
		}

		// 우측 입구 (화면 우측이 아닐 때만)
		if (!isAtRight) {
			this.createEntrance(region, 'right')
		}
	}

	/**
	 * @description
	 * 플레이어 전용 방 생성 (벽으로 둘러싸인 안전한 공간)
	 */
	private createPlayerRoom(region: RegionInfo): void {
		console.log('🏠 플레이어 방 생성 중...', region)

		for (let y = region.startY; y < region.endY; y++) {
			for (let x = region.startX; x < region.endX; x++) {
				const relativeX = x - region.startX // 0~15
				const relativeY = y - region.startY // 0~11

				// 벽 조건: 구역의 경계면
				const isTopWall = relativeY === 0
				const isBottomWall = relativeY === this.REGION_HEIGHT - 1 // 11
				const isLeftWall = relativeX === 0
				const isRightWall = relativeX === this.REGION_WIDTH - 1 // 15

				if (isTopWall || isBottomWall || isLeftWall || isRightWall) {
					// 일단 모든 경계를 벽으로 설정
					this.gameMap[y][x] = 1 // rock-01
				} else {
					// 내부는 모두 soil-01 (이동 가능한 바닥)
					this.gameMap[y][x] = 0 // soil-01
				}
			}
		}

		// 입구 생성 (화면 끝이 아닌 면에만)
		this.createRoomEntrances(region)

		// 플레이어 방 데이터를 localStorage에 저장
		// this.savePlayerRoom(region)
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
				this.createPlayerRoom(region)
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

	/**
	 * @description
	 * 플레이어 생성 및 초기화
	 */
	private createPlayer(): void {
		// 플레이어 구역의 중앙에 플레이어 배치
		const playerRegion = this.getRegionCoordinates(this.playerRegionId)

		// 플레이어 구역 중앙 좌표 계산
		this.playerGridX = playerRegion.startX + Math.floor(this.REGION_WIDTH / 2)
		this.playerGridY = playerRegion.startY + Math.floor(this.REGION_HEIGHT / 2)

		// 픽셀 좌표로 변환
		const pixelX = this.playerGridX * this.BLOCK_SIZE + this.BLOCK_SIZE / 2
		const pixelY = this.playerGridY * this.BLOCK_SIZE + this.BLOCK_SIZE / 2

		// 플레이어 스프라이트 생성 (정지 상태로 시작)
		this.player = this.add.sprite(pixelX, pixelY, 'player-stop')
		this.player.setDisplaySize(28, 28) // 블럭보다 약간 작게
		this.player.setDepth(100) // 블럭들 위에 표시

		// 초기 방향 설정 (아래쪽을 바라봄)
		this.updatePlayerSprite()
	}

	/**
	 * @description
	 * Atlas 방식 애니메이션 생성 (Phaser 공식 권장)
	 */
	private createGifAnimations(): void {
		console.log('🎬 Creating Atlas-based animations...')

		// 각 방향별로 애니메이션 생성
		const directions = ['down', 'left', 'up', 'right']

		directions.forEach((direction, dirIndex) => {
			// Atlas에서 사용 가능한 프레임들 확인
			const runningTexture = this.textures.get('player-running')
			const stopTexture = this.textures.get('player-stop')

			console.log(`📊 Running atlas frames:`, runningTexture.getFrameNames())
			console.log(`📊 Stop atlas frames:`, stopTexture.getFrameNames())

			// 달리기 애니메이션 프레임 수집
			const runningFrames = []
			const frameNames = runningTexture.getFrameNames()

			// 해당 방향의 프레임들 찾기 (예: "down_1", "down_2", "left_1", "left_2" 등)
			const directionFrames = frameNames.filter(
				name => name.toLowerCase().includes(direction) || name.includes(dirIndex.toString())
			)

			// 방향별 프레임이 있으면 사용, 없으면 기본 프레임 사용
			if (directionFrames.length > 0) {
				directionFrames.forEach(frameName => {
					runningFrames.push({ key: 'player-running', frame: frameName })
				})
			} else {
				// 기본: 숫자 인덱스 사용 (0, 1, 2, 3)
				runningFrames.push({ key: 'player-running', frame: dirIndex.toString() })
			}

			// 달리기 애니메이션 생성
			this.anims.create({
				key: `player-run-${direction}`,
				frames: runningFrames,
				frameRate: 8, // 초당 8프레임
				repeat: -1, // 무한 반복
			})

			// 정지 애니메이션 (단일 프레임)
			const stopFrameName =
				stopTexture
					.getFrameNames()
					.find(
						name => name.toLowerCase().includes(direction) || name.includes(dirIndex.toString())
					) || dirIndex.toString()

			this.anims.create({
				key: `player-stop-${direction}`,
				frames: [{ key: 'player-stop', frame: stopFrameName }],
				frameRate: 1,
			})

			console.log(
				`✅ Created animations for ${direction}: ${runningFrames.length} running frames`
			)
		})
	}

	/**
	 * @description
	 * 플레이어 스프라이트 업데이트 (단순한 프레임 교체 방식)
	 */
	private updatePlayerSprite(): void {
		// stop 이미지의 해당 방향 프레임만 사용
		const frameIndex = this.DIRECTION_FRAMES[this.playerDirection]

		console.log(`🎮 Player frame: ${frameIndex}, direction: ${this.playerDirection}`)

		// 텍스처 존재 여부 확인
		if (!this.textures.exists('player-stop')) {
			console.error(`❌ Texture 'player-stop' not found!`)
			return
		}

		// stop 이미지의 해당 방향 프레임으로 설정
		this.player.setTexture('player-stop', frameIndex)
		console.log(`✅ Frame applied: player-stop frame ${frameIndex}`)
	}

	/**
	 * @description
	 * 어둠과 횃불 시스템 생성 (4개 사각형 + 둥근 모서리)
	 */
	private createDarknessSystem(): void {
		// 4개의 검은색 사각형 생성
		this.darknessTop = this.add.graphics()
		this.darknessBottom = this.add.graphics()
		this.darknessLeft = this.add.graphics()
		this.darknessRight = this.add.graphics()

		// 모든 어둠 면을 최상위에 표시
		this.darknessTop.setDepth(200)
		this.darknessBottom.setDepth(200)
		this.darknessLeft.setDepth(200)
		this.darknessRight.setDepth(200)

		// 검은색으로 채우기
		this.darknessTop.fillStyle(0x000000, 1)
		this.darknessBottom.fillStyle(0x000000, 1)
		this.darknessLeft.fillStyle(0x000000, 1)
		this.darknessRight.fillStyle(0x000000, 1)

		// 둥근 모서리 이미지 생성
		this.createCornerImages()

		// 초기 어둠 위치 설정
		this.updateDarkness()

		// 횃불 깜빡임 효과
		this.createTorchFlicker()
	}

	/**
	 * @description
	 * 4개 모서리에 둥근 어둠 이미지 생성
	 */
	private createCornerImages(): void {
		// 좌상단 모서리 (원본) - 사각형 밖쪽 모서리에 위치
		this.cornerTopLeft = this.add.image(0, 0, 'dark')
		this.cornerTopLeft.setDepth(201)
		this.cornerTopLeft.setOrigin(0, 0)

		// 우상단 모서리 (90도 시계방향 회전)
		this.cornerTopRight = this.add.image(0, 0, 'dark')
		this.cornerTopRight.setDepth(201)
		this.cornerTopRight.setOrigin(0, 0)
		this.cornerTopRight.setRotation(Phaser.Math.DegToRad(90))

		// 우하단 모서리 (180도 회전)
		this.cornerBottomRight = this.add.image(0, 0, 'dark')
		this.cornerBottomRight.setDepth(201)
		this.cornerBottomRight.setOrigin(0, 0)
		this.cornerBottomRight.setRotation(Phaser.Math.DegToRad(180))

		// 좌하단 모서리 (270도 회전)
		this.cornerBottomLeft = this.add.image(0, 0, 'dark')
		this.cornerBottomLeft.setDepth(201)
		this.cornerBottomLeft.setOrigin(0, 0)
		this.cornerBottomLeft.setRotation(Phaser.Math.DegToRad(270))
	}

	/**
	 * @description
	 * 횃불 깜빡임 효과 생성
	 */
	private createTorchFlicker(): void {
		// 0.5초마다 빛의 크기를 약간 변화시켜 깜빡임 효과 연출
		this.time.addEvent({
			delay: 100,
			callback: () => {
				// 랜덤하게 빛의 반지름을 조금씩 변화
				const flickerAmount = Phaser.Math.Between(-5, 5)

				// 임시로 빛 크기 변경하고 위치 업데이트
				const originalSize = this.LIGHT_SIZE
				;(this as any).LIGHT_SIZE = Math.max(
					350,
					Math.min(400, this.LIGHT_SIZE + flickerAmount * 2)
				)
				this.updateDarkness()
				;(this as any).LIGHT_SIZE = originalSize
			},
			loop: true,
		})
	}

	/**
	 * @description
	 * 4개 어둠 사각형 + 모서리 이미지 위치 업데이트 (원형 횃불 효과)
	 */
	private updateDarkness(): void {
		// 플레이어의 실제 픽셀 위치
		const playerX = this.player.x
		const playerY = this.player.y

		// 플레이어 주변 밝은 영역의 경계 계산
		const lightHalfSize = this.LIGHT_SIZE / 2
		const leftBound = playerX - lightHalfSize
		const rightBound = playerX + lightHalfSize
		const topBound = playerY - lightHalfSize
		const bottomBound = playerY + lightHalfSize

		// 화면 크기의 2배로 설정 (여유분 확보)
		const extraSize = Math.max(this.SCREEN_WIDTH, this.SCREEN_HEIGHT)

		// 기존 그래픽 지우기
		this.darknessTop.clear()
		this.darknessBottom.clear()
		this.darknessLeft.clear()
		this.darknessRight.clear()

		// 다시 검은색으로 설정
		this.darknessTop.fillStyle(0x000000, 1)
		this.darknessBottom.fillStyle(0x000000, 1)
		this.darknessLeft.fillStyle(0x000000, 1)
		this.darknessRight.fillStyle(0x000000, 1)

		// 상단 어둠 (플레이어 위쪽 전체를 가림)
		this.darknessTop.fillRect(-extraSize, -extraSize, extraSize * 2, topBound + extraSize)

		// 하단 어둠 (플레이어 아래쪽 전체를 가림)
		this.darknessBottom.fillRect(-extraSize, bottomBound, extraSize * 2, extraSize * 2)

		// 좌측 어둠 (플레이어 왼쪽을 가림)
		this.darknessLeft.fillRect(-extraSize, topBound, leftBound + extraSize, this.LIGHT_SIZE)

		// 우측 어둠 (플레이어 오른쪽을 가림)
		this.darknessRight.fillRect(rightBound, topBound, extraSize * 2, this.LIGHT_SIZE)

		// 둥근 모서리 이미지 위치 업데이트
		this.updateCornerPositions(leftBound, rightBound, topBound, bottomBound)
	}

	/**
	 * @description
	 * 4개 모서리 이미지 위치 업데이트 - 사각형 밖쪽 모서리에 정확히 배치
	 */
	private updateCornerPositions(
		leftBound: number,
		rightBound: number,
		topBound: number,
		bottomBound: number
	): void {
		// 좌상단 모서리 - 밝은 영역의 좌상단 모서리에 배치
		this.cornerTopLeft.setPosition(leftBound, topBound)

		// 우상단 모서리 - 밝은 영역의 우상단 모서리에 배치
		this.cornerTopRight.setPosition(rightBound, topBound)

		// 우하단 모서리 - 밝은 영역의 우하단 모서리에 배치
		this.cornerBottomRight.setPosition(rightBound, bottomBound)

		// 좌하단 모서리 - 밝은 영역의 좌하단 모서리에 배치
		this.cornerBottomLeft.setPosition(leftBound, bottomBound)
	}

	/**
	 * @description
	 * 해당 위치로 이동 가능한지 체크
	 */
	private canMoveTo(gridX: number, gridY: number): boolean {
		// 맵 경계 체크
		if (gridX < 0 || gridX >= 32 || gridY < 0 || gridY >= 24) {
			return false
		}

		// 블럭 타입에 따른 이동 가능 여부
		const blockType = this.gameMap[gridY][gridX]

		// 예: 0(흙)과 1(돌)만 이동 가능, 2,3(바위/광물)은 이동 불가
		return blockType === 0
	}

	/**
	 * @description
	 * 플레이어 이동
	 */
	private movePlayer(newGridX: number, newGridY: number): void {
		// 기존 애니메이션 중단 (부드러운 전환을 위해)
		this.tweens.killTweensOf(this.player)

		this.playerGridX = newGridX
		this.playerGridY = newGridY

		// 픽셀 좌표로 변환
		const pixelX = newGridX * this.BLOCK_SIZE + this.BLOCK_SIZE / 2
		const pixelY = newGridY * this.BLOCK_SIZE + this.BLOCK_SIZE / 2

		// 이동 중 상태로 변경
		this.isPlayerMoving = true
		this.updatePlayerSprite()

		// 부드러운 이동 애니메이션
		this.tweens.add({
			targets: this.player,
			x: pixelX,
			y: pixelY,
			duration: this.ANIMATION_DURATION, // 150ms 이동 시간
			ease: 'Linear', // 선형 이동으로 더 부드럽게
			onUpdate: () => {
				// 이동 중에도 횃불 빛 위치 업데이트
				this.updateDarkness()
			},
			onComplete: () => {
				// 이동 완료 후에도 연속 이동 중이라면 달리기 상태 유지
				// 연속 이동이 멈췄을 때만 정지 상태로 변경
				console.log('🏃 Move completed, currentDirection:', this.currentDirection)
			},
		})

		// 횃불 빛 위치 즉시 업데이트
		this.updateDarkness()

		// 카메라가 플레이어를 부드럽게 따라가기
		const centerX = pixelX - 512 // 화면 중앙
		const centerY = pixelY - 384

		this.cameras.main.scrollX = Math.max(0, Math.min(centerX, 32 * this.BLOCK_SIZE - 1024))
		this.cameras.main.scrollY = Math.max(0, Math.min(centerY, 24 * this.BLOCK_SIZE - 768))
	}

	/**
	 * @description
	 * 연속 이동 시작
	 */
	private startContinuousMovement(keyCode: string): void {
		// 이동 키가 아니면 무시
		if (!this.isMovementKey(keyCode)) return

		// 이미 같은 방향으로 이동 중이면 무시
		if (this.currentDirection === keyCode) return

		// 다른 방향키가 눌렸을 때 기존 이동 중단
		this.handleDirectionChange(keyCode)

		// 기존 타이머 정리
		this.stopMovement()

		// 새로운 방향 설정
		this.currentDirection = keyCode

		// 즉시 한 번 이동
		this.handleKeyInput(keyCode)

		// 연속 이동 타이머 시작
		this.moveTimer = this.time.addEvent({
			delay: this.MOVE_DELAY,
			callback: () => {
				if (this.currentDirection) {
					this.handleKeyInput(this.currentDirection)
				}
			},
			loop: true,
		})
	}

	/**
	 * @description
	 * 연속 이동 중지
	 */
	private stopContinuousMovement(keyCode: string): void {
		// 현재 이동 중인 키와 같을 때만 중지
		if (this.currentDirection === keyCode) {
			this.stopMovement()
		}
	}

	/**
	 * @description
	 * 다른 방향키가 눌렸을 때 기존 이동 중단
	 */
	private handleDirectionChange(newKeyCode: string): void {
		// 현재 이동 중인 방향과 다른 방향키가 눌렸을 때
		if (this.currentDirection && this.currentDirection !== newKeyCode) {
			this.stopMovement()
		}
	}

	/**
	 * @description
	 * 이동 완전 중지
	 */
	private stopMovement(): void {
		if (this.moveTimer) {
			this.moveTimer.destroy()
			this.moveTimer = null
		}
		this.currentDirection = null

		// 이동 중지 시 정지 상태로 전환
		this.isPlayerMoving = false
		this.updatePlayerSprite()
	}

	/**
	 * @description
	 * 이동 키인지 확인
	 */
	private isMovementKey(keyCode: string): boolean {
		return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(keyCode)
	}

	/**
	 * @description
	 * 키 입력 처리
	 */
	private handleKeyInput(keyCode: string): void {
		let newGridX = this.playerGridX
		let newGridY = this.playerGridY

		// 키 입력에 따른 방향 설정 및 이동 계산
		switch (keyCode) {
			case 'ArrowUp':
				this.playerDirection = 'up'
				newGridY = Math.max(0, this.playerGridY - 1)
				break
			case 'ArrowDown':
				this.playerDirection = 'down'
				newGridY = Math.min(23, this.playerGridY + 1) // 24-1
				break
			case 'ArrowLeft':
				this.playerDirection = 'left'
				newGridX = Math.max(0, this.playerGridX - 1)
				break
			case 'ArrowRight':
				this.playerDirection = 'right'
				newGridX = Math.min(31, this.playerGridX + 1) // 32-1
				break
		}

		// 이동 가능한지 체크하고 실제로 이동할 수 있을 때만 처리
		if (
			this.canMoveTo(newGridX, newGridY) &&
			(newGridX !== this.playerGridX || newGridY !== this.playerGridY)
		) {
			this.movePlayer(newGridX, newGridY)
		}
	}

	/**
	 * @description
	 * 키보드 입력 설정
	 */
	private setupInput(): void {
		// 화살표 키만 사용
		this.input.keyboard!.createCursorKeys()

		// 키 입력 이벤트 설정
		this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
			this.startContinuousMovement(event.code)
		})

		this.input.keyboard!.on('keyup', (event: KeyboardEvent) => {
			this.stopContinuousMovement(event.code)
		})
	}

	// private savePlayerRegion(): void {
	// 	const region = this.getRegionCoordinates(this.playerRegionId)
	// 	const regionData = this.extractRegionData(region)

	// 	localStorage.setItem(`player-region-${this.playerRegionId}`, JSON.stringify(regionData))
	// }

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

		// 플레이어 관련 초기화 추가
		this.createPlayer() // 5) 플레이어 생성
		this.setupInput() // 6) 키보드 입력 설정

		// 횃불 시스템 초기화
		this.createDarknessSystem() // 7) 어둠과 횃불 시스템 생성

		console.log('🚀 gameMap', this.gameMap)
		EventBus.emit('current-scene-ready', this)

		// 씬 시작 시 페이드인
		this.cameras.main.fadeIn(500, 0, 0, 0) // 500ms 동안 페이드인
	}
}
