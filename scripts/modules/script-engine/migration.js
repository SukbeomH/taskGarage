/**
 * migration.js
 * 기존 스크립트 실행 엔진을 새로운 MCP 패턴 기반 시스템으로 마이그레이션
 * 안전한 전환을 위한 백업, 검증, 롤백 기능 포함
 */

import { readFile, writeFile, copyFile, access, constants } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { getTaskMasterAdapter, checkTaskMasterCompatibility } from '../../../mcp-server/src/script-execution/taskmaster-adapter.js';

/**
 * 마이그레이션 관리자 클래스
 */
export class ScriptExecutionMigration {
  constructor() {
    this.migrationDir = '.taskmaster/migrations';
    this.backupDir = '.taskmaster/backups';
    this.migrationLog = [];
    this.migrationStatus = {
      started: false,
      completed: false,
      failed: false,
      rollbackRequired: false
    };
  }

  /**
   * 마이그레이션 시작
   */
  async startMigration(options = {}) {
    const {
      dryRun = false,
      backup = true,
      validate = true,
      force = false
    } = options;

    try {
      console.log('[Migration] Starting script execution system migration...');
      this.migrationStatus.started = true;
      this.migrationLog.push({
        timestamp: new Date().toISOString(),
        action: 'migration_started',
        message: 'Migration process initiated'
      });

      // 1. 호환성 검사
      if (validate) {
        const compatibility = await this._checkCompatibility();
        if (!compatibility.compatible && !force) {
          throw new Error(`Compatibility check failed: ${JSON.stringify(compatibility.details)}`);
        }
        this.migrationLog.push({
          timestamp: new Date().toISOString(),
          action: 'compatibility_check',
          result: compatibility
        });
      }

      // 2. 백업 생성
      if (backup) {
        await this._createBackup();
      }

      // 3. 마이그레이션 실행
      if (!dryRun) {
        await this._performMigration();
      } else {
        console.log('[Migration] Dry run mode - no actual changes made');
        this.migrationLog.push({
          timestamp: new Date().toISOString(),
          action: 'dry_run',
          message: 'Migration executed in dry run mode'
        });
      }

      // 4. 검증
      if (validate && !dryRun) {
        await this._validateMigration();
      }

      this.migrationStatus.completed = true;
      console.log('[Migration] Migration completed successfully');
      
      return {
        success: true,
        dryRun,
        migrationLog: this.migrationLog,
        status: this.migrationStatus
      };

    } catch (error) {
      console.error('[Migration] Migration failed:', error);
      this.migrationStatus.failed = true;
      this.migrationLog.push({
        timestamp: new Date().toISOString(),
        action: 'migration_failed',
        error: error.message
      });

      // 자동 롤백 시도
      if (backup && !dryRun) {
        try {
          console.log('[Migration] Attempting automatic rollback...');
          await this.rollback();
        } catch (rollbackError) {
          console.error('[Migration] Automatic rollback failed:', rollbackError);
          this.migrationStatus.rollbackRequired = true;
        }
      }

      return {
        success: false,
        error: error.message,
        migrationLog: this.migrationLog,
        status: this.migrationStatus
      };
    }
  }

  /**
   * 호환성 검사
   */
  async _checkCompatibility() {
    console.log('[Migration] Checking system compatibility...');
    
    const compatibility = checkTaskMasterCompatibility();
    
    // 추가적인 시스템 검사
    const additionalChecks = {
      fileSystem: await this._checkFileSystemAccess(),
      permissions: await this._checkPermissions(),
      dependencies: await this._checkDependencies()
    };

    return {
      ...compatibility,
      additionalChecks
    };
  }

  /**
   * 파일 시스템 접근 검사
   */
  async _checkFileSystemAccess() {
    const checks = {};
    
    try {
      // 프로젝트 루트 접근
      await access('.', constants.R_OK | constants.W_OK);
      checks.projectRoot = true;
    } catch (error) {
      checks.projectRoot = false;
    }

    try {
      // .taskmaster 디렉토리 접근
      await access('.taskmaster', constants.R_OK | constants.W_OK);
      checks.taskmasterDir = true;
    } catch (error) {
      checks.taskmasterDir = false;
    }

    try {
      // scripts 디렉토리 접근
      await access('scripts', constants.R_OK | constants.W_OK);
      checks.scriptsDir = true;
    } catch (error) {
      checks.scriptsDir = false;
    }

    return checks;
  }

  /**
   * 권한 검사
   */
  async _checkPermissions() {
    const checks = {};
    
    // Node.js 프로세스 권한 검사
    checks.processUser = process.getuid ? process.getuid() : 'unknown';
    checks.processGroup = process.getgid ? process.getgid() : 'unknown';
    
    // 환경 변수 검사
    checks.envVars = {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PWD: process.env.PWD || process.cwd()
    };

    return checks;
  }

  /**
   * 의존성 검사
   */
  async _checkDependencies() {
    const checks = {};
    
    try {
      // 필수 모듈 검사
      const requiredModules = [
        'fs/promises',
        'path',
        'child_process',
        'events'
      ];

      for (const module of requiredModules) {
        try {
          await import(module);
          checks[module] = true;
        } catch (error) {
          checks[module] = false;
        }
      }

      // 선택적 모듈 검사
      const optionalModules = [
        'uuid',
        'zod'
      ];

      for (const module of optionalModules) {
        try {
          await import(module);
          checks[module] = true;
        } catch (error) {
          checks[module] = false;
        }
      }

    } catch (error) {
      checks.error = error.message;
    }

    return checks;
  }

  /**
   * 백업 생성
   */
  async _createBackup() {
    console.log('[Migration] Creating backup...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `script-execution-backup-${timestamp}`);
    
    try {
      // 백업 디렉토리 생성
      if (!existsSync(this.backupDir)) {
        mkdirSync(this.backupDir, { recursive: true });
      }

      // 기존 스크립트 실행 엔진 백업
      const enginePath = 'scripts/modules/script-execution-engine.js';
      if (existsSync(enginePath)) {
        await copyFile(enginePath, `${backupPath}-engine.js`);
      }

      // MCP 도구 백업
      const mcpToolsPath = 'mcp-server/src/tools/run-script.js';
      if (existsSync(mcpToolsPath)) {
        await copyFile(mcpToolsPath, `${backupPath}-mcp-tools.js`);
      }

      // 직접 함수 백업
      const directFunctionsPath = 'mcp-server/src/core/direct-functions/run-script.js';
      if (existsSync(directFunctionsPath)) {
        await copyFile(directFunctionsPath, `${backupPath}-direct-functions.js`);
      }

      // 설정 파일 백업
      const configPath = '.taskmaster/config.json';
      if (existsSync(configPath)) {
        await copyFile(configPath, `${backupPath}-config.json`);
      }

      this.migrationLog.push({
        timestamp: new Date().toISOString(),
        action: 'backup_created',
        backupPath
      });

      console.log(`[Migration] Backup created at: ${backupPath}`);
      
    } catch (error) {
      console.error('[Migration] Backup creation failed:', error);
      throw error;
    }
  }

  /**
   * 마이그레이션 수행
   */
  async _performMigration() {
    console.log('[Migration] Performing migration...');
    
    try {
      // 1. 새로운 시스템 초기화
      const adapter = getTaskMasterAdapter();
      const initResult = await adapter.initialize();
      
      if (!initResult.success) {
        throw new Error(`Adapter initialization failed: ${initResult.error}`);
      }

      this.migrationLog.push({
        timestamp: new Date().toISOString(),
        action: 'adapter_initialized',
        result: initResult
      });

      // 2. 기존 시스템 비활성화
      await this._disableLegacySystem();

      // 3. 새로운 시스템 활성화
      await this._enableNewSystem();

      // 4. 마이그레이션 완료 표시
      await this._markMigrationComplete();

      this.migrationLog.push({
        timestamp: new Date().toISOString(),
        action: 'migration_performed',
        message: 'Migration steps completed successfully'
      });

    } catch (error) {
      console.error('[Migration] Migration performance failed:', error);
      throw error;
    }
  }

  /**
   * 기존 시스템 비활성화
   */
  async _disableLegacySystem() {
    console.log('[Migration] Disabling legacy system...');
    
    try {
      // 기존 스크립트 실행 엔진 비활성화
      const enginePath = 'scripts/modules/script-execution-engine.js';
      if (existsSync(enginePath)) {
        const backupPath = `${enginePath}.disabled`;
        await copyFile(enginePath, backupPath);
        await writeFile(enginePath, `// Legacy script execution engine disabled by migration
// Original file backed up to: ${backupPath}
// Use the new MCP pattern-based system instead

console.warn('Legacy script execution engine is disabled. Use the new MCP pattern-based system.');

export function executeScript() {
  throw new Error('Legacy script execution engine is disabled. Use the new MCP pattern-based system.');
}
`);
      }

      this.migrationLog.push({
        timestamp: new Date().toISOString(),
        action: 'legacy_system_disabled',
        message: 'Legacy script execution engine disabled'
      });

    } catch (error) {
      console.error('[Migration] Failed to disable legacy system:', error);
      throw error;
    }
  }

  /**
   * 새로운 시스템 활성화
   */
  async _enableNewSystem() {
    console.log('[Migration] Enabling new system...');
    
    try {
      // 새로운 시스템이 이미 어댑터를 통해 활성화됨
      // 여기서는 추가적인 활성화 단계를 수행할 수 있음
      
      this.migrationLog.push({
        timestamp: new Date().toISOString(),
        action: 'new_system_enabled',
        message: 'New MCP pattern-based system enabled'
      });

    } catch (error) {
      console.error('[Migration] Failed to enable new system:', error);
      throw error;
    }
  }

  /**
   * 마이그레이션 완료 표시
   */
  async _markMigrationComplete() {
    console.log('[Migration] Marking migration as complete...');
    
    try {
      const migrationInfo = {
        completed: true,
        completedAt: new Date().toISOString(),
        version: '1.0.0',
        system: 'mcp-pattern-based',
        migrationLog: this.migrationLog
      };

      const migrationPath = path.join(this.migrationDir, 'migration-complete.json');
      
      if (!existsSync(this.migrationDir)) {
        mkdirSync(this.migrationDir, { recursive: true });
      }

      await writeFile(migrationPath, JSON.stringify(migrationInfo, null, 2));

      this.migrationLog.push({
        timestamp: new Date().toISOString(),
        action: 'migration_marked_complete',
        migrationPath
      });

    } catch (error) {
      console.error('[Migration] Failed to mark migration as complete:', error);
      throw error;
    }
  }

  /**
   * 마이그레이션 검증
   */
  async _validateMigration() {
    console.log('[Migration] Validating migration...');
    
    try {
      const validationResults = {
        adapterStatus: null,
        systemStatus: null,
        functionality: null
      };

      // 어댑터 상태 검증
      const adapter = getTaskMasterAdapter();
      validationResults.adapterStatus = adapter.getAdaptationStatus();

      // 시스템 상태 검증
      const integrationManager = adapter.integrationManager;
      validationResults.systemStatus = integrationManager.getIntegrationStatus();

      // 기능 검증
      validationResults.functionality = await this._testFunctionality();

      const isValid = validationResults.adapterStatus.isAdapted &&
                     validationResults.systemStatus.initialized &&
                     validationResults.functionality.success;

      this.migrationLog.push({
        timestamp: new Date().toISOString(),
        action: 'migration_validated',
        results: validationResults,
        isValid
      });

      if (!isValid) {
        throw new Error('Migration validation failed');
      }

      console.log('[Migration] Migration validation successful');

    } catch (error) {
      console.error('[Migration] Migration validation failed:', error);
      throw error;
    }
  }

  /**
   * 기능 테스트
   */
  async _testFunctionality() {
    console.log('[Migration] Testing functionality...');
    
    try {
      const tests = {
        scriptExecution: false,
        analysis: false,
        status: false
      };

      // 스크립트 실행 테스트
      try {
        const adapter = getTaskMasterAdapter();
        const result = await adapter.integrationManager.executeScriptWithEvents('echo "test"', { timeout: 5000 });
        tests.scriptExecution = result && result.executionId;
      } catch (error) {
        console.warn('[Migration] Script execution test failed:', error.message);
      }

      // 상태 조회 테스트
      try {
        const adapter = getTaskMasterAdapter();
        const status = adapter.getAdaptationStatus();
        tests.status = status && status.isAdapted;
      } catch (error) {
        console.warn('[Migration] Status test failed:', error.message);
      }

      return {
        success: Object.values(tests).some(Boolean),
        tests
      };

    } catch (error) {
      console.error('[Migration] Functionality testing failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 롤백 수행
   */
  async rollback() {
    console.log('[Migration] Starting rollback...');
    
    try {
      // 1. 어댑터 롤백
      const adapter = getTaskMasterAdapter();
      const rollbackResult = await adapter.rollback();

      if (!rollbackResult.success) {
        throw new Error(`Adapter rollback failed: ${rollbackResult.error}`);
      }

      // 2. 백업에서 복원
      await this._restoreFromBackup();

      // 3. 마이그레이션 상태 초기화
      this.migrationStatus = {
        started: false,
        completed: false,
        failed: false,
        rollbackRequired: false
      };

      this.migrationLog.push({
        timestamp: new Date().toISOString(),
        action: 'rollback_completed',
        message: 'Rollback completed successfully'
      });

      console.log('[Migration] Rollback completed successfully');
      
      return {
        success: true,
        migrationLog: this.migrationLog
      };

    } catch (error) {
      console.error('[Migration] Rollback failed:', error);
      this.migrationLog.push({
        timestamp: new Date().toISOString(),
        action: 'rollback_failed',
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        migrationLog: this.migrationLog
      };
    }
  }

  /**
   * 백업에서 복원
   */
  async _restoreFromBackup() {
    console.log('[Migration] Restoring from backup...');
    
    try {
      // 가장 최근 백업 찾기
      const backupFiles = await this._findLatestBackup();
      
      if (!backupFiles) {
        throw new Error('No backup files found');
      }

      // 파일 복원
      for (const [originalPath, backupPath] of Object.entries(backupFiles)) {
        if (existsSync(backupPath)) {
          await copyFile(backupPath, originalPath);
          console.log(`[Migration] Restored: ${originalPath}`);
        }
      }

      this.migrationLog.push({
        timestamp: new Date().toISOString(),
        action: 'backup_restored',
        backupFiles: Object.keys(backupFiles)
      });

    } catch (error) {
      console.error('[Migration] Failed to restore from backup:', error);
      throw error;
    }
  }

  /**
   * 최신 백업 찾기
   */
  async _findLatestBackup() {
    try {
      if (!existsSync(this.backupDir)) {
        return null;
      }

      // 백업 디렉토리에서 가장 최근 백업 찾기
      const { readdir } = await import('fs/promises');
      const files = await readdir(this.backupDir);
      
      const backupPrefixes = files
        .filter(file => file.startsWith('script-execution-backup-'))
        .sort()
        .reverse();

      if (backupPrefixes.length === 0) {
        return null;
      }

      const latestPrefix = backupPrefixes[0].replace('.js', '');
      
      return {
        'scripts/modules/script-execution-engine.js': path.join(this.backupDir, `${latestPrefix}-engine.js`),
        'mcp-server/src/tools/run-script.js': path.join(this.backupDir, `${latestPrefix}-mcp-tools.js`),
        'mcp-server/src/core/direct-functions/run-script.js': path.join(this.backupDir, `${latestPrefix}-direct-functions.js`),
        '.taskmaster/config.json': path.join(this.backupDir, `${latestPrefix}-config.json`)
      };

    } catch (error) {
      console.error('[Migration] Failed to find latest backup:', error);
      return null;
    }
  }

  /**
   * 마이그레이션 상태 조회
   */
  getMigrationStatus() {
    return {
      status: this.migrationStatus,
      log: this.migrationLog,
      timestamp: new Date().toISOString()
    };
  }
}

// 싱글톤 인스턴스
let migrationInstance = null;

export function getMigrationManager() {
  if (!migrationInstance) {
    migrationInstance = new ScriptExecutionMigration();
  }
  return migrationInstance;
}

// 편의 함수들
export async function startScriptExecutionMigration(options = {}) {
  const manager = getMigrationManager();
  return await manager.startMigration(options);
}

export async function rollbackScriptExecutionMigration() {
  const manager = getMigrationManager();
  return await manager.rollback();
}

export function getScriptExecutionMigrationStatus() {
  const manager = getMigrationManager();
  return manager.getMigrationStatus();
}
