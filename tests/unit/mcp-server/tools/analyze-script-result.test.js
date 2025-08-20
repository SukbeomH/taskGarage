/**
 * analyze-script-result.test.js
 * analyze-script-result MCP 도구 테스트
 * MCP 도구 등록, 파라미터 검증, 직접 함수 호출, 에러 처리 테스트
 */

import { jest } from '@jest/globals';
import { registerAnalyzeScriptResultTool } from '../../../../../mcp-server/src/tools/analyze-script-result.js';
import { analyzeScriptResultDirect } from '../../../../../mcp-server/src/core/direct-functions/analyze-script-result.js';
import { 
  sampleSuccessfulScriptResult,
  sampleFailedScriptResult,
  allScriptResultSamples
} from '../../../fixtures/sample-script-results.js';
import {
  sampleBasicAnalysisSuccess,
  sampleDetailedAnalysisSuccess,
  sampleAIAnalysisSuccess,
  sampleComprehensiveAnalysisSuccess,
  allAnalysisResultSamples
} from '../../../fixtures/sample-analysis-results.js';
import {
  setupTestEnvironment,
  setupMCPLogMocks,
  createMCPResponseStub,
  verifyMockCalls
} from '../../../utils/test-helpers.js';

// 직접 함수 모킹
jest.mock('../../../../../mcp-server/src/core/direct-functions/analyze-script-result.js', () => ({
  analyzeScriptResultDirect: jest.fn()
}));

// 스크립트 실행 엔진 모킹
jest.mock('../../../../../scripts/modules/script-execution-engine.js', () => ({
  getScriptResult: jest.fn()
}));

// 스크립트 분석 엔진 모킹
jest.mock('../../../../../scripts/modules/script-analysis-engine.js', () => ({
  getAnalysis: jest.fn()
}));

// 테스트 환경 설정
setupTestEnvironment();

describe('analyze-script-result MCP 도구', () => {
  let mockServer;
  let mockLog;
  let mockSession;

  beforeEach(() => {
    // MCP 서버 모킹
    mockServer = {
      addTool: jest.fn()
    };

    // 로거 모킹
    mockLog = setupMCPLogMocks();

    // 세션 모킹
    mockSession = {
      id: 'test-session-001',
      user: 'test-user'
    };

    // 직접 함수 모킹 초기화
    analyzeScriptResultDirect.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('도구 등록', () => {
    test('도구가 올바르게 등록되어야 함', () => {
      registerAnalyzeScriptResultTool(mockServer);

      expect(mockServer.addTool).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'analyze_script_result',
          description: expect.stringContaining('스크립트 실행 결과를 분석'),
          parameters: expect.any(Object),
          execute: expect.any(Function)
        })
      );
    });

    test('도구 파라미터 스키마가 올바르게 정의되어야 함', () => {
      registerAnalyzeScriptResultTool(mockServer);

      const toolCall = mockServer.addTool.mock.calls[0][0];
      const schema = toolCall.parameters;

      // 필수 파라미터 검증
      expect(schema.shape).toHaveProperty('scriptResultId');
      expect(schema.shape).toHaveProperty('analysisType');
      expect(schema.shape).toHaveProperty('projectRoot');

      // 선택적 파라미터 검증
      expect(schema.shape).toHaveProperty('includeBasic');
      expect(schema.shape).toHaveProperty('includeDetailed');
      expect(schema.shape).toHaveProperty('includeAI');
      expect(schema.shape).toHaveProperty('research');
      expect(schema.shape).toHaveProperty('metadata');
    });
  });

  describe('도구 실행', () => {
    let toolExecute;

    beforeEach(() => {
      registerAnalyzeScriptResultTool(mockServer);
      toolExecute = mockServer.addTool.mock.calls[0][0].execute;
    });

    test('성공적인 스크립트 분석을 처리해야 함', async () => {
      const args = {
        scriptResultId: 'script_001',
        analysisType: 'comprehensive',
        includeBasic: true,
        includeDetailed: true,
        includeAI: true,
        research: false,
        projectRoot: '/test/project'
      };

      const expectedResponse = {
        success: true,
        data: {
          scriptResultId: 'script_001',
          analysisType: 'comprehensive',
          analysisId: 'analysis_001',
          summary: '스크립트가 성공적으로 실행되었습니다',
          recommendations: ['정기적인 모니터링을 권장합니다'],
          nextSteps: ['스크립트 실행 결과를 문서화하세요'],
          confidence: 0.95,
          generatedAt: expect.any(String),
          metadata: expect.any(Object)
        },
        analysis: expect.any(Object)
      };

      analyzeScriptResultDirect.mockResolvedValue(expectedResponse);

      const result = await toolExecute(args, { log: mockLog, session: mockSession });

      expect(analyzeScriptResultDirect).toHaveBeenCalledWith(
        args,
        mockLog,
        { session: mockSession }
      );

      expect(result).toEqual(expectedResponse);
      expect(mockLog.info).toHaveBeenCalledWith(
        expect.stringContaining('Analyzing script result: script_001')
      );
    });

    test('기본 분석만 수행해야 함', async () => {
      const args = {
        scriptResultId: 'script_001',
        analysisType: 'basic',
        includeBasic: true,
        includeDetailed: false,
        includeAI: false,
        research: false,
        projectRoot: '/test/project'
      };

      const expectedResponse = {
        success: true,
        data: {
          scriptResultId: 'script_001',
          analysisType: 'basic',
          analysisId: 'analysis_001',
          summary: '기본 분석이 완료되었습니다',
          recommendations: [],
          nextSteps: [],
          confidence: 0.8,
          generatedAt: expect.any(String),
          metadata: expect.any(Object)
        },
        analysis: expect.any(Object)
      };

      analyzeScriptResultDirect.mockResolvedValue(expectedResponse);

      const result = await toolExecute(args, { log: mockLog, session: mockSession });

      expect(analyzeScriptResultDirect).toHaveBeenCalledWith(
        args,
        mockLog,
        { session: mockSession }
      );

      expect(result).toEqual(expectedResponse);
    });

    test('AI 분석을 포함한 포괄적 분석을 수행해야 함', async () => {
      const args = {
        scriptResultId: 'script_001',
        analysisType: 'comprehensive',
        includeBasic: true,
        includeDetailed: true,
        includeAI: true,
        research: true,
        projectRoot: '/test/project'
      };

      const expectedResponse = {
        success: true,
        data: {
          scriptResultId: 'script_001',
          analysisType: 'comprehensive',
          analysisId: 'analysis_001',
          summary: 'AI 기반 포괄적 분석이 완료되었습니다',
          recommendations: ['AI 권장사항 1', 'AI 권장사항 2'],
          nextSteps: ['AI 제안 단계 1', 'AI 제안 단계 2'],
          confidence: 0.95,
          generatedAt: expect.any(String),
          metadata: expect.any(Object)
        },
        analysis: expect.any(Object)
      };

      analyzeScriptResultDirect.mockResolvedValue(expectedResponse);

      const result = await toolExecute(args, { log: mockLog, session: mockSession });

      expect(analyzeScriptResultDirect).toHaveBeenCalledWith(
        args,
        mockLog,
        { session: mockSession }
      );

      expect(result).toEqual(expectedResponse);
    });

    test('분석 실패를 처리해야 함', async () => {
      const args = {
        scriptResultId: 'nonexistent',
        analysisType: 'comprehensive',
        includeBasic: true,
        includeDetailed: true,
        includeAI: true,
        research: false,
        projectRoot: '/test/project'
      };

      const errorResponse = {
        success: false,
        error: {
          code: 'SCRIPT_RESULT_NOT_FOUND',
          message: 'Script result not found: nonexistent'
        }
      };

      analyzeScriptResultDirect.mockResolvedValue(errorResponse);

      const result = await toolExecute(args, { log: mockLog, session: mockSession });

      expect(result).toEqual(errorResponse);
      expect(mockLog.error).toHaveBeenCalledWith(
        expect.stringContaining('Script result not found')
      );
    });

    test('직접 함수 에러를 처리해야 함', async () => {
      const args = {
        scriptResultId: 'script_001',
        analysisType: 'comprehensive',
        includeBasic: true,
        includeDetailed: true,
        includeAI: true,
        research: false,
        projectRoot: '/test/project'
      };

      const error = new Error('Analysis failed');
      analyzeScriptResultDirect.mockRejectedValue(error);

      const result = await toolExecute(args, { log: mockLog, session: mockSession });

      expect(result).toEqual({
        success: false,
        error: {
          code: 'SCRIPT_ANALYSIS_ERROR',
          message: 'Analysis failed'
        }
      });

      expect(mockLog.error).toHaveBeenCalledWith(
        expect.stringContaining('Error in analyze_script_result')
      );
    });

    test('잘못된 분석 타입을 처리해야 함', async () => {
      const args = {
        scriptResultId: 'script_001',
        analysisType: 'invalid-type',
        includeBasic: true,
        includeDetailed: true,
        includeAI: true,
        research: false,
        projectRoot: '/test/project'
      };

      const errorResponse = {
        success: false,
        error: {
          code: 'INVALID_ANALYSIS_TYPE',
          message: 'Invalid analysis type: invalid-type'
        }
      };

      analyzeScriptResultDirect.mockResolvedValue(errorResponse);

      const result = await toolExecute(args, { log: mockLog, session: mockSession });

      expect(result).toEqual(errorResponse);
    });
  });

  describe('파라미터 검증', () => {
    let toolExecute;

    beforeEach(() => {
      registerAnalyzeScriptResultTool(mockServer);
      toolExecute = mockServer.addTool.mock.calls[0][0].execute;
    });

    test('필수 파라미터가 누락되면 에러를 반환해야 함', async () => {
      const args = {
        // scriptResultId 누락
        analysisType: 'comprehensive',
        projectRoot: '/test/project'
      };

      const result = await toolExecute(args, { log: mockLog, session: mockSession });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('MISSING_REQUIRED_PARAMETER');
    });

    test('잘못된 분석 타입을 거부해야 함', async () => {
      const args = {
        scriptResultId: 'script_001',
        analysisType: 'invalid-type',
        projectRoot: '/test/project'
      };

      const result = await toolExecute(args, { log: mockLog, session: mockSession });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_ANALYSIS_TYPE');
    });

    test('프로젝트 루트가 없으면 기본값을 사용해야 함', async () => {
      const args = {
        scriptResultId: 'script_001',
        analysisType: 'comprehensive'
        // projectRoot 누락
      };

      const expectedResponse = {
        success: true,
        data: {
          scriptResultId: 'script_001',
          analysisType: 'comprehensive',
          analysisId: 'analysis_001',
          summary: '분석이 완료되었습니다',
          recommendations: [],
          nextSteps: [],
          confidence: 0.8,
          generatedAt: expect.any(String),
          metadata: expect.any(Object)
        },
        analysis: expect.any(Object)
      };

      analyzeScriptResultDirect.mockResolvedValue(expectedResponse);

      const result = await toolExecute(args, { log: mockLog, session: mockSession });

      expect(analyzeScriptResultDirect).toHaveBeenCalledWith(
        expect.objectContaining({
          projectRoot: process.cwd()
        }),
        mockLog,
        { session: mockSession }
      );

      expect(result).toEqual(expectedResponse);
    });
  });

  describe('메타데이터 처리', () => {
    let toolExecute;

    beforeEach(() => {
      registerAnalyzeScriptResultTool(mockServer);
      toolExecute = mockServer.addTool.mock.calls[0][0].execute;
    });

    test('사용자 정의 메타데이터를 포함해야 함', async () => {
      const args = {
        scriptResultId: 'script_001',
        analysisType: 'comprehensive',
        includeBasic: true,
        includeDetailed: true,
        includeAI: true,
        research: false,
        projectRoot: '/test/project',
        metadata: {
          customField: 'customValue',
          priority: 'high'
        }
      };

      const expectedResponse = {
        success: true,
        data: {
          scriptResultId: 'script_001',
          analysisType: 'comprehensive',
          analysisId: 'analysis_001',
          summary: '분석이 완료되었습니다',
          recommendations: [],
          nextSteps: [],
          confidence: 0.8,
          generatedAt: expect.any(String),
          metadata: expect.objectContaining({
            customField: 'customValue',
            priority: 'high',
            sessionId: 'test-session-001',
            generatedBy: 'task-master-cli'
          })
        },
        analysis: expect.any(Object)
      };

      analyzeScriptResultDirect.mockResolvedValue(expectedResponse);

      const result = await toolExecute(args, { log: mockLog, session: mockSession });

      expect(analyzeScriptResultDirect).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            customField: 'customValue',
            priority: 'high'
          })
        }),
        mockLog,
        { session: mockSession }
      );

      expect(result).toEqual(expectedResponse);
    });
  });
});

describe('analyzeScriptResultDirect 직접 함수', () => {
  let mockLog;
  let mockSession;

  beforeEach(() => {
    mockLog = setupMCPLogMocks();
    mockSession = {
      id: 'test-session-001',
      user: 'test-user'
    };

    // 모듈 모킹 초기화
    const scriptExecutionEngine = require('../../../../../scripts/modules/script-execution-engine.js');
    const scriptAnalysisEngine = require('../../../../../scripts/modules/script-analysis-engine.js');

    scriptExecutionEngine.getScriptResult.mockClear();
    scriptAnalysisEngine.getAnalysis.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('스크립트 결과를 찾지 못하면 에러를 반환해야 함', async () => {
    const args = {
      scriptResultId: 'nonexistent',
      analysisType: 'comprehensive',
      includeBasic: true,
      includeDetailed: true,
      includeAI: true,
      research: false,
      projectRoot: '/test/project'
    };

    const scriptExecutionEngine = require('../../../../../scripts/modules/script-execution-engine.js');
    scriptExecutionEngine.getScriptResult.mockReturnValue(null);

    const result = await analyzeScriptResultDirect(args, mockLog, { session: mockSession });

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('SCRIPT_RESULT_NOT_FOUND');
    expect(result.error.message).toContain('nonexistent');
  });

  test('잘못된 분석 타입을 거부해야 함', async () => {
    const args = {
      scriptResultId: 'script_001',
      analysisType: 'invalid-type',
      includeBasic: true,
      includeDetailed: true,
      includeAI: true,
      research: false,
      projectRoot: '/test/project'
    };

    const scriptExecutionEngine = require('../../../../../scripts/modules/script-execution-engine.js');
    scriptExecutionEngine.getScriptResult.mockReturnValue(sampleSuccessfulScriptResult);

    const result = await analyzeScriptResultDirect(args, mockLog, { session: mockSession });

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('INVALID_ANALYSIS_TYPE');
  });

  test('분석 엔진 에러를 처리해야 함', async () => {
    const args = {
      scriptResultId: 'script_001',
      analysisType: 'comprehensive',
      includeBasic: true,
      includeDetailed: true,
      includeAI: true,
      research: false,
      projectRoot: '/test/project'
    };

    const scriptExecutionEngine = require('../../../../../scripts/modules/script-execution-engine.js');
    const scriptAnalysisEngine = require('../../../../../scripts/modules/script-analysis-engine.js');

    scriptExecutionEngine.getScriptResult.mockReturnValue(sampleSuccessfulScriptResult);
    scriptAnalysisEngine.analyzeScriptResult.mockRejectedValue(new Error('Analysis engine error'));

    const result = await analyzeScriptResultDirect(args, mockLog, { session: mockSession });

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('SCRIPT_ANALYSIS_ERROR');
    expect(result.error.message).toContain('Analysis engine error');
  });

  test('성공적인 분석을 수행해야 함', async () => {
    const args = {
      scriptResultId: 'script_001',
      analysisType: 'comprehensive',
      includeBasic: true,
      includeDetailed: true,
      includeAI: true,
      research: false,
      projectRoot: '/test/project',
      metadata: {
        customField: 'customValue'
      }
    };

    const scriptExecutionEngine = require('../../../../../scripts/modules/script-execution-engine.js');
    const scriptAnalysisEngine = require('../../../../../scripts/modules/script-analysis-engine.js');

    scriptExecutionEngine.getScriptResult.mockReturnValue(sampleSuccessfulScriptResult);
    scriptAnalysisEngine.analyzeScriptResult.mockResolvedValue(sampleComprehensiveAnalysisSuccess);

    const result = await analyzeScriptResultDirect(args, mockLog, { session: mockSession });

    expect(result.success).toBe(true);
    expect(result.data.scriptResultId).toBe('script_001');
    expect(result.data.analysisType).toBe('comprehensive');
    expect(result.data.analysisId).toBe('analysis_001');
    expect(result.data.metadata).toHaveProperty('customField', 'customValue');
    expect(result.data.metadata).toHaveProperty('sessionId', 'test-session-001');
    expect(result.analysis).toBe(sampleComprehensiveAnalysisSuccess);
  });
});
