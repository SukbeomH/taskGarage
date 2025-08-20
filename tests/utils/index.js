/**
 * index.js
 * 모든 테스트 유틸리티를 한 곳에서 export
 */

// 테스트 헬퍼 함수들
export * from './test-helpers.js';

// 모킹 유틸리티들
export * from './mock-utilities.js';

// 편의 함수들
export const setupAllMocks = () => {
  const {
    setupFileSystemMocks,
    setupChildProcessMocks,
    setupPathMocks,
    setupAIServiceMocks,
    setupTimeMocks,
    setupLoggerMocks
  } = require('./test-helpers.js');

  const {
    mockScriptExecutionEngine,
    mockScriptAnalysisEngine,
    mockScriptReportEngine,
    mockMCPTools,
    mockCLICommands,
    mockFileSystem,
    mockPath,
    mockChildProcess,
    mockConsole,
    mockProcess
  } = require('./mock-utilities.js');

  // 모든 모킹 설정
  const fsMocks = setupFileSystemMocks();
  const cpMocks = setupChildProcessMocks();
  const pathMocks = setupPathMocks();
  const aiMocks = setupAIServiceMocks();
  const timeMocks = setupTimeMocks();
  const logMocks = setupLoggerMocks();

  const scriptEngineMocks = mockScriptExecutionEngine();
  const analysisEngineMocks = mockScriptAnalysisEngine();
  const reportEngineMocks = mockScriptReportEngine();
  const mcpMocks = mockMCPTools();
  const cliMocks = mockCLICommands();
  const fileSystemMocks = mockFileSystem();
  const pathModuleMocks = mockPath();
  const childProcessMocks = mockChildProcess();
  const consoleMocks = mockConsole();
  const processMocks = mockProcess();

  return {
    // 기본 모킹
    fsMocks,
    cpMocks,
    pathMocks,
    aiMocks,
    timeMocks,
    logMocks,
    
    // 엔진 모킹
    scriptEngineMocks,
    analysisEngineMocks,
    reportEngineMocks,
    
    // 도구 모킹
    mcpMocks,
    cliMocks,
    
    // 시스템 모킹
    fileSystemMocks,
    pathModuleMocks,
    childProcessMocks,
    consoleMocks,
    processMocks,
    
    // 정리 함수
    cleanup: () => {
      consoleMocks.restore();
      processMocks.restore();
      require('./test-helpers.js').cleanupTestEnvironment();
    }
  };
};

// 테스트 환경 설정 헬퍼
export const setupTestEnvironment = () => {
  const { setupTestEnvironment: setupEnv } = require('./test-helpers.js');
  setupEnv();
};

// 모킹 검증 헬퍼
export const verifyAllMocks = (mocks) => {
  const { verifyMockCalls } = require('./mock-utilities.js');
  
  // 모든 모킹된 함수가 호출되었는지 확인
  Object.values(mocks).forEach(mockGroup => {
    if (typeof mockGroup === 'object' && mockGroup !== null) {
      Object.values(mockGroup).forEach(mock => {
        if (jest.isMockFunction(mock)) {
          expect(mock).toHaveBeenCalled();
        }
      });
    }
  });
};
