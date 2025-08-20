/**
 * run-script.js
 * 스크립트 실행 직접 함수 래퍼
 * MCP 도구와 핵심 로직을 연결
 */

import { executeScript } from '../../../../scripts/modules/script-execution-engine.js';
import { enableSilentMode, disableSilentMode } from '../../../../scripts/modules/utils.js';

/**
 * 스크립트 실행 직접 함수
 * @param {Object} args - 실행 인수
 * @param {Object} log - 로거 객체
 * @param {Object} context - 컨텍스트 객체
 * @returns {Promise<Object>} 실행 결과
 */
export async function runScriptDirect(args, log, context = {}) {
  const { session } = context;
  
  try {
    // 인수 검증
    if (!args.command) {
      throw new Error('Command is required');
    }

    // 실행 옵션 구성
    const options = {
      workingDirectory: args.workingDirectory || process.cwd(),
      timeout: args.timeout || 300000,
      shell: args.shell || false,
      encoding: args.encoding || 'utf8',
      maxBuffer: args.maxBuffer || 1024 * 1024,
      env: process.env
    };

    // 세션에서 환경 변수 가져오기 (있는 경우)
    if (session && session.env) {
      options.env = { ...process.env, ...session.env };
    }

    log.info(`Preparing to execute script: ${args.command}`);
    log.info(`Working directory: ${options.workingDirectory}`);
    log.info(`Timeout: ${options.timeout}ms`);

    // 무음 모드 활성화 (콘솔 출력 방지)
    enableSilentMode();
    
    try {
      // 스크립트 실행
      const result = await executeScript(args.command, options);
      
      log.info(`Script execution completed: ${result.id}`);
      log.info(`Exit code: ${result.exitCode}`);
      log.info(`Duration: ${result.duration}ms`);
      log.info(`Success: ${result.success}`);

      // 결과 반환
      return {
        success: true,
        data: {
          id: result.id,
          command: result.command,
          workingDirectory: result.workingDirectory,
          startTime: result.startTime,
          endTime: result.endTime,
          duration: result.duration,
          exitCode: result.exitCode,
          stdout: result.stdout,
          stderr: result.stderr,
          success: result.success,
          error: result.error ? result.error.message : null,
          metadata: result.metadata
        },
        fromCache: false
      };
    } finally {
      // 무음 모드 비활성화
      disableSilentMode();
    }

  } catch (error) {
    log.error(`Script execution failed: ${error.message}`);
    
    return {
      success: false,
      error: {
        code: 'SCRIPT_EXECUTION_ERROR',
        message: error.message,
        details: error.stack
      },
      fromCache: false
    };
  }
}
