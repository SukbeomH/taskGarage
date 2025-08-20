/**
 * script-workflow.test.js
 * 스크립트 실행 및 분석 워크플로우 통합 테스트
 * 스크립트 실행 → 결과 저장 → 분석 → 보고서 생성 전체 워크플로우 검증
 */

import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

import {
  ScriptExecutionEngine,
  ScriptResultStorage,
  executeScript,
  getScriptResult,
  getAllScriptResults
} from '../../scripts/modules/script-execution-engine.js';
import {
  ScriptAnalysisEngine,
  analyzeScriptResult,
  getBasicAnalysis,
  getDetailedAnalysis,
  getAIAnalysis,
  getAnalysis
} from '../../scripts/modules/script-analysis-engine.js';
import {
  ReportGenerator,
  generateScriptReport,
  getSupportedReportFormats,
  getSupportedReportTemplates
} from '../../scripts/modules/script-report-engine.js';
import {
  sampleSuccessfulScriptResult,
  sampleFailedScriptResult,
  sampleTimeoutScriptResult,
  sampleLargeOutputScriptResult,
  sampleErrorOutputScriptResult,
  sampleWarningScriptResult,
  allScriptResultSamples
} from '../fixtures/sample-script-results.js';
import {
  sampleBasicAnalysisSuccess,
  sampleDetailedAnalysisSuccess,
  sampleAIAnalysisSuccess,
  sampleComprehensiveAnalysisSuccess,
  allAnalysisResultSamples
} from '../fixtures/sample-analysis-results.js';
import {
  sampleMarkdownReportSuccess,
  sampleHTMLReportSuccess,
  sampleJSONReportSuccess,
  allReportSamples
} from '../fixtures/sample-reports.js';
import {
  setupTestEnvironment,
  createTempDir,
  cleanupTempDir,
  validateScriptResult,
  validateAnalysisResult,
  validateReport
} from '../utils/test-helpers.js';

// 모킹 설정
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  readFile: jest.fn()
}));

jest.mock('../../scripts/modules/ai-services-unified.js', () => ({
  generateTextService: jest.fn()
}));

// 테스트 환경 설정
setupTestEnvironment();

describe('Script Execution and Analysis Workflow Integration', () => {
  let tempDir;
  let scriptResultsDir;
  let analysisResultsDir;
  let reportResultsDir;
  let executionEngine;
  let resultStorage;
  let analysisEngine;
  let reportGenerator;

  beforeEach(async () => {
    tempDir = await createTempDir();
    scriptResultsDir = path.join(tempDir, '.taskmaster', 'script-results');
    analysisResultsDir = path.join(tempDir, '.taskmaster', 'analysis-results');
    reportResultsDir = path.join(tempDir, '.taskmaster', 'reports');

    // 디렉토리 생성
    await fs.promises.mkdir(scriptResultsDir, { recursive: true });
    await fs.promises.mkdir(analysisResultsDir, { recursive: true });
    await fs.promises.mkdir(reportResultsDir, { recursive: true });

    // 엔진 초기화
    executionEngine = new ScriptExecutionEngine();
    resultStorage = new ScriptResultStorage(scriptResultsDir);
    analysisEngine = new ScriptAnalysisEngine();
    reportGenerator = new ReportGenerator();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
    jest.clearAllMocks();
  });

  describe('성공적인 워크플로우 시나리오', () => {
    it('should complete full workflow: execute → save → analyze → report (successful script)', async () => {
      // 1. 스크립트 실행
      const command = 'ls -la';
      const options = {
        workingDirectory: tempDir,
        timeout: 30000,
        shell: false,
        encoding: 'utf8',
        maxBuffer: 1048576
      };

      // 실제 스크립트 실행 모킹
      const mockProcess = {
        stdout: { on: jest.fn(), pipe: jest.fn() },
        stderr: { on: jest.fn(), pipe: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 100);
          }
          return mockProcess;
        })
      };

      spawn.mockReturnValue(mockProcess);

      const scriptResult = await executeScript(command, options);
      
      expect(scriptResult).toBeDefined();
      expect(scriptResult.command).toBe(command);
      expect(scriptResult.workingDirectory).toBe(tempDir);
      expect(scriptResult.success).toBe(true);
      expect(scriptResult.exitCode).toBe(0);

      // 2. 결과 저장
      const savedResult = await resultStorage.saveResult(scriptResult);
      expect(savedResult).toBeDefined();
      expect(savedResult.id).toBe(scriptResult.id);
      expect(savedResult.savedAt).toBeDefined();

      // 3. 결과 조회
      const retrievedResult = getScriptResult(scriptResult.id);
      expect(retrievedResult).toBeDefined();
      expect(retrievedResult.id).toBe(scriptResult.id);
      expect(retrievedResult.command).toBe(command);

      // 4. 기본 분석
      const basicAnalysis = getBasicAnalysis(retrievedResult);
      expect(basicAnalysis).toBeDefined();
      expect(basicAnalysis.success).toBe(true);
      expect(basicAnalysis.executionTime).toBeGreaterThan(0);

      // 5. 상세 분석
      const detailedAnalysis = getDetailedAnalysis(retrievedResult);
      expect(detailedAnalysis).toBeDefined();
      expect(detailedAnalysis.errorPatterns).toBeDefined();
      expect(detailedAnalysis.warningPatterns).toBeDefined();
      expect(detailedAnalysis.outputTypes).toBeDefined();

      // 6. 종합 분석
      const comprehensiveAnalysis = await analyzeScriptResult(retrievedResult, {
        enableAI: false,
        context: 'Integration test workflow'
      });
      expect(comprehensiveAnalysis).toBeDefined();
      expect(comprehensiveAnalysis.scriptResultId).toBe(scriptResult.id);
      expect(comprehensiveAnalysis.analysisType).toBe('comprehensive');

      // 7. 분석 결과 저장
      const savedAnalysis = await analysisEngine.saveAnalysis(comprehensiveAnalysis);
      expect(savedAnalysis).toBeDefined();
      expect(savedAnalysis.id).toBe(comprehensiveAnalysis.id);

      // 8. 보고서 생성 (마크다운)
      const reportOptions = {
        format: 'markdown',
        template: 'default',
        outputPath: path.join(reportResultsDir, 'workflow-report.md'),
        includeDetails: true,
        includeAnalysis: true,
        includeRecommendations: true,
        includeNextSteps: true,
        metadata: {
          generatedBy: 'integration-test',
          workflow: 'successful-script'
        }
      };

      const markdownReport = await generateScriptReport(
        retrievedResult,
        comprehensiveAnalysis,
        reportOptions
      );
      expect(markdownReport).toBeDefined();
      expect(markdownReport).toContain('Script Execution Report');
      expect(markdownReport).toContain(command);
      expect(markdownReport).toContain('Analysis Results');

      // 9. 보고서 저장
      const reportPath = path.join(reportResultsDir, 'workflow-report.md');
      await fs.promises.writeFile(reportPath, markdownReport);
      
      const savedReport = await fs.promises.readFile(reportPath, 'utf8');
      expect(savedReport).toBe(markdownReport);

      // 10. 워크플로우 검증
      const allResults = getAllScriptResults();
      expect(allResults).toContainEqual(expect.objectContaining({
        id: scriptResult.id,
        command: command
      }));

      const allAnalyses = analysisEngine.getAllAnalyses();
      expect(allAnalyses).toContainEqual(expect.objectContaining({
        id: comprehensiveAnalysis.id,
        scriptResultId: scriptResult.id
      }));
    });

    it('should complete full workflow: execute → save → analyze → report (failed script)', async () => {
      // 1. 실패하는 스크립트 실행
      const command = 'invalid-command-that-fails';
      const options = {
        workingDirectory: tempDir,
        timeout: 30000,
        shell: false,
        encoding: 'utf8',
        maxBuffer: 1048576
      };

      // 실패하는 스크립트 모킹
      const mockProcess = {
        stdout: { on: jest.fn(), pipe: jest.fn() },
        stderr: { on: jest.fn(), pipe: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(1), 100);
          }
          return mockProcess;
        })
      };

      spawn.mockReturnValue(mockProcess);

      const scriptResult = await executeScript(command, options);
      
      expect(scriptResult).toBeDefined();
      expect(scriptResult.command).toBe(command);
      expect(scriptResult.success).toBe(false);
      expect(scriptResult.exitCode).toBe(1);

      // 2. 결과 저장
      await resultStorage.saveResult(scriptResult);

      // 3. 결과 조회
      const retrievedResult = getScriptResult(scriptResult.id);
      expect(retrievedResult.success).toBe(false);

      // 4. 기본 분석
      const basicAnalysis = getBasicAnalysis(retrievedResult);
      expect(basicAnalysis.success).toBe(false);
      expect(basicAnalysis.executionTime).toBeGreaterThan(0);

      // 5. 상세 분석
      const detailedAnalysis = getDetailedAnalysis(retrievedResult);
      expect(detailedAnalysis.errorPatterns.length).toBeGreaterThan(0);

      // 6. 종합 분석
      const comprehensiveAnalysis = await analyzeScriptResult(retrievedResult, {
        enableAI: false,
        context: 'Integration test workflow - failed script'
      });
      expect(comprehensiveAnalysis.analysisType).toBe('comprehensive');

      // 7. 분석 결과 저장
      await analysisEngine.saveAnalysis(comprehensiveAnalysis);

      // 8. 보고서 생성 (HTML)
      const reportOptions = {
        format: 'html',
        template: 'default',
        outputPath: path.join(reportResultsDir, 'failed-workflow-report.html'),
        includeDetails: true,
        includeAnalysis: true,
        includeRecommendations: true,
        includeNextSteps: true,
        metadata: {
          generatedBy: 'integration-test',
          workflow: 'failed-script'
        }
      };

      const htmlReport = await generateScriptReport(
        retrievedResult,
        comprehensiveAnalysis,
        reportOptions
      );
      expect(htmlReport).toBeDefined();
      expect(htmlReport).toContain('<html>');
      expect(htmlReport).toContain('Script Execution Report');
      expect(htmlReport).toContain(command);

      // 9. 보고서 저장
      const reportPath = path.join(reportResultsDir, 'failed-workflow-report.html');
      await fs.promises.writeFile(reportPath, htmlReport);
      
      const savedReport = await fs.promises.readFile(reportPath, 'utf8');
      expect(savedReport).toBe(htmlReport);
    });

    it('should complete full workflow with AI analysis enabled', async () => {
      // AI 서비스 모킹
      const { generateTextService } = await import('../../scripts/modules/ai-services-unified.js');
      generateTextService.mockResolvedValue({
        mainResult: 'AI analysis insights: The script executed successfully with no errors detected.',
        telemetryData: {
          timestamp: new Date().toISOString(),
          modelUsed: 'test-model',
          inputTokens: 100,
          outputTokens: 50,
          totalCost: 0.001
        }
      });

      // 1. 스크립트 실행
      const command = 'echo "test output"';
      const scriptResult = await executeScript(command, {
        workingDirectory: tempDir,
        timeout: 30000
      });

      expect(scriptResult.success).toBe(true);

      // 2. 결과 저장
      await resultStorage.saveResult(scriptResult);

      // 3. AI 분석 포함 종합 분석
      const comprehensiveAnalysis = await analyzeScriptResult(scriptResult, {
        enableAI: true,
        context: 'AI-enabled integration test'
      });

      expect(comprehensiveAnalysis).toBeDefined();
      expect(comprehensiveAnalysis.details.ai).toBeDefined();
      expect(comprehensiveAnalysis.details.ai.insights).toContain('AI analysis insights');

      // 4. 분석 결과 저장
      await analysisEngine.saveAnalysis(comprehensiveAnalysis);

      // 5. AI 분석이 포함된 보고서 생성
      const reportOptions = {
        format: 'markdown',
        template: 'detailed',
        includeDetails: true,
        includeAnalysis: true,
        includeRecommendations: true,
        includeNextSteps: true,
        metadata: {
          generatedBy: 'integration-test',
          workflow: 'ai-enabled'
        }
      };

      const report = await generateScriptReport(
        scriptResult,
        comprehensiveAnalysis,
        reportOptions
      );

      expect(report).toContain('AI Analysis');
      expect(report).toContain('AI analysis insights');
    });
  });

  describe('에러 처리 워크플로우 시나리오', () => {
    it('should handle script execution timeout gracefully', async () => {
      // 타임아웃 스크립트 모킹
      const mockProcess = {
        stdout: { on: jest.fn(), pipe: jest.fn() },
        stderr: { on: jest.fn(), pipe: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            // 타임아웃 시뮬레이션
            setTimeout(() => callback(null), 100);
          }
          return mockProcess;
        }),
        kill: jest.fn()
      };

      spawn.mockReturnValue(mockProcess);

      const command = 'sleep 100';
      const options = {
        workingDirectory: tempDir,
        timeout: 1000, // 짧은 타임아웃
        shell: false
      };

      const scriptResult = await executeScript(command, options);
      
      expect(scriptResult).toBeDefined();
      expect(scriptResult.error).toBeDefined();
      expect(scriptResult.error.message).toContain('timeout');

      // 결과 저장 및 분석 진행
      await resultStorage.saveResult(scriptResult);
      const retrievedResult = getScriptResult(scriptResult.id);
      
      const basicAnalysis = getBasicAnalysis(retrievedResult);
      expect(basicAnalysis.success).toBe(false);

      const comprehensiveAnalysis = await analyzeScriptResult(retrievedResult, {
        enableAI: false,
        context: 'Timeout error workflow'
      });

      expect(comprehensiveAnalysis.details.basic.success).toBe(false);
      expect(comprehensiveAnalysis.recommendations).toContain('timeout');
    });

    it('should handle large output scripts correctly', async () => {
      // 대용량 출력 스크립트 모킹
      const largeOutput = 'x'.repeat(2000000); // 2MB 출력
      const mockProcess = {
        stdout: { 
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback(largeOutput);
            }
            if (event === 'end') {
              callback();
            }
          }), 
          pipe: jest.fn() 
        },
        stderr: { on: jest.fn(), pipe: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 100);
          }
          return mockProcess;
        })
      };

      spawn.mockReturnValue(mockProcess);

      const command = 'generate-large-output';
      const options = {
        workingDirectory: tempDir,
        maxBuffer: 1048576, // 1MB 버퍼
        timeout: 30000
      };

      const scriptResult = await executeScript(command, options);
      
      expect(scriptResult).toBeDefined();
      expect(scriptResult.stdout.length).toBeGreaterThan(1000000);

      // 결과 저장
      await resultStorage.saveResult(scriptResult);

      // 상세 분석에서 대용량 출력 처리 확인
      const retrievedResult = getScriptResult(scriptResult.id);
      const detailedAnalysis = getDetailedAnalysis(retrievedResult);
      
      expect(detailedAnalysis.outputTypes.largeOutput).toBe(true);
      expect(detailedAnalysis.optimizationOpportunities).toContain('large output');

      // 보고서 생성 (요약 템플릿 사용)
      const comprehensiveAnalysis = await analyzeScriptResult(retrievedResult, {
        enableAI: false,
        context: 'Large output workflow'
      });

      const reportOptions = {
        format: 'markdown',
        template: 'summary',
        includeDetails: false, // 상세 정보 제외
        includeAnalysis: true,
        includeRecommendations: true,
        includeNextSteps: true
      };

      const report = await generateScriptReport(
        retrievedResult,
        comprehensiveAnalysis,
        reportOptions
      );

      expect(report).toContain('Large Output Detected');
      expect(report).toContain('Optimization Recommendations');
    });

    it('should handle permission errors and security issues', async () => {
      // 권한 오류 스크립트 모킹
      const mockProcess = {
        stdout: { on: jest.fn(), pipe: jest.fn() },
        stderr: { 
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback('Permission denied: /root/system-file');
            }
            if (event === 'end') {
              callback();
            }
          }), 
          pipe: jest.fn() 
        },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(1), 100);
          }
          return mockProcess;
        })
      };

      spawn.mockReturnValue(mockProcess);

      const command = 'sudo rm -rf /root/system-file';
      const options = {
        workingDirectory: tempDir,
        timeout: 30000
      };

      const scriptResult = await executeScript(command, options);
      
      expect(scriptResult).toBeDefined();
      expect(scriptResult.success).toBe(false);
      expect(scriptResult.stderr).toContain('Permission denied');

      // 결과 저장
      await resultStorage.saveResult(scriptResult);

      // 상세 분석에서 보안 이슈 감지 확인
      const retrievedResult = getScriptResult(scriptResult.id);
      const detailedAnalysis = getDetailedAnalysis(retrievedResult);
      
      expect(detailedAnalysis.securityIssues.length).toBeGreaterThan(0);
      expect(detailedAnalysis.securityIssues).toContain('permission');

      // 종합 분석
      const comprehensiveAnalysis = await analyzeScriptResult(retrievedResult, {
        enableAI: false,
        context: 'Security workflow'
      });

      expect(comprehensiveAnalysis.recommendations).toContain('security');
      expect(comprehensiveAnalysis.recommendations).toContain('permission');

      // 보안 보고서 생성
      const reportOptions = {
        format: 'json',
        template: 'security',
        includeDetails: true,
        includeAnalysis: true,
        includeRecommendations: true,
        includeNextSteps: true
      };

      const report = await generateScriptReport(
        retrievedResult,
        comprehensiveAnalysis,
        reportOptions
      );

      const reportData = JSON.parse(report);
      expect(reportData.securityIssues).toBeDefined();
      expect(reportData.recommendations).toContain('security');
    });
  });

  describe('경계값 및 특수 케이스 워크플로우', () => {
    it('should handle empty output scripts', async () => {
      // 빈 출력 스크립트 모킹
      const mockProcess = {
        stdout: { on: jest.fn(), pipe: jest.fn() },
        stderr: { on: jest.fn(), pipe: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 100);
          }
          return mockProcess;
        })
      };

      spawn.mockReturnValue(mockProcess);

      const command = 'echo ""';
      const scriptResult = await executeScript(command, { workingDirectory: tempDir });
      
      expect(scriptResult.stdout).toBe('');
      expect(scriptResult.success).toBe(true);

      // 결과 저장 및 분석
      await resultStorage.saveResult(scriptResult);
      const retrievedResult = getScriptResult(scriptResult.id);
      
      const detailedAnalysis = getDetailedAnalysis(retrievedResult);
      expect(detailedAnalysis.outputTypes.emptyOutput).toBe(true);

      const comprehensiveAnalysis = await analyzeScriptResult(retrievedResult, {
        enableAI: false,
        context: 'Empty output workflow'
      });

      expect(comprehensiveAnalysis.summary).toContain('empty output');
    });

    it('should handle scripts with special characters in output', async () => {
      // 특수 문자 출력 스크립트 모킹
      const specialOutput = 'Special chars: éñüß日本語한글🚀\n\t\r\b';
      const mockProcess = {
        stdout: { 
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback(specialOutput);
            }
            if (event === 'end') {
              callback();
            }
          }), 
          pipe: jest.fn() 
        },
        stderr: { on: jest.fn(), pipe: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 100);
          }
          return mockProcess;
        })
      };

      spawn.mockReturnValue(mockProcess);

      const command = 'echo "Special chars: éñüß日本語한글🚀"';
      const scriptResult = await executeScript(command, { workingDirectory: tempDir });
      
      expect(scriptResult.stdout).toContain('éñüß');
      expect(scriptResult.stdout).toContain('日本語');
      expect(scriptResult.stdout).toContain('한글');
      expect(scriptResult.stdout).toContain('🚀');

      // 결과 저장 및 분석
      await resultStorage.saveResult(scriptResult);
      const retrievedResult = getScriptResult(scriptResult.id);
      
      const detailedAnalysis = getDetailedAnalysis(retrievedResult);
      expect(detailedAnalysis.outputTypes.specialCharacters).toBe(true);

      const comprehensiveAnalysis = await analyzeScriptResult(retrievedResult, {
        enableAI: false,
        context: 'Special characters workflow'
      });

      // 보고서 생성 (JSON 형식으로 특수 문자 처리 확인)
      const reportOptions = {
        format: 'json',
        template: 'default',
        includeDetails: true,
        includeAnalysis: true
      };

      const report = await generateScriptReport(
        retrievedResult,
        comprehensiveAnalysis,
        reportOptions
      );

      const reportData = JSON.parse(report);
      expect(reportData.scriptResult.stdout).toContain('éñüß');
      expect(reportData.analysis.detailed.outputTypes.specialCharacters).toBe(true);
    });

    it('should handle multiple script executions in sequence', async () => {
      const commands = [
        'echo "First command"',
        'echo "Second command"',
        'echo "Third command"'
      ];

      const results = [];

      // 순차적으로 여러 스크립트 실행
      for (const command of commands) {
        const mockProcess = {
          stdout: { 
            on: jest.fn((event, callback) => {
              if (event === 'data') {
                callback(`Output: ${command}`);
              }
              if (event === 'end') {
                callback();
              }
            }), 
            pipe: jest.fn() 
          },
          stderr: { on: jest.fn(), pipe: jest.fn() },
          on: jest.fn((event, callback) => {
            if (event === 'close') {
              setTimeout(() => callback(0), 100);
            }
            return mockProcess;
          })
        };

        spawn.mockReturnValue(mockProcess);

        const scriptResult = await executeScript(command, { workingDirectory: tempDir });
        await resultStorage.saveResult(scriptResult);
        results.push(scriptResult);
      }

      // 모든 결과 조회
      const allResults = getAllScriptResults();
      expect(allResults.length).toBeGreaterThanOrEqual(3);

      // 각 결과에 대한 분석
      for (const result of results) {
        const comprehensiveAnalysis = await analyzeScriptResult(result, {
          enableAI: false,
          context: 'Sequential execution workflow'
        });

        await analysisEngine.saveAnalysis(comprehensiveAnalysis);
        expect(comprehensiveAnalysis.scriptResultId).toBe(result.id);
      }

      // 모든 분석 결과 조회
      const allAnalyses = analysisEngine.getAllAnalyses();
      expect(allAnalyses.length).toBeGreaterThanOrEqual(3);

      // 통합 보고서 생성
      const lastResult = results[results.length - 1];
      const lastAnalysis = analysisEngine.getAllAnalyses().find(a => a.scriptResultId === lastResult.id);

      const reportOptions = {
        format: 'markdown',
        template: 'comprehensive',
        includeDetails: true,
        includeAnalysis: true,
        includeRecommendations: true,
        includeNextSteps: true,
        metadata: {
          generatedBy: 'integration-test',
          workflow: 'sequential-execution',
          totalScripts: results.length
        }
      };

      const report = await generateScriptReport(
        lastResult,
        lastAnalysis,
        reportOptions
      );

      expect(report).toContain('Sequential Execution Workflow');
      expect(report).toContain('Total Scripts: 3');
    });
  });

  describe('성능 및 확장성 워크플로우', () => {
    it('should handle concurrent script executions', async () => {
      const commands = [
        'echo "Concurrent 1"',
        'echo "Concurrent 2"',
        'echo "Concurrent 3"',
        'echo "Concurrent 4"',
        'echo "Concurrent 5"'
      ];

      // 동시 실행을 위한 Promise 배열
      const executionPromises = commands.map(async (command, index) => {
        const mockProcess = {
          stdout: { 
            on: jest.fn((event, callback) => {
              if (event === 'data') {
                callback(`Output ${index + 1}: ${command}`);
              }
              if (event === 'end') {
                callback();
              }
            }), 
            pipe: jest.fn() 
          },
          stderr: { on: jest.fn(), pipe: jest.fn() },
          on: jest.fn((event, callback) => {
            if (event === 'close') {
              setTimeout(() => callback(0), 50 + index * 10); // 약간 다른 완료 시간
            }
            return mockProcess;
          })
        };

        spawn.mockReturnValue(mockProcess);

        const scriptResult = await executeScript(command, { workingDirectory: tempDir });
        await resultStorage.saveResult(scriptResult);
        return scriptResult;
      });

      // 동시 실행
      const results = await Promise.all(executionPromises);

      expect(results.length).toBe(5);
      results.forEach((result, index) => {
        expect(result.command).toBe(commands[index]);
        expect(result.success).toBe(true);
      });

      // 모든 결과 조회
      const allResults = getAllScriptResults();
      expect(allResults.length).toBeGreaterThanOrEqual(5);

      // 동시 분석 실행
      const analysisPromises = results.map(async (result) => {
        const comprehensiveAnalysis = await analyzeScriptResult(result, {
          enableAI: false,
          context: 'Concurrent execution workflow'
        });
        await analysisEngine.saveAnalysis(comprehensiveAnalysis);
        return comprehensiveAnalysis;
      });

      const analyses = await Promise.all(analysisPromises);
      expect(analyses.length).toBe(5);

      // 통합 보고서 생성
      const lastResult = results[results.length - 1];
      const lastAnalysis = analyses[analyses.length - 1];

      const reportOptions = {
        format: 'html',
        template: 'performance',
        includeDetails: true,
        includeAnalysis: true,
        metadata: {
          generatedBy: 'integration-test',
          workflow: 'concurrent-execution',
          concurrency: results.length
        }
      };

      const report = await generateScriptReport(
        lastResult,
        lastAnalysis,
        reportOptions
      );

      expect(report).toContain('Concurrent Execution');
      expect(report).toContain('Performance Analysis');
    });

    it('should handle memory-efficient processing of large datasets', async () => {
      // 대용량 데이터셋 시뮬레이션
      const largeDataset = Array.from({ length: 1000 }, (_, i) => `data-${i}`).join('\n');
      
      const mockProcess = {
        stdout: { 
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              // 청크 단위로 데이터 전송
              const chunks = largeDataset.match(/.{1,1000}/g) || [];
              chunks.forEach(chunk => callback(chunk));
            }
            if (event === 'end') {
              callback();
            }
          }), 
          pipe: jest.fn() 
        },
        stderr: { on: jest.fn(), pipe: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 100);
          }
          return mockProcess;
        })
      };

      spawn.mockReturnValue(mockProcess);

      const command = 'generate-large-dataset';
      const scriptResult = await executeScript(command, { 
        workingDirectory: tempDir,
        maxBuffer: 10485760 // 10MB 버퍼
      });

      expect(scriptResult.stdout.length).toBeGreaterThan(5000);

      // 메모리 효율적인 결과 저장
      await resultStorage.saveResult(scriptResult);

      // 메모리 효율적인 분석
      const retrievedResult = getScriptResult(scriptResult.id);
      const basicAnalysis = getBasicAnalysis(retrievedResult);
      expect(basicAnalysis.outputSize).toBeGreaterThan(5000);

      const detailedAnalysis = getDetailedAnalysis(retrievedResult);
      expect(detailedAnalysis.outputTypes.largeOutput).toBe(true);

      // 메모리 효율적인 보고서 생성 (요약 형식)
      const comprehensiveAnalysis = await analyzeScriptResult(retrievedResult, {
        enableAI: false,
        context: 'Memory-efficient workflow'
      });

      const reportOptions = {
        format: 'markdown',
        template: 'summary',
        includeDetails: false, // 상세 정보 제외로 메모리 절약
        includeAnalysis: true,
        includeRecommendations: true,
        includeNextSteps: true
      };

      const report = await generateScriptReport(
        retrievedResult,
        comprehensiveAnalysis,
        reportOptions
      );

      expect(report).toContain('Large Dataset Processing');
      expect(report).toContain('Memory Optimization');
    });
  });

  describe('워크플로우 검증 및 검증', () => {
    it('should validate complete workflow data integrity', async () => {
      // 1. 스크립트 실행
      const command = 'echo "Data integrity test"';
      const scriptResult = await executeScript(command, { workingDirectory: tempDir });
      
      // 2. 결과 저장
      await resultStorage.saveResult(scriptResult);
      
      // 3. 데이터 무결성 검증
      const retrievedResult = getScriptResult(scriptResult.id);
      expect(retrievedResult.id).toBe(scriptResult.id);
      expect(retrievedResult.command).toBe(scriptResult.command);
      expect(retrievedResult.workingDirectory).toBe(scriptResult.workingDirectory);
      expect(retrievedResult.startTime).toBe(scriptResult.startTime);
      expect(retrievedResult.endTime).toBe(scriptResult.endTime);
      expect(retrievedResult.duration).toBe(scriptResult.duration);
      expect(retrievedResult.exitCode).toBe(scriptResult.exitCode);
      expect(retrievedResult.success).toBe(scriptResult.success);
      expect(retrievedResult.stdout).toBe(scriptResult.stdout);
      expect(retrievedResult.stderr).toBe(scriptResult.stderr);

      // 4. 분석 실행
      const comprehensiveAnalysis = await analyzeScriptResult(retrievedResult, {
        enableAI: false,
        context: 'Data integrity workflow'
      });

      // 5. 분석 결과 저장
      await analysisEngine.saveAnalysis(comprehensiveAnalysis);

      // 6. 분석 데이터 무결성 검증
      const retrievedAnalysis = getAnalysis(comprehensiveAnalysis.id);
      expect(retrievedAnalysis.id).toBe(comprehensiveAnalysis.id);
      expect(retrievedAnalysis.scriptResultId).toBe(comprehensiveAnalysis.scriptResultId);
      expect(retrievedAnalysis.analysisType).toBe(comprehensiveAnalysis.analysisType);
      expect(retrievedAnalysis.timestamp).toBe(comprehensiveAnalysis.timestamp);
      expect(retrievedAnalysis.summary).toBe(comprehensiveAnalysis.summary);

      // 7. 보고서 생성
      const reportOptions = {
        format: 'json',
        template: 'default',
        includeDetails: true,
        includeAnalysis: true
      };

      const report = await generateScriptReport(
        retrievedResult,
        retrievedAnalysis,
        reportOptions
      );

      // 8. 보고서 데이터 무결성 검증
      const reportData = JSON.parse(report);
      expect(reportData.scriptResult.id).toBe(scriptResult.id);
      expect(reportData.analysis.id).toBe(comprehensiveAnalysis.id);
      expect(reportData.analysis.scriptResultId).toBe(scriptResult.id);

      // 9. 전체 워크플로우 무결성 검증
      const allResults = getAllScriptResults();
      const allAnalyses = analysisEngine.getAllAnalyses();

      const workflowResult = allResults.find(r => r.id === scriptResult.id);
      const workflowAnalysis = allAnalyses.find(a => a.id === comprehensiveAnalysis.id);

      expect(workflowResult).toBeDefined();
      expect(workflowAnalysis).toBeDefined();
      expect(workflowAnalysis.scriptResultId).toBe(workflowResult.id);
    });

    it('should handle workflow error recovery and cleanup', async () => {
      // 1. 정상 스크립트 실행
      const command = 'echo "Error recovery test"';
      const scriptResult = await executeScript(command, { workingDirectory: tempDir });
      await resultStorage.saveResult(scriptResult);

      // 2. 분석 중 에러 발생 시뮬레이션
      const retrievedResult = getScriptResult(scriptResult.id);
      
      // 분석 엔진 에러 모킹
      const originalAnalyzeScriptResult = analyzeScriptResult;
      analyzeScriptResult.mockRejectedValueOnce(new Error('Analysis failed'));

      try {
        await analyzeScriptResult(retrievedResult, {
          enableAI: false,
          context: 'Error recovery workflow'
        });
      } catch (error) {
        expect(error.message).toBe('Analysis failed');
      }

      // 3. 에러 복구 후 재시도
      analyzeScriptResult.mockRestore();
      const comprehensiveAnalysis = await analyzeScriptResult(retrievedResult, {
        enableAI: false,
        context: 'Error recovery workflow - retry'
      });

      expect(comprehensiveAnalysis).toBeDefined();
      await analysisEngine.saveAnalysis(comprehensiveAnalysis);

      // 4. 정상적인 보고서 생성
      const reportOptions = {
        format: 'markdown',
        template: 'default',
        includeDetails: true,
        includeAnalysis: true
      };

      const report = await generateScriptReport(
        retrievedResult,
        comprehensiveAnalysis,
        reportOptions
      );

      expect(report).toContain('Error Recovery Test');
      expect(report).toContain('Analysis Results');

      // 5. 워크플로우 완료 검증
      const allResults = getAllScriptResults();
      const allAnalyses = analysisEngine.getAllAnalyses();

      expect(allResults.length).toBeGreaterThan(0);
      expect(allAnalyses.length).toBeGreaterThan(0);
    });
  });
});
