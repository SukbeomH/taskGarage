/**
 * test-helpers.js
 * 테스트에서 공통적으로 사용할 헬퍼 함수들
 * 모킹 설정, 테스트 데이터 생성, 검증 함수 등
 */

import { jest } from '@jest/globals';
import path from 'path';
import fs from 'fs/promises';

/**
 * 테스트용 임시 디렉토리 생성
 */
export const createTempDir = async () => {
  const tempDir = path.join(process.cwd(), 'tests', 'temp', `test-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
};

/**
 * 테스트용 임시 디렉토리 정리
 */
export const cleanupTempDir = async (tempDir) => {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    // 정리 실패는 무시
    console.warn(`Failed to cleanup temp dir: ${error.message}`);
  }
};

/**
 * 파일 시스템 모킹 설정
 */
export const setupFileSystemMocks = () => {
  const mockFs = {
    writeFile: jest.fn(),
    readFile: jest.fn(),
    mkdir: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    access: jest.fn(),
    rm: jest.fn(),
    copyFile: jest.fn(),
    rename: jest.fn()
  };

  jest.mock('fs/promises', () => mockFs);
  return mockFs;
};

/**
 * child_process 모킹 설정
 */
export const setupChildProcessMocks = () => {
  const mockSpawn = jest.fn();
  const mockChild = {
    stdout: {
      on: jest.fn(),
      pipe: jest.fn()
    },
    stderr: {
      on: jest.fn(),
      pipe: jest.fn()
    },
    on: jest.fn(),
    kill: jest.fn()
  };

  mockSpawn.mockReturnValue(mockChild);
  
  jest.mock('child_process', () => ({
    spawn: mockSpawn
  }));

  return { mockSpawn, mockChild };
};

/**
 * path 모킹 설정
 */
export const setupPathMocks = () => {
  const mockPath = {
    join: jest.fn((...args) => args.join('/')),
    dirname: jest.fn((filePath) => filePath.split('/').slice(0, -1).join('/')),
    extname: jest.fn((filePath) => {
      const ext = filePath.split('.').pop();
      return ext && ext !== filePath ? `.${ext}` : '';
    }),
    basename: jest.fn((filePath) => filePath.split('/').pop()),
    resolve: jest.fn((...args) => args.join('/'))
  };

  jest.mock('path', () => mockPath);
  return mockPath;
};

/**
 * AI 서비스 모킹 설정
 */
export const setupAIServiceMocks = () => {
  const mockGenerateTextService = jest.fn();
  const mockGenerateObjectService = jest.fn();

  jest.mock('../../scripts/modules/ai-services-unified.js', () => ({
    generateTextService: mockGenerateTextService,
    generateObjectService: mockGenerateObjectService
  }));

  return { mockGenerateTextService, mockGenerateObjectService };
};

/**
 * 시간 관련 모킹 설정
 */
export const setupTimeMocks = () => {
  const mockDate = new Date('2024-01-01T00:00:00Z');
  const mockGetTime = jest.fn(() => mockDate.getTime());
  
  jest.spyOn(Date.prototype, 'getTime').mockImplementation(mockGetTime);
  jest.spyOn(Date, 'now').mockImplementation(() => mockDate.getTime());
  
  return { mockDate, mockGetTime };
};

/**
 * 로거 모킹 설정
 */
export const setupLoggerMocks = () => {
  const mockLog = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  };

  jest.mock('../../scripts/modules/utils.js', () => ({
    log: mockLog
  }));

  return mockLog;
};

/**
 * MCP 로그 래퍼 모킹 설정
 */
export const setupMCPLogMocks = () => {
  const mockMCPLog = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  };

  return mockMCPLog;
};

/**
 * 스크립트 실행 결과 모킹 헬퍼
 */
export const mockScriptExecution = (options = {}) => {
  const {
    success = true,
    exitCode = 0,
    stdout = 'test output',
    stderr = '',
    duration = 1000,
    error = null
  } = options;

  const mockChild = {
    stdout: {
      on: jest.fn((event, callback) => {
        if (event === 'data') {
          callback(stdout);
        }
        if (event === 'end') {
          callback();
        }
        return mockChild.stdout;
      }),
      pipe: jest.fn()
    },
    stderr: {
      on: jest.fn((event, callback) => {
        if (event === 'data') {
          callback(stderr);
        }
        if (event === 'end') {
          callback();
        }
        return mockChild.stderr;
      }),
      pipe: jest.fn()
    },
    on: jest.fn((event, callback) => {
      if (event === 'close') {
        setTimeout(() => callback(exitCode), 10);
      }
      return mockChild;
    }),
    kill: jest.fn()
  };

  return mockChild;
};

/**
 * AI 분석 응답 모킹 헬퍼
 */
export const mockAIAnalysisResponse = (options = {}) => {
  const {
    success = true,
    insights = ['테스트 인사이트'],
    recommendations = ['테스트 권장사항'],
    confidence = 0.9
  } = options;

  if (success) {
    return {
      mainResult: {
        object: {
          insights,
          bestPractices: ['테스트 베스트 프랙티스'],
          relatedCommands: ['test-command'],
          confidence,
          riskAssessment: 'low',
          recommendations
        }
      },
      telemetryData: {
        timestamp: new Date().toISOString(),
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        totalCost: 0.001
      }
    };
  } else {
    throw new Error('AI 분석 실패');
  }
};

/**
 * 파일 시스템 응답 모킹 헬퍼
 */
export const mockFileSystemResponse = (options = {}) => {
  const {
    success = true,
    content = 'test content',
    exists = true,
    isDirectory = false
  } = options;

  if (success) {
    return {
      writeFile: Promise.resolve(),
      readFile: Promise.resolve(content),
      mkdir: Promise.resolve(),
      readdir: Promise.resolve(['file1.txt', 'file2.txt']),
      stat: Promise.resolve({
        isDirectory: () => isDirectory,
        isFile: () => !isDirectory,
        size: content.length
      }),
      access: exists ? Promise.resolve() : Promise.reject(new Error('File not found'))
    };
  } else {
    return {
      writeFile: Promise.reject(new Error('Write failed')),
      readFile: Promise.reject(new Error('Read failed')),
      mkdir: Promise.reject(new Error('Mkdir failed')),
      readdir: Promise.reject(new Error('Readdir failed')),
      stat: Promise.reject(new Error('Stat failed')),
      access: Promise.reject(new Error('Access failed'))
    };
  }
};

/**
 * 테스트 데이터 검증 헬퍼
 */
export const validateScriptResult = (result) => {
  expect(result).toHaveProperty('id');
  expect(result).toHaveProperty('command');
  expect(result).toHaveProperty('workingDirectory');
  expect(result).toHaveProperty('startTime');
  expect(result).toHaveProperty('endTime');
  expect(result).toHaveProperty('duration');
  expect(result).toHaveProperty('exitCode');
  expect(result).toHaveProperty('success');
  expect(result).toHaveProperty('stdout');
  expect(result).toHaveProperty('stderr');
  expect(result).toHaveProperty('metadata');
  
  expect(typeof result.id).toBe('string');
  expect(typeof result.command).toBe('string');
  expect(typeof result.workingDirectory).toBe('string');
  expect(typeof result.startTime).toBe('number');
  expect(typeof result.endTime).toBe('number');
  expect(typeof result.duration).toBe('number');
  expect(typeof result.success).toBe('boolean');
  expect(typeof result.stdout).toBe('string');
  expect(typeof result.stderr).toBe('string');
  expect(typeof result.metadata).toBe('object');
};

/**
 * 분석 결과 검증 헬퍼
 */
export const validateAnalysisResult = (result) => {
  expect(result).toHaveProperty('id');
  expect(result).toHaveProperty('scriptResultId');
  expect(result).toHaveProperty('analysisType');
  expect(result).toHaveProperty('timestamp');
  expect(result).toHaveProperty('summary');
  expect(result).toHaveProperty('details');
  expect(result).toHaveProperty('recommendations');
  expect(result).toHaveProperty('nextSteps');
  expect(result).toHaveProperty('confidence');
  expect(result).toHaveProperty('metadata');
  
  expect(typeof result.id).toBe('string');
  expect(typeof result.scriptResultId).toBe('string');
  expect(typeof result.analysisType).toBe('string');
  expect(typeof result.timestamp).toBe('number');
  expect(typeof result.summary).toBe('string');
  expect(typeof result.details).toBe('object');
  expect(Array.isArray(result.recommendations)).toBe(true);
  expect(Array.isArray(result.nextSteps)).toBe(true);
  expect(typeof result.confidence).toBe('number');
  expect(typeof result.metadata).toBe('object');
};

/**
 * 보고서 검증 헬퍼
 */
export const validateReport = (report, format) => {
  expect(typeof report).toBe('string');
  expect(report.length).toBeGreaterThan(0);
  
  if (format === 'markdown') {
    expect(report).toContain('#');
    expect(report).toContain('##');
  } else if (format === 'html') {
    expect(report).toContain('<!DOCTYPE html>');
    expect(report).toContain('<html');
  } else if (format === 'json') {
    expect(() => JSON.parse(report)).not.toThrow();
  }
};

/**
 * 에러 검증 헬퍼
 */
export const validateError = (error, expectedMessage = null, expectedCode = null) => {
  expect(error).toBeInstanceOf(Error);
  
  if (expectedMessage) {
    expect(error.message).toContain(expectedMessage);
  }
  
  if (expectedCode) {
    expect(error.code).toBe(expectedCode);
  }
};

/**
 * 비동기 함수 실행 헬퍼
 */
export const runAsyncTest = async (testFn, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Test timeout'));
    }, timeout);

    testFn()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

/**
 * 테스트 환경 정리 헬퍼
 */
export const cleanupTestEnvironment = async () => {
  // 모든 모킹 초기화
  jest.clearAllMocks();
  jest.resetAllMocks();
  
  // 임시 파일 정리
  try {
    const tempDir = path.join(process.cwd(), 'tests', 'temp');
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    // 정리 실패는 무시
  }
};

/**
 * 테스트 설정 헬퍼
 */
export const setupTestEnvironment = () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestEnvironment();
  });
};

/**
 * 모킹된 함수 호출 검증 헬퍼
 */
export const expectMockCalledWith = (mockFn, expectedCalls) => {
  expect(mockFn).toHaveBeenCalledTimes(expectedCalls.length);
  
  expectedCalls.forEach((expectedCall, index) => {
    if (Array.isArray(expectedCall)) {
      expect(mockFn).toHaveBeenNthCalledWith(index + 1, ...expectedCall);
    } else {
      expect(mockFn).toHaveBeenNthCalledWith(index + 1, expectedCall);
    }
  });
};
