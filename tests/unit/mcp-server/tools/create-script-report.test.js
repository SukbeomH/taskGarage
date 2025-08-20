/**
 * create-script-report.test.js
 * create-script-report MCP 도구 테스트
 * MCP 도구 등록, 파라미터 검증, 직접 함수 호출, 에러 처리 테스트
 */

import { jest } from '@jest/globals';
import { registerCreateScriptReportTool } from '../../../../../mcp-server/src/tools/create-script-report.js';
import { createScriptReportDirect } from '../../../../../mcp-server/src/core/direct-functions/create-script-report.js';
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
  sampleMarkdownReportSuccess,
  sampleHTMLReportSuccess,
  sampleJSONReportSuccess,
  allReportSamples
} from '../../../fixtures/sample-reports.js';
import {
  setupTestEnvironment,
  setupMCPLogMocks,
  createMCPResponseStub,
  verifyMockCalls
} from '../../../utils/test-helpers.js';

// 직접 함수 모킹
jest.mock('../../../../../mcp-server/src/core/direct-functions/create-script-report.js', () => ({
  createScriptReportDirect: jest.fn()
}));

// 스크립트 실행 엔진 모킹
jest.mock('../../../../../scripts/modules/script-execution-engine.js', () => ({
  getScriptResult: jest.fn()
}));

// 스크립트 분석 엔진 모킹
jest.mock('../../../../../scripts/modules/script-analysis-engine.js', () => ({
  getAnalysis: jest.fn()
}));

// 보고서 생성 엔진 모킹
jest.mock('../../../../../scripts/modules/script-report-engine.js', () => ({
  generateScriptReport: jest.fn(),
  getSupportedReportFormats: jest.fn(),
  getSupportedReportTemplates: jest.fn()
}));

// 테스트 환경 설정
setupTestEnvironment();

describe('create-script-report MCP 도구', () => {
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
    createScriptReportDirect.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('도구 등록', () => {
    test('도구가 올바르게 등록되어야 함', () => {
      registerCreateScriptReportTool(mockServer);

      expect(mockServer.addTool).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'create_script_report',
          description: expect.stringContaining('스크립트 실행 결과를 다양한 형식'),
          parameters: expect.any(Object),
          execute: expect.any(Function)
        })
      );
    });

    test('도구 파라미터 스키마가 올바르게 정의되어야 함', () => {
      registerCreateScriptReportTool(mockServer);

      const toolCall = mockServer.addTool.mock.calls[0][0];
      const schema = toolCall.parameters;

      // 필수 파라미터 검증
      expect(schema.shape).toHaveProperty('scriptResultId');
      expect(schema.shape).toHaveProperty('projectRoot');

      // 선택적 파라미터 검증
      expect(schema.shape).toHaveProperty('analysisResultId');
      expect(schema.shape).toHaveProperty('format');
      expect(schema.shape).toHaveProperty('template');
      expect(schema.shape).toHaveProperty('outputPath');
      expect(schema.shape).toHaveProperty('includeDetails');
      expect(schema.shape).toHaveProperty('includeAnalysis');
      expect(schema.shape).toHaveProperty('includeRecommendations');
      expect(schema.shape).toHaveProperty('includeNextSteps');
      expect(schema.shape).toHaveProperty('customStyles');
      expect(schema.shape).toHaveProperty('metadata');
    });
  });

  describe('도구 실행', () => {
    let toolExecute;

    beforeEach(() => {
      registerCreateScriptReportTool(mockServer);
      toolExecute = mockServer.addTool.mock.calls[0][0].execute;
    });

    test('성공적인 마크다운 보고서 생성을 처리해야 함', async () => {
      const args = {
        scriptResultId: 'script_001',
        analysisResultId: 'analysis_001',
        format: 'markdown',
        template: 'default',
        outputPath: '/tmp/test-report.md',
        includeDetails: true,
        includeAnalysis: true,
        includeRecommendations: true,
        includeNextSteps: true,
        projectRoot: '/test/project'
      };

      const expectedResponse = {
        success: true,
        data: {
          scriptResultId: 'script_001',
          analysisResultId: 'analysis_001',
          format: 'markdown',
          template: 'default',
          outputPath: '/tmp/test-report.md',
          reportLength: 1500,
          generatedAt: expect.any(String),
          savedToFile: true,
          filePath: '/tmp/test-report.md',
          metadata: expect.any(Object)
        },
        report: sampleMarkdownReportSuccess
      };

      createScriptReportDirect.mockResolvedValue(expectedResponse);

      const result = await toolExecute(args, { log: mockLog, session: mockSession });

      expect(createScriptReportDirect).toHaveBeenCalledWith(
        args,
        mockLog,
        { session: mockSession }
      );

      expect(result).toEqual(expectedResponse);
      expect(mockLog.info).toHaveBeenCalledWith(
        expect.stringContaining('Creating script report for: script_001')
      );
    });

    test('HTML 보고서 생성을 처리해야 함', async () => {
      const args = {
        scriptResultId: 'script_001',
        analysisResultId: 'analysis_001',
        format: 'html',
        template: 'default',
        outputPath: '/tmp/test-report.html',
        includeDetails: true,
        includeAnalysis: true,
        includeRecommendations: true,
        includeNextSteps: true,
        customStyles: { backgroundColor: '#f0f0f0' },
        projectRoot: '/test/project'
      };

      const expectedResponse = {
        success: true,
        data: {
          scriptResultId: 'script_001',
          analysisResultId: 'analysis_001',
          format: 'html',
          template: 'default',
          outputPath: '/tmp/test-report.html',
          reportLength: 2000,
          generatedAt: expect.any(String),
          savedToFile: true,
          filePath: '/tmp/test-report.html',
          metadata: expect.any(Object)
        },
        report: sampleHTMLReportSuccess
      };

      createScriptReportDirect.mockResolvedValue(expectedResponse);

      const result = await toolExecute(args, { log: mockLog, session: mockSession });

      expect(result).toEqual(expectedResponse);
    });

    test('JSON 보고서 생성을 처리해야 함', async () => {
      const args = {
        scriptResultId: 'script_001',
        analysisResultId: 'analysis_001',
        format: 'json',
        template: 'default',
        outputPath: null, // 파일로 저장하지 않음
        includeDetails: true,
        includeAnalysis: true,
        includeRecommendations: true,
        includeNextSteps: true,
        projectRoot: '/test/project'
      };

      const expectedResponse = {
        success: true,
        data: {
          scriptResultId: 'script_001',
          analysisResultId: 'analysis_001',
          format: 'json',
          template: 'default',
          outputPath: null,
          reportLength: 800,
          generatedAt: expect.any(String),
          savedToFile: false,
          metadata: expect.any(Object)
        },
        report: JSON.stringify(sampleJSONReportSuccess)
      };

      createScriptReportDirect.mockResolvedValue(expectedResponse);

      const result = await toolExecute(args, { log: mockLog, session: mockSession });

      expect(result).toEqual(expectedResponse);
    });

    test('분석 결과 없이 보고서를 생성해야 함', async () => {
      const args = {
        scriptResultId: 'script_001',
        // analysisResultId 누락
        format: 'markdown',
        template: 'default',
        outputPath: null,
        includeDetails: true,
        includeAnalysis: false,
        includeRecommendations: false,
        includeNextSteps: false,
        projectRoot: '/test/project'
      };

      const expectedResponse = {
        success: true,
        data: {
          scriptResultId: 'script_001',
          analysisResultId: null,
          format: 'markdown',
          template: 'default',
          outputPath: null,
          reportLength: 800,
          generatedAt: expect.any(String),
          savedToFile: false,
          metadata: expect.any(Object)
        },
        report: '# 스크립트 실행 보고서\n\n## 개요\n- 스크립트 ID: script_001\n- 명령어: ls -la\n- 상태: 성공\n\n*이 보고서는 Task Master CLI에 의해 자동 생성되었습니다.*'
      };

      createScriptReportDirect.mockResolvedValue(expectedResponse);

      const result = await toolExecute(args, { log: mockLog, session: mockSession });

      expect(result).toEqual(expectedResponse);
    });

    test('보고서 생성 실패를 처리해야 함', async () => {
      const args = {
        scriptResultId: 'nonexistent',
        analysisResultId: 'analysis_001',
        format: 'markdown',
        template: 'default',
        outputPath: '/tmp/test-report.md',
        includeDetails: true,
        includeAnalysis: true,
        includeRecommendations: true,
        includeNextSteps: true,
        projectRoot: '/test/project'
      };

      const errorResponse = {
        success: false,
        error: {
          code: 'SCRIPT_RESULT_NOT_FOUND',
          message: 'Script result not found: nonexistent'
        }
      };

      createScriptReportDirect.mockResolvedValue(errorResponse);

      const result = await toolExecute(args, { log: mockLog, session: mockSession });

      expect(result).toEqual(errorResponse);
      expect(mockLog.error).toHaveBeenCalledWith(
        expect.stringContaining('Script result not found')
      );
    });

    test('직접 함수 에러를 처리해야 함', async () => {
      const args = {
        scriptResultId: 'script_001',
        analysisResultId: 'analysis_001',
        format: 'markdown',
        template: 'default',
        outputPath: '/tmp/test-report.md',
        includeDetails: true,
        includeAnalysis: true,
        includeRecommendations: true,
        includeNextSteps: true,
        projectRoot: '/test/project'
      };

      const error = new Error('Report generation failed');
      createScriptReportDirect.mockRejectedValue(error);

      const result = await toolExecute(args, { log: mockLog, session: mockSession });

      expect(result).toEqual({
        success: false,
        error: {
          code: 'SCRIPT_REPORT_CREATION_ERROR',
          message: 'Report generation failed'
        }
      });

      expect(mockLog.error).toHaveBeenCalledWith(
        expect.stringContaining('Error in create_script_report')
      );
    });

    test('지원하지 않는 형식을 처리해야 함', async () => {
      const args = {
        scriptResultId: 'script_001',
        analysisResultId: 'analysis_001',
        format: 'invalid-format',
        template: 'default',
        outputPath: '/tmp/test-report.invalid',
        includeDetails: true,
        includeAnalysis: true,
        includeRecommendations: true,
        includeNextSteps: true,
        projectRoot: '/test/project'
      };

      const errorResponse = {
        success: false,
        error: {
          code: 'UNSUPPORTED_FORMAT',
          message: 'Unsupported report format: invalid-format'
        }
      };

      createScriptReportDirect.mockResolvedValue(errorResponse);

      const result = await toolExecute(args, { log: mockLog, session: mockSession });

      expect(result).toEqual(errorResponse);
    });
  });

  describe('파라미터 검증', () => {
    let toolExecute;

    beforeEach(() => {
      registerCreateScriptReportTool(mockServer);
      toolExecute = mockServer.addTool.mock.calls[0][0].execute;
    });

    test('필수 파라미터가 누락되면 에러를 반환해야 함', async () => {
      const args = {
        // scriptResultId 누락
        format: 'markdown',
        template: 'default',
        projectRoot: '/test/project'
      };

      const result = await toolExecute(args, { log: mockLog, session: mockSession });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('MISSING_REQUIRED_PARAMETER');
    });

    test('프로젝트 루트가 없으면 기본값을 사용해야 함', async () => {
      const args = {
        scriptResultId: 'script_001',
        analysisResultId: 'analysis_001',
        format: 'markdown',
        template: 'default'
        // projectRoot 누락
      };

      const expectedResponse = {
        success: true,
        data: {
          scriptResultId: 'script_001',
          analysisResultId: 'analysis_001',
          format: 'markdown',
          template: 'default',
          outputPath: null,
          reportLength: 1500,
          generatedAt: expect.any(String),
          savedToFile: false,
          metadata: expect.any(Object)
        },
        report: sampleMarkdownReportSuccess
      };

      createScriptReportDirect.mockResolvedValue(expectedResponse);

      const result = await toolExecute(args, { log: mockLog, session: mockSession });

      expect(createScriptReportDirect).toHaveBeenCalledWith(
        expect.objectContaining({
          projectRoot: process.cwd()
        }),
        mockLog,
        { session: mockSession }
      );

      expect(result).toEqual(expectedResponse);
    });

    test('기본값이 올바르게 적용되어야 함', async () => {
      const args = {
        scriptResultId: 'script_001'
        // 다른 파라미터들은 기본값 사용
      };

      const expectedResponse = {
        success: true,
        data: {
          scriptResultId: 'script_001',
          analysisResultId: null,
          format: 'markdown',
          template: 'default',
          outputPath: null,
          reportLength: 1500,
          generatedAt: expect.any(String),
          savedToFile: false,
          metadata: expect.any(Object)
        },
        report: sampleMarkdownReportSuccess
      };

      createScriptReportDirect.mockResolvedValue(expectedResponse);

      const result = await toolExecute(args, { log: mockLog, session: mockSession });

      expect(createScriptReportDirect).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'markdown',
          template: 'default',
          includeDetails: true,
          includeAnalysis: true,
          includeRecommendations: true,
          includeNextSteps: true
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
      registerCreateScriptReportTool(mockServer);
      toolExecute = mockServer.addTool.mock.calls[0][0].execute;
    });

    test('사용자 정의 메타데이터를 포함해야 함', async () => {
      const args = {
        scriptResultId: 'script_001',
        analysisResultId: 'analysis_001',
        format: 'markdown',
        template: 'default',
        outputPath: null,
        includeDetails: true,
        includeAnalysis: true,
        includeRecommendations: true,
        includeNextSteps: true,
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
          analysisResultId: 'analysis_001',
          format: 'markdown',
          template: 'default',
          outputPath: null,
          reportLength: 1500,
          generatedAt: expect.any(String),
          savedToFile: false,
          metadata: expect.objectContaining({
            customField: 'customValue',
            priority: 'high',
            sessionId: 'test-session-001',
            generatedBy: 'task-master-cli'
          })
        },
        report: sampleMarkdownReportSuccess
      };

      createScriptReportDirect.mockResolvedValue(expectedResponse);

      const result = await toolExecute(args, { log: mockLog, session: mockSession });

      expect(createScriptReportDirect).toHaveBeenCalledWith(
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

describe('createScriptReportDirect 직접 함수', () => {
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
    const scriptReportEngine = require('../../../../../scripts/modules/script-report-engine.js');

    scriptExecutionEngine.getScriptResult.mockClear();
    scriptAnalysisEngine.getAnalysis.mockClear();
    scriptReportEngine.generateScriptReport.mockClear();
    scriptReportEngine.getSupportedReportFormats.mockClear();
    scriptReportEngine.getSupportedReportTemplates.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('스크립트 결과를 찾지 못하면 에러를 반환해야 함', async () => {
    const args = {
      scriptResultId: 'nonexistent',
      analysisResultId: 'analysis_001',
      format: 'markdown',
      template: 'default',
      outputPath: null,
      includeDetails: true,
      includeAnalysis: true,
      includeRecommendations: true,
      includeNextSteps: true,
      projectRoot: '/test/project'
    };

    const scriptExecutionEngine = require('../../../../../scripts/modules/script-execution-engine.js');
    scriptExecutionEngine.getScriptResult.mockReturnValue(null);

    const result = await createScriptReportDirect(args, mockLog, { session: mockSession });

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('SCRIPT_RESULT_NOT_FOUND');
    expect(result.error.message).toContain('nonexistent');
  });

  test('분석 결과를 찾지 못하면 경고를 로그하고 계속 진행해야 함', async () => {
    const args = {
      scriptResultId: 'script_001',
      analysisResultId: 'nonexistent',
      format: 'markdown',
      template: 'default',
      outputPath: null,
      includeDetails: true,
      includeAnalysis: true,
      includeRecommendations: true,
      includeNextSteps: true,
      projectRoot: '/test/project'
    };

    const scriptExecutionEngine = require('../../../../../scripts/modules/script-execution-engine.js');
    const scriptAnalysisEngine = require('../../../../../scripts/modules/script-analysis-engine.js');
    const scriptReportEngine = require('../../../../../scripts/modules/script-report-engine.js');

    scriptExecutionEngine.getScriptResult.mockReturnValue(sampleSuccessfulScriptResult);
    scriptAnalysisEngine.getAnalysis.mockReturnValue(null);
    scriptReportEngine.generateScriptReport.mockResolvedValue(sampleMarkdownReportSuccess);

    const result = await createScriptReportDirect(args, mockLog, { session: mockSession });

    expect(mockLog.warn).toHaveBeenCalledWith(
      expect.stringContaining('Analysis result not found: nonexistent')
    );
    expect(result.success).toBe(true);
  });

  test('지원하지 않는 형식을 거부해야 함', async () => {
    const args = {
      scriptResultId: 'script_001',
      analysisResultId: 'analysis_001',
      format: 'invalid-format',
      template: 'default',
      outputPath: null,
      includeDetails: true,
      includeAnalysis: true,
      includeRecommendations: true,
      includeNextSteps: true,
      projectRoot: '/test/project'
    };

    const scriptExecutionEngine = require('../../../../../scripts/modules/script-execution-engine.js');
    const scriptReportEngine = require('../../../../../scripts/modules/script-report-engine.js');

    scriptExecutionEngine.getScriptResult.mockReturnValue(sampleSuccessfulScriptResult);
    scriptReportEngine.getSupportedReportFormats.mockReturnValue(['markdown', 'html', 'json']);

    const result = await createScriptReportDirect(args, mockLog, { session: mockSession });

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('UNSUPPORTED_FORMAT');
    expect(result.error.message).toContain('invalid-format');
  });

  test('지원하지 않는 템플릿을 기본값으로 대체해야 함', async () => {
    const args = {
      scriptResultId: 'script_001',
      analysisResultId: 'analysis_001',
      format: 'markdown',
      template: 'nonexistent-template',
      outputPath: null,
      includeDetails: true,
      includeAnalysis: true,
      includeRecommendations: true,
      includeNextSteps: true,
      projectRoot: '/test/project'
    };

    const scriptExecutionEngine = require('../../../../../scripts/modules/script-execution-engine.js');
    const scriptAnalysisEngine = require('../../../../../scripts/modules/script-analysis-engine.js');
    const scriptReportEngine = require('../../../../../scripts/modules/script-report-engine.js');

    scriptExecutionEngine.getScriptResult.mockReturnValue(sampleSuccessfulScriptResult);
    scriptAnalysisEngine.getAnalysis.mockReturnValue(sampleComprehensiveAnalysisSuccess);
    scriptReportEngine.getSupportedReportFormats.mockReturnValue(['markdown', 'html', 'json']);
    scriptReportEngine.getSupportedReportTemplates.mockReturnValue(['default', 'detailed', 'summary']);
    scriptReportEngine.generateScriptReport.mockResolvedValue(sampleMarkdownReportSuccess);

    const result = await createScriptReportDirect(args, mockLog, { session: mockSession });

    expect(mockLog.warn).toHaveBeenCalledWith(
      expect.stringContaining("Template 'nonexistent-template' not found")
    );
    expect(result.success).toBe(true);
  });

  test('보고서 생성 엔진 에러를 처리해야 함', async () => {
    const args = {
      scriptResultId: 'script_001',
      analysisResultId: 'analysis_001',
      format: 'markdown',
      template: 'default',
      outputPath: null,
      includeDetails: true,
      includeAnalysis: true,
      includeRecommendations: true,
      includeNextSteps: true,
      projectRoot: '/test/project'
    };

    const scriptExecutionEngine = require('../../../../../scripts/modules/script-execution-engine.js');
    const scriptAnalysisEngine = require('../../../../../scripts/modules/script-analysis-engine.js');
    const scriptReportEngine = require('../../../../../scripts/modules/script-report-engine.js');

    scriptExecutionEngine.getScriptResult.mockReturnValue(sampleSuccessfulScriptResult);
    scriptAnalysisEngine.getAnalysis.mockReturnValue(sampleComprehensiveAnalysisSuccess);
    scriptReportEngine.getSupportedReportFormats.mockReturnValue(['markdown', 'html', 'json']);
    scriptReportEngine.getSupportedReportTemplates.mockReturnValue(['default', 'detailed', 'summary']);
    scriptReportEngine.generateScriptReport.mockRejectedValue(new Error('Report generation failed'));

    const result = await createScriptReportDirect(args, mockLog, { session: mockSession });

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('SCRIPT_REPORT_CREATION_ERROR');
    expect(result.error.message).toContain('Report generation failed');
  });

  test('성공적인 보고서 생성을 수행해야 함', async () => {
    const args = {
      scriptResultId: 'script_001',
      analysisResultId: 'analysis_001',
      format: 'markdown',
      template: 'default',
      outputPath: '/tmp/test-report.md',
      includeDetails: true,
      includeAnalysis: true,
      includeRecommendations: true,
      includeNextSteps: true,
      projectRoot: '/test/project',
      metadata: {
        customField: 'customValue'
      }
    };

    const scriptExecutionEngine = require('../../../../../scripts/modules/script-execution-engine.js');
    const scriptAnalysisEngine = require('../../../../../scripts/modules/script-analysis-engine.js');
    const scriptReportEngine = require('../../../../../scripts/modules/script-report-engine.js');

    scriptExecutionEngine.getScriptResult.mockReturnValue(sampleSuccessfulScriptResult);
    scriptAnalysisEngine.getAnalysis.mockReturnValue(sampleComprehensiveAnalysisSuccess);
    scriptReportEngine.getSupportedReportFormats.mockReturnValue(['markdown', 'html', 'json']);
    scriptReportEngine.getSupportedReportTemplates.mockReturnValue(['default', 'detailed', 'summary']);
    scriptReportEngine.generateScriptReport.mockResolvedValue(sampleMarkdownReportSuccess);

    const result = await createScriptReportDirect(args, mockLog, { session: mockSession });

    expect(result.success).toBe(true);
    expect(result.data.scriptResultId).toBe('script_001');
    expect(result.data.analysisResultId).toBe('analysis_001');
    expect(result.data.format).toBe('markdown');
    expect(result.data.template).toBe('default');
    expect(result.data.outputPath).toBe('/tmp/test-report.md');
    expect(result.data.savedToFile).toBe(true);
    expect(result.data.filePath).toBe('/tmp/test-report.md');
    expect(result.data.metadata).toHaveProperty('customField', 'customValue');
    expect(result.data.metadata).toHaveProperty('sessionId', 'test-session-001');
    expect(result.report).toBe(sampleMarkdownReportSuccess);
  });
});
