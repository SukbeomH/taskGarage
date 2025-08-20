/**
 * mock-utilities.js
 * 테스트에서 사용할 모킹 유틸리티들
 * 외부 의존성 모킹, 스파이 함수, 스텁 함수 등
 */

import { jest } from '@jest/globals';

/**
 * Chalk 모킹 유틸리티
 */
export const mockChalk = {
  blue: jest.fn((text) => text),
  green: jest.fn((text) => text),
  red: jest.fn((text) => text),
  yellow: jest.fn((text) => text),
  cyan: jest.fn((text) => text),
  magenta: jest.fn((text) => text),
  white: jest.fn((text) => text),
  gray: jest.fn((text) => text),
  bold: jest.fn((text) => text),
  dim: jest.fn((text) => text),
  italic: jest.fn((text) => text),
  underline: jest.fn((text) => text),
  inverse: jest.fn((text) => text),
  hidden: jest.fn((text) => text),
  strikethrough: jest.fn((text) => text),
  black: jest.fn((text) => text),
  redBright: jest.fn((text) => text),
  greenBright: jest.fn((text) => text),
  yellowBright: jest.fn((text) => text),
  blueBright: jest.fn((text) => text),
  magentaBright: jest.fn((text) => text),
  cyanBright: jest.fn((text) => text),
  whiteBright: jest.fn((text) => text)
};

/**
 * 스크립트 실행 엔진 모킹 유틸리티
 */
export const mockScriptExecutionEngine = () => {
  const mockExecuteScript = jest.fn();
  const mockGetScriptResult = jest.fn();
  const mockGetAllScriptResults = jest.fn();
  const mockSaveScriptResult = jest.fn();

  jest.mock('../../scripts/modules/script-execution-engine.js', () => ({
    executeScript: mockExecuteScript,
    getScriptResult: mockGetScriptResult,
    getAllScriptResults: mockGetAllScriptResults,
    saveScriptResult: mockSaveScriptResult
  }));

  return {
    mockExecuteScript,
    mockGetScriptResult,
    mockGetAllScriptResults,
    mockSaveScriptResult
  };
};

/**
 * 스크립트 분석 엔진 모킹 유틸리티
 */
export const mockScriptAnalysisEngine = () => {
  const mockAnalyzeScriptResult = jest.fn();
  const mockGetBasicAnalysis = jest.fn();
  const mockGetDetailedAnalysis = jest.fn();
  const mockGetAIAnalysis = jest.fn();
  const mockGetAnalysis = jest.fn();

  jest.mock('../../scripts/modules/script-analysis-engine.js', () => ({
    analyzeScriptResult: mockAnalyzeScriptResult,
    getBasicAnalysis: mockGetBasicAnalysis,
    getDetailedAnalysis: mockGetDetailedAnalysis,
    getAIAnalysis: mockGetAIAnalysis,
    getAnalysis: mockGetAnalysis
  }));

  return {
    mockAnalyzeScriptResult,
    mockGetBasicAnalysis,
    mockGetDetailedAnalysis,
    mockGetAIAnalysis,
    mockGetAnalysis
  };
};

/**
 * 스크립트 보고서 엔진 모킹 유틸리티
 */
export const mockScriptReportEngine = () => {
  const mockGenerateScriptReport = jest.fn();
  const mockGetSupportedReportFormats = jest.fn();
  const mockGetSupportedReportTemplates = jest.fn();

  jest.mock('../../scripts/modules/script-report-engine.js', () => ({
    generateScriptReport: mockGenerateScriptReport,
    getSupportedReportFormats: mockGetSupportedReportFormats,
    getSupportedReportTemplates: mockGetSupportedReportTemplates
  }));

  return {
    mockGenerateScriptReport,
    mockGetSupportedReportFormats,
    mockGetSupportedReportTemplates
  };
};

/**
 * MCP 도구 모킹 유틸리티
 */
export const mockMCPTools = () => {
  const mockRunScriptDirect = jest.fn();
  const mockGetScriptResultDirect = jest.fn();
  const mockListScriptResultsDirect = jest.fn();
  const mockAnalyzeScriptResultDirect = jest.fn();
  const mockCreateScriptReportDirect = jest.fn();

  jest.mock('../../mcp-server/src/core/direct-functions/run-script.js', () => ({
    runScriptDirect: mockRunScriptDirect
  }));

  jest.mock('../../mcp-server/src/core/direct-functions/get-script-result.js', () => ({
    getScriptResultDirect: mockGetScriptResultDirect
  }));

  jest.mock('../../mcp-server/src/core/direct-functions/list-script-results.js', () => ({
    listScriptResultsDirect: mockListScriptResultsDirect
  }));

  jest.mock('../../mcp-server/src/core/direct-functions/analyze-script-result.js', () => ({
    analyzeScriptResultDirect: mockAnalyzeScriptResultDirect
  }));

  jest.mock('../../mcp-server/src/core/direct-functions/create-script-report.js', () => ({
    createScriptReportDirect: mockCreateScriptReportDirect
  }));

  return {
    mockRunScriptDirect,
    mockGetScriptResultDirect,
    mockListScriptResultsDirect,
    mockAnalyzeScriptResultDirect,
    mockCreateScriptReportDirect
  };
};

/**
 * CLI 명령어 모킹 유틸리티
 */
export const mockCLICommands = () => {
  const mockCommander = {
    command: jest.fn().mockReturnThis(),
    description: jest.fn().mockReturnThis(),
    argument: jest.fn().mockReturnThis(),
    option: jest.fn().mockReturnThis(),
    action: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis()
  };

  jest.mock('commander', () => ({
    Command: jest.fn(() => mockCommander),
    Option: jest.fn(),
    program: mockCommander
  }));

  return { mockCommander };
};

/**
 * 파일 시스템 모킹 유틸리티
 */
export const mockFileSystem = () => {
  const mockFs = {
    writeFile: jest.fn(),
    readFile: jest.fn(),
    mkdir: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    access: jest.fn(),
    rm: jest.fn(),
    copyFile: jest.fn(),
    rename: jest.fn(),
    existsSync: jest.fn()
  };

  jest.mock('fs/promises', () => mockFs);
  jest.mock('fs', () => ({
    ...mockFs,
    existsSync: mockFs.existsSync
  }));

  return mockFs;
};

/**
 * 경로 모킹 유틸리티
 */
export const mockPath = () => {
  const mockPathModule = {
    join: jest.fn((...args) => args.join('/')),
    dirname: jest.fn((filePath) => filePath.split('/').slice(0, -1).join('/')),
    extname: jest.fn((filePath) => {
      const ext = filePath.split('.').pop();
      return ext && ext !== filePath ? `.${ext}` : '';
    }),
    basename: jest.fn((filePath) => filePath.split('/').pop()),
    resolve: jest.fn((...args) => args.join('/')),
    isAbsolute: jest.fn((path) => path.startsWith('/')),
    relative: jest.fn((from, to) => to.replace(from, ''))
  };

  jest.mock('path', () => mockPathModule);
  return mockPathModule;
};

/**
 * child_process 모킹 유틸리티
 */
export const mockChildProcess = () => {
  const mockSpawn = jest.fn();
  const mockExec = jest.fn();
  const mockExecSync = jest.fn();

  const mockChild = {
    stdout: {
      on: jest.fn(),
      pipe: jest.fn(),
      once: jest.fn()
    },
    stderr: {
      on: jest.fn(),
      pipe: jest.fn(),
      once: jest.fn()
    },
    on: jest.fn(),
    kill: jest.fn(),
    pid: 12345
  };

  mockSpawn.mockReturnValue(mockChild);

  jest.mock('child_process', () => ({
    spawn: mockSpawn,
    exec: mockExec,
    execSync: mockExecSync
  }));

  return { mockSpawn, mockExec, mockExecSync, mockChild };
};

// child_process 모킹
export const spawn = jest.fn();
export const exec = jest.fn();
export const execSync = jest.fn();

// fs/promises 모킹
export const writeFile = jest.fn();
export const readFile = jest.fn();
export const mkdir = jest.fn();
export const readdir = jest.fn();
export const stat = jest.fn();
export const access = jest.fn();
export const rm = jest.fn();
export const copyFile = jest.fn();
export const rename = jest.fn();

// 통합 default export
export default {
  // child_process exports
  spawn,
  exec,
  execSync,
  // fs/promises exports
  writeFile,
  readFile,
  mkdir,
  readdir,
  stat,
  access,
  rm,
  copyFile,
  rename
};

/**
 * 콘솔 출력 모킹 유틸리티
 */
export const mockConsole = () => {
  const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
  const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
  const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
  const mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation();

  return {
    mockConsoleLog,
    mockConsoleError,
    mockConsoleWarn,
    mockConsoleInfo,
    restore: () => {
      mockConsoleLog.mockRestore();
      mockConsoleError.mockRestore();
      mockConsoleWarn.mockRestore();
      mockConsoleInfo.mockRestore();
    }
  };
};

/**
 * 프로세스 모킹 유틸리티
 */
export const mockProcess = () => {
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('process.exit() called');
  });

  const mockCwd = jest.spyOn(process, 'cwd').mockReturnValue('/test/project');

  return {
    mockExit,
    mockCwd,
    restore: () => {
      mockExit.mockRestore();
      mockCwd.mockRestore();
    }
  };
};

/**
 * 스크립트 실행 결과 스텁 생성
 */
export const createScriptResultStub = (overrides = {}) => {
  return {
    id: 'script_001',
    command: 'ls -la',
    workingDirectory: '/tmp',
    startTime: Date.now() - 1000,
    endTime: Date.now(),
    duration: 1000,
    exitCode: 0,
    success: true,
    stdout: 'test output',
    stderr: '',
    error: null,
    metadata: {
      platform: 'darwin',
      nodeVersion: '18.0.0',
      shell: '/bin/zsh'
    },
    ...overrides
  };
};

/**
 * 분석 결과 스텁 생성
 */
export const createAnalysisResultStub = (overrides = {}) => {
  return {
    id: 'analysis_001',
    scriptResultId: 'script_001',
    analysisType: 'comprehensive',
    timestamp: Date.now(),
    summary: '테스트 분석 결과',
    details: {
      basic: {
        success: true,
        executionTime: 1000,
        performance: 'good',
        errorCount: 0,
        warningCount: 0,
        outputSize: 150,
        outputType: 'text',
        hasErrors: false,
        hasWarnings: false,
        isLargeOutput: false,
        isFastExecution: true
      },
      detailed: {
        errorPatterns: [],
        warningPatterns: [],
        outputPatterns: [],
        securityIssues: [],
        optimizationOpportunities: [],
        outputMetrics: {
          lineCount: 4,
          wordCount: 15,
          characterCount: 150,
          uniqueWords: 8
        }
      },
      ai: {
        insights: ['테스트 인사이트'],
        bestPractices: ['테스트 베스트 프랙티스'],
        relatedCommands: ['test-command'],
        confidence: 0.9,
        riskAssessment: 'low',
        recommendations: ['테스트 권장사항']
      }
    },
    recommendations: ['테스트 권장사항'],
    nextSteps: ['테스트 다음 단계'],
    confidence: 0.9,
    metadata: {
      analyzer: 'task-master-cli',
      version: '1.0.0'
    },
    ...overrides
  };
};

/**
 * MCP 응답 스텁 생성
 */
export const createMCPResponseStub = (overrides = {}) => {
  return {
    success: true,
    data: {
      id: 'test_id',
      message: '테스트 메시지'
    },
    telemetryData: {
      timestamp: new Date().toISOString(),
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150,
      totalCost: 0.001
    },
    ...overrides
  };
};

/**
 * CLI 옵션 스텁 생성
 */
export const createCLIOptionsStub = (overrides = {}) => {
  return {
    file: '.taskmaster/tasks/tasks.json',
    tag: 'master',
    format: 'json',
    verbose: false,
    quiet: false,
    ...overrides
  };
};

/**
 * 스파이 함수 생성
 */
export const createSpy = (target, method) => {
  return jest.spyOn(target, method);
};

/**
 * 모킹된 함수 호출 검증
 */
export const verifyMockCalls = (mockFn, expectedCalls) => {
  expect(mockFn).toHaveBeenCalledTimes(expectedCalls.length);
  
  expectedCalls.forEach((expectedCall, index) => {
    if (Array.isArray(expectedCall)) {
      expect(mockFn).toHaveBeenNthCalledWith(index + 1, ...expectedCall);
    } else {
      expect(mockFn).toHaveBeenNthCalledWith(index + 1, expectedCall);
    }
  });
};

/**
 * 모킹된 함수 호출 인수 검증
 */
export const verifyMockCallArgs = (mockFn, callIndex, expectedArgs) => {
  const calls = mockFn.mock.calls;
  expect(calls.length).toBeGreaterThan(callIndex);
  
  if (Array.isArray(expectedArgs)) {
    expect(calls[callIndex]).toEqual(expectedArgs);
  } else {
    expect(calls[callIndex]).toEqual([expectedArgs]);
  }
};

/**
 * 모킹된 함수 반환값 검증
 */
export const verifyMockReturnValue = (mockFn, callIndex, expectedReturn) => {
  const results = mockFn.mock.results;
  expect(results.length).toBeGreaterThan(callIndex);
  expect(results[callIndex].value).toEqual(expectedReturn);
};

/**
 * 모든 모킹 초기화
 */
export const resetAllMocks = () => {
  jest.clearAllMocks();
  jest.resetAllMocks();
  jest.restoreAllMocks();
};
