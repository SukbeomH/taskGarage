/**
 * tools.js
 * 스크립트 실행 관련 액션 실행 도구들
 * MCP Filesystem 서버 패턴을 따라 구현
 */

import { mcpTool, registerTool } from './decorators.js';
import { spawn } from 'child_process';
import { writeFile, mkdir, readFile, readdir, unlink } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { TimeManager } from './time-manager.js';
import { SecurityManager } from './security-manager.js';

/**
 * 스크립트 실행 도구들
 */
export class ScriptExecutionTools {
  constructor(baseDir = process.cwd()) {
    this.baseDir = baseDir;
    this.resultsDir = path.join(baseDir, '.taskmaster', 'script-results');
    this.timeManager = new TimeManager();
    this.securityManager = new SecurityManager(baseDir);
    this.ensureResultsDirectory();
  }

  /**
   * 스크립트 실행 도구
   */
  @mcpTool({
    name: 'run_script',
    description: '터미널 스크립트를 실행하고 결과를 캡처하여 저장합니다. MCP Filesystem 서버 패턴을 참고하여 구현되었습니다.',
    input: {
      command: 'string (실행할 명령어)',
      workingDirectory: 'string (작업 디렉토리, 기본값: 현재 디렉토리)',
      timeout: 'number (실행 타임아웃, 밀리초, 기본값: 300000)',
      shell: 'boolean (쉘을 통해 실행할지 여부, 기본값: false)',
      encoding: 'string (출력 인코딩, 기본값: utf8)',
      maxBuffer: 'number (최대 버퍼 크기, 바이트, 기본값: 1048576)'
    },
    output: {
      id: 'string (스크립트 실행 결과 ID)',
      success: 'boolean (실행 성공 여부)',
      exitCode: 'number (종료 코드)',
      duration: 'number (실행 시간, 밀리초)',
      stdout: 'string (표준 출력)',
      stderr: 'string (표준 에러)',
      error: 'string (에러 메시지, 있는 경우)'
    },
    category: 'script-execution',
    tags: ['script', 'execute', 'run'],
    timeout: 300000, // 5분
    retry: {
      maxAttempts: 1,
      backoff: 'exponential'
    }
  })
  async runScript(args) {
    const {
      command,
      workingDirectory = process.cwd(),
      timeout = 300000,
      shell = false,
      encoding = 'utf8',
      maxBuffer = 1024 * 1024
    } = args;

    if (!command) {
      throw new Error('Command is required');
    }

    const id = uuidv4();
    const startTime = Date.now();
    const startTimestamp = await this.timeManager.getCurrentTimestamp();
    
    try {
      // 보안 검증: 작업 디렉토리
      const workingDirValidation = await this.securityManager.validatePathSecurity({
        targetPath: workingDirectory,
        operation: 'execute'
      });

      if (!workingDirValidation.isValid || !workingDirValidation.isAllowed) {
        throw new Error(`Security validation failed for working directory: ${workingDirValidation.securityChecks.join(', ')}`);
      }

      // 결과 디렉토리 확인
      await this.ensureResultsDirectory();

      // 스크립트 실행
      const result = await this._executeScript(command, {
        workingDirectory,
        timeout,
        shell,
        encoding,
        maxBuffer,
        env: process.env
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      const endTimestamp = await this.timeManager.getCurrentTimestamp();

      // 결과 객체 생성
      const scriptResult = {
        id,
        command,
        workingDirectory,
        startTime: startTimestamp.timestamp,
        endTime: endTimestamp.timestamp,
        duration,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        success: result.exitCode === 0,
        error: result.error ? result.error.message : null,
        metadata: {
          platform: process.platform,
          nodeVersion: process.version,
          startTimestamp: startTimestamp,
          endTimestamp: endTimestamp,
          timezone: startTimestamp.timezone
        }
      };

      // 보안 검증: 결과 파일 저장 경로
      const resultPathValidation = await this.securityManager.validatePathSecurity({
        targetPath: path.join(this.resultsDir, `${id}.json`),
        operation: 'write'
      });

      if (!resultPathValidation.isValid || !resultPathValidation.isAllowed) {
        throw new Error(`Security validation failed for result file path: ${resultPathValidation.securityChecks.join(', ')}`);
      }

      // 결과 저장
      await this._saveScriptResult(id, scriptResult);

      return {
        id,
        success: scriptResult.success,
        exitCode: scriptResult.exitCode,
        duration: scriptResult.duration,
        stdout: scriptResult.stdout,
        stderr: scriptResult.stderr,
        error: scriptResult.error
      };
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const endTimestamp = await this.timeManager.getCurrentTimestamp();

      // 에러 결과 저장
      const errorResult = {
        id,
        command,
        workingDirectory,
        startTime: startTimestamp.timestamp,
        endTime: endTimestamp.timestamp,
        duration,
        exitCode: null,
        stdout: '',
        stderr: '',
        success: false,
        error: error.message,
        metadata: {
          platform: process.platform,
          nodeVersion: process.version,
          startTimestamp: startTimestamp,
          endTimestamp: endTimestamp,
          timezone: startTimestamp.timezone
        }
      };

      // 보안 검증: 에러 결과 파일 저장 경로
      const errorPathValidation = await this.securityManager.validatePathSecurity({
        targetPath: path.join(this.resultsDir, `${id}.json`),
        operation: 'write'
      });

      if (errorPathValidation.isValid && errorPathValidation.isAllowed) {
        await this._saveScriptResult(id, errorResult);
      }

      throw error;
    }
  }

  /**
   * 스크립트 실행 결과 분석 도구
   */
  @mcpTool({
    name: 'analyze_script_result',
    description: '스크립트 실행 결과를 분석하고 인사이트를 제공합니다. MCP Filesystem 서버 패턴을 참고하여 구현되었습니다.',
    input: {
      scriptResultId: 'string (분석할 스크립트 실행 결과의 ID)',
      analysisType: 'string (분석 타입: basic, detailed, ai, comprehensive) (기본값: comprehensive)',
      enableAI: 'boolean (AI 분석 활성화 여부, 기본값: true)',
      context: 'string (분석 컨텍스트 정보)'
    },
    output: {
      analysis: 'object (분석 결과)',
      insights: 'array (인사이트 목록)',
      recommendations: 'array (권장사항 목록)',
      success: 'boolean (분석 성공 여부)'
    },
    category: 'script-execution',
    tags: ['script', 'analyze', 'insights'],
    timeout: 60000, // 1분
    retry: {
      maxAttempts: 2,
      backoff: 'exponential'
    }
  })
  async analyzeScriptResult(args) {
    const {
      scriptResultId,
      analysisType = 'comprehensive',
      enableAI = true,
      context = ''
    } = args;

    if (!scriptResultId) {
      throw new Error('Script result ID is required');
    }

    try {
      // 보안 검증: 스크립트 결과 파일 경로
      const resultPathValidation = await this.securityManager.validatePathSecurity({
        targetPath: path.join(this.resultsDir, `${scriptResultId}.json`),
        operation: 'read'
      });

      if (!resultPathValidation.isValid || !resultPathValidation.isAllowed) {
        throw new Error(`Security validation failed for script result path: ${resultPathValidation.securityChecks.join(', ')}`);
      }

      // 스크립트 결과 조회
      const result = await this._getScriptResult(scriptResultId);
      if (!result) {
        throw new Error(`Script result ${scriptResultId} not found`);
      }

      // 분석 수행
      const analysis = await this._performAnalysis(result, analysisType, enableAI, context);

      // 보안 검증: 분석 결과 파일 저장 경로
      const analysisPathValidation = await this.securityManager.validatePathSecurity({
        targetPath: path.join(this.resultsDir, `${scriptResultId}_analysis_${Date.now()}.json`),
        operation: 'write'
      });

      if (!analysisPathValidation.isValid || !analysisPathValidation.isAllowed) {
        throw new Error(`Security validation failed for analysis result path: ${analysisPathValidation.securityChecks.join(', ')}`);
      }

      // 분석 결과 저장
      const analysisId = `${scriptResultId}_analysis_${Date.now()}`;
      await this._saveAnalysisResult(analysisId, {
        scriptResultId,
        analysisType,
        enableAI,
        context,
        analysis,
        timestamp: new Date().toISOString()
      });

      return {
        analysis: analysis.summary,
        insights: analysis.insights,
        recommendations: analysis.recommendations,
        success: true
      };
    } catch (error) {
      return {
        analysis: null,
        insights: [],
        recommendations: [],
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 스크립트 실행 보고서 생성 도구
   */
  @mcpTool({
    name: 'create_script_report',
    description: '스크립트 실행 결과를 다양한 형식(마크다운, HTML, JSON)으로 보고서를 생성합니다. MCP Filesystem 서버 패턴을 참고하여 구현되었습니다.',
    input: {
      scriptResultId: 'string (보고서를 생성할 스크립트 실행 결과의 ID)',
      analysisResultId: 'string (분석 결과 ID, 선택사항)',
      format: 'string (보고서 형식: markdown, html, json) (기본값: markdown)',
      template: 'string (보고서 템플릿, 기본값: default)',
      outputPath: 'string (보고서 파일 저장 경로, 선택사항)',
      includeDetails: 'boolean (상세 정보 포함 여부, 기본값: true)',
      includeAnalysis: 'boolean (분석 결과 포함 여부, 기본값: true)',
      includeRecommendations: 'boolean (권장사항 포함 여부, 기본값: true)',
      includeNextSteps: 'boolean (다음 단계 포함 여부, 기본값: true)'
    },
    output: {
      reportId: 'string (생성된 보고서 ID)',
      reportPath: 'string (보고서 파일 경로)',
      format: 'string (보고서 형식)',
      success: 'boolean (생성 성공 여부)'
    },
    category: 'script-execution',
    tags: ['script', 'report', 'generate'],
    timeout: 120000, // 2분
    retry: {
      maxAttempts: 1,
      backoff: 'exponential'
    }
  })
  async createScriptReport(args) {
    const {
      scriptResultId,
      analysisResultId,
      format = 'markdown',
      template = 'default',
      outputPath,
      includeDetails = true,
      includeAnalysis = true,
      includeRecommendations = true,
      includeNextSteps = true
    } = args;

    if (!scriptResultId) {
      throw new Error('Script result ID is required');
    }

    try {
      // 스크립트 결과 조회
      const scriptResult = await this._getScriptResult(scriptResultId);
      if (!scriptResult) {
        throw new Error(`Script result ${scriptResultId} not found`);
      }

      // 분석 결과 조회 (있는 경우)
      let analysisResult = null;
      if (analysisResultId) {
        analysisResult = await this._getAnalysisResult(analysisResultId);
      }

      // 보안 검증: 보고서 파일 저장 경로
      const reportId = `${scriptResultId}_report_${Date.now()}`;
      const reportPath = outputPath || path.join(this.resultsDir, `${reportId}.${format}`);
      
      const reportPathValidation = await this.securityManager.validatePathSecurity({
        targetPath: reportPath,
        operation: 'write'
      });

      if (!reportPathValidation.isValid || !reportPathValidation.isAllowed) {
        throw new Error(`Security validation failed for report path: ${reportPathValidation.securityChecks.join(', ')}`);
      }

      // 보고서 생성
      const report = await this._generateReport({
        scriptResult,
        analysisResult,
        format,
        template,
        includeDetails,
        includeAnalysis,
        includeRecommendations,
        includeNextSteps
      });

      // 보고서 저장
      await writeFile(reportPath, report.content, 'utf8');

      // 보고서 메타데이터 저장
      await this._saveReportMetadata(reportId, {
        scriptResultId,
        analysisResultId,
        format,
        template,
        reportPath,
        includeDetails,
        includeAnalysis,
        includeRecommendations,
        includeNextSteps,
        timestamp: new Date().toISOString()
      });

      return {
        reportId,
        reportPath,
        format,
        success: true
      };
    } catch (error) {
      return {
        reportId: null,
        reportPath: null,
        format,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 스크립트 실행 결과 정리 도구
   */
  @mcpTool({
    name: 'cleanup_script_results',
    description: '오래된 스크립트 실행 결과를 정리합니다.',
    input: {
      maxAge: 'number (최대 보관 기간, 일, 기본값: 30)',
      dryRun: 'boolean (실제 삭제하지 않고 미리보기, 기본값: true)',
      keepSuccessful: 'boolean (성공한 결과 보관 여부, 기본값: true)',
      keepFailed: 'boolean (실패한 결과 보관 여부, 기본값: false)'
    },
    output: {
      cleanedCount: 'number (정리된 결과 수)',
      keptCount: 'number (보관된 결과 수)',
      freedSpace: 'number (해제된 공간, 바이트)',
      success: 'boolean (정리 성공 여부)'
    },
    category: 'script-execution',
    tags: ['script', 'cleanup', 'maintenance'],
    timeout: 300000, // 5분
    retry: {
      maxAttempts: 1,
      backoff: 'exponential'
    }
  })
  async cleanupScriptResults(args) {
    const {
      maxAge = 30,
      dryRun = true,
      keepSuccessful = true,
      keepFailed = false
    } = args;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAge);

      // 모든 결과 파일 조회
      const files = await this._listResultFiles();
      let cleanedCount = 0;
      let keptCount = 0;
      let freedSpace = 0;

      for (const file of files) {
        try {
          const result = await this._getScriptResult(file.id);
          if (!result) continue;

          const resultDate = new Date(result.startTime);
          const shouldCleanup = resultDate < cutoffDate;

          if (shouldCleanup) {
            // 정리 조건 확인
            const shouldDelete = (result.success && !keepSuccessful) || 
                               (!result.success && !keepFailed);

            if (shouldDelete) {
              if (!dryRun) {
                await this._deleteScriptResult(file.id);
                freedSpace += file.size || 0;
              }
              cleanedCount++;
            } else {
              keptCount++;
            }
          } else {
            keptCount++;
          }
        } catch (error) {
          console.warn(`Failed to process result file ${file.id}:`, error.message);
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
  async ensureResultsDirectory() {
    try {
      await mkdir(this.resultsDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  async _executeScript(command, options) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, [], {
        ...options,
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';
      let error = null;

      child.stdout.on('data', (data) => {
        stdout += data.toString(options.encoding || 'utf8');
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString(options.encoding || 'utf8');
      });

      child.on('error', (err) => {
        error = err;
      });

      child.on('close', (code) => {
        resolve({
          exitCode: code,
          stdout,
          stderr,
          error
        });
      });

      // 타임아웃 처리
      if (options.timeout) {
        setTimeout(() => {
          child.kill('SIGTERM');
          reject(new Error(`Script execution timed out after ${options.timeout}ms`));
        }, options.timeout);
      }
    });
  }

  async _saveScriptResult(id, result) {
    const filePath = path.join(this.resultsDir, `${id}.json`);
    await writeFile(filePath, JSON.stringify(result, null, 2), 'utf8');
  }

  async _getScriptResult(id) {
    try {
      const filePath = path.join(this.resultsDir, `${id}.json`);
      const content = await readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async _performAnalysis(result, type, enableAI, context) {
    // 기본 분석
    const analysis = {
      summary: {
        success: result.success,
        duration: result.duration,
        exitCode: result.exitCode,
        command: result.command
      },
      insights: [],
      recommendations: []
    };

    // 성능 분석
    if (result.duration > 30000) {
      analysis.insights.push('스크립트 실행 시간이 30초를 초과했습니다.');
      analysis.recommendations.push('스크립트 최적화를 고려해보세요.');
    }

    // 에러 분석
    if (!result.success) {
      analysis.insights.push('스크립트 실행이 실패했습니다.');
      if (result.stderr) {
        analysis.insights.push(`에러 메시지: ${result.stderr.substring(0, 200)}...`);
      }
      analysis.recommendations.push('명령어 구문과 권한을 확인해보세요.');
    }

    // 출력 분석
    if (result.stdout && result.stdout.length > 1000) {
      analysis.insights.push('스크립트가 대량의 출력을 생성했습니다.');
      analysis.recommendations.push('출력 필터링을 고려해보세요.');
    }

    return analysis;
  }

  async _saveAnalysisResult(id, analysis) {
    const filePath = path.join(this.resultsDir, `${id}.json`);
    await writeFile(filePath, JSON.stringify(analysis, null, 2), 'utf8');
  }

  async _getAnalysisResult(id) {
    try {
      const filePath = path.join(this.resultsDir, `${id}.json`);
      const content = await readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async _generateReport(options) {
    const { format, scriptResult, analysisResult } = options;
    
    let content = '';
    
    if (format === 'markdown') {
      content = this._generateMarkdownReport(options);
    } else if (format === 'html') {
      content = this._generateHtmlReport(options);
    } else if (format === 'json') {
      content = JSON.stringify({
        scriptResult,
        analysisResult,
        timestamp: new Date().toISOString()
      }, null, 2);
    }

    return { content };
  }

  _generateMarkdownReport(options) {
    const { scriptResult, analysisResult, includeDetails, includeAnalysis } = options;
    
    let report = `# 스크립트 실행 보고서\n\n`;
    report += `**명령어:** ${scriptResult.command}\n`;
    report += `**실행 시간:** ${new Date(scriptResult.startTime).toLocaleString()}\n`;
    report += `**상태:** ${scriptResult.success ? '✅ 성공' : '❌ 실패'}\n`;
    report += `**실행 시간:** ${scriptResult.duration}ms\n`;
    report += `**종료 코드:** ${scriptResult.exitCode}\n\n`;

    if (includeDetails) {
      report += `## 상세 정보\n\n`;
      if (scriptResult.stdout) {
        report += `### 표준 출력\n\`\`\`\n${scriptResult.stdout}\n\`\`\`\n\n`;
      }
      if (scriptResult.stderr) {
        report += `### 표준 에러\n\`\`\`\n${scriptResult.stderr}\n\`\`\`\n\n`;
      }
    }

    if (includeAnalysis && analysisResult) {
      report += `## 분석 결과\n\n`;
      if (analysisResult.insights.length > 0) {
        report += `### 인사이트\n`;
        analysisResult.insights.forEach(insight => {
          report += `- ${insight}\n`;
        });
        report += `\n`;
      }
      if (analysisResult.recommendations.length > 0) {
        report += `### 권장사항\n`;
        analysisResult.recommendations.forEach(rec => {
          report += `- ${rec}\n`;
        });
        report += `\n`;
      }
    }

    return report;
  }

  _generateHtmlReport(options) {
    const { scriptResult, analysisResult, includeDetails, includeAnalysis } = options;
    
    let report = `<!DOCTYPE html>
<html>
<head>
    <title>스크립트 실행 보고서</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .success { color: green; }
        .failure { color: red; }
        .code { background: #f5f5f5; padding: 10px; border-radius: 5px; font-family: monospace; }
    </style>
</head>
<body>
    <h1>스크립트 실행 보고서</h1>
    <p><strong>명령어:</strong> ${scriptResult.command}</p>
    <p><strong>실행 시간:</strong> ${new Date(scriptResult.startTime).toLocaleString()}</p>
    <p><strong>상태:</strong> <span class="${scriptResult.success ? 'success' : 'failure'}">${scriptResult.success ? '✅ 성공' : '❌ 실패'}</span></p>
    <p><strong>실행 시간:</strong> ${scriptResult.duration}ms</p>
    <p><strong>종료 코드:</strong> ${scriptResult.exitCode}</p>`;

    if (includeDetails) {
      if (scriptResult.stdout) {
        report += `<h2>표준 출력</h2><div class="code">${scriptResult.stdout.replace(/\n/g, '<br>')}</div>`;
      }
      if (scriptResult.stderr) {
        report += `<h2>표준 에러</h2><div class="code">${scriptResult.stderr.replace(/\n/g, '<br>')}</div>`;
      }
    }

    if (includeAnalysis && analysisResult) {
      report += `<h2>분석 결과</h2>`;
      if (analysisResult.insights.length > 0) {
        report += `<h3>인사이트</h3><ul>`;
        analysisResult.insights.forEach(insight => {
          report += `<li>${insight}</li>`;
        });
        report += `</ul>`;
      }
      if (analysisResult.recommendations.length > 0) {
        report += `<h3>권장사항</h3><ul>`;
        analysisResult.recommendations.forEach(rec => {
          report += `<li>${rec}</li>`;
        });
        report += `</ul>`;
      }
    }

    report += `</body></html>`;
    return report;
  }

  async _saveReportMetadata(id, metadata) {
    const filePath = path.join(this.resultsDir, `${id}_metadata.json`);
    await writeFile(filePath, JSON.stringify(metadata, null, 2), 'utf8');
  }

  async _listResultFiles() {
    try {
      const files = await readdir(this.resultsDir);
      return files
        .filter(file => file.endsWith('.json') && !file.includes('_metadata'))
        .map(file => ({
          id: path.basename(file, '.json'),
          name: file
        }));
    } catch {
      return [];
    }
  }

  async _deleteScriptResult(id) {
    try {
      const filePath = path.join(this.resultsDir, `${id}.json`);
      await unlink(filePath);
    } catch (error) {
      console.warn(`Failed to delete script result ${id}:`, error.message);
    }
  }
}

// 함수형 등록 방식 (데코레이터를 사용하지 않는 경우)
export function registerScriptExecutionTools(baseDir = process.cwd()) {
  const tools = new ScriptExecutionTools(baseDir);
  
  // 도구들을 수동으로 등록
  registerTool('run_script', {
    name: 'run_script',
    description: '터미널 스크립트를 실행하고 결과를 캡처하여 저장합니다.',
    input: {
      command: 'string (실행할 명령어)',
      workingDirectory: 'string (작업 디렉토리, 기본값: 현재 디렉토리)',
      timeout: 'number (실행 타임아웃, 밀리초, 기본값: 300000)',
      shell: 'boolean (쉘을 통해 실행할지 여부, 기본값: false)',
      encoding: 'string (출력 인코딩, 기본값: utf8)',
      maxBuffer: 'number (최대 버퍼 크기, 바이트, 기본값: 1048576)'
    },
    output: {
      id: 'string (스크립트 실행 결과 ID)',
      success: 'boolean (실행 성공 여부)',
      exitCode: 'number (종료 코드)',
      duration: 'number (실행 시간, 밀리초)',
      stdout: 'string (표준 출력)',
      stderr: 'string (표준 에러)',
      error: 'string (에러 메시지, 있는 경우)'
    },
    category: 'script-execution',
    tags: ['script', 'execute', 'run'],
    timeout: 300000,
    retry: {
      maxAttempts: 1,
      backoff: 'exponential'
    }
  }, tools.runScript.bind(tools));

  registerTool('analyze_script_result', {
    name: 'analyze_script_result',
    description: '스크립트 실행 결과를 분석하고 인사이트를 제공합니다.',
    input: {
      scriptResultId: 'string (분석할 스크립트 실행 결과의 ID)',
      analysisType: 'string (분석 타입: basic, detailed, ai, comprehensive) (기본값: comprehensive)',
      enableAI: 'boolean (AI 분석 활성화 여부, 기본값: true)',
      context: 'string (분석 컨텍스트 정보)'
    },
    output: {
      analysis: 'object (분석 결과)',
      insights: 'array (인사이트 목록)',
      recommendations: 'array (권장사항 목록)',
      success: 'boolean (분석 성공 여부)'
    },
    category: 'script-execution',
    tags: ['script', 'analyze', 'insights'],
    timeout: 60000,
    retry: {
      maxAttempts: 2,
      backoff: 'exponential'
    }
  }, tools.analyzeScriptResult.bind(tools));

  registerTool('create_script_report', {
    name: 'create_script_report',
    description: '스크립트 실행 결과를 다양한 형식으로 보고서를 생성합니다.',
    input: {
      scriptResultId: 'string (보고서를 생성할 스크립트 실행 결과의 ID)',
      analysisResultId: 'string (분석 결과 ID, 선택사항)',
      format: 'string (보고서 형식: markdown, html, json) (기본값: markdown)',
      template: 'string (보고서 템플릿, 기본값: default)',
      outputPath: 'string (보고서 파일 저장 경로, 선택사항)',
      includeDetails: 'boolean (상세 정보 포함 여부, 기본값: true)',
      includeAnalysis: 'boolean (분석 결과 포함 여부, 기본값: true)',
      includeRecommendations: 'boolean (권장사항 포함 여부, 기본값: true)',
      includeNextSteps: 'boolean (다음 단계 포함 여부, 기본값: true)'
    },
    output: {
      reportId: 'string (생성된 보고서 ID)',
      reportPath: 'string (보고서 파일 경로)',
      format: 'string (보고서 형식)',
      success: 'boolean (생성 성공 여부)'
    },
    category: 'script-execution',
    tags: ['script', 'report', 'generate'],
    timeout: 120000,
    retry: {
      maxAttempts: 1,
      backoff: 'exponential'
    }
  }, tools.createScriptReport.bind(tools));

  registerTool('cleanup_script_results', {
    name: 'cleanup_script_results',
    description: '오래된 스크립트 실행 결과를 정리합니다.',
    input: {
      maxAge: 'number (최대 보관 기간, 일, 기본값: 30)',
      dryRun: 'boolean (실제 삭제하지 않고 미리보기, 기본값: true)',
      keepSuccessful: 'boolean (성공한 결과 보관 여부, 기본값: true)',
      keepFailed: 'boolean (실패한 결과 보관 여부, 기본값: false)'
    },
    output: {
      cleanedCount: 'number (정리된 결과 수)',
      keptCount: 'number (보관된 결과 수)',
      freedSpace: 'number (해제된 공간, 바이트)',
      success: 'boolean (정리 성공 여부)'
    },
    category: 'script-execution',
    tags: ['script', 'cleanup', 'maintenance'],
    timeout: 300000,
    retry: {
      maxAttempts: 1,
      backoff: 'exponential'
    }
  }, tools.cleanupScriptResults.bind(tools));

  return tools;
}
