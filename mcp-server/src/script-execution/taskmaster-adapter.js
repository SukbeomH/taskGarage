/**
 * taskmaster-adapter.js
 * 기존 Task Master 시스템과의 통합 어댑터
 * 기존 스크립트 실행 엔진과 새로운 MCP 패턴 기반 시스템 간의 호환성 제공
 */

import { getIntegrationManager } from './integration-manager.js';
import { readJSON, writeJSON, findProjectRoot } from '../../../../scripts/modules/utils.js';

/**
 * Task Master 어댑터 클래스
 */
export class TaskMasterAdapter {
  constructor() {
    this.integrationManager = getIntegrationManager();
    this.isAdapted = false;
    this.adaptationStatus = {
      scriptExecutionEngine: false,
      taskManager: false,
      cliCommands: false,
      mcpTools: false
    };
  }

  /**
   * 어댑터 초기화
   */
  async initialize() {
    try {
      console.log('[TaskMasterAdapter] Starting adaptation initialization...');
      
      // 통합 관리자 초기화
      await this.integrationManager.initialize();
      
      // 기존 시스템과의 어댑터 설정
      await this._setupScriptExecutionEngineAdapter();
      await this._setupTaskManagerAdapter();
      await this._setupCLICommandsAdapter();
      await this._setupMCPToolsAdapter();
      
      this.isAdapted = true;
      console.log('[TaskMasterAdapter] Adaptation initialization completed successfully');
      
      return {
        success: true,
        status: this.adaptationStatus,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[TaskMasterAdapter] Adaptation initialization failed:', error);
      return {
        success: false,
        error: error.message,
        status: this.adaptationStatus,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 기존 스크립트 실행 엔진 어댑터
   */
  async _setupScriptExecutionEngineAdapter() {
    try {
      // 기존 스크립트 실행 엔진의 executeScript 함수를 새로운 시스템으로 리다이렉트
      const originalExecuteScript = global.executeScript;
      
      if (originalExecuteScript) {
        // 기존 함수를 백업하고 새로운 함수로 교체
        global.executeScript = async (command, options = {}) => {
          console.log('[TaskMasterAdapter] Redirecting script execution to new system');
          
          try {
            // 새로운 통합 시스템을 통해 스크립트 실행
            const result = await this.integrationManager.executeScriptWithEvents(command, options);
            
            // 기존 형식과 호환되는 결과 반환
            return {
              id: result.executionId,
              command: command,
              workingDirectory: options.workingDirectory || process.cwd(),
              startTime: new Date().toISOString(),
              endTime: new Date().toISOString(),
              duration: result.result.duration,
              exitCode: result.result.exitCode,
              stdout: result.result.stdout,
              stderr: result.result.stderr,
              success: result.result.success,
              error: result.result.error,
              metadata: {
                adapted: true,
                newSystem: true,
                executionId: result.executionId
              }
            };
          } catch (error) {
            console.error('[TaskMasterAdapter] Script execution failed:', error);
            throw error;
          }
        };
      }
      
      this.adaptationStatus.scriptExecutionEngine = true;
      console.log('[TaskMasterAdapter] Script execution engine adapter setup completed');
    } catch (error) {
      console.error('[TaskMasterAdapter] Failed to setup script execution engine adapter:', error);
      throw error;
    }
  }

  /**
   * Task Manager 어댑터
   */
  async _setupTaskManagerAdapter() {
    try {
      // 기존 Task Manager와의 통합
      const projectRoot = findProjectRoot();
      if (!projectRoot) {
        throw new Error('Project root not found');
      }

      // Task Master 설정에 새로운 시스템 정보 추가
      const configPath = `${projectRoot}/.taskmaster/config.json`;
      let config = {};
      
      try {
        config = readJSON(configPath);
      } catch (error) {
        // 설정 파일이 없는 경우 기본 설정 생성
        config = {
          version: '1.0.0',
          features: {},
          integrations: {}
        };
      }

      // 새로운 스크립트 실행 시스템 정보 추가
      config.integrations = config.integrations || {};
      config.integrations.scriptExecution = {
        enabled: true,
        system: 'mcp-pattern-based',
        version: '1.0.0',
        features: [
          'security-validation',
          'time-management',
          'memory-management',
          'event-driven',
          'mcp-integration'
        ],
        adaptedAt: new Date().toISOString()
      };

      // 설정 파일 저장
      writeJSON(configPath, config);
      
      this.adaptationStatus.taskManager = true;
      console.log('[TaskMasterAdapter] Task manager adapter setup completed');
    } catch (error) {
      console.error('[TaskMasterAdapter] Failed to setup task manager adapter:', error);
      throw error;
    }
  }

  /**
   * CLI 명령어 어댑터
   */
  async _setupCLICommandsAdapter() {
    try {
      // 기존 CLI 명령어에 새로운 기능 추가
      const originalCommands = global.taskMasterCommands || {};
      
      // 새로운 스크립트 실행 명령어 추가
      global.taskMasterCommands = {
        ...originalCommands,
        'run-script': {
          description: 'Execute script with enhanced security and monitoring',
          handler: async (args) => {
            const { command, options = {} } = args;
            
            if (!command) {
              console.error('Command is required');
              return;
            }

            try {
              const result = await this.integrationManager.executeScriptWithEvents(command, options);
              console.log(`Script executed successfully. Execution ID: ${result.executionId}`);
              console.log(`Result ID: ${result.result.id}`);
              console.log(`Success: ${result.result.success}`);
              console.log(`Duration: ${result.result.duration}ms`);
            } catch (error) {
              console.error('Script execution failed:', error.message);
            }
          }
        },
        'analyze-script': {
          description: 'Analyze script execution results',
          handler: async (args) => {
            const { scriptResultId, options = {} } = args;
            
            if (!scriptResultId) {
              console.error('Script result ID is required');
              return;
            }

            try {
              const result = await this.integrationManager.performIntegratedAnalysis(scriptResultId, options);
              console.log(`Analysis completed successfully. Analysis ID: ${result.analysisId}`);
              console.log(`Report generated: ${result.reportResult.reportPath}`);
            } catch (error) {
              console.error('Analysis failed:', error.message);
            }
          }
        },
        'system-status': {
          description: 'Get system integration status',
          handler: async () => {
            const status = this.integrationManager.getIntegrationStatus();
            console.log('System Integration Status:');
            console.log(JSON.stringify(status, null, 2));
          }
        },
        'cleanup-system': {
          description: 'Clean up old script results and memories',
          handler: async (args) => {
            const { options = {} } = args;
            
            try {
              const result = await this.integrationManager.performCleanup(options);
              console.log(`Cleanup completed successfully. Cleanup ID: ${result.cleanupId}`);
              console.log('Results:', JSON.stringify(result.results, null, 2));
            } catch (error) {
              console.error('Cleanup failed:', error.message);
            }
          }
        }
      };
      
      this.adaptationStatus.cliCommands = true;
      console.log('[TaskMasterAdapter] CLI commands adapter setup completed');
    } catch (error) {
      console.error('[TaskMasterAdapter] Failed to setup CLI commands adapter:', error);
      throw error;
    }
  }

  /**
   * MCP 도구 어댑터
   */
  async _setupMCPToolsAdapter() {
    try {
      // 기존 MCP 도구들을 새로운 시스템과 통합
      const originalMCPTools = global.mcpTools || {};
      
      // 새로운 MCP 도구들 추가
      global.mcpTools = {
        ...originalMCPTools,
        // 스크립트 실행 관련 도구들
        'run_script': {
          description: 'Execute script with enhanced security and monitoring',
          parameters: {
            command: 'string (실행할 명령어)',
            workingDirectory: 'string (작업 디렉토리, 선택사항)',
            timeout: 'number (타임아웃, 밀리초, 선택사항)',
            shell: 'boolean (쉘 사용 여부, 선택사항)'
          },
          handler: async (args) => {
            return await this.integrationManager.executeScriptWithEvents(
              args.command,
              {
                workingDirectory: args.workingDirectory,
                timeout: args.timeout,
                shell: args.shell
              }
            );
          }
        },
        'analyze_script_result': {
          description: 'Analyze script execution results',
          parameters: {
            scriptResultId: 'string (스크립트 결과 ID)',
            analysisType: 'string (분석 타입, 선택사항)',
            enableAI: 'boolean (AI 분석 활성화, 선택사항)'
          },
          handler: async (args) => {
            return await this.integrationManager.performIntegratedAnalysis(
              args.scriptResultId,
              {
                analysisType: args.analysisType,
                enableAI: args.enableAI
              }
            );
          }
        },
        'get_system_status': {
          description: 'Get system integration status',
          parameters: {},
          handler: async () => {
            return this.integrationManager.getIntegrationStatus();
          }
        },
        'cleanup_system': {
          description: 'Clean up old script results and memories',
          parameters: {
            maxAge: 'number (최대 보관 기간, 일, 선택사항)',
            dryRun: 'boolean (실제 삭제하지 않고 미리보기, 선택사항)'
          },
          handler: async (args) => {
            return await this.integrationManager.performCleanup({
              maxAge: args.maxAge,
              dryRun: args.dryRun
            });
          }
        }
      };
      
      this.adaptationStatus.mcpTools = true;
      console.log('[TaskMasterAdapter] MCP tools adapter setup completed');
    } catch (error) {
      console.error('[TaskMasterAdapter] Failed to setup MCP tools adapter:', error);
      throw error;
    }
  }

  /**
   * 어댑터 상태 조회
   */
  getAdaptationStatus() {
    return {
      isAdapted: this.isAdapted,
      modules: this.adaptationStatus,
      timestamp: new Date().toISOString(),
      integrationStatus: this.integrationManager.getIntegrationStatus()
    };
  }

  /**
   * 기존 시스템 호환성 확인
   */
  checkCompatibility() {
    const compatibility = {
      scriptExecutionEngine: typeof global.executeScript === 'function',
      taskManager: typeof readJSON === 'function' && typeof writeJSON === 'function',
      cliCommands: typeof global.taskMasterCommands === 'object',
      mcpTools: typeof global.mcpTools === 'object',
      utils: typeof findProjectRoot === 'function'
    };

    return {
      compatible: Object.values(compatibility).every(Boolean),
      details: compatibility,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 어댑터 제거 (롤백)
   */
  async rollback() {
    try {
      console.log('[TaskMasterAdapter] Starting rollback...');
      
      // 기존 함수들 복원
      if (global.executeScriptBackup) {
        global.executeScript = global.executeScriptBackup;
        delete global.executeScriptBackup;
      }
      
      if (global.taskMasterCommandsBackup) {
        global.taskMasterCommands = global.taskMasterCommandsBackup;
        delete global.taskMasterCommandsBackup;
      }
      
      if (global.mcpToolsBackup) {
        global.mcpTools = global.mcpToolsBackup;
        delete global.mcpToolsBackup;
      }
      
      this.isAdapted = false;
      this.adaptationStatus = {
        scriptExecutionEngine: false,
        taskManager: false,
        cliCommands: false,
        mcpTools: false
      };
      
      console.log('[TaskMasterAdapter] Rollback completed successfully');
      
      return {
        success: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[TaskMasterAdapter] Rollback failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// 싱글톤 인스턴스 생성
let taskMasterAdapterInstance = null;

export function getTaskMasterAdapter() {
  if (!taskMasterAdapterInstance) {
    taskMasterAdapterInstance = new TaskMasterAdapter();
  }
  return taskMasterAdapterInstance;
}

export function createTaskMasterAdapter() {
  return new TaskMasterAdapter();
}

// 기존 시스템과의 호환성을 위한 래퍼 함수들
export async function initializeTaskMasterAdapter() {
  const adapter = getTaskMasterAdapter();
  return await adapter.initialize();
}

export function getTaskMasterAdaptationStatus() {
  const adapter = getTaskMasterAdapter();
  return adapter.getAdaptationStatus();
}

export function checkTaskMasterCompatibility() {
  const adapter = getTaskMasterAdapter();
  return adapter.checkCompatibility();
}

export async function rollbackTaskMasterAdapter() {
  const adapter = getTaskMasterAdapter();
  return await adapter.rollback();
}

// 자동 초기화 (모듈 로드 시)
if (typeof window === 'undefined') {
  // Node.js 환경에서만 자동 초기화
  process.nextTick(async () => {
    try {
      const adapter = getTaskMasterAdapter();
      const compatibility = adapter.checkCompatibility();
      
      if (compatibility.compatible) {
        console.log('[TaskMasterAdapter] Auto-initializing adapter...');
        await adapter.initialize();
      } else {
        console.warn('[TaskMasterAdapter] Compatibility check failed, skipping auto-initialization');
      }
    } catch (error) {
      console.error('[TaskMasterAdapter] Auto-initialization failed:', error);
    }
  });
}
