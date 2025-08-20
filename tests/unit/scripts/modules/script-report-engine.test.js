/**
 * script-report-engine.test.js
 * 스크립트 보고서 생성 엔진 단위 테스트
 * ReportTemplate, ReportGenerator, generateScriptReport 클래스 및 함수 테스트
 */

import { jest } from '@jest/globals';
import { 
  ReportTemplate, 
  ReportGenerator, 
  generateScriptReport,
  getSupportedReportFormats,
  getSupportedReportTemplates
} from '../../../../scripts/modules/script-report-engine.js';
import { 
  sampleSuccessfulScriptResult,
  sampleFailedScriptResult,
  sampleTimeoutScriptResult,
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
  validateReport,
  createTempDir,
  cleanupTempDir
} from '../../../utils/test-helpers.js';
import path from 'path';

// 파일 시스템 모킹 - 실제 파일 시스템 사용을 위해 제거
// jest.mock('fs/promises', () => ({
//   writeFile: jest.fn(),
//   mkdir: jest.fn(),
//   readFile: jest.fn()
// }));

// path 모듈 모킹 - 실제 path 모듈 사용을 위해 제거
// jest.mock('path', () => ({
//   dirname: jest.fn((path) => path.split('/').slice(0, -1).join('/')),
//   extname: jest.fn((path) => {
//     const ext = path.split('.').pop();
//     return ext === path ? '' : `.${ext}`;
//   })
// }));

// 테스트 환경 설정
setupTestEnvironment();

describe('ReportTemplate', () => {
  let template;

  beforeEach(() => {
    template = new ReportTemplate();
  });

  describe('생성자', () => {
    test('기본값으로 초기화되어야 함', () => {
      expect(template.name).toBe('');
      expect(template.description).toBe('');
      expect(template.format).toBe('markdown');
      expect(template.content).toBe('');
      expect(template.variables).toEqual([]);
      expect(template.metadata).toEqual({});
    });
  });

  describe('validate', () => {
    test('유효한 템플릿을 검증해야 함', () => {
      template.name = 'test-template';
      template.description = 'Test template';
      template.format = 'markdown';
      template.content = 'Test content';

      const isValid = template.validate();
      expect(isValid).toBe(true);
    });

    test('필수 필드가 없으면 유효하지 않아야 함', () => {
      template.name = '';
      template.content = 'Test content';

      const isValid = template.validate();
      expect(isValid).toBe(false);
    });

    test('지원하지 않는 형식을 거부해야 함', () => {
      template.name = 'test-template';
      template.format = 'invalid-format';
      template.content = 'Test content';

      const isValid = template.validate();
      expect(isValid).toBe(false);
    });
  });

  describe('render', () => {
    test('변수를 치환하여 템플릿을 렌더링해야 함', () => {
      template.content = 'Hello {{name}}, your script {{scriptId}} {{status}}';
      template.variables = ['name', 'scriptId', 'status'];

      const data = {
        name: 'User',
        scriptId: 'script_001',
        status: 'succeeded'
      };

      const rendered = template.render(data);

      expect(rendered).toBe('Hello User, your script script_001 succeeded');
    });

    test('존재하지 않는 변수를 빈 문자열로 치환해야 함', () => {
      template.content = 'Hello {{name}}, status: {{status}}';
      template.variables = ['name', 'status'];

      const data = { name: 'User' };

      const rendered = template.render(data);

      expect(rendered).toBe('Hello User, status: ');
    });

    test('변수가 없으면 원본 내용을 반환해야 함', () => {
      template.content = 'Static content without variables';

      const data = {};

      const rendered = template.render(data);

      expect(rendered).toBe('Static content without variables');
    });
  });

  describe('toJSON', () => {
    test('모든 속성을 포함한 JSON 객체를 반환해야 함', () => {
      template.name = 'test-template';
      template.description = 'Test template';
      template.format = 'markdown';
      template.content = 'Test content';
      template.variables = ['var1', 'var2'];
      template.metadata = { author: 'test' };

      const json = template.toJSON();

      expect(json).toEqual({
        name: 'test-template',
        description: 'Test template',
        format: 'markdown',
        content: 'Test content',
        variables: ['var1', 'var2'],
        metadata: { author: 'test' }
      });
    });
  });
});

describe('ReportGenerator', () => {
  let generator;
  let tempDir;

  beforeEach(async () => {
    tempDir = await createTempDir();
    generator = new ReportGenerator();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
    jest.clearAllMocks();
  });

  describe('생성자', () => {
    test('기본 템플릿과 설정으로 초기화되어야 함', () => {
      expect(generator.templates).toBeInstanceOf(Map);
      expect(generator.templates.size).toBeGreaterThan(0);
      expect(generator.defaultFormat).toBe('markdown');
      expect(generator.defaultTemplate).toBe('default');
    });
  });

  describe('registerTemplate', () => {
    test('새 템플릿을 등록해야 함', () => {
      const template = new ReportTemplate();
      template.name = 'custom-template';
      template.format = 'markdown';
      template.content = 'Custom content';

      generator.registerTemplate(template);

      expect(generator.templates.has('custom-template')).toBe(true);
      expect(generator.templates.get('custom-template')).toBe(template);
    });

    test('기존 템플릿을 덮어써야 함', () => {
      const template1 = new ReportTemplate();
      template1.name = 'test-template';
      template1.content = 'Original content';

      const template2 = new ReportTemplate();
      template2.name = 'test-template';
      template2.content = 'Updated content';

      generator.registerTemplate(template1);
      generator.registerTemplate(template2);

      const registered = generator.templates.get('test-template');
      expect(registered.content).toBe('Updated content');
    });

    test('유효하지 않은 템플릿을 거부해야 함', () => {
      const template = new ReportTemplate();
      template.name = '';
      template.content = 'Invalid template';

      expect(() => generator.registerTemplate(template)).toThrow('Invalid template');
    });
  });

  describe('getTemplate', () => {
    test('존재하는 템플릿을 반환해야 함', () => {
      const template = generator.getTemplate('default', 'markdown');
      expect(template).toBeInstanceOf(ReportTemplate);
      expect(template.name).toBe('default');
      expect(template.format).toBe('markdown');
    });

    test('존재하지 않는 템플릿은 null을 반환해야 함', () => {
      const template = generator.getTemplate('nonexistent', 'markdown');
      expect(template).toBeNull();
    });

    test('지원하지 않는 형식은 null을 반환해야 함', () => {
      const template = generator.getTemplate('default', 'invalid-format');
      expect(template).toBeNull();
    });
  });

  describe('getSupportedFormats', () => {
    test('지원하는 모든 형식을 반환해야 함', () => {
      const formats = generator.getSupportedFormats();
      expect(formats).toContain('markdown');
      expect(formats).toContain('html');
      expect(formats).toContain('json');
    });
  });

  describe('getSupportedTemplates', () => {
    test('지정된 형식의 모든 템플릿을 반환해야 함', () => {
      const templates = generator.getSupportedTemplates('markdown');
      expect(templates).toContain('default');
      expect(templates).toContain('detailed');
      expect(templates).toContain('summary');
    });

    test('지원하지 않는 형식은 빈 배열을 반환해야 함', () => {
      const templates = generator.getSupportedTemplates('invalid-format');
      expect(templates).toEqual([]);
    });
  });

  describe('generateReport', () => {
    test('마크다운 보고서를 생성해야 함', () => {
      const scriptResult = {
        id: 'script_001',
        command: 'ls -la',
        success: true,
        duration: 1000,
        stdout: 'file1.txt\nfile2.txt',
        stderr: '',
        exitCode: 0,
        startTime: 1000,
        endTime: 2000
      };

      const analysisResult = {
        id: 'analysis_001',
        analysisType: 'comprehensive',
        summary: '스크립트가 성공적으로 실행되었습니다',
        details: {
          basic: sampleBasicAnalysisSuccess,
          detailed: sampleDetailedAnalysisSuccess,
          ai: sampleAIAnalysisSuccess
        },
        recommendations: ['정기적인 모니터링을 권장합니다'],
        nextSteps: ['스크립트 실행 결과를 문서화하세요'],
        confidence: 0.95
      };

      const options = {
        format: 'markdown',
        template: 'default',
        includeDetails: true,
        includeAnalysis: true,
        includeRecommendations: true,
        includeNextSteps: true,
        metadata: { generatedBy: 'test' }
      };

      const report = generator.generateReport(scriptResult, analysisResult, options);

      expect(report).toContain('# 스크립트 실행 보고서');
      expect(report).toContain('script_001');
      expect(report).toContain('ls -la');
      expect(report).toContain('성공');
      expect(report).toContain('1000ms');
      expect(report).toContain('정기적인 모니터링을 권장합니다');
      expect(report).toContain('스크립트 실행 결과를 문서화하세요');
      expect(report).toContain('Task Master CLI');
    });

    test('HTML 보고서를 생성해야 함', () => {
      const scriptResult = {
        id: 'script_001',
        command: 'ls -la',
        success: true,
        duration: 1000,
        stdout: 'file1.txt\nfile2.txt',
        stderr: '',
        exitCode: 0
      };

      const analysisResult = {
        id: 'analysis_001',
        analysisType: 'comprehensive',
        summary: '스크립트가 성공적으로 실행되었습니다',
        details: {
          basic: sampleBasicAnalysisSuccess,
          detailed: sampleDetailedAnalysisSuccess,
          ai: sampleAIAnalysisSuccess
        },
        recommendations: ['정기적인 모니터링을 권장합니다'],
        nextSteps: ['스크립트 실행 결과를 문서화하세요'],
        confidence: 0.95
      };

      const options = {
        format: 'html',
        template: 'default',
        includeDetails: true,
        includeAnalysis: true,
        includeRecommendations: true,
        includeNextSteps: true,
        customStyles: { backgroundColor: '#f0f0f0' }
      };

      const report = generator.generateReport(scriptResult, analysisResult, options);

      expect(report).toContain('<!DOCTYPE html>');
      expect(report).toContain('<html lang="ko">');
      expect(report).toContain('<title>스크립트 실행 보고서 - script_001</title>');
      expect(report).toContain('<h1>스크립트 실행 보고서</h1>');
      expect(report).toContain('script_001');
      expect(report).toContain('ls -la');
      expect(report).toContain('성공');
      expect(report).toContain('정기적인 모니터링을 권장합니다');
      expect(report).toContain('background-color: #f5f5f5');
    });

    test('JSON 보고서를 생성해야 함', () => {
      const scriptResult = {
        id: 'script_001',
        command: 'ls -la',
        success: true,
        duration: 1000,
        stdout: 'file1.txt\nfile2.txt',
        stderr: '',
        exitCode: 0,
        startTime: 1000,
        endTime: 2000
      };

      const analysisResult = {
        id: 'analysis_001',
        analysisType: 'comprehensive',
        summary: '스크립트가 성공적으로 실행되었습니다',
        details: {
          basic: sampleBasicAnalysisSuccess,
          detailed: sampleDetailedAnalysisSuccess,
          ai: sampleAIAnalysisSuccess
        },
        recommendations: ['정기적인 모니터링을 권장합니다'],
        nextSteps: ['스크립트 실행 결과를 문서화하세요'],
        confidence: 0.95
      };

      const options = {
        format: 'json',
        template: 'default',
        includeDetails: true,
        includeAnalysis: true,
        includeRecommendations: true,
        includeNextSteps: true,
        metadata: { generatedBy: 'test' }
      };

      const report = generator.generateReport(scriptResult, analysisResult, options);

      const jsonReport = JSON.parse(report);
      expect(jsonReport.metadata).toHaveProperty('generatedAt');
      expect(jsonReport.metadata).toHaveProperty('reportId');
      expect(jsonReport.metadata).toHaveProperty('scriptId');
      expect(jsonReport.metadata).toHaveProperty('format');
      expect(jsonReport.scriptResult).toHaveProperty('id', 'script_001');
      expect(jsonReport.scriptResult).toHaveProperty('command', 'ls -la');
      expect(jsonReport.scriptResult).toHaveProperty('success', true);
      expect(jsonReport.analysis).toHaveProperty('id', 'analysis_001');
      expect(jsonReport.analysis).toHaveProperty('analysisType', 'comprehensive');
    });

    test('분석 결과가 없어도 보고서를 생성해야 함', () => {
      const scriptResult = {
        id: 'script_001',
        command: 'ls -la',
        success: true,
        duration: 1000,
        stdout: 'file1.txt\nfile2.txt',
        stderr: '',
        exitCode: 0
      };

      const options = {
        format: 'markdown',
        template: 'default',
        includeDetails: true,
        includeAnalysis: false,
        includeRecommendations: false,
        includeNextSteps: false
      };

      const report = generator.generateReport(scriptResult, null, options);

      expect(report).toContain('# 스크립트 실행 보고서');
      expect(report).toContain('script_001');
      expect(report).toContain('ls -la');
      expect(report).not.toContain('분석 결과');
      expect(report).not.toContain('권장사항');
      expect(report).not.toContain('다음 단계');
    });

    test('상세 정보를 제외한 보고서를 생성해야 함', () => {
      const scriptResult = {
        id: 'script_001',
        command: 'ls -la',
        success: true,
        duration: 1000,
        stdout: 'file1.txt\nfile2.txt',
        stderr: '',
        exitCode: 0
      };

      const analysisResult = {
        id: 'analysis_001',
        analysisType: 'comprehensive',
        summary: '스크립트가 성공적으로 실행되었습니다',
        details: {
          basic: sampleBasicAnalysisSuccess,
          detailed: sampleDetailedAnalysisSuccess,
          ai: sampleAIAnalysisSuccess
        },
        recommendations: ['정기적인 모니터링을 권장합니다'],
        nextSteps: ['스크립트 실행 결과를 문서화하세요'],
        confidence: 0.95
      };

      const options = {
        format: 'markdown',
        template: 'default',
        includeDetails: false,
        includeAnalysis: true,
        includeRecommendations: true,
        includeNextSteps: true
      };

      const report = generator.generateReport(scriptResult, analysisResult, options);

      expect(report).toContain('# 스크립트 실행 보고서');
      expect(report).toContain('script_001');
      expect(report).toContain('ls -la');
      expect(report).not.toContain('## 실행 세부사항');
      expect(report).toContain('## 분석 결과');
      expect(report).toContain('## 권장사항');
      expect(report).toContain('## 다음 단계');
    });

    test('요약 템플릿을 사용한 보고서를 생성해야 함', () => {
      const scriptResult = {
        id: 'script_001',
        command: 'ls -la',
        success: true,
        duration: 1000,
        stdout: 'file1.txt\nfile2.txt',
        stderr: '',
        exitCode: 0
      };

      const analysisResult = {
        id: 'analysis_001',
        analysisType: 'comprehensive',
        summary: '스크립트가 성공적으로 실행되었습니다',
        details: {
          basic: sampleBasicAnalysisSuccess,
          detailed: sampleDetailedAnalysisSuccess,
          ai: sampleAIAnalysisSuccess
        },
        recommendations: ['정기적인 모니터링을 권장합니다'],
        nextSteps: ['스크립트 실행 결과를 문서화하세요'],
        confidence: 0.95
      };

      const options = {
        format: 'markdown',
        template: 'summary',
        includeDetails: true,
        includeAnalysis: true,
        includeRecommendations: true,
        includeNextSteps: true
      };

      const report = generator.generateReport(scriptResult, analysisResult, options);

      expect(report).toContain('# 스크립트 실행 요약');
      expect(report).toContain('script_001');
      expect(report).toContain('ls -la');
      expect(report).toContain('성공');
      expect(report).toContain('1000ms');
    });
  });

  describe('saveReport', () => {
    test('보고서를 파일로 저장해야 함', async () => {
      const report = '# Test Report\nThis is a test report.';
      const outputPath = path.join(tempDir, 'test-report.md');

      await generator.saveReport(report, outputPath, 'markdown');

      // 파일이 실제로 생성되었는지 확인
      const fs = await import('fs/promises');
      const fileContent = await fs.readFile(outputPath, 'utf8');
      expect(fileContent).toBe(report);
    });

    test('파일명이 없으면 자동으로 생성해야 함', async () => {
      const report = '# Test Report\nThis is a test report.';
      const outputPath = path.join(tempDir, 'test');

      await generator.saveReport(report, outputPath, 'markdown');

      // 파일이 실제로 생성되었는지 확인
      const fs = await import('fs/promises');
      const fileContent = await fs.readFile(outputPath + '.md', 'utf8');
      expect(fileContent).toBe(report);
    });

    test('저장 디렉토리가 없으면 생성해야 함', async () => {
      const report = '# Test Report\nThis is a test report.';
      const outputPath = path.join(tempDir, 'subdir', 'test-report.md');

      await generator.saveReport(report, outputPath, 'markdown');

      // 파일이 실제로 생성되었는지 확인
      const fs = await import('fs/promises');
      const fileContent = await fs.readFile(outputPath, 'utf8');
      expect(fileContent).toBe(report);
    });

    test('저장 실패를 처리해야 함', async () => {
      const report = '# Test Report\nThis is a test report.';
      const outputPath = '/invalid/path/test-report.md';

      await expect(generator.saveReport(report, outputPath, 'markdown')).rejects.toThrow();
    });
  });
});

describe('편의 함수들', () => {
  describe('generateScriptReport', () => {
    test('스크립트 보고서를 생성해야 함', async () => {
      const scriptResult = {
        id: 'script_001',
        command: 'ls -la',
        success: true,
        duration: 1000,
        stdout: 'file1.txt\nfile2.txt',
        stderr: '',
        exitCode: 0
      };

      const analysisResult = {
        id: 'analysis_001',
        analysisType: 'comprehensive',
        summary: '스크립트가 성공적으로 실행되었습니다',
        details: {
          basic: sampleBasicAnalysisSuccess,
          detailed: sampleDetailedAnalysisSuccess,
          ai: sampleAIAnalysisSuccess
        },
        recommendations: ['정기적인 모니터링을 권장합니다'],
        nextSteps: ['스크립트 실행 결과를 문서화하세요'],
        confidence: 0.95
      };

      const options = {
        format: 'markdown',
        template: 'default',
        outputPath: null,
        includeDetails: true,
        includeAnalysis: true,
        includeRecommendations: true,
        includeNextSteps: true,
        customStyles: {},
        metadata: { generatedBy: 'test' }
      };

      const report = await generateScriptReport(scriptResult, analysisResult, options);

      expect(report).toContain('# 스크립트 실행 보고서');
      expect(report).toContain('script_001');
      expect(report).toContain('ls -la');
      expect(report).toContain('성공');
      expect(report).toContain('정기적인 모니터링을 권장합니다');
      validateReport(report, 'markdown');
    });

    test('파일로 저장하는 옵션을 처리해야 함', async () => {

      const scriptResult = {
        id: 'script_001',
        command: 'ls -la',
        success: true,
        duration: 1000,
        stdout: 'file1.txt\nfile2.txt',
        stderr: '',
        exitCode: 0
      };

      const analysisResult = {
        id: 'analysis_001',
        analysisType: 'comprehensive',
        summary: '스크립트가 성공적으로 실행되었습니다',
        details: {
          basic: sampleBasicAnalysisSuccess,
          detailed: sampleDetailedAnalysisSuccess,
          ai: sampleAIAnalysisSuccess
        },
        recommendations: ['정기적인 모니터링을 권장합니다'],
        nextSteps: ['스크립트 실행 결과를 문서화하세요'],
        confidence: 0.95
      };

      const options = {
        format: 'markdown',
        template: 'default',
        outputPath: '/tmp/test-report.md',
        includeDetails: true,
        includeAnalysis: true,
        includeRecommendations: true,
        includeNextSteps: true,
        customStyles: {},
        metadata: { generatedBy: 'test' }
      };

      const report = await generateScriptReport(scriptResult, analysisResult, options);

      expect(report).toContain('# 스크립트 실행 보고서');
      // 파일 저장 확인 - 실제 파일 시스템 사용
      const fs = await import('fs/promises');
      const savedContent = await fs.readFile('/tmp/test-report.md', 'utf8');
      expect(savedContent).toBe(report);
    });

    test('분석 결과가 없어도 보고서를 생성해야 함', async () => {
      const scriptResult = {
        id: 'script_001',
        command: 'ls -la',
        success: true,
        duration: 1000,
        stdout: 'file1.txt\nfile2.txt',
        stderr: '',
        exitCode: 0
      };

      const options = {
        format: 'markdown',
        template: 'default',
        outputPath: null,
        includeDetails: true,
        includeAnalysis: false,
        includeRecommendations: false,
        includeNextSteps: false,
        customStyles: {},
        metadata: { generatedBy: 'test' }
      };

      const report = await generateScriptReport(scriptResult, null, options);

      expect(report).toContain('# 스크립트 실행 보고서');
      expect(report).toContain('script_001');
      expect(report).toContain('ls -la');
      expect(report).not.toContain('분석 결과');
      expect(report).not.toContain('권장사항');
      expect(report).not.toContain('다음 단계');
    });

    test('HTML 형식의 보고서를 생성해야 함', async () => {
      const scriptResult = {
        id: 'script_001',
        command: 'ls -la',
        success: true,
        duration: 1000,
        stdout: 'file1.txt\nfile2.txt',
        stderr: '',
        exitCode: 0
      };

      const analysisResult = {
        id: 'analysis_001',
        analysisType: 'comprehensive',
        summary: '스크립트가 성공적으로 실행되었습니다',
        details: {
          basic: sampleBasicAnalysisSuccess,
          detailed: sampleDetailedAnalysisSuccess,
          ai: sampleAIAnalysisSuccess
        },
        recommendations: ['정기적인 모니터링을 권장합니다'],
        nextSteps: ['스크립트 실행 결과를 문서화하세요'],
        confidence: 0.95
      };

      const options = {
        format: 'html',
        template: 'default',
        outputPath: null,
        includeDetails: true,
        includeAnalysis: true,
        includeRecommendations: true,
        includeNextSteps: true,
        customStyles: { backgroundColor: '#f0f0f0' },
        metadata: { generatedBy: 'test' }
      };

      const report = await generateScriptReport(scriptResult, analysisResult, options);

      expect(report).toContain('<!DOCTYPE html>');
      expect(report).toContain('<html lang="ko">');
      expect(report).toContain('<title>스크립트 실행 보고서 - script_001</title>');
      expect(report).toContain('<h1>스크립트 실행 보고서</h1>');
      expect(report).toContain('script_001');
      expect(report).toContain('background-color: #f5f5f5');
      validateReport(report, 'html');
    });

    test('JSON 형식의 보고서를 생성해야 함', async () => {
      const scriptResult = {
        id: 'script_001',
        command: 'ls -la',
        success: true,
        duration: 1000,
        stdout: 'file1.txt\nfile2.txt',
        stderr: '',
        exitCode: 0,
        startTime: 1000,
        endTime: 2000
      };

      const analysisResult = {
        id: 'analysis_001',
        analysisType: 'comprehensive',
        summary: '스크립트가 성공적으로 실행되었습니다',
        details: {
          basic: sampleBasicAnalysisSuccess,
          detailed: sampleDetailedAnalysisSuccess,
          ai: sampleAIAnalysisSuccess
        },
        recommendations: ['정기적인 모니터링을 권장합니다'],
        nextSteps: ['스크립트 실행 결과를 문서화하세요'],
        confidence: 0.95
      };

      const options = {
        format: 'json',
        template: 'default',
        outputPath: null,
        includeDetails: true,
        includeAnalysis: true,
        includeRecommendations: true,
        includeNextSteps: true,
        customStyles: {},
        metadata: { generatedBy: 'test' }
      };

      const report = await generateScriptReport(scriptResult, analysisResult, options);

      const jsonReport = JSON.parse(report);
      expect(jsonReport.metadata).toHaveProperty('generatedAt');
      expect(jsonReport.metadata).toHaveProperty('reportId');
      expect(jsonReport.metadata).toHaveProperty('scriptId');
      expect(jsonReport.metadata).toHaveProperty('format');
      expect(jsonReport.scriptResult).toHaveProperty('id', 'script_001');
      expect(jsonReport.scriptResult).toHaveProperty('command', 'ls -la');
      expect(jsonReport.scriptResult).toHaveProperty('success', true);
      expect(jsonReport.analysis).toHaveProperty('id', 'analysis_001');
      expect(jsonReport.analysis).toHaveProperty('analysisType', 'comprehensive');
      validateReport(report, 'json');
    });
  });

  describe('getSupportedReportFormats', () => {
    test('지원하는 모든 형식을 반환해야 함', () => {
      const formats = getSupportedReportFormats();
      expect(formats).toContain('markdown');
      expect(formats).toContain('html');
      expect(formats).toContain('json');
    });
  });

  describe('getSupportedReportTemplates', () => {
    test('지정된 형식의 모든 템플릿을 반환해야 함', () => {
      const templates = getSupportedReportTemplates('markdown');
      expect(templates).toContain('default');
      expect(templates).toContain('detailed');
      expect(templates).toContain('summary');
    });

    test('지원하지 않는 형식은 빈 배열을 반환해야 함', () => {
      const templates = getSupportedReportTemplates('invalid-format');
      expect(templates).toEqual([]);
    });
  });
});

describe('통합 테스트', () => {
  test('전체 보고서 생성 워크플로우가 정상적으로 작동해야 함', async () => {
    const scriptResult = {
      id: 'script_001',
      command: 'ls -la',
      success: true,
      duration: 1000,
      stdout: 'file1.txt\nfile2.txt\nJSON: {"count": 2}',
      stderr: 'Warning: deprecated option used',
      exitCode: 0,
      startTime: 1000,
      endTime: 2000
    };

    const analysisResult = {
      id: 'analysis_001',
      analysisType: 'comprehensive',
      summary: '스크립트가 성공적으로 실행되었습니다',
      details: {
        basic: sampleBasicAnalysisSuccess,
        detailed: sampleDetailedAnalysisSuccess,
        ai: sampleAIAnalysisSuccess
      },
      recommendations: ['정기적인 모니터링을 권장합니다', 'JSON 파싱을 고려해보세요'],
      nextSteps: ['스크립트 실행 결과를 문서화하세요', '정기적인 성능 모니터링을 설정하세요'],
      confidence: 0.95
    };



    // 마크다운 보고서 생성
    const markdownOptions = {
      format: 'markdown',
      template: 'default',
      outputPath: '/tmp/test-report.md',
      includeDetails: true,
      includeAnalysis: true,
      includeRecommendations: true,
      includeNextSteps: true,
      customStyles: {},
      metadata: { generatedBy: 'test' }
    };

    const markdownReport = await generateScriptReport(scriptResult, analysisResult, markdownOptions);

    expect(markdownReport).toContain('# 스크립트 실행 보고서');
    expect(markdownReport).toContain('script_001');
    expect(markdownReport).toContain('ls -la');
    expect(markdownReport).toContain('성공');
    expect(markdownReport).toContain('1000ms');
    expect(markdownReport).toContain('정기적인 모니터링을 권장합니다');
    expect(markdownReport).toContain('JSON 파싱을 고려해보세요');
    expect(markdownReport).toContain('스크립트 실행 결과를 문서화하세요');
    expect(markdownReport).toContain('정기적인 성능 모니터링을 설정하세요');
    validateReport(markdownReport, 'markdown');

    // HTML 보고서 생성
    const htmlOptions = {
      format: 'html',
      template: 'default',
      outputPath: null,
      includeDetails: true,
      includeAnalysis: true,
      includeRecommendations: true,
      includeNextSteps: true,
      customStyles: { backgroundColor: '#f0f0f0', color: '#333' },
      metadata: { generatedBy: 'test' }
    };

    const htmlReport = await generateScriptReport(scriptResult, analysisResult, htmlOptions);

    expect(htmlReport).toContain('<!DOCTYPE html>');
    expect(htmlReport).toContain('<html lang="ko">');
    expect(htmlReport).toContain('<title>스크립트 실행 보고서 - script_001</title>');
    expect(htmlReport).toContain('<h1>스크립트 실행 보고서</h1>');
    expect(htmlReport).toContain('script_001');
    expect(htmlReport).toContain('background-color: #f5f5f5');
    validateReport(htmlReport, 'html');

    // JSON 보고서 생성
    const jsonOptions = {
      format: 'json',
      template: 'default',
      outputPath: null,
      includeDetails: true,
      includeAnalysis: true,
      includeRecommendations: true,
      includeNextSteps: true,
      customStyles: {},
      metadata: { generatedBy: 'test' }
    };

    const jsonReport = await generateScriptReport(scriptResult, analysisResult, jsonOptions);

    const parsedJsonReport = JSON.parse(jsonReport);
    expect(parsedJsonReport.metadata).toHaveProperty('generatedAt');
    expect(parsedJsonReport.metadata).toHaveProperty('reportId');
    expect(parsedJsonReport.metadata).toHaveProperty('scriptId', 'script_001');
    expect(parsedJsonReport.metadata).toHaveProperty('format', 'json');
    expect(parsedJsonReport.scriptResult).toHaveProperty('id', 'script_001');
    expect(parsedJsonReport.scriptResult).toHaveProperty('command', 'ls -la');
    expect(parsedJsonReport.scriptResult).toHaveProperty('success', true);
    expect(parsedJsonReport.analysis).toHaveProperty('id', 'analysis_001');
    expect(parsedJsonReport.analysis).toHaveProperty('analysisType', 'comprehensive');
    expect(parsedJsonReport.analysis).toHaveProperty('recommendations');
    expect(parsedJsonReport.analysis).toHaveProperty('nextSteps');
    validateReport(jsonReport, 'json');

    // 파일 저장 확인 - 실제 파일 시스템 사용
    const fs = await import('fs/promises');
    const savedContent = await fs.readFile('/tmp/test-report.md', 'utf8');
    expect(savedContent).toBe(markdownReport);
  });
});
