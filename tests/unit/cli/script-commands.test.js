/**
 * script-commands.test.js
 * CLI 명령어 테스트
 * run-script, get-script-result, list-script-results, analyze-script-result, create-script-report 명령어 테스트
 */

import { jest } from '@jest/globals';
import { program } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import {
  sampleSuccessfulScriptResult,
  sampleFailedScriptResult,
  sampleTimeoutScriptResult,
  allScriptResultSamples
} from '../../fixtures/sample-script-results.js';
import {
  sampleBasicAnalysisSuccess,
  sampleDetailedAnalysisSuccess,
  sampleAIAnalysisSuccess,
  sampleComprehensiveAnalysisSuccess,
  allAnalysisResultSamples
} from '../../fixtures/sample-analysis-results.js';
import {
  sampleMarkdownReportSuccess,
  sampleHTMLReportSuccess,
  sampleJSONReportSuccess,
  allReportSamples
} from '../../fixtures/sample-reports.js';
import {
  setupTestEnvironment,
  createTempDir,
  cleanupTempDir,
  mockConsoleOutput,
  restoreConsoleOutput
} from '../../utils/test-helpers.js';
import {
  mockCLICommands,
  mockCommander,
  mockChalk,
  mockFS,
  mockProcess
} from '../../utils/mock-utilities.js';

// 모킹 설정
jest.mock('commander', () => ({
  program: {
    command: jest.fn().mockReturnThis(),
    description: jest.fn().mockReturnThis(),
    argument: jest.fn().mockReturnThis(),
    option: jest.fn().mockReturnThis(),
    action: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis()
  }
}));

jest.mock('chalk', () => ({
  blue: jest.fn((text) => `[BLUE]${text}[/BLUE]`),
  green: jest.fn((text) => `[GREEN]${text}[/GREEN]`),
  red: jest.fn((text) => `[RED]${text}[/RED]`),
  yellow: jest.fn((text) => `[YELLOW]${text}[/YELLOW]`),
  cyan: jest.fn((text) => `[CYAN]${text}[/CYAN]`)
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn()
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  dirname: jest.fn((path) => path.split('/').slice(0, -1).join('/')),
  resolve: jest.fn((...args) => args.join('/'))
}));

// 스크립트 실행 엔진 모킹
jest.mock('../../../scripts/modules/script-execution-engine.js', () => ({
  executeScript: jest.fn(),
  getScriptResult: jest.fn(),
  getAllScriptResults: jest.fn()
}));

// 스크립트 분석 엔진 모킹
jest.mock('../../../scripts/modules/script-analysis-engine.js', () => ({
  analyzeScriptResult: jest.fn(),
  getBasicAnalysis: jest.fn(),
  getDetailedAnalysis: jest.fn(),
  getAIAnalysis: jest.fn(),
  getAnalysis: jest.fn()
}));

// 보고서 생성 엔진 모킹
jest.mock('../../../scripts/modules/script-report-engine.js', () => ({
  generateScriptReport: jest.fn(),
  getSupportedReportFormats: jest.fn(),
  getSupportedReportTemplates: jest.fn()
}));

// TaskMaster 초기화 모킹
jest.mock('../../../src/taskgarage.js', () => ({
  initTaskMaster: jest.fn()
}));

// 유틸리티 모킹
jest.mock('../../../scripts/modules/utils.js', () => ({
  log: jest.fn(),
  getCurrentTag: jest.fn()
}));

// 테스트 환경 설정
setupTestEnvironment();

describe('CLI Script Commands', () => {
  let tempDir;
  let consoleOutput;
  let mockExecuteScript;
  let mockGetScriptResult;
  let mockGetAllScriptResults;
  let mockAnalyzeScriptResult;
  let mockGetBasicAnalysis;
  let mockGetDetailedAnalysis;
  let mockGetAIAnalysis;
  let mockGetAnalysis;
  let mockGenerateScriptReport;
  let mockGetSupportedReportFormats;
  let mockGetSupportedReportTemplates;
  let mockInitTaskMaster;
  let mockGetCurrentTag;

  beforeEach(async () => {
    tempDir = await createTempDir();
    consoleOutput = mockConsoleOutput();

    // 모킹된 함수들 가져오기
    const scriptExecutionEngine = await import('../../../scripts/modules/script-execution-engine.js');
    const scriptAnalysisEngine = await import('../../../scripts/modules/script-analysis-engine.js');
    const scriptReportEngine = await import('../../../scripts/modules/script-report-engine.js');
    const taskgarage = await import('../../../src/taskgarage.js');
    const utils = await import('../../../scripts/modules/utils.js');

    mockExecuteScript = scriptExecutionEngine.executeScript;
    mockGetScriptResult = scriptExecutionEngine.getScriptResult;
    mockGetAllScriptResults = scriptExecutionEngine.getAllScriptResults;
    mockAnalyzeScriptResult = scriptAnalysisEngine.analyzeScriptResult;
    mockGetBasicAnalysis = scriptAnalysisEngine.getBasicAnalysis;
    mockGetDetailedAnalysis = scriptAnalysisEngine.getDetailedAnalysis;
    mockGetAIAnalysis = scriptAnalysisEngine.getAIAnalysis;
    mockGetAnalysis = scriptAnalysisEngine.getAnalysis;
    mockGenerateScriptReport = scriptReportEngine.generateScriptReport;
    mockGetSupportedReportFormats = scriptReportEngine.getSupportedReportFormats;
    mockGetSupportedReportTemplates = scriptReportEngine.getSupportedReportTemplates;
    mockInitTaskMaster = taskgarage.initTaskMaster;
    mockGetCurrentTag = utils.getCurrentTag;

    // 기본 모킹 설정
    fs.existsSync.mockReturnValue(true);
    mockInitTaskMaster.mockReturnValue({
      getTasksPath: () => path.join(tempDir, 'tasks.json'),
      getProjectRoot: () => tempDir
    });
    mockGetCurrentTag.mockReturnValue('master');
  });

  afterEach(async () => {
    restoreConsoleOutput(consoleOutput);
    await cleanupTempDir(tempDir);
    jest.clearAllMocks();
  });

  describe('run-script 명령어', () => {
    it('should execute script successfully', async () => {
      const command = 'ls -la';
      const options = {
        file: 'tasks.json',
        tag: 'master',
        workingDirectory: tempDir,
        timeout: '300000',
        shell: false,
        encoding: 'utf8',
        maxBuffer: '1048576'
      };

      mockExecuteScript.mockResolvedValue(sampleSuccessfulScriptResult);

      // CLI 명령어 실행 시뮬레이션
      const action = program.command.mock.calls.find(call => 
        call[0] === 'run-script'
      )?.[0]?.action;

      if (action) {
        await action(command, options);
      }

      // 검증
      expect(mockExecuteScript).toHaveBeenCalledWith(command, {
        workingDirectory: tempDir,
        timeout: 300000,
        shell: false,
        encoding: 'utf8',
        maxBuffer: 1048576
      });

      expect(consoleOutput.logs).toContain(expect.stringContaining('Script execution completed'));
      expect(consoleOutput.logs).toContain(expect.stringContaining('Exit code: 0'));
      expect(consoleOutput.logs).toContain(expect.stringContaining('Success: true'));
    });

    it('should handle script execution failure', async () => {
      const command = 'invalid-command';
      const options = {
        file: 'tasks.json',
        tag: 'master'
      };

      mockExecuteScript.mockResolvedValue(sampleFailedScriptResult);

      const action = program.command.mock.calls.find(call => 
        call[0] === 'run-script'
      )?.[0]?.action;

      if (action) {
        await action(command, options);
      }

      expect(mockExecuteScript).toHaveBeenCalledWith(command, {
        workingDirectory: process.cwd(),
        timeout: 300000,
        shell: false,
        encoding: 'utf8',
        maxBuffer: 1048576
      });

      expect(consoleOutput.logs).toContain(expect.stringContaining('Script execution completed'));
      expect(consoleOutput.logs).toContain(expect.stringContaining('Exit code: 1'));
      expect(consoleOutput.logs).toContain(expect.stringContaining('Success: false'));
    });

    it('should handle tasks file not found error', async () => {
      const command = 'ls -la';
      const options = {
        file: 'nonexistent.json',
        tag: 'master'
      };

      fs.existsSync.mockReturnValue(false);

      const action = program.command.mock.calls.find(call => 
        call[0] === 'run-script'
      )?.[0]?.action;

      if (action) {
        await expect(action(command, options)).rejects.toThrow();
      }

      expect(consoleOutput.errors).toContain(expect.stringContaining('Tasks file not found'));
    });

    it('should handle script execution error', async () => {
      const command = 'ls -la';
      const options = {
        file: 'tasks.json',
        tag: 'master'
      };

      mockExecuteScript.mockRejectedValue(new Error('Script execution failed'));

      const action = program.command.mock.calls.find(call => 
        call[0] === 'run-script'
      )?.[0]?.action;

      if (action) {
        await expect(action(command, options)).rejects.toThrow('Script execution failed');
      }

      expect(consoleOutput.errors).toContain(expect.stringContaining('Error executing script'));
    });
  });

  describe('get-script-result 명령어', () => {
    it('should get script result successfully', async () => {
      const id = 'script_001';
      const options = {
        file: 'tasks.json',
        tag: 'master'
      };

      mockGetScriptResult.mockReturnValue(sampleSuccessfulScriptResult);

      const action = program.command.mock.calls.find(call => 
        call[0] === 'get-script-result'
      )?.[0]?.action;

      if (action) {
        await action(id, options);
      }

      expect(mockGetScriptResult).toHaveBeenCalledWith(id);
      expect(consoleOutput.logs).toContain(expect.stringContaining('Script Result: script_001'));
      expect(consoleOutput.logs).toContain(expect.stringContaining('Command: ls -la'));
      expect(consoleOutput.logs).toContain(expect.stringContaining('Exit Code: 0'));
      expect(consoleOutput.logs).toContain(expect.stringContaining('Success: true'));
    });

    it('should handle script result not found', async () => {
      const id = 'nonexistent_script';
      const options = {
        file: 'tasks.json',
        tag: 'master'
      };

      mockGetScriptResult.mockReturnValue(null);

      const action = program.command.mock.calls.find(call => 
        call[0] === 'get-script-result'
      )?.[0]?.action;

      if (action) {
        await expect(action(id, options)).rejects.toThrow();
      }

      expect(mockGetScriptResult).toHaveBeenCalledWith(id);
      expect(consoleOutput.errors).toContain(expect.stringContaining('Script result not found'));
    });

    it('should display stdout and stderr correctly', async () => {
      const id = 'script_001';
      const options = {
        file: 'tasks.json',
        tag: 'master'
      };

      const resultWithOutput = {
        ...sampleSuccessfulScriptResult,
        stdout: 'File listing output',
        stderr: 'Warning messages'
      };

      mockGetScriptResult.mockReturnValue(resultWithOutput);

      const action = program.command.mock.calls.find(call => 
        call[0] === 'get-script-result'
      )?.[0]?.action;

      if (action) {
        await action(id, options);
      }

      expect(consoleOutput.logs).toContain(expect.stringContaining('=== STDOUT ==='));
      expect(consoleOutput.logs).toContain(expect.stringContaining('File listing output'));
      expect(consoleOutput.logs).toContain(expect.stringContaining('=== STDERR ==='));
      expect(consoleOutput.logs).toContain(expect.stringContaining('Warning messages'));
    });
  });

  describe('list-script-results 명령어', () => {
    it('should list script results successfully', async () => {
      const options = {
        file: 'tasks.json',
        tag: 'master',
        limit: '10',
        offset: '0',
        status: 'all'
      };

      mockGetAllScriptResults.mockReturnValue(allScriptResultSamples);

      const action = program.command.mock.calls.find(call => 
        call[0] === 'list-script-results'
      )?.[0]?.action;

      if (action) {
        await action(options);
      }

      expect(mockGetAllScriptResults).toHaveBeenCalled();
      expect(consoleOutput.logs).toContain(expect.stringContaining('Found 8 script results'));
      expect(consoleOutput.logs).toContain(expect.stringContaining('=== Script Results ==='));
    });

    it('should filter results by success status', async () => {
      const options = {
        file: 'tasks.json',
        tag: 'master',
        limit: '10',
        offset: '0',
        status: 'success'
      };

      mockGetAllScriptResults.mockReturnValue(allScriptResultSamples);

      const action = program.command.mock.calls.find(call => 
        call[0] === 'list-script-results'
      )?.[0]?.action;

      if (action) {
        await action(options);
      }

      expect(consoleOutput.logs).toContain(expect.stringContaining('Found 3 script results'));
    });

    it('should filter results by failure status', async () => {
      const options = {
        file: 'tasks.json',
        tag: 'master',
        limit: '10',
        offset: '0',
        status: 'failure'
      };

      mockGetAllScriptResults.mockReturnValue(allScriptResultSamples);

      const action = program.command.mock.calls.find(call => 
        call[0] === 'list-script-results'
      )?.[0]?.action;

      if (action) {
        await action(options);
      }

      expect(consoleOutput.logs).toContain(expect.stringContaining('Found 5 script results'));
    });

    it('should handle pagination correctly', async () => {
      const options = {
        file: 'tasks.json',
        tag: 'master',
        limit: '2',
        offset: '1',
        status: 'all'
      };

      mockGetAllScriptResults.mockReturnValue(allScriptResultSamples);

      const action = program.command.mock.calls.find(call => 
        call[0] === 'list-script-results'
      )?.[0]?.action;

      if (action) {
        await action(options);
      }

      expect(consoleOutput.logs).toContain(expect.stringContaining('Showing 2 results (offset: 1)'));
    });

    it('should handle no results found', async () => {
      const options = {
        file: 'tasks.json',
        tag: 'master',
        limit: '10',
        offset: '0',
        status: 'all'
      };

      mockGetAllScriptResults.mockReturnValue([]);

      const action = program.command.mock.calls.find(call => 
        call[0] === 'list-script-results'
      )?.[0]?.action;

      if (action) {
        await action(options);
      }

      expect(consoleOutput.logs).toContain(expect.stringContaining('Found 0 script results'));
      expect(consoleOutput.logs).toContain(expect.stringContaining('No script results found'));
    });
  });

  describe('analyze-script-result 명령어', () => {
    it('should perform basic analysis successfully', async () => {
      const scriptResultId = 'script_001';
      const options = {
        file: 'tasks.json',
        tag: 'master',
        type: 'basic',
        noAi: false,
        context: 'Test context'
      };

      mockGetScriptResult.mockReturnValue(sampleSuccessfulScriptResult);
      mockGetBasicAnalysis.mockReturnValue(sampleBasicAnalysisSuccess);

      const action = program.command.mock.calls.find(call => 
        call[0] === 'analyze-script-result'
      )?.[0]?.action;

      if (action) {
        await action(scriptResultId, options);
      }

      expect(mockGetScriptResult).toHaveBeenCalledWith(scriptResultId);
      expect(mockGetBasicAnalysis).toHaveBeenCalledWith(sampleSuccessfulScriptResult);
      expect(consoleOutput.logs).toContain(expect.stringContaining('Performing basic analysis'));
      expect(consoleOutput.logs).toContain(expect.stringContaining('Analysis completed successfully'));
    });

    it('should perform detailed analysis successfully', async () => {
      const scriptResultId = 'script_001';
      const options = {
        file: 'tasks.json',
        tag: 'master',
        type: 'detailed',
        noAi: false,
        context: 'Test context'
      };

      mockGetScriptResult.mockReturnValue(sampleSuccessfulScriptResult);
      mockGetDetailedAnalysis.mockReturnValue(sampleDetailedAnalysisSuccess);

      const action = program.command.mock.calls.find(call => 
        call[0] === 'analyze-script-result'
      )?.[0]?.action;

      if (action) {
        await action(scriptResultId, options);
      }

      expect(mockGetScriptResult).toHaveBeenCalledWith(scriptResultId);
      expect(mockGetDetailedAnalysis).toHaveBeenCalledWith(sampleSuccessfulScriptResult);
      expect(consoleOutput.logs).toContain(expect.stringContaining('Performing detailed analysis'));
      expect(consoleOutput.logs).toContain(expect.stringContaining('Analysis completed successfully'));
    });

    it('should perform AI analysis successfully', async () => {
      const scriptResultId = 'script_001';
      const options = {
        file: 'tasks.json',
        tag: 'master',
        type: 'ai',
        noAi: false,
        context: 'Test context'
      };

      mockGetScriptResult.mockReturnValue(sampleSuccessfulScriptResult);
      mockGetAIAnalysis.mockResolvedValue(sampleAIAnalysisSuccess);

      const action = program.command.mock.calls.find(call => 
        call[0] === 'analyze-script-result'
      )?.[0]?.action;

      if (action) {
        await action(scriptResultId, options);
      }

      expect(mockGetScriptResult).toHaveBeenCalledWith(scriptResultId);
      expect(mockGetAIAnalysis).toHaveBeenCalledWith(sampleSuccessfulScriptResult, {
        enableAI: true,
        context: 'Test context'
      });
      expect(consoleOutput.logs).toContain(expect.stringContaining('Performing AI analysis'));
      expect(consoleOutput.logs).toContain(expect.stringContaining('Analysis completed successfully'));
    });

    it('should perform comprehensive analysis successfully', async () => {
      const scriptResultId = 'script_001';
      const options = {
        file: 'tasks.json',
        tag: 'master',
        type: 'comprehensive',
        noAi: false,
        context: 'Test context'
      };

      mockGetScriptResult.mockReturnValue(sampleSuccessfulScriptResult);
      mockAnalyzeScriptResult.mockResolvedValue(sampleComprehensiveAnalysisSuccess);

      const action = program.command.mock.calls.find(call => 
        call[0] === 'analyze-script-result'
      )?.[0]?.action;

      if (action) {
        await action(scriptResultId, options);
      }

      expect(mockGetScriptResult).toHaveBeenCalledWith(scriptResultId);
      expect(mockAnalyzeScriptResult).toHaveBeenCalledWith(sampleSuccessfulScriptResult, {
        enableAI: true,
        context: 'Test context'
      });
      expect(consoleOutput.logs).toContain(expect.stringContaining('Performing comprehensive analysis'));
      expect(consoleOutput.logs).toContain(expect.stringContaining('Analysis completed successfully'));
    });

    it('should handle script result not found', async () => {
      const scriptResultId = 'nonexistent_script';
      const options = {
        file: 'tasks.json',
        tag: 'master',
        type: 'basic',
        noAi: false
      };

      mockGetScriptResult.mockReturnValue(null);

      const action = program.command.mock.calls.find(call => 
        call[0] === 'analyze-script-result'
      )?.[0]?.action;

      if (action) {
        await expect(action(scriptResultId, options)).rejects.toThrow();
      }

      expect(mockGetScriptResult).toHaveBeenCalledWith(scriptResultId);
      expect(consoleOutput.errors).toContain(expect.stringContaining('Script result not found'));
    });

    it('should handle AI analysis disabled', async () => {
      const scriptResultId = 'script_001';
      const options = {
        file: 'tasks.json',
        tag: 'master',
        type: 'ai',
        noAi: true,
        context: 'Test context'
      };

      mockGetScriptResult.mockReturnValue(sampleSuccessfulScriptResult);
      mockGetAIAnalysis.mockResolvedValue(sampleAIAnalysisSuccess);

      const action = program.command.mock.calls.find(call => 
        call[0] === 'analyze-script-result'
      )?.[0]?.action;

      if (action) {
        await action(scriptResultId, options);
      }

      expect(mockGetAIAnalysis).toHaveBeenCalledWith(sampleSuccessfulScriptResult, {
        enableAI: false,
        context: 'Test context'
      });
    });
  });

  describe('create-script-report 명령어', () => {
    it('should create markdown report successfully', async () => {
      const scriptResultId = 'script_001';
      const options = {
        file: 'tasks.json',
        tag: 'master',
        analysisId: 'analysis_001',
        output: path.join(tempDir, 'report.md'),
        format: 'markdown',
        template: 'default',
        noDetails: false,
        noAnalysis: false,
        noRecommendations: false,
        noNextSteps: false,
        listFormats: false,
        listTemplates: false
      };

      mockGetScriptResult.mockReturnValue(sampleSuccessfulScriptResult);
      mockGetAnalysis.mockReturnValue(sampleComprehensiveAnalysisSuccess);
      mockGenerateScriptReport.mockResolvedValue(sampleMarkdownReportSuccess);

      const action = program.command.mock.calls.find(call => 
        call[0] === 'create-script-report'
      )?.[0]?.action;

      if (action) {
        await action(scriptResultId, options);
      }

      expect(mockGetScriptResult).toHaveBeenCalledWith(scriptResultId);
      expect(mockGetAnalysis).toHaveBeenCalledWith('analysis_001');
      expect(mockGenerateScriptReport).toHaveBeenCalledWith(
        sampleSuccessfulScriptResult,
        sampleComprehensiveAnalysisSuccess,
        {
          format: 'markdown',
          template: 'default',
          outputPath: path.join(tempDir, 'report.md'),
          includeDetails: true,
          includeAnalysis: true,
          includeRecommendations: true,
          includeNextSteps: true,
          metadata: expect.any(Object)
        }
      );
      expect(consoleOutput.logs).toContain(expect.stringContaining('Report created successfully'));
    });

    it('should create HTML report successfully', async () => {
      const scriptResultId = 'script_001';
      const options = {
        file: 'tasks.json',
        tag: 'master',
        format: 'html',
        template: 'default',
        noDetails: false,
        noAnalysis: false,
        noRecommendations: false,
        noNextSteps: false,
        listFormats: false,
        listTemplates: false
      };

      mockGetScriptResult.mockReturnValue(sampleSuccessfulScriptResult);
      mockGenerateScriptReport.mockResolvedValue(sampleHTMLReportSuccess);

      const action = program.command.mock.calls.find(call => 
        call[0] === 'create-script-report'
      )?.[0]?.action;

      if (action) {
        await action(scriptResultId, options);
      }

      expect(mockGenerateScriptReport).toHaveBeenCalledWith(
        sampleSuccessfulScriptResult,
        null,
        {
          format: 'html',
          template: 'default',
          outputPath: null,
          includeDetails: true,
          includeAnalysis: true,
          includeRecommendations: true,
          includeNextSteps: true,
          metadata: expect.any(Object)
        }
      );
    });

    it('should create JSON report successfully', async () => {
      const scriptResultId = 'script_001';
      const options = {
        file: 'tasks.json',
        tag: 'master',
        format: 'json',
        template: 'default',
        noDetails: false,
        noAnalysis: false,
        noRecommendations: false,
        noNextSteps: false,
        listFormats: false,
        listTemplates: false
      };

      mockGetScriptResult.mockReturnValue(sampleSuccessfulScriptResult);
      mockGenerateScriptReport.mockResolvedValue(sampleJSONReportSuccess);

      const action = program.command.mock.calls.find(call => 
        call[0] === 'create-script-report'
      )?.[0]?.action;

      if (action) {
        await action(scriptResultId, options);
      }

      expect(mockGenerateScriptReport).toHaveBeenCalledWith(
        sampleSuccessfulScriptResult,
        null,
        {
          format: 'json',
          template: 'default',
          outputPath: null,
          includeDetails: true,
          includeAnalysis: true,
          includeRecommendations: true,
          includeNextSteps: true,
          metadata: expect.any(Object)
        }
      );
    });

    it('should handle script result not found', async () => {
      const scriptResultId = 'nonexistent_script';
      const options = {
        file: 'tasks.json',
        tag: 'master',
        format: 'markdown',
        template: 'default',
        listFormats: false,
        listTemplates: false
      };

      mockGetScriptResult.mockReturnValue(null);

      const action = program.command.mock.calls.find(call => 
        call[0] === 'create-script-report'
      )?.[0]?.action;

      if (action) {
        await expect(action(scriptResultId, options)).rejects.toThrow();
      }

      expect(mockGetScriptResult).toHaveBeenCalledWith(scriptResultId);
      expect(consoleOutput.errors).toContain(expect.stringContaining('Script result not found'));
    });

    it('should handle analysis result not found with warning', async () => {
      const scriptResultId = 'script_001';
      const options = {
        file: 'tasks.json',
        tag: 'master',
        analysisId: 'nonexistent_analysis',
        format: 'markdown',
        template: 'default',
        listFormats: false,
        listTemplates: false
      };

      mockGetScriptResult.mockReturnValue(sampleSuccessfulScriptResult);
      mockGetAnalysis.mockReturnValue(null);
      mockGenerateScriptReport.mockResolvedValue(sampleMarkdownReportSuccess);

      const action = program.command.mock.calls.find(call => 
        call[0] === 'create-script-report'
      )?.[0]?.action;

      if (action) {
        await action(scriptResultId, options);
      }

      expect(consoleOutput.logs).toContain(expect.stringContaining('Analysis result not found'));
      expect(consoleOutput.logs).toContain(expect.stringContaining('proceeding without analysis'));
    });

    it('should list supported formats', async () => {
      const scriptResultId = 'script_001';
      const options = {
        file: 'tasks.json',
        tag: 'master',
        listFormats: true,
        listTemplates: false
      };

      mockGetSupportedReportFormats.mockReturnValue(['markdown', 'html', 'json']);

      const action = program.command.mock.calls.find(call => 
        call[0] === 'create-script-report'
      )?.[0]?.action;

      if (action) {
        await action(scriptResultId, options);
      }

      expect(mockGetSupportedReportFormats).toHaveBeenCalled();
      expect(consoleOutput.logs).toContain(expect.stringContaining('지원하는 보고서 형식:'));
      expect(consoleOutput.logs).toContain(expect.stringContaining('- markdown'));
      expect(consoleOutput.logs).toContain(expect.stringContaining('- html'));
      expect(consoleOutput.logs).toContain(expect.stringContaining('- json'));
    });

    it('should list supported templates', async () => {
      const scriptResultId = 'script_001';
      const options = {
        file: 'tasks.json',
        tag: 'master',
        format: 'markdown',
        listFormats: false,
        listTemplates: true
      };

      mockGetSupportedReportTemplates.mockReturnValue(['default', 'detailed', 'summary']);

      const action = program.command.mock.calls.find(call => 
        call[0] === 'create-script-report'
      )?.[0]?.action;

      if (action) {
        await action(scriptResultId, options);
      }

      expect(mockGetSupportedReportTemplates).toHaveBeenCalledWith('markdown');
      expect(consoleOutput.logs).toContain(expect.stringContaining('지원하는 markdown 템플릿:'));
      expect(consoleOutput.logs).toContain(expect.stringContaining('- default'));
      expect(consoleOutput.logs).toContain(expect.stringContaining('- detailed'));
      expect(consoleOutput.logs).toContain(expect.stringContaining('- summary'));
    });

    it('should handle report generation with excluded sections', async () => {
      const scriptResultId = 'script_001';
      const options = {
        file: 'tasks.json',
        tag: 'master',
        format: 'markdown',
        template: 'default',
        noDetails: true,
        noAnalysis: true,
        noRecommendations: true,
        noNextSteps: true,
        listFormats: false,
        listTemplates: false
      };

      mockGetScriptResult.mockReturnValue(sampleSuccessfulScriptResult);
      mockGenerateScriptReport.mockResolvedValue(sampleMarkdownReportSuccess);

      const action = program.command.mock.calls.find(call => 
        call[0] === 'create-script-report'
      )?.[0]?.action;

      if (action) {
        await action(scriptResultId, options);
      }

      expect(mockGenerateScriptReport).toHaveBeenCalledWith(
        sampleSuccessfulScriptResult,
        null,
        {
          format: 'markdown',
          template: 'default',
          outputPath: null,
          includeDetails: false,
          includeAnalysis: false,
          includeRecommendations: false,
          includeNextSteps: false,
          metadata: expect.any(Object)
        }
      );
    });
  });

  describe('CLI 명령어 등록', () => {
    it('should register run-script command with correct options', () => {
      expect(program.command).toHaveBeenCalledWith('run-script');
      expect(program.description).toHaveBeenCalledWith(expect.stringContaining('터미널 스크립트를 실행'));
      expect(program.argument).toHaveBeenCalledWith('<command>', expect.stringContaining('실행할 명령어'));
    });

    it('should register get-script-result command with correct options', () => {
      expect(program.command).toHaveBeenCalledWith('get-script-result');
      expect(program.description).toHaveBeenCalledWith(expect.stringContaining('특정 스크립트 실행 결과를 조회'));
      expect(program.argument).toHaveBeenCalledWith('<id>', expect.stringContaining('조회할 스크립트 실행 결과의 ID'));
    });

    it('should register list-script-results command with correct options', () => {
      expect(program.command).toHaveBeenCalledWith('list-script-results');
      expect(program.description).toHaveBeenCalledWith(expect.stringContaining('모든 스크립트 실행 결과 목록을 조회'));
    });

    it('should register analyze-script-result command with correct options', () => {
      expect(program.command).toHaveBeenCalledWith('analyze-script-result');
      expect(program.description).toHaveBeenCalledWith(expect.stringContaining('스크립트 실행 결과를 분석'));
      expect(program.argument).toHaveBeenCalledWith('<scriptResultId>', expect.stringContaining('분석할 스크립트 실행 결과의 ID'));
    });

    it('should register create-script-report command with correct options', () => {
      expect(program.command).toHaveBeenCalledWith('create-script-report');
      expect(program.description).toHaveBeenCalledWith(expect.stringContaining('스크립트 실행 결과를 다양한 형식으로 보고서를 생성'));
      expect(program.argument).toHaveBeenCalledWith('<scriptResultId>', expect.stringContaining('보고서를 생성할 스크립트 실행 결과의 ID'));
    });
  });

  describe('에러 처리', () => {
    it('should handle tasks file not found error consistently', async () => {
      fs.existsSync.mockReturnValue(false);

      const commands = ['run-script', 'get-script-result', 'list-script-results', 'analyze-script-result', 'create-script-report'];
      
      for (const command of commands) {
        const action = program.command.mock.calls.find(call => 
          call[0] === command
        )?.[0]?.action;

        if (action) {
          await expect(action('test', { file: 'nonexistent.json' })).rejects.toThrow();
          expect(consoleOutput.errors).toContain(expect.stringContaining('Tasks file not found'));
        }
      }
    });

    it('should handle project root not found error', async () => {
      mockInitTaskMaster.mockReturnValue({
        getTasksPath: () => path.join(tempDir, 'tasks.json'),
        getProjectRoot: () => null
      });

      const commands = ['run-script', 'get-script-result', 'list-script-results', 'analyze-script-result', 'create-script-report'];
      
      for (const command of commands) {
        const action = program.command.mock.calls.find(call => 
          call[0] === command
        )?.[0]?.action;

        if (action) {
          await expect(action('test', { file: 'tasks.json' })).rejects.toThrow();
          expect(consoleOutput.errors).toContain(expect.stringContaining('Could not find project root'));
        }
      }
    });
  });
});
