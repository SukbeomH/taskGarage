/**
 * list-script-results.js
 * 스크립트 실행 결과 목록 조회 직접 함수 래퍼
 * MCP 도구와 핵심 로직을 연결
 */

import { getAllScriptResults } from '../../../../scripts/modules/script-execution-engine.js';
import { readFile, readdir } from 'fs/promises';
import path from 'path';

/**
 * 스크립트 실행 결과 목록 조회 직접 함수
 * @param {Object} args - 조회 인수
 * @param {Object} log - 로거 객체
 * @param {Object} context - 컨텍스트 객체
 * @returns {Promise<Object>} 조회 결과
 */
export async function listScriptResultsDirect(args, log, context = {}) {
  const { session } = context;
  
  try {
    // 기본값 설정
    const limit = args.limit || 50;
    const offset = args.offset || 0;
    const status = args.status || 'all';

    log.info(`Listing script results with limit: ${limit}, offset: ${offset}, status: ${status}`);

    // 메모리에서 결과 조회
    const memoryResults = getAllScriptResults();
    
    // 파일 시스템에서 결과 조회
    let fileResults = [];
    try {
      const projectRoot = args.projectRoot || process.cwd();
      const resultsDir = path.join(projectRoot, '.taskmaster', 'script-results');
      const metadataPath = path.join(resultsDir, 'metadata.json');
      
      // 메타데이터 파일 읽기
      const metadataContent = await readFile(metadataPath, 'utf8');
      const metadata = JSON.parse(metadataContent);
      
      // 결과 파일들 읽기
      const files = await readdir(resultsDir);
      const resultFiles = files.filter(file => 
        file.endsWith('.json') && file !== 'metadata.json'
      );
      
      for (const file of resultFiles) {
        try {
          const resultPath = path.join(resultsDir, file);
          const resultContent = await readFile(resultPath, 'utf8');
          const fileResult = JSON.parse(resultContent);
          
          fileResults.push({
            id: fileResult.id,
            command: fileResult.command,
            workingDirectory: fileResult.workingDirectory,
            startTime: fileResult.startTime,
            endTime: fileResult.endTime,
            duration: fileResult.duration,
            exitCode: fileResult.exitCode,
            success: fileResult.success,
            savedAt: fileResult.savedAt,
            source: 'file'
          });
        } catch (fileError) {
          log.warn(`Could not read result file ${file}: ${fileError.message}`);
        }
      }
    } catch (fileError) {
      log.warn(`Could not read results directory: ${fileError.message}`);
    }

    // 메모리와 파일 결과 병합 (중복 제거)
    const allResults = [...memoryResults];
    
    for (const fileResult of fileResults) {
      const exists = allResults.find(r => r.id === fileResult.id);
      if (!exists) {
        allResults.push(fileResult);
      }
    }

    // 상태별 필터링
    let filteredResults = allResults;
    if (status !== 'all') {
      filteredResults = allResults.filter(result => {
        if (status === 'success') {
          return result.success === true;
        } else if (status === 'failure') {
          return result.success === false;
        }
        return true;
      });
    }

    // 정렬 (최신순)
    filteredResults.sort((a, b) => {
      const timeA = a.endTime || a.savedAt || 0;
      const timeB = b.endTime || b.savedAt || 0;
      return timeB - timeA;
    });

    // 페이지네이션
    const paginatedResults = filteredResults.slice(offset, offset + limit);

    // 결과 요약
    const summary = {
      total: filteredResults.length,
      limit,
      offset,
      status,
      results: paginatedResults.map(result => ({
        id: result.id,
        command: result.command,
        workingDirectory: result.workingDirectory,
        startTime: result.startTime,
        endTime: result.endTime,
        duration: result.duration,
        exitCode: result.exitCode,
        success: result.success,
        source: result.source || 'memory'
      }))
    };

    log.info(`Found ${summary.total} script results, returning ${summary.results.length}`);

    return {
      success: true,
      data: summary,
      fromCache: false
    };

  } catch (error) {
    log.error(`Script results listing failed: ${error.message}`);
    
    return {
      success: false,
      error: {
        code: 'SCRIPT_RESULTS_LIST_ERROR',
        message: error.message,
        details: error.stack
      },
      fromCache: false
    };
  }
}
