/**
 * script-execution-engine.js
 * 스크립트 실행 및 결과 캡처 엔진
 * MCP Filesystem 서버 패턴을 참고하여 구현
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { log } from './utils.js';

/**
 * 스크립트 실행 결과 객체
 */
export class ScriptExecutionResult {
  constructor(options = {}) {
    this.id = options.id || null;
    this.command = options.command || '';
    this.workingDirectory = options.workingDirectory || '';
    this.startTime = options.startTime || null;
    this.endTime = options.endTime || null;
    this.duration = options.duration || null;
    this.exitCode = options.exitCode || null;
    this.stdout = options.stdout || '';
    this.stderr = options.stderr || '';
    this.success = options.success || false;
    this.error = options.error || null;
    this.metadata = options.metadata || {};
  }

  /**
   * 실행 시간 계산
   */
  calculateDuration() {
    if (this.startTime && this.endTime) {
      // startTime과 endTime이 숫자인 경우
      if (typeof this.startTime === 'number' && typeof this.endTime === 'number') {
        this.duration = this.endTime - this.startTime;
      } else {
        // Date 객체인 경우
        this.duration = this.endTime.getTime() - this.startTime.getTime();
      }
      return this.duration;
    }
    return 0;
  }

  /**
   * 성공 여부 판단
   */
  determineSuccess() {
    this.success = this.exitCode === 0 && !this.error;
    return this.success;
  }

  /**
   * 결과를 JSON으로 직렬화
   */
  toJSON() {
    return {
      id: this.id,
      command: this.command,
      workingDirectory: this.workingDirectory,
      startTime: this.startTime ? (typeof this.startTime === 'number' ? new Date(this.startTime).toISOString() : this.startTime.toISOString()) : null,
      endTime: this.endTime ? (typeof this.endTime === 'number' ? new Date(this.endTime).toISOString() : this.endTime.toISOString()) : null,
      duration: this.duration,
      exitCode: this.exitCode,
      stdout: this.stdout,
      stderr: this.stderr,
      success: this.success,
      error: this.error ? this.error.message : null,
      metadata: this.metadata
    };
  }
}

/**
 * 스크립트 실행 옵션
 */
export class ScriptExecutionOptions {
  constructor(options = {}) {
    this.workingDirectory = options.workingDirectory || process.cwd();
    this.timeout = options.timeout || 30000; // 30초 기본
    this.env = options.env || process.env;
    this.shell = options.shell || false;
    this.maxBuffer = options.maxBuffer || 1024 * 1024; // 1MB
    this.encoding = options.encoding || 'utf8';
    this.cwd = options.cwd || process.cwd();
    this.stdio = options.stdio || 'pipe';
  }
}

/**
 * 스크립트 실행 엔진
 */
export class ScriptExecutionEngine {
  constructor() {
    this.results = new Map();
    this.nextId = 1;
  }

  /**
   * 고유 ID 생성
   */
  generateId() {
    return `script_${String(this.nextId++).padStart(3, '0')}`;
  }



  /**
   * 스크립트 실행
   * @param {string} command - 실행할 명령어
   * @param {ScriptExecutionOptions} options - 실행 옵션
   * @returns {Promise<ScriptExecutionResult>} 실행 결과
   */
  async executeScript(command, options = {}) {
    const executionOptions = new ScriptExecutionOptions(options);
    const result = new ScriptExecutionResult();
    
    result.id = this.generateId();
    result.command = command;
    result.workingDirectory = executionOptions.workingDirectory;
    result.startTime = Date.now();

    log('info', `Executing script ${result.id}: ${command}`);

    try {
      // 명령어 파싱
      const [cmd, ...args] = this.parseCommand(command);
      
      // 프로세스 생성
      const childProcess = spawn(cmd, args, {
        cwd: executionOptions.workingDirectory,
        env: executionOptions.env,
        shell: executionOptions.shell,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // 타임아웃 설정
      const timeoutId = setTimeout(() => {
        childProcess.kill('SIGTERM');
        result.error = new Error(`Script execution timed out after ${executionOptions.timeout}ms`);
      }, executionOptions.timeout);

      // stdout 캡처
      childProcess.stdout.on('data', (data) => {
        result.stdout += data.toString(executionOptions.encoding);
      });

      // stderr 캡처
      childProcess.stderr.on('data', (data) => {
        result.stderr += data.toString(executionOptions.encoding);
      });

      // 프로세스 종료 대기
      await new Promise((resolve, reject) => {
        childProcess.on('close', (code) => {
          clearTimeout(timeoutId);
          result.exitCode = code;
          resolve();
        });

        childProcess.on('error', (error) => {
          clearTimeout(timeoutId);
          result.error = error;
          reject(error);
        });
      });

    } catch (error) {
      result.error = error;
      log('error', `Script execution failed: ${error.message}`);
    } finally {
      result.endTime = Date.now();
      result.calculateDuration();
      result.determineSuccess();
      
      // 결과 저장
      this.results.set(result.id, result);
      
      log('info', `Script ${result.id} completed with exit code ${result.exitCode} in ${result.duration}ms`);
    }

    return result;
  }

  /**
   * 명령어 파싱
   * @param {string} command - 파싱할 명령어
   * @returns {Array} 파싱된 명령어 배열
   */
  parseCommand(command) {
    // 간단한 공백 기반 파싱 (따옴표 처리 필요시 개선)
    return command.trim().split(/\s+/);
  }

  /**
   * 실행 결과 조회
   * @param {string} id - 결과 ID
   * @returns {ScriptExecutionResult|null} 실행 결과
   */
  getResult(id) {
    return this.results.get(id) || null;
  }

  /**
   * 모든 결과 조회
   * @returns {Array<ScriptExecutionResult>} 모든 실행 결과
   */
  getAllResults() {
    return Array.from(this.results.values());
  }

  /**
   * 결과 삭제
   * @param {string} id - 결과 ID
   * @returns {boolean} 삭제 성공 여부
   */
  deleteResult(id) {
    return this.results.delete(id);
  }

  /**
   * 모든 결과 삭제
   */
  clearResults() {
    this.results.clear();
  }
}

/**
 * 스크립트 실행 결과 저장기
 */
export class ScriptResultStorage {
  constructor(directory = '.taskmaster/script-results') {
    this.directory = directory;
  }

  /**
   * 저장 디렉토리 생성
   */
  async ensureDirectory() {
    try {
      await mkdir(this.directory, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * 실행 결과 저장
   * @param {ScriptExecutionResult} result - 저장할 결과
   * @returns {Promise<string>} 저장된 파일 경로
   */
  async saveResult(result) {
    await this.ensureDirectory();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${result.id}_${timestamp}.json`;
    const filepath = path.join(this.directory, filename);
    
    const data = {
      ...result.toJSON(),
      savedAt: new Date().toISOString()
    };
    
    await writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');
    
    log('info', `Script result saved to: ${filepath}`);
    return filepath;
  }

  /**
   * 메타데이터 파일 업데이트
   * @param {ScriptExecutionResult} result - 업데이트할 결과
   */
  async updateMetadata(result) {
    await this.ensureDirectory();
    
    const metadataPath = path.join(this.directory, 'metadata.json');
    let metadata = {};
    
    try {
      const existingData = await import('fs/promises').then(fs => 
        fs.readFile(metadataPath, 'utf8')
      );
      metadata = JSON.parse(existingData);
    } catch (error) {
      // 파일이 없거나 읽기 실패시 새로 생성
    }
    
    metadata[result.id] = {
      command: result.command,
      startTime: result.startTime,
      endTime: result.endTime,
      duration: result.duration,
      exitCode: result.exitCode,
      success: result.success,
      workingDirectory: result.workingDirectory
    };
    
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
  }
}

/**
 * 실시간 실행 상태 모니터링 클래스
 */
export class ScriptExecutionMonitor {
  constructor() {
    this.activeExecutions = new Map(); // 실행 중인 스크립트 추적
    this.executionHistory = []; // 실행 히스토리
    this.maxHistorySize = 100; // 최대 히스토리 크기
  }

  /**
   * 실행 시작 추적
   * @param {string} scriptId - 스크립트 ID
   * @param {string} command - 실행 명령어
   * @param {Object} options - 실행 옵션
   */
  startExecution(scriptId, command, options = {}) {
    const executionInfo = {
      id: scriptId,
      command,
      options,
      startTime: Date.now(),
      status: 'running',
      progress: 0
    };

    this.activeExecutions.set(scriptId, executionInfo);
    this.addToHistory(executionInfo);
    
    log('info', `Script execution started: ${scriptId} - ${command}`);
  }

  /**
   * 실행 완료 추적
   * @param {string} scriptId - 스크립트 ID
   * @param {Object} result - 실행 결과
   */
  completeExecution(scriptId, result) {
    const executionInfo = this.activeExecutions.get(scriptId);
    if (executionInfo) {
      executionInfo.status = 'completed';
      executionInfo.endTime = Date.now();
      executionInfo.duration = executionInfo.endTime - executionInfo.startTime;
      executionInfo.result = result;
      executionInfo.progress = 100;

      this.activeExecutions.delete(scriptId);
      this.updateHistory(scriptId, executionInfo);
      
      log('info', `Script execution completed: ${scriptId} - Duration: ${executionInfo.duration}ms`);
    }
  }

  /**
   * 실행 실패 추적
   * @param {string} scriptId - 스크립트 ID
   * @param {Error} error - 에러 정보
   */
  failExecution(scriptId, error) {
    const executionInfo = this.activeExecutions.get(scriptId);
    if (executionInfo) {
      executionInfo.status = 'failed';
      executionInfo.endTime = Date.now();
      executionInfo.duration = executionInfo.endTime - executionInfo.startTime;
      executionInfo.error = error.message;
      executionInfo.progress = 100;

      this.activeExecutions.delete(scriptId);
      this.updateHistory(scriptId, executionInfo);
      
      log('error', `Script execution failed: ${scriptId} - ${error.message}`);
    }
  }

  /**
   * 실행 진행률 업데이트
   * @param {string} scriptId - 스크립트 ID
   * @param {number} progress - 진행률 (0-100)
   */
  updateProgress(scriptId, progress) {
    const executionInfo = this.activeExecutions.get(scriptId);
    if (executionInfo) {
      executionInfo.progress = Math.min(100, Math.max(0, progress));
      log('debug', `Script execution progress: ${scriptId} - ${executionInfo.progress}%`);
    }
  }

  /**
   * 활성 실행 목록 조회
   * @returns {Array} 활성 실행 목록
   */
  getActiveExecutions() {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * 실행 히스토리 조회
   * @param {number} limit - 조회할 개수
   * @returns {Array} 실행 히스토리
   */
  getExecutionHistory(limit = 20) {
    return this.executionHistory.slice(-limit);
  }

  /**
   * 특정 스크립트 실행 상태 조회
   * @param {string} scriptId - 스크립트 ID
   * @returns {Object|null} 실행 상태 정보
   */
  getExecutionStatus(scriptId) {
    return this.activeExecutions.get(scriptId) || null;
  }

  /**
   * 히스토리에 추가
   * @param {Object} executionInfo - 실행 정보
   */
  addToHistory(executionInfo) {
    this.executionHistory.push(executionInfo);
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.shift();
    }
  }

  /**
   * 히스토리 업데이트
   * @param {string} scriptId - 스크립트 ID
   * @param {Object} updatedInfo - 업데이트된 정보
   */
  updateHistory(scriptId, updatedInfo) {
    const index = this.executionHistory.findIndex(item => item.id === scriptId);
    if (index !== -1) {
      this.executionHistory[index] = { ...this.executionHistory[index], ...updatedInfo };
    }
  }

  /**
   * 모든 활성 실행 정리
   */
  clearActiveExecutions() {
    this.activeExecutions.clear();
    log('info', 'All active script executions cleared');
  }

  /**
   * 히스토리 정리
   */
  clearHistory() {
    this.executionHistory = [];
    log('info', 'Script execution history cleared');
  }
}

// 기본 인스턴스 생성
export const scriptEngine = new ScriptExecutionEngine();
export const resultStorage = new ScriptResultStorage();
export const executionMonitor = new ScriptExecutionMonitor();

/**
 * 스크립트 실행 함수 (편의용)
 * @param {string} command - 실행할 명령어
 * @param {Object} options - 실행 옵션
 * @returns {Promise<ScriptExecutionResult>} 실행 결과
 */
export async function executeScript(command, options = {}) {
  // 실행 시작 모니터링
  const scriptId = scriptEngine.generateId();
  executionMonitor.startExecution(scriptId, command, options);
  
  try {
    const result = await scriptEngine.executeScript(command, options);
    
    // 결과 저장
    await resultStorage.saveResult(result);
    await resultStorage.updateMetadata(result);
    
    // 실행 완료 모니터링
    executionMonitor.completeExecution(scriptId, result);
    
    return result;
  } catch (error) {
    // 실행 실패 모니터링
    executionMonitor.failExecution(scriptId, error);
    throw error;
  }
}

/**
 * 스크립트 실행 결과 조회 함수 (편의용)
 * @param {string} id - 결과 ID
 * @returns {ScriptExecutionResult|null} 실행 결과
 */
export function getScriptResult(id) {
  return scriptEngine.getResult(id);
}

/**
 * 모든 스크립트 실행 결과 조회 함수 (편의용)
 * @returns {Array<ScriptExecutionResult>} 모든 실행 결과
 */
export function getAllScriptResults() {
  return scriptEngine.getAllResults();
}

/**
 * 활성 실행 목록 조회 함수 (편의용)
 * @returns {Array} 활성 실행 목록
 */
export function getActiveExecutions() {
  return executionMonitor.getActiveExecutions();
}

/**
 * 실행 히스토리 조회 함수 (편의용)
 * @param {number} limit - 조회할 개수
 * @returns {Array} 실행 히스토리
 */
export function getExecutionHistory(limit = 20) {
  return executionMonitor.getExecutionHistory(limit);
}

/**
 * 특정 스크립트 실행 상태 조회 함수 (편의용)
 * @param {string} scriptId - 스크립트 ID
 * @returns {Object|null} 실행 상태 정보
 */
export function getExecutionStatus(scriptId) {
  return executionMonitor.getExecutionStatus(scriptId);
}
