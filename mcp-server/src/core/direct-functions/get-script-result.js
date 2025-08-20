/**
 * get-script-result.js
 * 스크립트 실행 결과 조회 직접 함수 래퍼
 * MCP 도구와 핵심 로직을 연결
 */

import { getScriptResult, getAllScriptResults } from '../../../../scripts/modules/script-execution-engine.js';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * 스크립트 실행 결과 조회 직접 함수
 * @param {Object} args - 조회 인수
 * @param {Object} log - 로거 객체
 * @param {Object} context - 컨텍스트 객체
 * @returns {Promise<Object>} 조회 결과
 */
export async function getScriptResultDirect(args, log, context = {}) {
  const { session } = context;
  
  try {
    // 인수 검증
    if (!args.id) {
      throw new Error('Script result ID is required');
    }

    log.info(`Looking up script result: ${args.id}`);

    // 메모리에서 결과 조회
    const result = getScriptResult(args.id);
    
    if (!result) {
      // 파일 시스템에서 결과 조회 시도
      try {
        const projectRoot = args.projectRoot || process.cwd();
        const resultsDir = path.join(projectRoot, '.taskmaster', 'script-results');
        const metadataPath = path.join(resultsDir, 'metadata.json');
        
        // 메타데이터 파일 읽기
        const metadataContent = await readFile(metadataPath, 'utf8');
        const metadata = JSON.parse(metadataContent);
        
        if (metadata[args.id]) {
          // 결과 파일 찾기
          const files = await import('fs/promises').then(fs => 
            fs.readdir(resultsDir)
          );
          
          const resultFile = files.find(file => 
            file.startsWith(args.id) && file.endsWith('.json')
          );
          
          if (resultFile) {
            const resultPath = path.join(resultsDir, resultFile);
            const resultContent = await readFile(resultPath, 'utf8');
            const fileResult = JSON.parse(resultContent);
            
            log.info(`Script result loaded from file: ${resultPath}`);
            
            return {
              success: true,
              data: {
                id: fileResult.id,
                command: fileResult.command,
                workingDirectory: fileResult.workingDirectory,
                startTime: fileResult.startTime,
                endTime: fileResult.endTime,
                duration: fileResult.duration,
                exitCode: fileResult.exitCode,
                stdout: fileResult.stdout,
                stderr: fileResult.stderr,
                success: fileResult.success,
                error: fileResult.error,
                metadata: fileResult.metadata,
                savedAt: fileResult.savedAt,
                source: 'file'
              },
              fromCache: false
            };
          }
        }
      } catch (fileError) {
        log.warn(`Could not load result from file: ${fileError.message}`);
      }
      
      throw new Error(`Script result not found: ${args.id}`);
    }

    log.info(`Script result found in memory: ${args.id}`);

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
        metadata: result.metadata,
        source: 'memory'
      },
      fromCache: false
    };

  } catch (error) {
    log.error(`Script result lookup failed: ${error.message}`);
    
    return {
      success: false,
      error: {
        code: 'SCRIPT_RESULT_NOT_FOUND',
        message: error.message,
        details: error.stack
      },
      fromCache: false
    };
  }
}
