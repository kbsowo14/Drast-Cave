import { Events } from 'phaser'

/**
 * 이벤트 버스
 * 컴포넌트, HTML과 Phaser 씬 간의 이벤트 전송을 위해 사용됩니다.
 */
export const EventBus = new Events.EventEmitter()
