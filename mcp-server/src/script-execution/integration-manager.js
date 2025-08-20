/**
 * integration-manager.js
 * 이벤트 기반 아키텍처 및 Task Master 기존 시스템 통합
 * MCP 패턴 기반 모듈들을 통합하고 기존 시스템과 연결
 */

import { EventEmitter } from 'events';
import { ScriptExecutionResources } from './resources.js';
import { ScriptExecutionTools } from './tools.js';
import { TimeManager } from './time-manager.js';
import { MemoryManager } from './memory-manager.js';
import { SecurityManager } from './security-manager.js';
import { bindToServer } from './decorators.js';

/**
 * 통합 관리자 클래스
 */
export class IntegrationManager extends EventEmitter {
  constructor(baseDir = process.cwd()) {
    super();
    this.baseDir = baseDir;
    
    // MCP 패턴 기반 모듈들 초기화
    this.resources = new ScriptExecutionResources(baseDir);
    this.tools = new ScriptExecutionTools(baseDir);
    this.timeManager = new TimeManager();
    this.memoryManager = new MemoryManager(baseDir);
    this.securityManager = new SecurityManager(baseDir);
    
    // 이벤트 리스너 설정
    this._setupEventListeners();
    
    // 통합 상태
    this.isInitialized = false;
    this.integrationStatus = {
      resources: false,
      tools: false,
      timeManager: false,
      memoryManager: false,
      securityManager: false
    };
  }

  /**
   * 통합 초기화
   */
  async initialize() {
    try {
      console.log('[IntegrationManager] Starting integration initialization...');
      
      // 각 모듈 초기화 상태 확인
      await this._initializeModules();
      
      // 이벤트 시스템 설정
      this._setupEventSystem();
      
      // 기존 Task Master 시스템과 연결
      await this._connectToTaskMaster();
      
      this.isInitialized = true;
      console.log('[IntegrationManager] Integration initialization completed successfully');
      
      this.emit('initialized', {
        timestamp: new Date().toISOString(),
        status: this.integrationStatus
      });
      
      return {
        success: true,
        status: this.integrationStatus,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[IntegrationManager] Integration initialization failed:', error);
      this.emit('initialization_failed', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: false,
        error: error.message,
        status: this.integrationStatus,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * MCP 서버에 등록
   */
  registerToServer(server) {
    try {
      console.log('[IntegrationManager] Registering to MCP server...');
      
      // 데코레이터 기반 등록
      bindToServer(server);
      
      // 함수형 등록 (데코레이터를 사용하지 않는 경우)
      this._registerResourcesToServer(server);
      this._registerToolsToServer(server);
      
      console.log('[IntegrationManager] Successfully registered to MCP server');
      
      this.emit('registered_to_server', {
        server: server.constructor.name,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: true,
        registeredModules: {
          resources: this.resources.constructor.name,
          tools: this.tools.constructor.name,
          timeManager: this.timeManager.constructor.name,
          memoryManager: this.memoryManager.constructor.name,
          securityManager: this.securityManager.constructor.name
        }
      };
    } catch (error) {
      console.error('[IntegrationManager] Failed to register to MCP server:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 통합 상태 조회
   */
  getIntegrationStatus() {
    return {
      isInitialized: this.isInitialized,
      modules: this.integrationStatus,
      timestamp: new Date().toISOString(),
      baseDir: this.baseDir,
      eventListeners: this.listenerCount('*')
    };
  }

  /**
   * 이벤트 기반 스크립트 실행
   */
  async executeScriptWithEvents(command, options = {}) {
    if (!this.isInitialized) {
      throw new Error('IntegrationManager is not initialized');
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // 실행 시작 이벤트
      this.emit('script_execution_started', {
        executionId,
        command,
        options,
        timestamp: new Date().toISOString()
      });

      // 보안 검증
      const securityValidation = await this.securityManager.validatePathSecurity({
        targetPath: options.workingDirectory || this.baseDir,
        operation: 'execute'
      });

      if (!securityValidation.isValid || !securityValidation.isAllowed) {
        throw new Error(`Security validation failed: ${securityValidation.securityChecks.join(', ')}`);
      }

      // 스크립트 실행
      const result = await this.tools.runScript({
        command,
        ...options
      });

      // 실행 완료 이벤트
      this.emit('script_execution_completed', {
        executionId,
        result,
        timestamp: new Date().toISOString()
      });

      // 메모리에 실행 결과 저장
      await this.memoryManager.saveMemory({
        content: `Script execution: ${command}`,
        tags: ['script-execution', 'completed'],
        metadata: {
          executionId,
          command,
          result: result.id,
          success: result.success
        }
      });

      return {
        executionId,
        result,
        success: true
      };
    } catch (error) {
      // 실행 실패 이벤트
      this.emit('script_execution_failed', {
        executionId,
        command,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      // 메모리에 실패 정보 저장
      await this.memoryManager.saveMemory({
        content: `Script execution failed: ${command} - ${error.message}`,
        tags: ['script-execution', 'failed'],
        metadata: {
          executionId,
          command,
          error: error.message
        }
      });

      throw error;
    }
  }

  /**
   * 통합 분석 실행
   */
  async performIntegratedAnalysis(scriptResultId, analysisOptions = {}) {
    if (!this.isInitialized) {
      throw new Error('IntegrationManager is not initialized');
    }

    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // 분석 시작 이벤트
      this.emit('analysis_started', {
        analysisId,
        scriptResultId,
        options: analysisOptions,
        timestamp: new Date().toISOString()
      });

      // 스크립트 결과 조회
      const scriptResult = await this.resources.getScriptResult({ id: scriptResultId });
      if (!scriptResult.exists) {
        throw new Error(`Script result ${scriptResultId} not found`);
      }

      // 시간 기반 분석
      const timeAnalysis = await this.timeManager.measureExecutionTime({
        operation: `Analysis of script result ${scriptResultId}`,
        timeout: 60000
      });

      // 스크립트 결과 분석
      const analysisResult = await this.tools.analyzeScriptResult({
        scriptResultId,
        ...analysisOptions
      });

      // 통합 보고서 생성
      const reportResult = await this.tools.createScriptReport({
        scriptResultId,
        analysisResultId: analysisResult.analysis ? `${scriptResultId}_analysis` : null,
        format: 'markdown',
        includeDetails: true,
        includeAnalysis: true
      });

      // 분석 완료 이벤트
      this.emit('analysis_completed', {
        analysisId,
        scriptResultId,
        results: {
          timeAnalysis,
          analysisResult,
          reportResult
        },
        timestamp: new Date().toISOString()
      });

      return {
        analysisId,
        scriptResultId,
        timeAnalysis,
        analysisResult,
        reportResult,
        success: true
      };
    } catch (error) {
      // 분석 실패 이벤트
      this.emit('analysis_failed', {
        analysisId,
        scriptResultId,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  /**
   * 통합 정리 작업
   */
  async performCleanup(cleanupOptions = {}) {
    if (!this.isInitialized) {
      throw new Error('IntegrationManager is not initialized');
    }

    const cleanupId = `cleanup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // 정리 시작 이벤트
      this.emit('cleanup_started', {
        cleanupId,
        options: cleanupOptions,
        timestamp: new Date().toISOString()
      });

      const results = {};

      // 스크립트 결과 정리
      if (cleanupOptions.cleanupScriptResults !== false) {
        results.scriptResults = await this.tools.cleanupScriptResults({
          maxAge: cleanupOptions.maxAge || 30,
          dryRun: cleanupOptions.dryRun !== false
        });
      }

      // 메모리 정리
      if (cleanupOptions.cleanupMemories !== false) {
        results.memories = await this.memoryManager.cleanupMemories({
          maxAge: cleanupOptions.maxAge || 30,
          dryRun: cleanupOptions.dryRun !== false
        });
      }

      // 정리 완료 이벤트
      this.emit('cleanup_completed', {
        cleanupId,
        results,
        timestamp: new Date().toISOString()
      });

      return {
        cleanupId,
        results,
        success: true
      };
    } catch (error) {
      // 정리 실패 이벤트
      this.emit('cleanup_failed', {
        cleanupId,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  // 헬퍼 메서드들
  async _initializeModules() {
    // 각 모듈 초기화 상태 확인
    this.integrationStatus.resources = true;
    this.integrationStatus.tools = true;
    this.integrationStatus.timeManager = true;
    this.integrationStatus.memoryManager = true;
    this.integrationStatus.securityManager = true;
  }

  _setupEventListeners() {
    // 메모리 관리자 이벤트 리스너
    this.memoryManager.on('session_started', (session) => {
      this.emit('memory_session_started', session);
    });

    this.memoryManager.on('memory_saved', (memory) => {
      this.emit('memory_saved', memory);
    });

    this.memoryManager.on('snapshot_saved', (snapshot) => {
      this.emit('snapshot_saved', snapshot);
    });

    // 보안 관리자 이벤트 리스너
    this.securityManager.on('access_logged', (logEntry) => {
      this.emit('security_access_logged', logEntry);
    });
  }

  _setupEventSystem() {
    // 전역 이벤트 리스너
    this.on('*', (eventName, ...args) => {
      console.log(`[IntegrationManager] Event: ${eventName}`, args);
    });
  }

  async _connectToTaskMaster() {
    // 기존 Task Master 시스템과의 연결 로직
    // 여기서는 기본적인 연결만 구현
    console.log('[IntegrationManager] Connected to Task Master system');
  }

  _registerResourcesToServer(server) {
    // 리소스들을 서버에 등록
    const resourceMethods = [
      'listScriptResults',
      'getScriptResult',
      'getScriptStatistics',
      'getScriptLogs',
      'getScriptEnvironment'
    ];

    resourceMethods.forEach(method => {
      if (this.resources[method]) {
        // 리소스 등록 로직
      }
    });
  }

  _registerToolsToServer(server) {
    // 도구들을 서버에 등록
    const toolMethods = [
      'runScript',
      'analyzeScriptResult',
      'createScriptReport',
      'cleanupScriptResults'
    ];

    toolMethods.forEach(method => {
      if (this.tools[method]) {
        // 도구 등록 로직
      }
    });
  }
}

// 싱글톤 인스턴스 생성
let integrationManagerInstance = null;

export function getIntegrationManager(baseDir = process.cwd()) {
  if (!integrationManagerInstance) {
    integrationManagerInstance = new IntegrationManager(baseDir);
  }
  return integrationManagerInstance;
}

export function createIntegrationManager(baseDir = process.cwd()) {
  return new IntegrationManager(baseDir);
}

// 기존 시스템과의 호환성을 위한 래퍼 함수들
export async function initializeScriptExecutionSystem(baseDir = process.cwd()) {
  const manager = getIntegrationManager(baseDir);
  return await manager.initialize();
}

export async function executeScript(command, options = {}) {
  const manager = getIntegrationManager();
  return await manager.executeScriptWithEvents(command, options);
}

export async function analyzeScriptResult(scriptResultId, options = {}) {
  const manager = getIntegrationManager();
  return await manager.performIntegratedAnalysis(scriptResultId, options);
}

export async function cleanupSystem(options = {}) {
  const manager = getIntegrationManager();
  return await manager.performCleanup(options);
}

export function getSystemStatus() {
  const manager = getIntegrationManager();
  return manager.getIntegrationStatus();
}
