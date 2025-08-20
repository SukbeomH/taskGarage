/**
 * resources.js
 * 스크립트 실행 관련 읽기 전용 리소스들
 * MCP Filesystem 서버 패턴을 따라 구현
 */

import { mcpResource, registerResource } from './decorators.js';
import { readFile, readdir, stat } from 'fs/promises';
import path from 'path';
import { z } from 'zod';

/**
 * 스크립트 실행 결과 조회 리소스
 */
export class ScriptExecutionResources {
  constructor(baseDir = process.cwd()) {
    this.baseDir = baseDir;
    this.resultsDir = path.join(baseDir, '.taskmaster', 'script-results');
  }

  /**
   * 스크립트 실행 결과 목록 조회
   */
  @mcpResource({
    name: 'list_script_results',
    description: '모든 스크립트 실행 결과 목록을 조회합니다. MCP Filesystem 서버 패턴을 참고하여 구현되었습니다.',
    input: {
      limit: 'number (기본값: 50)',
      offset: 'number (기본값: 0)',
      status: 'string (success, failure, all) (기본값: all)'
    },
    output: {
      results: 'array',
      total: 'number',
      limit: 'number',
      offset: 'number'
    },
    category: 'script-execution',
    tags: ['script', 'results', 'list']
  })
  async listScriptResults(args = {}) {
    const { limit = 50, offset = 0, status = 'all' } = args;
    
    try {
      // 결과 디렉토리 확인
      const resultsDir = this.resultsDir;
      const dirExists = await this._checkDirectoryExists(resultsDir);
      
      if (!dirExists) {
        return {
          results: [],
          total: 0,
          limit,
          offset
        };
      }

      // 결과 파일 목록 조회
      const files = await readdir(resultsDir);
      const resultFiles = files.filter(file => file.endsWith('.json'));
      
      // 파일 정보 수집
      const results = [];
      for (const file of resultFiles) {
        try {
          const filePath = path.join(resultsDir, file);
          const content = await readFile(filePath, 'utf8');
          const result = JSON.parse(content);
          
          // 상태 필터링
          if (status !== 'all' && result.success !== (status === 'success')) {
            continue;
          }
          
          results.push({
            id: path.basename(file, '.json'),
            ...result,
            filePath
          });
        } catch (error) {
          console.warn(`Failed to read result file ${file}:`, error.message);
        }
      }

      // 정렬 (최신순)
      results.sort((a, b) => {
        const timeA = new Date(a.startTime || 0).getTime();
        const timeB = new Date(b.startTime || 0).getTime();
        return timeB - timeA;
      });

      // 페이지네이션
      const total = results.length;
      const paginatedResults = results.slice(offset, offset + limit);

      return {
        results: paginatedResults,
        total,
        limit,
        offset
      };
    } catch (error) {
      throw new Error(`Failed to list script results: ${error.message}`);
    }
  }

  /**
   * 특정 스크립트 실행 결과 조회
   */
  @mcpResource({
    name: 'get_script_result',
    description: '특정 스크립트 실행 결과를 조회합니다. MCP Filesystem 서버 패턴을 참고하여 구현되었습니다.',
    input: {
      id: 'string (조회할 스크립트 실행 결과의 ID)'
    },
    output: {
      result: 'object',
      exists: 'boolean'
    },
    category: 'script-execution',
    tags: ['script', 'result', 'get']
  })
  async getScriptResult(args) {
    const { id } = args;
    
    if (!id) {
      throw new Error('Script result ID is required');
    }

    try {
      const filePath = path.join(this.resultsDir, `${id}.json`);
      
      // 파일 존재 확인
      const exists = await this._checkFileExists(filePath);
      
      if (!exists) {
        return {
          result: null,
          exists: false
        };
      }

      // 파일 읽기
      const content = await readFile(filePath, 'utf8');
      const result = JSON.parse(content);

      return {
        result: {
          id,
          ...result,
          filePath
        },
        exists: true
      };
    } catch (error) {
      throw new Error(`Failed to get script result ${id}: ${error.message}`);
    }
  }

  /**
   * 스크립트 실행 통계 조회
   */
  @mcpResource({
    name: 'get_script_statistics',
    description: '스크립트 실행 통계 정보를 조회합니다.',
    input: {
      timeRange: 'string (1h, 24h, 7d, 30d, all) (기본값: all)'
    },
    output: {
      total: 'number',
      success: 'number',
      failure: 'number',
      averageDuration: 'number',
      successRate: 'number',
      recentExecutions: 'array'
    },
    category: 'script-execution',
    tags: ['script', 'statistics', 'analytics']
  })
  async getScriptStatistics(args = {}) {
    const { timeRange = 'all' } = args;
    
    try {
      // 모든 결과 조회
      const allResults = await this.listScriptResults({ limit: 1000, offset: 0, status: 'all' });
      
      // 시간 범위 필터링
      const now = Date.now();
      const timeRangeMs = this._getTimeRangeMs(timeRange);
      
      const filteredResults = allResults.results.filter(result => {
        if (timeRange === 'all') return true;
        
        const resultTime = new Date(result.startTime || 0).getTime();
        return (now - resultTime) <= timeRangeMs;
      });

      // 통계 계산
      const total = filteredResults.length;
      const success = filteredResults.filter(r => r.success).length;
      const failure = total - success;
      const successRate = total > 0 ? (success / total) * 100 : 0;
      
      // 평균 실행 시간 계산
      const durations = filteredResults
        .filter(r => r.duration && typeof r.duration === 'number')
        .map(r => r.duration);
      
      const averageDuration = durations.length > 0 
        ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length 
        : 0;

      // 최근 실행 목록 (최대 10개)
      const recentExecutions = filteredResults
        .sort((a, b) => new Date(b.startTime || 0) - new Date(a.startTime || 0))
        .slice(0, 10)
        .map(result => ({
          id: result.id,
          command: result.command,
          success: result.success,
          duration: result.duration,
          startTime: result.startTime,
          exitCode: result.exitCode
        }));

      return {
        total,
        success,
        failure,
        averageDuration: Math.round(averageDuration),
        successRate: Math.round(successRate * 100) / 100,
        recentExecutions
      };
    } catch (error) {
      throw new Error(`Failed to get script statistics: ${error.message}`);
    }
  }

  /**
   * 스크립트 실행 로그 조회
   */
  @mcpResource({
    name: 'get_script_logs',
    description: '스크립트 실행 로그를 조회합니다.',
    input: {
      id: 'string (스크립트 실행 결과 ID)',
      type: 'string (stdout, stderr, all) (기본값: all)',
      maxLines: 'number (최대 라인 수, 기본값: 100)'
    },
    output: {
      logs: 'object',
      exists: 'boolean'
    },
    category: 'script-execution',
    tags: ['script', 'logs', 'output']
  })
  async getScriptLogs(args) {
    const { id, type = 'all', maxLines = 100 } = args;
    
    if (!id) {
      throw new Error('Script result ID is required');
    }

    try {
      const result = await this.getScriptResult({ id });
      
      if (!result.exists) {
        return {
          logs: null,
          exists: false
        };
      }

      const scriptResult = result.result;
      const logs = {};

      // stdout 로그 처리
      if (type === 'all' || type === 'stdout') {
        if (scriptResult.stdout) {
          logs.stdout = this._truncateLines(scriptResult.stdout, maxLines);
        }
      }

      // stderr 로그 처리
      if (type === 'all' || type === 'stderr') {
        if (scriptResult.stderr) {
          logs.stderr = this._truncateLines(scriptResult.stderr, maxLines);
        }
      }

      return {
        logs,
        exists: true
      };
    } catch (error) {
      throw new Error(`Failed to get script logs for ${id}: ${error.message}`);
    }
  }

  /**
   * 스크립트 실행 환경 정보 조회
   */
  @mcpResource({
    name: 'get_script_environment',
    description: '스크립트 실행 환경 정보를 조회합니다.',
    input: {},
    output: {
      environment: 'object',
      system: 'object'
    },
    category: 'script-execution',
    tags: ['script', 'environment', 'system']
  })
  async getScriptEnvironment() {
    try {
      const environment = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cwd: process.cwd(),
        baseDir: this.baseDir,
        resultsDir: this.resultsDir,
        env: {
          NODE_ENV: process.env.NODE_ENV,
          PATH: process.env.PATH ? '***' : undefined, // 보안상 마스킹
          HOME: process.env.HOME,
          USER: process.env.USER
        }
      };

      const system = {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        pid: process.pid,
        title: process.title
      };

      return {
        environment,
        system
      };
    } catch (error) {
      throw new Error(`Failed to get script environment: ${error.message}`);
    }
  }

  // 헬퍼 메서드들
  async _checkDirectoryExists(dirPath) {
    try {
      const stats = await stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  async _checkFileExists(filePath) {
    try {
      const stats = await stat(filePath);
      return stats.isFile();
    } catch {
      return false;
    }
  }

  _getTimeRangeMs(timeRange) {
    const ranges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    return ranges[timeRange] || 0;
  }

  _truncateLines(text, maxLines) {
    if (!text) return '';
    
    const lines = text.split('\n');
    if (lines.length <= maxLines) return text;
    
    return lines.slice(0, maxLines).join('\n') + `\n... (truncated, showing ${maxLines} of ${lines.length} lines)`;
  }
}

// 함수형 등록 방식 (데코레이터를 사용하지 않는 경우)
export function registerScriptExecutionResources(baseDir = process.cwd()) {
  const resources = new ScriptExecutionResources(baseDir);
  
  // 리소스들을 수동으로 등록
  registerResource('list_script_results', {
    name: 'list_script_results',
    description: '모든 스크립트 실행 결과 목록을 조회합니다.',
    input: {
      limit: 'number (기본값: 50)',
      offset: 'number (기본값: 0)',
      status: 'string (success, failure, all) (기본값: all)'
    },
    output: {
      results: 'array',
      total: 'number',
      limit: 'number',
      offset: 'number'
    },
    category: 'script-execution',
    tags: ['script', 'results', 'list']
  }, resources.listScriptResults.bind(resources));

  registerResource('get_script_result', {
    name: 'get_script_result',
    description: '특정 스크립트 실행 결과를 조회합니다.',
    input: {
      id: 'string (조회할 스크립트 실행 결과의 ID)'
    },
    output: {
      result: 'object',
      exists: 'boolean'
    },
    category: 'script-execution',
    tags: ['script', 'result', 'get']
  }, resources.getScriptResult.bind(resources));

  registerResource('get_script_statistics', {
    name: 'get_script_statistics',
    description: '스크립트 실행 통계 정보를 조회합니다.',
    input: {
      timeRange: 'string (1h, 24h, 7d, 30d, all) (기본값: all)'
    },
    output: {
      total: 'number',
      success: 'number',
      failure: 'number',
      averageDuration: 'number',
      successRate: 'number',
      recentExecutions: 'array'
    },
    category: 'script-execution',
    tags: ['script', 'statistics', 'analytics']
  }, resources.getScriptStatistics.bind(resources));

  registerResource('get_script_logs', {
    name: 'get_script_logs',
    description: '스크립트 실행 로그를 조회합니다.',
    input: {
      id: 'string (스크립트 실행 결과 ID)',
      type: 'string (stdout, stderr, all) (기본값: all)',
      maxLines: 'number (최대 라인 수, 기본값: 100)'
    },
    output: {
      logs: 'object',
      exists: 'boolean'
    },
    category: 'script-execution',
    tags: ['script', 'logs', 'output']
  }, resources.getScriptLogs.bind(resources));

  registerResource('get_script_environment', {
    name: 'get_script_environment',
    description: '스크립트 실행 환경 정보를 조회합니다.',
    input: {},
    output: {
      environment: 'object',
      system: 'object'
    },
    category: 'script-execution',
    tags: ['script', 'environment', 'system']
  }, resources.getScriptEnvironment.bind(resources));

  return resources;
}
