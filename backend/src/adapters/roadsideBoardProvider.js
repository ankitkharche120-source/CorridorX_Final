/**
 * RoadsideBoardProvider
 *
 * Physical Variable Message Signs (VMS) placed on highway gantries and
 * arterial corridors are operated via vendor roadside telemetry hardware (e.g., Daktronics, SWARCO, LED ITMS).
 *
 * Google Maps Platform does NOT own or control physical LED road signs.
 * This adapter interface provides:
 * 1. MockBoardProvider: For UI simulation, pitch demonstrations, and tests.
 * 2. ExternalBoardProvider: For real VMS hardware REST/TCP endpoints when configured.
 */

class MockBoardProvider {
  constructor() {
    this.boardDisplays = new Map();
  }

  async activateBoard(boardId, messagePayload = {}) {
    const display = {
      boardId,
      status: 'ACTIVE',
      line1: messagePayload.line1 || '🚨 AMBULANCE APPROACHING',
      line2: messagePayload.line2 || 'PLEASE CLEAR RIGHT LANE',
      line3: messagePayload.line3 || 'HOLD AT INTERSECTION',
      timestamp: new Date().toISOString(),
      mode: 'SIMULATION'
    };
    this.boardDisplays.set(boardId, display);
    return { success: true, mode: 'SIMULATION', display };
  }

  async updateBoardMessage(boardId, lines = {}) {
    const existing = this.boardDisplays.get(boardId) || {};
    const updated = {
      ...existing,
      ...lines,
      status: 'ACTIVE',
      timestamp: new Date().toISOString(),
      mode: 'SIMULATION'
    };
    this.boardDisplays.set(boardId, updated);
    return { success: true, mode: 'SIMULATION', display: updated };
  }

  async clearBoard(boardId) {
    const display = {
      boardId,
      status: 'STANDBY',
      line1: 'CORRIDORX TRAFFIC SAFETY',
      line2: 'DRIVE CAREFULLY',
      line3: 'OBSERVE SPEED LIMITS',
      timestamp: new Date().toISOString(),
      mode: 'SIMULATION'
    };
    this.boardDisplays.set(boardId, display);
    return { success: true, mode: 'SIMULATION', display };
  }

  async getBoardStatus(boardId) {
    return this.boardDisplays.get(boardId) || {
      boardId,
      status: 'STANDBY',
      mode: 'SIMULATION'
    };
  }
}

class ExternalBoardProvider {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async activateBoard(boardId, messagePayload = {}) {
    try {
      const res = await fetch(`${this.apiUrl}/v1/boards/${boardId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messagePayload)
      });
      return await res.json();
    } catch (e) {
      console.warn(`[Road Board Provider] Hardware API call failed for ${boardId}:`, e.message);
      return { success: false, error: e.message, mode: 'EXTERNAL_FAILED' };
    }
  }

  async updateBoardMessage(boardId, lines = {}) {
    try {
      const res = await fetch(`${this.apiUrl}/v1/boards/${boardId}/message`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lines)
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message, mode: 'EXTERNAL_FAILED' };
    }
  }

  async clearBoard(boardId) {
    try {
      const res = await fetch(`${this.apiUrl}/v1/boards/${boardId}/clear`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message, mode: 'EXTERNAL_FAILED' };
    }
  }

  async getBoardStatus(boardId) {
    try {
      const res = await fetch(`${this.apiUrl}/v1/boards/${boardId}/status`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return await res.json();
    } catch (e) {
      return { status: 'UNKNOWN', mode: 'EXTERNAL_FAILED' };
    }
  }
}

const hasExternalBoardApi = Boolean(
  process.env.ROAD_BOARD_API_URL && 
  process.env.ROAD_BOARD_API_KEY && 
  !process.env.ROAD_BOARD_API_KEY.includes('Your')
);

const roadsideBoardProvider = hasExternalBoardApi
  ? new ExternalBoardProvider(process.env.ROAD_BOARD_API_URL, process.env.ROAD_BOARD_API_KEY)
  : new MockBoardProvider();

module.exports = {
  roadsideBoardProvider,
  MockBoardProvider,
  ExternalBoardProvider,
  isLiveHardwareActive: hasExternalBoardApi
};
