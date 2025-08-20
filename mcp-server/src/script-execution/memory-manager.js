/**
 * memory-manager.js
 * MCP Memory 서버 패턴 기반 상태 관리 및 실시간 모니터링
 * 세션 기반 상태 관리, 스냅샷 저장/복원, 이벤트 스트림 등
 */

import { mcpResource, mcpTool, registerResource, registerTool } from './decorators.js';
import { writeFile, readFile, mkdir, readdir, unlink } from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

/**
 * 메모리 아이템 구조
 */
export class MemoryItem {
  constructor(options = {}) {
    this.id = options.id || null;
    this.content = options.content || '';
    this.tags = options.tags || [];
    this.createdAt = options.createdAt || new Date().toISOString();
    this.updatedAt = options.updatedAt || new Date().toISOString();
    this.sessionId = options.sessionId || null;
    this.metadata = options.metadata || {};
  }

  toJSON() {
    return {
      id: this.id,
      content: this.content,
      tags: this.tags,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      sessionId: this.sessionId,
      metadata: this.metadata
    };
  }
}

/**
 * 메모리 관리자 클래스
 */
export class MemoryManager extends EventEmitter {
  constructor(baseDir = process.cwd()) {
    super();
    this.baseDir = baseDir;
    this.memoryDir = path.join(baseDir, '.taskmaster', 'memory');
    this.sessions = new Map();
    this.memories = new Map();
    this.nextMemoryId = 1;
    this.nextSessionId = 1;
    
    this.ensureMemoryDirectory();
    this.loadMemories();
  }

  /**
   * 세션 시작 리소스
   */
  @mcpResource({
    name: 'start_session',
    description: '새로운 메모리 세션을 시작합니다.',
    input: {
      sessionName: 'string (세션 이름, 선택사항)',
      metadata: 'object (세션 메타데이터, 선택사항)'
    },
    output: {
      sessionId: 'string (세션 ID)',
      sessionName: 'string (세션 이름)',
      startTime: 'string (시작 시간)',
      metadata: 'object (세션 메타데이터)'
    },
    category: 'memory-management',
    tags: ['memory', 'session', 'start']
  })
  async startSession(args = {}) {
    const { sessionName = `session_${Date.now()}`, metadata = {} } = args;
    
    try {
      const sessionId = `session_${this.nextSessionId++}`;
      const startTime = new Date().toISOString();
      
      const session = {
        id: sessionId,
        name: sessionName,
        startTime,
        metadata,
        memories: [],
        active: true
      };

      this.sessions.set(sessionId, session);
      
      // 이벤트 발생
      this.emit('session_started', session);
      
      return {
        sessionId,
        sessionName,
        startTime,
        metadata
      };
    } catch (error) {
      throw new Error(`Failed to start session: ${error.message}`);
    }
  }

  /**
   * 메모리 저장 도구
   */
  @mcpTool({
    name: 'save_memory',
    description: '메모리를 저장합니다.',
    input: {
      content: 'string (저장할 메모리 내용)',
      sessionId: 'string (세션 ID, 선택사항)',
      tags: 'array (태그 목록, 선택사항)',
      metadata: 'object (메타데이터, 선택사항)'
    },
    output: {
      memoryId: 'string (메모리 ID)',
      sessionId: 'string (세션 ID)',
      content: 'string (저장된 내용)',
      tags: 'array (태그 목록)',
      createdAt: 'string (생성 시간)',
      success: 'boolean (저장 성공 여부)'
    },
    category: 'memory-management',
    tags: ['memory', 'save', 'store'],
    timeout: 10000,
    retry: {
      maxAttempts: 2,
      backoff: 'exponential'
    }
  })
  async saveMemory(args) {
    const {
      content,
      sessionId = null,
      tags = [],
      metadata = {}
    } = args;

    if (!content) {
      throw new Error('Memory content is required');
    }

    try {
      const memoryId = `memory_${this.nextMemoryId++}`;
      const createdAt = new Date().toISOString();
      
      const memory = new MemoryItem({
        id: memoryId,
        content,
        tags,
        createdAt,
        sessionId,
        metadata
      });

      this.memories.set(memoryId, memory);
      
      // 세션에 메모리 추가
      if (sessionId && this.sessions.has(sessionId)) {
        const session = this.sessions.get(sessionId);
        session.memories.push(memoryId);
      }

      // 메모리 저장
      await this._saveMemoryToFile(memory);
      
      // 이벤트 발생
      this.emit('memory_saved', memory);
      
      return {
        memoryId,
        sessionId,
        content,
        tags,
        createdAt,
        success: true
      };
    } catch (error) {
      return {
        memoryId: null,
        sessionId,
        content,
        tags: [],
        createdAt: null,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 메모리 검색 리소스
   */
  @mcpResource({
    name: 'search_memories',
    description: '저장된 메모리를 검색합니다.',
    input: {
      query: 'string (검색 쿼리)',
      sessionId: 'string (세션 ID, 선택사항)',
      tags: 'array (태그 필터, 선택사항)',
      limit: 'number (결과 제한, 기본값: 10)',
      offset: 'number (오프셋, 기본값: 0)'
    },
    output: {
      memories: 'array (검색된 메모리 목록)',
      total: 'number (총 메모리 수)',
      query: 'string (사용된 쿼리)',
      sessionId: 'string (세션 ID)'
    },
    category: 'memory-management',
    tags: ['memory', 'search', 'find']
  })
  async searchMemories(args = {}) {
    const {
      query = '',
      sessionId = null,
      tags = [],
      limit = 10,
      offset = 0
    } = args;

    try {
      let filteredMemories = Array.from(this.memories.values());

      // 세션 필터링
      if (sessionId) {
        filteredMemories = filteredMemories.filter(memory => 
          memory.sessionId === sessionId
        );
      }

      // 태그 필터링
      if (tags.length > 0) {
        filteredMemories = filteredMemories.filter(memory =>
          tags.some(tag => memory.tags.includes(tag))
        );
      }

      // 쿼리 검색
      if (query) {
        const lowerQuery = query.toLowerCase();
        filteredMemories = filteredMemories.filter(memory =>
          memory.content.toLowerCase().includes(lowerQuery) ||
          memory.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
      }

      // 정렬 (최신순)
      filteredMemories.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );

      // 페이지네이션
      const total = filteredMemories.length;
      const paginatedMemories = filteredMemories.slice(offset, offset + limit);

      return {
        memories: paginatedMemories.map(memory => memory.toJSON()),
        total,
        query,
        sessionId
      };
    } catch (error) {
      throw new Error(`Failed to search memories: ${error.message}`);
    }
  }

  /**
   * 세션 상태 조회 리소스
   */
  @mcpResource({
    name: 'get_session_status',
    description: '현재 세션 상태를 조회합니다.',
    input: {
      sessionId: 'string (세션 ID, 선택사항)'
    },
    output: {
      sessions: 'array (세션 목록)',
      activeSession: 'object (활성 세션)',
      totalMemories: 'number (총 메모리 수)',
      recentMemories: 'array (최근 메모리 목록)'
    },
    category: 'memory-management',
    tags: ['memory', 'session', 'status']
  })
  async getSessionStatus(args = {}) {
    const { sessionId = null } = args;

    try {
      const sessions = Array.from(this.sessions.values());
      const activeSession = sessions.find(s => s.active) || null;
      
      const totalMemories = this.memories.size;
      
      // 최근 메모리 (최대 5개)
      const recentMemories = Array.from(this.memories.values())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(memory => memory.toJSON());

      return {
        sessions: sessions.map(session => ({
          id: session.id,
          name: session.name,
          startTime: session.startTime,
          active: session.active,
          memoryCount: session.memories.length
        })),
        activeSession: activeSession ? {
          id: activeSession.id,
          name: activeSession.name,
          startTime: activeSession.startTime,
          memoryCount: activeSession.memories.length
        } : null,
        totalMemories,
        recentMemories
      };
    } catch (error) {
      throw new Error(`Failed to get session status: ${error.message}`);
    }
  }

  /**
   * 스냅샷 저장 도구
   */
  @mcpTool({
    name: 'save_snapshot',
    description: '현재 메모리 상태를 스냅샷으로 저장합니다.',
    input: {
      snapshotName: 'string (스냅샷 이름)',
      includeSessions: 'boolean (세션 포함 여부, 기본값: true)',
      includeMemories: 'boolean (메모리 포함 여부, 기본값: true)',
      description: 'string (스냅샷 설명, 선택사항)'
    },
    output: {
      snapshotId: 'string (스냅샷 ID)',
      snapshotName: 'string (스냅샷 이름)',
      createdAt: 'string (생성 시간)',
      size: 'number (스냅샷 크기, 바이트)',
      success: 'boolean (저장 성공 여부)'
    },
    category: 'memory-management',
    tags: ['memory', 'snapshot', 'backup'],
    timeout: 30000,
    retry: {
      maxAttempts: 1,
      backoff: 'exponential'
    }
  })
  async saveSnapshot(args) {
    const {
      snapshotName,
      includeSessions = true,
      includeMemories = true,
      description = ''
    } = args;

    if (!snapshotName) {
      throw new Error('Snapshot name is required');
    }

    try {
      const snapshotId = `snapshot_${Date.now()}`;
      const createdAt = new Date().toISOString();
      
      const snapshot = {
        id: snapshotId,
        name: snapshotName,
        description,
        createdAt,
        metadata: {
          includeSessions,
          includeMemories,
          totalSessions: this.sessions.size,
          totalMemories: this.memories.size
        },
        data: {}
      };

      // 세션 데이터 포함
      if (includeSessions) {
        snapshot.data.sessions = Array.from(this.sessions.values());
      }

      // 메모리 데이터 포함
      if (includeMemories) {
        snapshot.data.memories = Array.from(this.memories.values()).map(memory => memory.toJSON());
      }

      // 스냅샷 저장
      const snapshotPath = path.join(this.memoryDir, `${snapshotId}.json`);
      const snapshotContent = JSON.stringify(snapshot, null, 2);
      await writeFile(snapshotPath, snapshotContent, 'utf8');

      const size = Buffer.byteLength(snapshotContent, 'utf8');
      
      // 이벤트 발생
      this.emit('snapshot_saved', snapshot);
      
      return {
        snapshotId,
        snapshotName,
        createdAt,
        size,
        success: true
      };
    } catch (error) {
      return {
        snapshotId: null,
        snapshotName,
        createdAt: null,
        size: 0,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 스냅샷 복원 도구
   */
  @mcpTool({
    name: 'restore_snapshot',
    description: '저장된 스냅샷을 복원합니다.',
    input: {
      snapshotId: 'string (복원할 스냅샷 ID)',
      restoreSessions: 'boolean (세션 복원 여부, 기본값: true)',
      restoreMemories: 'boolean (메모리 복원 여부, 기본값: true)',
      clearExisting: 'boolean (기존 데이터 삭제 여부, 기본값: false)'
    },
    output: {
      snapshotId: 'string (복원된 스냅샷 ID)',
      restoredSessions: 'number (복원된 세션 수)',
      restoredMemories: 'number (복원된 메모리 수)',
      success: 'boolean (복원 성공 여부)'
    },
    category: 'memory-management',
    tags: ['memory', 'snapshot', 'restore'],
    timeout: 60000,
    retry: {
      maxAttempts: 1,
      backoff: 'exponential'
    }
  })
  async restoreSnapshot(args) {
    const {
      snapshotId,
      restoreSessions = true,
      restoreMemories = true,
      clearExisting = false
    } = args;

    if (!snapshotId) {
      throw new Error('Snapshot ID is required');
    }

    try {
      // 스냅샷 파일 읽기
      const snapshotPath = path.join(this.memoryDir, `${snapshotId}.json`);
      const snapshotContent = await readFile(snapshotPath, 'utf8');
      const snapshot = JSON.parse(snapshotContent);

      let restoredSessions = 0;
      let restoredMemories = 0;

      // 기존 데이터 삭제
      if (clearExisting) {
        if (restoreSessions) {
          this.sessions.clear();
        }
        if (restoreMemories) {
          this.memories.clear();
        }
      }

      // 세션 복원
      if (restoreSessions && snapshot.data.sessions) {
        for (const sessionData of snapshot.data.sessions) {
          this.sessions.set(sessionData.id, sessionData);
          restoredSessions++;
        }
      }

      // 메모리 복원
      if (restoreMemories && snapshot.data.memories) {
        for (const memoryData of snapshot.data.memories) {
          const memory = new MemoryItem(memoryData);
          this.memories.set(memory.id, memory);
          restoredMemories++;
        }
      }

      // 이벤트 발생
      this.emit('snapshot_restored', {
        snapshotId,
        restoredSessions,
        restoredMemories
      });

      return {
        snapshotId,
        restoredSessions,
        restoredMemories,
        success: true
      };
    } catch (error) {
      return {
        snapshotId,
        restoredSessions: 0,
        restoredMemories: 0,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 메모리 정리 도구
   */
  @mcpTool({
    name: 'cleanup_memories',
    description: '오래된 메모리를 정리합니다.',
    input: {
      maxAge: 'number (최대 보관 기간, 일, 기본값: 30)',
      dryRun: 'boolean (실제 삭제하지 않고 미리보기, 기본값: true)',
      sessionId: 'string (특정 세션만 정리, 선택사항)',
      tags: 'array (특정 태그만 정리, 선택사항)'
    },
    output: {
      cleanedCount: 'number (정리된 메모리 수)',
      keptCount: 'number (보관된 메모리 수)',
      freedSpace: 'number (해제된 공간, 바이트)',
      success: 'boolean (정리 성공 여부)'
    },
    category: 'memory-management',
    tags: ['memory', 'cleanup', 'maintenance'],
    timeout: 30000,
    retry: {
      maxAttempts: 1,
      backoff: 'exponential'
    }
  })
  async cleanupMemories(args = {}) {
    const {
      maxAge = 30,
      dryRun = true,
      sessionId = null,
      tags = []
    } = args;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAge);

      let cleanedCount = 0;
      let keptCount = 0;
      let freedSpace = 0;

      const memoriesToClean = Array.from(this.memories.values());

      for (const memory of memoriesToClean) {
        const memoryDate = new Date(memory.createdAt);
        const shouldCleanup = memoryDate < cutoffDate;

        // 필터링 조건 확인
        const matchesSession = !sessionId || memory.sessionId === sessionId;
        const matchesTags = tags.length === 0 || 
          tags.some(tag => memory.tags.includes(tag));

        if (shouldCleanup && matchesSession && matchesTags) {
          if (!dryRun) {
            this.memories.delete(memory.id);
            await this._deleteMemoryFile(memory.id);
            freedSpace += JSON.stringify(memory.toJSON()).length;
          }
          cleanedCount++;
        } else {
          keptCount++;
        }
      }

      return {
        cleanedCount,
        keptCount,
        freedSpace,
        success: true
      };
    } catch (error) {
      return {
        cleanedCount: 0,
        keptCount: 0,
        freedSpace: 0,
        success: false,
        error: error.message
      };
    }
  }

  // 헬퍼 메서드들
  async ensureMemoryDirectory() {
    try {
      await mkdir(this.memoryDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  async loadMemories() {
    try {
      const files = await readdir(this.memoryDir);
      const memoryFiles = files.filter(file => 
        file.startsWith('memory_') && file.endsWith('.json')
      );

      for (const file of memoryFiles) {
        try {
          const filePath = path.join(this.memoryDir, file);
          const content = await readFile(filePath, 'utf8');
          const memoryData = JSON.parse(content);
          
          const memory = new MemoryItem(memoryData);
          this.memories.set(memory.id, memory);
          
          // ID 카운터 업데이트
          const idNum = parseInt(memory.id.replace('memory_', ''));
          if (idNum >= this.nextMemoryId) {
            this.nextMemoryId = idNum + 1;
          }
        } catch (error) {
          console.warn(`Failed to load memory file ${file}:`, error.message);
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn('Failed to load memories:', error.message);
      }
    }
  }

  async _saveMemoryToFile(memory) {
    const filePath = path.join(this.memoryDir, `${memory.id}.json`);
    const content = JSON.stringify(memory.toJSON(), null, 2);
    await writeFile(filePath, content, 'utf8');
  }

  async _deleteMemoryFile(memoryId) {
    try {
      const filePath = path.join(this.memoryDir, `${memoryId}.json`);
      await unlink(filePath);
    } catch (error) {
      console.warn(`Failed to delete memory file ${memoryId}:`, error.message);
    }
  }
}

// 함수형 등록 방식 (데코레이터를 사용하지 않는 경우)
export function registerMemoryManagementResources(baseDir = process.cwd()) {
  const memoryManager = new MemoryManager(baseDir);
  
  // 리소스들을 수동으로 등록
  registerResource('start_session', {
    name: 'start_session',
    description: '새로운 메모리 세션을 시작합니다.',
    input: {
      sessionName: 'string (세션 이름, 선택사항)',
      metadata: 'object (세션 메타데이터, 선택사항)'
    },
    output: {
      sessionId: 'string (세션 ID)',
      sessionName: 'string (세션 이름)',
      startTime: 'string (시작 시간)',
      metadata: 'object (세션 메타데이터)'
    },
    category: 'memory-management',
    tags: ['memory', 'session', 'start']
  }, memoryManager.startSession.bind(memoryManager));

  registerResource('search_memories', {
    name: 'search_memories',
    description: '저장된 메모리를 검색합니다.',
    input: {
      query: 'string (검색 쿼리)',
      sessionId: 'string (세션 ID, 선택사항)',
      tags: 'array (태그 필터, 선택사항)',
      limit: 'number (결과 제한, 기본값: 10)',
      offset: 'number (오프셋, 기본값: 0)'
    },
    output: {
      memories: 'array (검색된 메모리 목록)',
      total: 'number (총 메모리 수)',
      query: 'string (사용된 쿼리)',
      sessionId: 'string (세션 ID)'
    },
    category: 'memory-management',
    tags: ['memory', 'search', 'find']
  }, memoryManager.searchMemories.bind(memoryManager));

  registerResource('get_session_status', {
    name: 'get_session_status',
    description: '현재 세션 상태를 조회합니다.',
    input: {
      sessionId: 'string (세션 ID, 선택사항)'
    },
    output: {
      sessions: 'array (세션 목록)',
      activeSession: 'object (활성 세션)',
      totalMemories: 'number (총 메모리 수)',
      recentMemories: 'array (최근 메모리 목록)'
    },
    category: 'memory-management',
    tags: ['memory', 'session', 'status']
  }, memoryManager.getSessionStatus.bind(memoryManager));

  return memoryManager;
}

export function registerMemoryManagementTools(baseDir = process.cwd()) {
  const memoryManager = new MemoryManager(baseDir);
  
  // 도구들을 수동으로 등록
  registerTool('save_memory', {
    name: 'save_memory',
    description: '메모리를 저장합니다.',
    input: {
      content: 'string (저장할 메모리 내용)',
      sessionId: 'string (세션 ID, 선택사항)',
      tags: 'array (태그 목록, 선택사항)',
      metadata: 'object (메타데이터, 선택사항)'
    },
    output: {
      memoryId: 'string (메모리 ID)',
      sessionId: 'string (세션 ID)',
      content: 'string (저장된 내용)',
      tags: 'array (태그 목록)',
      createdAt: 'string (생성 시간)',
      success: 'boolean (저장 성공 여부)'
    },
    category: 'memory-management',
    tags: ['memory', 'save', 'store'],
    timeout: 10000,
    retry: {
      maxAttempts: 2,
      backoff: 'exponential'
    }
  }, memoryManager.saveMemory.bind(memoryManager));

  registerTool('save_snapshot', {
    name: 'save_snapshot',
    description: '현재 메모리 상태를 스냅샷으로 저장합니다.',
    input: {
      snapshotName: 'string (스냅샷 이름)',
      includeSessions: 'boolean (세션 포함 여부, 기본값: true)',
      includeMemories: 'boolean (메모리 포함 여부, 기본값: true)',
      description: 'string (스냅샷 설명, 선택사항)'
    },
    output: {
      snapshotId: 'string (스냅샷 ID)',
      snapshotName: 'string (스냅샷 이름)',
      createdAt: 'string (생성 시간)',
      size: 'number (스냅샷 크기, 바이트)',
      success: 'boolean (저장 성공 여부)'
    },
    category: 'memory-management',
    tags: ['memory', 'snapshot', 'backup'],
    timeout: 30000,
    retry: {
      maxAttempts: 1,
      backoff: 'exponential'
    }
  }, memoryManager.saveSnapshot.bind(memoryManager));

  registerTool('restore_snapshot', {
    name: 'restore_snapshot',
    description: '저장된 스냅샷을 복원합니다.',
    input: {
      snapshotId: 'string (복원할 스냅샷 ID)',
      restoreSessions: 'boolean (세션 복원 여부, 기본값: true)',
      restoreMemories: 'boolean (메모리 복원 여부, 기본값: true)',
      clearExisting: 'boolean (기존 데이터 삭제 여부, 기본값: false)'
    },
    output: {
      snapshotId: 'string (복원된 스냅샷 ID)',
      restoredSessions: 'number (복원된 세션 수)',
      restoredMemories: 'number (복원된 메모리 수)',
      success: 'boolean (복원 성공 여부)'
    },
    category: 'memory-management',
    tags: ['memory', 'snapshot', 'restore'],
    timeout: 60000,
    retry: {
      maxAttempts: 1,
      backoff: 'exponential'
    }
  }, memoryManager.restoreSnapshot.bind(memoryManager));

  registerTool('cleanup_memories', {
    name: 'cleanup_memories',
    description: '오래된 메모리를 정리합니다.',
    input: {
      maxAge: 'number (최대 보관 기간, 일, 기본값: 30)',
      dryRun: 'boolean (실제 삭제하지 않고 미리보기, 기본값: true)',
      sessionId: 'string (특정 세션만 정리, 선택사항)',
      tags: 'array (특정 태그만 정리, 선택사항)'
    },
    output: {
      cleanedCount: 'number (정리된 메모리 수)',
      keptCount: 'number (보관된 메모리 수)',
      freedSpace: 'number (해제된 공간, 바이트)',
      success: 'boolean (정리 성공 여부)'
    },
    category: 'memory-management',
    tags: ['memory', 'cleanup', 'maintenance'],
    timeout: 30000,
    retry: {
      maxAttempts: 1,
      backoff: 'exponential'
    }
  }, memoryManager.cleanupMemories.bind(memoryManager));

  return memoryManager;
}
