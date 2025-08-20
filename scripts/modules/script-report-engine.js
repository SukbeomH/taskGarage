/**
 * script-report-engine.js
 * 스크립트 실행 결과 보고서 생성 엔진
 * 마크다운, HTML, JSON 형식 지원
 */

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { log } from './utils.js';

/**
 * 보고서 템플릿 기본 클래스
 */
export class ReportTemplate {
  constructor(name = '', description = '') {
    this.name = name;
    this.description = description;
    this.format = 'markdown';
    this.content = '';
    this.variables = [];
    this.metadata = {};
  }

  /**
   * 템플릿 검증
   * @returns {boolean} 유효성 여부
   */
  validate() {
    if (!this.name || !this.content) {
      return false;
    }
    
    const supportedFormats = ['markdown', 'html', 'json'];
    if (!supportedFormats.includes(this.format)) {
      return false;
    }
    
    return true;
  }

  /**
   * 템플릿 렌더링
   * @param {Object} scriptResult - 스크립트 실행 결과 또는 데이터 객체
   * @param {Object} analysisResult - 분석 결과 (선택사항)
   * @param {ReportOptions} options - 보고서 옵션 (선택사항)
   * @returns {string} 렌더링된 템플릿
   */
  render(scriptResult, analysisResult, options) {
    let result = this.content;
    
    // 단일 데이터 객체로 전달된 경우 (테스트 호환성)
    if (scriptResult && typeof scriptResult === 'object' && !scriptResult.command) {
      const data = scriptResult;
      this.variables.forEach(variable => {
        const value = data[variable] || '';
        result = result.replace(new RegExp(`{{${variable}}}`, 'g'), value);
      });
      return result;
    }
    
    // 표준 매개변수로 전달된 경우
    this.variables.forEach(variable => {
      const value = this.getVariableValue(variable, scriptResult, analysisResult, options);
      result = result.replace(new RegExp(`{{${variable}}}`, 'g'), value || '');
    });
    
    return result;
  }

  /**
   * 변수 값 가져오기
   * @param {string} variable - 변수명
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {Object} analysisResult - 분석 결과
   * @param {Object} options - 옵션
   * @returns {string} 변수 값
   */
  getVariableValue(variable, scriptResult, analysisResult, options) {
    switch (variable) {
      case 'name':
        return scriptResult?.command || '';
      case 'scriptId':
        return scriptResult?.id || '';
      case 'status':
        return scriptResult?.success ? '성공' : '실패';
      default:
        return '';
    }
  }

  /**
   * JSON 변환
   * @returns {Object} JSON 객체
   */
  toJSON() {
    return {
      name: this.name,
      description: this.description,
      format: this.format,
      content: this.content,
      variables: this.variables,
      metadata: this.metadata
    };
  }
}

/**
 * 보고서 생성 옵션
 */
export class ReportOptions {
  constructor(options = {}) {
    this.format = options.format || 'markdown'; // 'markdown', 'html', 'json'
    this.outputPath = options.outputPath || null;
    this.template = options.template || 'default';
    this.includeDetails = options.includeDetails !== false; // 기본값: true
    this.includeAnalysis = options.includeAnalysis !== false; // 기본값: true
    this.includeRecommendations = options.includeRecommendations !== false; // 기본값: true
    this.includeNextSteps = options.includeNextSteps !== false; // 기본값: true
    this.customStyles = options.customStyles || {};
    this.metadata = options.metadata || {};
  }
}

/**
 * 마크다운 보고서 생성기
 */
export class MarkdownReportGenerator {
  constructor() {
    this.templates = {
      default: this.defaultTemplate.bind(this),
      simple: this.simpleTemplate.bind(this),
      detailed: this.detailedTemplate.bind(this),
      summary: this.summaryTemplate.bind(this)
    };
  }

  /**
   * 마크다운 보고서 생성
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {Object} analysisResult - 분석 결과
   * @param {ReportOptions} options - 보고서 옵션
   * @returns {string} 마크다운 보고서
   */
  generateReport(scriptResult, analysisResult, options) {
    const template = this.templates[options.template] || this.templates.default;
    return template(scriptResult, analysisResult, options);
  }

  /**
   * 기본 템플릿
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {Object} analysisResult - 분석 결과
   * @param {ReportOptions} options - 보고서 옵션
   * @returns {string} 마크다운 보고서
   */
  defaultTemplate(scriptResult, analysisResult, options) {
    let report = '';

    // 헤더
    report += this.generateHeader(scriptResult, analysisResult);
    
    // 실행 요약
    report += this.generateExecutionSummary(scriptResult);
    
    // 분석 결과
    if (options.includeAnalysis && analysisResult) {
      report += this.generateAnalysisSection(analysisResult);
    }
    
    // 권장사항
    if (options.includeRecommendations && analysisResult && analysisResult.recommendations) {
      report += this.generateRecommendationsSection(analysisResult);
    }
    
    // 다음 단계
    if (options.includeNextSteps && analysisResult && analysisResult.nextSteps) {
      report += this.generateNextStepsSection(analysisResult);
    }
    
    // 상세 정보
    if (options.includeDetails) {
      report += this.generateDetailsSection(scriptResult, analysisResult);
    }
    
    // 푸터
    report += this.generateFooter(scriptResult, analysisResult, options);

    return report;
  }

  /**
   * 간단한 템플릿
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {Object} analysisResult - 분석 결과
   * @param {ReportOptions} options - 보고서 옵션
   * @returns {string} 마크다운 보고서
   */
  simpleTemplate(scriptResult, analysisResult, options) {
    let report = '';

    // 간단한 헤더
    report += `# 스크립트 실행 보고서\n\n`;
    report += `**명령어**: \`${scriptResult.command}\`\n`;
    report += `**실행 시간**: ${new Date(scriptResult.startTime).toLocaleString()}\n`;
    report += `**상태**: ${scriptResult.success ? '✅ 성공' : '❌ 실패'}\n\n`;

    // 요약
    if (analysisResult && analysisResult.summary) {
      report += `## 요약\n\n${analysisResult.summary}\n\n`;
    }

    // 권장사항 (간단한 버전)
    if (options.includeRecommendations && analysisResult && analysisResult.recommendations) {
      report += `## 권장사항\n\n`;
      analysisResult.recommendations.slice(0, 3).forEach((rec, index) => {
        report += `${index + 1}. ${rec}\n`;
      });
      report += '\n';
    }

    return report;
  }

  /**
   * 요약 템플릿
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {Object} analysisResult - 분석 결과
   * @param {ReportOptions} options - 보고서 옵션
   * @returns {string} 마크다운 보고서
   */
  summaryTemplate(scriptResult, analysisResult, options) {
    let report = '';

    // 간단한 헤더
    report += `# 스크립트 실행 요약\n\n`;
    report += `**스크립트 ID**: ${scriptResult.id}\n`;
    report += `**명령어**: \`${scriptResult.command}\`\n`;
    report += `**실행 시간**: ${new Date(scriptResult.startTime).toLocaleString()}\n`;
    report += `**상태**: ${scriptResult.success ? '✅ 성공' : '❌ 실패'}\n`;
    report += `**실행 시간**: ${scriptResult.duration}ms\n\n`;

    // 요약
    if (analysisResult && analysisResult.summary) {
      report += `## 요약\n\n${analysisResult.summary}\n\n`;
    }

    // 주요 권장사항 (최대 2개)
    if (options.includeRecommendations && analysisResult && analysisResult.recommendations) {
      report += `## 주요 권장사항\n\n`;
      analysisResult.recommendations.slice(0, 2).forEach((rec, index) => {
        report += `${index + 1}. ${rec}\n`;
      });
      report += '\n';
    }

    return report;
  }

  /**
   * 상세한 템플릿
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {Object} analysisResult - 분석 결과
   * @param {ReportOptions} options - 보고서 옵션
   * @returns {string} 마크다운 보고서
   */
  detailedTemplate(scriptResult, analysisResult, options) {
    let report = '';

    // 상세 헤더
    report += this.generateDetailedHeader(scriptResult, analysisResult);
    
    // 실행 요약
    report += this.generateExecutionSummary(scriptResult);
    
    // 성능 분석
    if (analysisResult && analysisResult.details && analysisResult.details.basic) {
      report += this.generatePerformanceSection(analysisResult.details.basic);
    }
    
    // 에러 분석
    if (analysisResult && analysisResult.details && analysisResult.details.detailed) {
      report += this.generateErrorAnalysisSection(analysisResult.details.detailed);
    }
    
    // 보안 분석
    if (analysisResult && analysisResult.details && analysisResult.details.detailed) {
      report += this.generateSecuritySection(analysisResult.details.detailed);
    }
    
    // AI 분석
    if (analysisResult && analysisResult.details && analysisResult.details.ai) {
      report += this.generateAIAnalysisSection(analysisResult.details.ai);
    }
    
    // 권장사항
    if (options.includeRecommendations && analysisResult && analysisResult.recommendations) {
      report += this.generateRecommendationsSection(analysisResult);
    }
    
    // 다음 단계
    if (options.includeNextSteps && analysisResult && analysisResult.nextSteps) {
      report += this.generateNextStepsSection(analysisResult);
    }
    
    // 상세 정보
    if (options.includeDetails) {
      report += this.generateDetailedOutputSection(scriptResult);
    }
    
    // 푸터
    report += this.generateFooter(scriptResult, analysisResult, options);

    return report;
  }

  /**
   * 헤더 생성
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {Object} analysisResult - 분석 결과
   * @returns {string} 마크다운 헤더
   */
  generateHeader(scriptResult, analysisResult) {
    let header = '# 스크립트 실행 보고서\n\n';
    
    header += `**생성 시간**: ${new Date().toLocaleString()}\n`;
    header += `**보고서 ID**: ${analysisResult ? analysisResult.id : 'N/A'}\n`;
    header += `**스크립트 ID**: ${scriptResult.id}\n\n`;
    
    return header;
  }

  /**
   * 상세 헤더 생성
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {Object} analysisResult - 분석 결과
   * @returns {string} 마크다운 상세 헤더
   */
  generateDetailedHeader(scriptResult, analysisResult) {
    let header = '# 스크립트 실행 상세 보고서\n\n';
    
    header += `| 항목 | 값 |\n`;
    header += `|------|----|\n`;
    header += `| 생성 시간 | ${new Date().toLocaleString()} |\n`;
    header += `| 보고서 ID | ${analysisResult ? analysisResult.id : 'N/A'} |\n`;
    header += `| 스크립트 ID | ${scriptResult.id} |\n`;
    header += `| 분석 타입 | ${analysisResult ? analysisResult.analysisType : 'N/A'} |\n`;
    header += `| 신뢰도 | ${analysisResult ? `${(analysisResult.confidence * 100).toFixed(1)}%` : 'N/A'} |\n\n`;
    
    return header;
  }

  /**
   * 분석 섹션 생성
   * @param {Object} analysisResult - 분석 결과
   * @returns {string} 분석 섹션
   */
  generateAnalysisSection(analysisResult) {
    let section = '## 분석 결과\n\n';
    
    section += `**요약**: ${analysisResult.summary}\n`;
    section += `**신뢰도**: ${(analysisResult.confidence * 100).toFixed(1)}%\n\n`;
    
    if (analysisResult.details && analysisResult.details.basic) {
      const basic = analysisResult.details.basic;
      section += '### 기본 분석\n\n';
      section += `| 항목 | 값 |\n`;
      section += `|------|----|\n`;
      section += `| 성공 여부 | ${basic.success ? '✅ 성공' : '❌ 실패'} |\n`;
      section += `| 실행 시간 | ${basic.executionTime}ms |\n`;
      section += `| 성능 | ${this.getPerformanceEmoji(basic.performance)} ${basic.performance} |\n`;
      section += `| 에러 수 | ${basic.errorCount} |\n`;
      section += `| 경고 수 | ${basic.warningCount} |\n\n`;
    }
    
    return section;
  }

  /**
   * 실행 요약 생성
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @returns {string} 실행 요약
   */
  generateExecutionSummary(scriptResult) {
    let summary = '## 실행 요약\n\n';
    
    summary += `| 항목 | 값 |\n`;
    summary += `|------|----|\n`;
    summary += `| 명령어 | \`${scriptResult.command}\` |\n`;
    summary += `| 작업 디렉토리 | \`${scriptResult.workingDirectory}\` |\n`;
    summary += `| 시작 시간 | ${new Date(scriptResult.startTime).toLocaleString()} |\n`;
    summary += `| 종료 시간 | ${new Date(scriptResult.endTime).toLocaleString()} |\n`;
    summary += `| 실행 시간 | ${scriptResult.duration}ms |\n`;
    summary += `| 종료 코드 | ${scriptResult.exitCode} |\n`;
    summary += `| 상태 | ${scriptResult.success ? '✅ 성공' : '❌ 실패'} |\n`;
    summary += `| stdout 크기 | ${(scriptResult.stdout || '').length} 문자 |\n`;
    summary += `| stderr 크기 | ${(scriptResult.stderr || '').length} 문자 |\n\n`;
    
    return summary;
  }

  /**
   * 성능 분석 섹션 생성
   * @param {Object} basicAnalysis - 기본 분석 결과
   * @returns {string} 성능 분석 섹션
   */
  generatePerformanceSection(basicAnalysis) {
    let section = '## 성능 분석\n\n';
    
    section += `| 메트릭 | 값 | 평가 |\n`;
    section += `|--------|----|----|\n`;
    section += `| 실행 시간 | ${basicAnalysis.executionTime}ms | ${this.getPerformanceEmoji(basicAnalysis.performance)} ${basicAnalysis.performance} |\n`;
    section += `| 출력 크기 | ${basicAnalysis.outputSize} 문자 | ${basicAnalysis.outputSize > 10000 ? '⚠️ 대용량' : '✅ 적정'} |\n`;
    section += `| 에러 수 | ${basicAnalysis.errorCount} | ${basicAnalysis.errorCount > 0 ? '❌ 문제' : '✅ 정상'} |\n`;
    section += `| 경고 수 | ${basicAnalysis.warningCount} | ${basicAnalysis.warningCount > 0 ? '⚠️ 주의' : '✅ 정상'} |\n\n`;
    
    return section;
  }

  /**
   * 에러 분석 섹션 생성
   * @param {Object} detailedAnalysis - 상세 분석 결과
   * @returns {string} 에러 분석 섹션
   */
  generateErrorAnalysisSection(detailedAnalysis) {
    let section = '## 에러 및 경고 분석\n\n';
    
    if (detailedAnalysis.errorPatterns.length > 0) {
      section += '### 에러 패턴\n\n';
      detailedAnalysis.errorPatterns.forEach((error, index) => {
        section += `**${index + 1}. ${error.type}**\n`;
        section += `- 메시지: ${error.message}\n`;
        section += `- 라인: ${error.line}\n\n`;
      });
    }
    
    if (detailedAnalysis.warningPatterns.length > 0) {
      section += '### 경고 패턴\n\n';
      detailedAnalysis.warningPatterns.forEach((warning, index) => {
        section += `**${index + 1}. ${warning.type}**\n`;
        section += `- 메시지: ${warning.message}\n`;
        section += `- 라인: ${warning.line}\n\n`;
      });
    }
    
    if (detailedAnalysis.errorPatterns.length === 0 && detailedAnalysis.warningPatterns.length === 0) {
      section += '✅ 에러나 경고가 발견되지 않았습니다.\n\n';
    }
    
    return section;
  }

  /**
   * 보안 분석 섹션 생성
   * @param {Object} detailedAnalysis - 상세 분석 결과
   * @returns {string} 보안 분석 섹션
   */
  generateSecuritySection(detailedAnalysis) {
    let section = '## 보안 분석\n\n';
    
    if (detailedAnalysis.securityIssues.length > 0) {
      section += '### 발견된 보안 이슈\n\n';
      detailedAnalysis.securityIssues.forEach((issue, index) => {
        section += `**${index + 1}. ${issue.type}**\n`;
        section += `- 심각도: ${this.getSeverityEmoji(issue.severity)} ${issue.severity}\n`;
        section += `- 설명: ${issue.description}\n\n`;
      });
    } else {
      section += '✅ 보안 이슈가 발견되지 않았습니다.\n\n';
    }
    
    return section;
  }

  /**
   * AI 분석 섹션 생성
   * @param {Object} aiAnalysis - AI 분석 결과
   * @returns {string} AI 분석 섹션
   */
  generateAIAnalysisSection(aiAnalysis) {
    let section = '## AI 분석\n\n';
    
    if (aiAnalysis.insights.length > 0) {
      section += '### 인사이트\n\n';
      aiAnalysis.insights.forEach((insight, index) => {
        section += `${index + 1}. ${insight}\n`;
      });
      section += '\n';
    }
    
    if (aiAnalysis.bestPractices.length > 0) {
      section += '### 모범 사례\n\n';
      aiAnalysis.bestPractices.forEach((practice, index) => {
        section += `${index + 1}. ${practice}\n`;
      });
      section += '\n';
    }
    
    if (aiAnalysis.relatedCommands.length > 0) {
      section += '### 관련 명령어\n\n';
      aiAnalysis.relatedCommands.forEach((cmd, index) => {
        section += `${index + 1}. \`${cmd}\`\n`;
      });
      section += '\n';
    }
    
    section += `**신뢰도**: ${(aiAnalysis.confidence * 100).toFixed(1)}%\n`;
    section += `**위험도**: ${this.getRiskEmoji(aiAnalysis.riskAssessment)} ${aiAnalysis.riskAssessment}\n\n`;
    
    return section;
  }

  /**
   * 권장사항 섹션 생성
   * @param {Object} analysisResult - 분석 결과
   * @returns {string} 권장사항 섹션
   */
  generateRecommendationsSection(analysisResult) {
    let section = '## 권장사항\n\n';
    
    if (analysisResult.recommendations && analysisResult.recommendations.length > 0) {
      analysisResult.recommendations.forEach((rec, index) => {
        section += `${index + 1}. ${rec}\n`;
      });
    } else {
      section += '현재 권장사항이 없습니다.\n';
    }
    
    section += '\n';
    return section;
  }

  /**
   * 다음 단계 섹션 생성
   * @param {Object} analysisResult - 분석 결과
   * @returns {string} 다음 단계 섹션
   */
  generateNextStepsSection(analysisResult) {
    let section = '## 다음 단계\n\n';
    
    if (analysisResult.nextSteps && analysisResult.nextSteps.length > 0) {
      analysisResult.nextSteps.forEach((step, index) => {
        section += `${index + 1}. ${step}\n`;
      });
    } else {
      section += '현재 다음 단계가 없습니다.\n';
    }
    
    section += '\n';
    return section;
  }

  /**
   * 상세 정보 섹션 생성
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {Object} analysisResult - 분석 결과
   * @returns {string} 상세 정보 섹션
   */
  generateDetailsSection(scriptResult, analysisResult) {
    let section = '## 상세 정보\n\n';
    
    // stdout
    if (scriptResult.stdout) {
      section += '### 표준 출력 (stdout)\n\n';
      section += '```\n';
      section += scriptResult.stdout;
      section += '\n```\n\n';
    }
    
    // stderr
    if (scriptResult.stderr) {
      section += '### 표준 에러 (stderr)\n\n';
      section += '```\n';
      section += scriptResult.stderr;
      section += '\n```\n\n';
    }
    
    return section;
  }

  /**
   * 상세 출력 섹션 생성
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @returns {string} 상세 출력 섹션
   */
  generateDetailedOutputSection(scriptResult) {
    let section = '## 상세 출력\n\n';
    
    // stdout 분석
    if (scriptResult.stdout) {
      const lines = scriptResult.stdout.split('\n');
      const words = scriptResult.stdout.split(/\s+/);
      
      section += '### 표준 출력 (stdout)\n\n';
      section += `- 라인 수: ${lines.length}\n`;
      section += `- 단어 수: ${words.length}\n`;
      section += `- 문자 수: ${scriptResult.stdout.length}\n\n`;
      
      if (scriptResult.stdout.length < 1000) {
        section += '```\n';
        section += scriptResult.stdout;
        section += '\n```\n\n';
      } else {
        section += '```\n';
        section += scriptResult.stdout.substring(0, 1000) + '\n... (출력이 너무 길어 일부만 표시)';
        section += '\n```\n\n';
      }
    }
    
    // stderr 분석
    if (scriptResult.stderr) {
      const lines = scriptResult.stderr.split('\n');
      const words = scriptResult.stderr.split(/\s+/);
      
      section += '### 표준 에러 (stderr)\n\n';
      section += `- 라인 수: ${lines.length}\n`;
      section += `- 단어 수: ${words.length}\n`;
      section += `- 문자 수: ${scriptResult.stderr.length}\n\n`;
      
      if (scriptResult.stderr.length < 1000) {
        section += '```\n';
        section += scriptResult.stderr;
        section += '\n```\n\n';
      } else {
        section += '```\n';
        section += scriptResult.stderr.substring(0, 1000) + '\n... (출력이 너무 길어 일부만 표시)';
        section += '\n```\n\n';
      }
    }
    
    return section;
  }

  /**
   * 푸터 생성
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {Object} analysisResult - 분석 결과
   * @param {ReportOptions} options - 보고서 옵션
   * @returns {string} 푸터
   */
  generateFooter(scriptResult, analysisResult, options) {
    let footer = '---\n\n';
    footer += `*이 보고서는 Task Master CLI에 의해 자동 생성되었습니다.*\n`;
    footer += `*생성 시간: ${new Date().toLocaleString()}*\n`;
    
    if (options.metadata && Object.keys(options.metadata).length > 0) {
      footer += '\n**메타데이터:**\n';
      Object.entries(options.metadata).forEach(([key, value]) => {
        footer += `- ${key}: ${value}\n`;
      });
    }
    
    return footer;
  }

  /**
   * 성능 이모지 반환
   * @param {string} performance - 성능 등급
   * @returns {string} 이모지
   */
  getPerformanceEmoji(performance) {
    switch (performance) {
      case 'excellent': return '🚀';
      case 'good': return '✅';
      case 'poor': return '🐌';
      default: return '❓';
    }
  }

  /**
   * 심각도 이모지 반환
   * @param {string} severity - 심각도
   * @returns {string} 이모지
   */
  getSeverityEmoji(severity) {
    switch (severity) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }

  /**
   * 위험도 이모지 반환
   * @param {string} risk - 위험도
   * @returns {string} 이모지
   */
  getRiskEmoji(risk) {
    switch (risk) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }
}

/**
 * HTML 보고서 생성기
 */
export class HTMLReportGenerator {
  constructor() {
    this.templates = {
      default: this.defaultTemplate.bind(this),
      modern: this.modernTemplate.bind(this),
      simple: this.simpleTemplate.bind(this),
      summary: this.summaryTemplate.bind(this)
    };
  }

  /**
   * HTML 보고서 생성
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {Object} analysisResult - 분석 결과
   * @param {ReportOptions} options - 보고서 옵션
   * @returns {string} HTML 보고서
   */
  generateReport(scriptResult, analysisResult, options) {
    const template = this.templates[options.template] || this.templates.default;
    return template(scriptResult, analysisResult, options);
  }

  /**
   * 기본 HTML 템플릿
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {Object} analysisResult - 분석 결과
   * @param {ReportOptions} options - 보고서 옵션
   * @returns {string} HTML 보고서
   */
  defaultTemplate(scriptResult, analysisResult, options) {
    const css = this.generateCSS(options.customStyles);
    
    let html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>스크립트 실행 보고서 - ${scriptResult.id}</title>
    <style>${css}</style>
</head>
<body>
    <div class="container">
        <header>
            <h1>스크립트 실행 보고서</h1>
            <div class="metadata">
                <p><strong>생성 시간:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>스크립트 ID:</strong> ${scriptResult.id}</p>
                <p><strong>상태:</strong> <span class="status ${scriptResult.success ? 'success' : 'failure'}">${scriptResult.success ? '성공' : '실패'}</span></p>
            </div>
        </header>

        <main>
            <section class="execution-summary">
                <h2>실행 요약</h2>
                <table>
                    <tr><td>명령어</td><td><code>${scriptResult.command}</code></td></tr>
                    <tr><td>작업 디렉토리</td><td><code>${scriptResult.workingDirectory}</code></td></tr>
                    <tr><td>실행 시간</td><td>${scriptResult.duration}ms</td></tr>
                    <tr><td>종료 코드</td><td>${scriptResult.exitCode}</td></tr>
                </table>
            </section>`;

    if (options.includeAnalysis && analysisResult) {
      html += this.generateAnalysisHTML(analysisResult);
    }

    if (options.includeRecommendations && analysisResult && analysisResult.recommendations) {
      html += this.generateRecommendationsHTML(analysisResult);
    }

    if (options.includeNextSteps && analysisResult && analysisResult.nextSteps) {
      html += this.generateNextStepsHTML(analysisResult);
    }

    if (options.includeDetails) {
      html += this.generateDetailsHTML(scriptResult);
    }

    html += `
        </main>

        <footer>
            <p>이 보고서는 Task Master CLI에 의해 자동 생성되었습니다.</p>
            <p>생성 시간: ${new Date().toLocaleString()}</p>
        </footer>
    </div>
</body>
</html>`;

    return html;
  }

  /**
   * 현대적 HTML 템플릿
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {Object} analysisResult - 분석 결과
   * @param {ReportOptions} options - 보고서 옵션
   * @returns {string} HTML 보고서
   */
  modernTemplate(scriptResult, analysisResult, options) {
    return this.defaultTemplate(scriptResult, analysisResult, options);
  }

  /**
   * 간단한 HTML 템플릿
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {Object} analysisResult - 분석 결과
   * @param {ReportOptions} options - 보고서 옵션
   * @returns {string} HTML 보고서
   */
  simpleTemplate(scriptResult, analysisResult, options) {
    return this.defaultTemplate(scriptResult, analysisResult, options);
  }

  /**
   * CSS 생성
   * @param {Object} customStyles - 사용자 정의 스타일
   * @returns {string} CSS
   */
  generateCSS(customStyles) {
    return `
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        header {
            background: #2c3e50;
            color: white;
            padding: 2rem;
            text-align: center;
        }
        header h1 {
            margin: 0 0 1rem 0;
        }
        .metadata {
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
        }
        .status {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-weight: bold;
        }
        .status.success { background: #27ae60; }
        .status.failure { background: #e74c3c; }
        main {
            padding: 2rem;
        }
        section {
            margin-bottom: 2rem;
            padding: 1rem;
            border: 1px solid #ddd;
            border-radius: 8px;
        }
        h2 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 0.5rem;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
        }
        th, td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        code {
            background: #f8f9fa;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
        }
        pre {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 4px;
            overflow-x: auto;
            border: 1px solid #ddd;
        }
        .recommendation, .next-step {
            background: #e8f4fd;
            padding: 1rem;
            margin: 0.5rem 0;
            border-left: 4px solid #3498db;
            border-radius: 4px;
        }
        footer {
            background: #34495e;
            color: white;
            text-align: center;
            padding: 1rem;
            margin-top: 2rem;
        }
        ${customStyles.css || ''}
    `;
  }

  /**
   * 분석 HTML 생성
   * @param {Object} analysisResult - 분석 결과
   * @returns {string} 분석 HTML
   */
  generateAnalysisHTML(analysisResult) {
    let html = `
            <section class="analysis">
                <h2>분석 결과</h2>
                <p><strong>요약:</strong> ${analysisResult.summary}</p>
                <p><strong>신뢰도:</strong> ${(analysisResult.confidence * 100).toFixed(1)}%</p>`;

    if (analysisResult.details && analysisResult.details.basic) {
      const basic = analysisResult.details.basic;
      html += `
                <h3>기본 분석</h3>
                <table>
                    <tr><td>성공 여부</td><td>${basic.success ? '성공' : '실패'}</td></tr>
                    <tr><td>실행 시간</td><td>${basic.executionTime}ms</td></tr>
                    <tr><td>성능</td><td>${basic.performance}</td></tr>
                    <tr><td>에러 수</td><td>${basic.errorCount}</td></tr>
                    <tr><td>경고 수</td><td>${basic.warningCount}</td></tr>
                </table>`;
    }

    html += `
            </section>`;

    return html;
  }

  /**
   * 권장사항 HTML 생성
   * @param {Object} analysisResult - 분석 결과
   * @returns {string} 권장사항 HTML
   */
  generateRecommendationsHTML(analysisResult) {
    let html = `
            <section class="recommendations">
                <h2>권장사항</h2>`;

    if (analysisResult.recommendations && analysisResult.recommendations.length > 0) {
      analysisResult.recommendations.forEach((rec, index) => {
        html += `
                <div class="recommendation">
                    <strong>${index + 1}.</strong> ${rec}
                </div>`;
      });
    } else {
      html += `
                <p>현재 권장사항이 없습니다.</p>`;
    }

    html += `
            </section>`;

    return html;
  }

  /**
   * 다음 단계 HTML 생성
   * @param {Object} analysisResult - 분석 결과
   * @returns {string} 다음 단계 HTML
   */
  generateNextStepsHTML(analysisResult) {
    let html = `
            <section class="next-steps">
                <h2>다음 단계</h2>`;

    if (analysisResult.nextSteps && analysisResult.nextSteps.length > 0) {
      analysisResult.nextSteps.forEach((step, index) => {
        html += `
                <div class="next-step">
                    <strong>${index + 1}.</strong> ${step}
                </div>`;
      });
    } else {
      html += `
                <p>현재 다음 단계가 없습니다.</p>`;
    }

    html += `
            </section>`;

    return html;
  }

  /**
   * 상세 정보 HTML 생성
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @returns {string} 상세 정보 HTML
   */
  generateDetailsHTML(scriptResult) {
    let html = `
            <section class="details">
                <h2>상세 정보</h2>`;

    if (scriptResult.stdout) {
      html += `
                <h3>표준 출력 (stdout)</h3>
                <pre><code>${this.escapeHTML(scriptResult.stdout)}</code></pre>`;
    }

    if (scriptResult.stderr) {
      html += `
                <h3>표준 에러 (stderr)</h3>
                <pre><code>${this.escapeHTML(scriptResult.stderr)}</code></pre>`;
    }

    html += `
            </section>`;

    return html;
  }

  /**
   * HTML 이스케이프
   * @param {string} text - 텍스트
   * @returns {string} 이스케이프된 텍스트
   */
  escapeHTML(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * 요약 HTML 템플릿
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {Object} analysisResult - 분석 결과
   * @param {ReportOptions} options - 보고서 옵션
   * @returns {string} HTML 보고서
   */
  summaryTemplate(scriptResult, analysisResult, options) {
    const css = this.generateCSS(options.customStyles);
    
    let html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>스크립트 실행 요약 - ${scriptResult.id}</title>
    <style>${css}</style>
</head>
<body>
    <div class="container">
        <header>
            <h1>스크립트 실행 요약</h1>
            <div class="metadata">
                <p><strong>명령어:</strong> <code>${scriptResult.command}</code></p>
                <p><strong>실행 시간:</strong> ${new Date(scriptResult.startTime).toLocaleString()}</p>
                <p><strong>상태:</strong> <span class="status ${scriptResult.success ? 'success' : 'failure'}">${scriptResult.success ? '성공' : '실패'}</span></p>
                <p><strong>실행 시간:</strong> ${scriptResult.duration}ms</p>
            </div>
        </header>

        <main>`;

    // 요약
    if (analysisResult && analysisResult.summary) {
      html += `
            <section class="summary">
                <h2>요약</h2>
                <p>${analysisResult.summary}</p>
            </section>`;
    }

    // 주요 권장사항 (최대 2개)
    if (options.includeRecommendations && analysisResult && analysisResult.recommendations) {
      html += `
            <section class="recommendations">
                <h2>주요 권장사항</h2>
                <ol>`;
      analysisResult.recommendations.slice(0, 2).forEach(rec => {
        html += `
                    <li>${rec}</li>`;
      });
      html += `
                </ol>
            </section>`;
    }

    html += `
        </main>

        <footer>
            <p>이 보고서는 Task Master CLI에 의해 자동 생성되었습니다.</p>
            <p>생성 시간: ${new Date().toLocaleString()}</p>
        </footer>
    </div>
</body>
</html>`;

    return html;
  }
}

/**
 * JSON 보고서 생성기
 */
export class JSONReportGenerator {
  constructor() {
    this.templates = {
      default: this.defaultTemplate.bind(this),
      simple: this.simpleTemplate.bind(this),
      detailed: this.detailedTemplate.bind(this),
      summary: this.summaryTemplate.bind(this)
    };
  }

  /**
   * JSON 보고서 생성
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {Object} analysisResult - 분석 결과
   * @param {ReportOptions} options - 보고서 옵션
   * @returns {string} JSON 보고서
   */
  generateReport(scriptResult, analysisResult, options) {
    const template = this.templates[options.template] || this.templates.default;
    return template(scriptResult, analysisResult, options);
  }

  /**
   * 기본 템플릿
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {Object} analysisResult - 분석 결과
   * @param {ReportOptions} options - 보고서 옵션
   * @returns {string} JSON 보고서
   */
  defaultTemplate(scriptResult, analysisResult, options) {
    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        reportId: analysisResult ? analysisResult.id : null,
        scriptId: scriptResult.id,
        format: 'json',
        version: '1.0'
      },
      scriptResult: {
        id: scriptResult.id,
        command: scriptResult.command,
        workingDirectory: scriptResult.workingDirectory,
        startTime: scriptResult.startTime,
        endTime: scriptResult.endTime,
        duration: scriptResult.duration,
        exitCode: scriptResult.exitCode,
        success: scriptResult.success,
        stdout: options.includeDetails ? scriptResult.stdout : null,
        stderr: options.includeDetails ? scriptResult.stderr : null,
        error: scriptResult.error ? scriptResult.error.message : null,
        metadata: scriptResult.metadata
      },
      analysis: options.includeAnalysis ? analysisResult : null,
      recommendations: options.includeRecommendations && analysisResult ? analysisResult.recommendations : null,
      nextSteps: options.includeNextSteps && analysisResult ? analysisResult.nextSteps : null,
      customMetadata: options.metadata
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * 간단한 템플릿
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {Object} analysisResult - 분석 결과
   * @param {ReportOptions} options - 보고서 옵션
   * @returns {string} JSON 보고서
   */
  simpleTemplate(scriptResult, analysisResult, options) {
    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        scriptId: scriptResult.id,
        format: 'json',
        version: '1.0'
      },
      scriptResult: {
        id: scriptResult.id,
        command: scriptResult.command,
        success: scriptResult.success,
        duration: scriptResult.duration,
        exitCode: scriptResult.exitCode
      },
      summary: analysisResult ? analysisResult.summary : null
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * 상세한 템플릿
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {Object} analysisResult - 분석 결과
   * @param {ReportOptions} options - 보고서 옵션
   * @returns {string} JSON 보고서
   */
  detailedTemplate(scriptResult, analysisResult, options) {
    return this.defaultTemplate(scriptResult, analysisResult, options);
  }

  /**
   * 요약 템플릿
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {Object} analysisResult - 분석 결과
   * @param {ReportOptions} options - 보고서 옵션
   * @returns {string} JSON 보고서
   */
  summaryTemplate(scriptResult, analysisResult, options) {
    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        scriptId: scriptResult.id,
        format: 'json',
        version: '1.0'
      },
      scriptResult: {
        id: scriptResult.id,
        command: scriptResult.command,
        success: scriptResult.success,
        duration: scriptResult.duration,
        exitCode: scriptResult.exitCode,
        startTime: scriptResult.startTime
      },
      summary: analysisResult ? analysisResult.summary : null,
      recommendations: options.includeRecommendations && analysisResult ? analysisResult.recommendations?.slice(0, 2) : null
    };

    return JSON.stringify(report, null, 2);
  }
}

/**
 * 통합 보고서 생성기 (ReportGenerator 별칭)
 */
export class ReportGenerator {
  constructor() {
    this.templates = new Map();
    this.defaultFormat = 'markdown';
    this.defaultTemplate = 'default';
    
    this.generators = {
      markdown: new MarkdownReportGenerator(),
      html: new HTMLReportGenerator(),
      json: new JSONReportGenerator()
    };

    // 기본 템플릿 등록
    const defaultTemplate = new ReportTemplate('default', '기본 템플릿');
    defaultTemplate.format = 'markdown';
    defaultTemplate.content = '# 기본 보고서\n\n{{content}}';
    defaultTemplate.variables = ['content'];
    this.registerTemplate(defaultTemplate);
  }

  /**
   * 템플릿 등록
   * @param {ReportTemplate} template - 등록할 템플릿
   */
  registerTemplate(template) {
    if (!template.validate()) {
      throw new Error('Invalid template');
    }
    
    const key = template.name;
    this.templates.set(key, template);
  }

  /**
   * 템플릿 조회
   * @param {string} name - 템플릿 이름
   * @param {string} format - 형식
   * @returns {ReportTemplate|null} 템플릿 또는 null
   */
  getTemplate(name, format) {
    if (!this.generators[format]) {
      return null;
    }
    
    return this.templates.get(name) || null;
  }

  /**
   * 보고서 생성
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {Object} analysisResult - 분석 결과
   * @param {ReportOptions} options - 보고서 옵션
   * @returns {string} 생성된 보고서
   */
  generateReport(scriptResult, analysisResult, options = {}) {
    const reportOptions = new ReportOptions(options);
    const generator = this.generators[reportOptions.format];
    
    if (!generator) {
      throw new Error(`Unsupported report format: ${reportOptions.format}`);
    }

    const report = generator.generateReport(scriptResult, analysisResult, reportOptions);
    return report;
  }

  /**
   * 보고서 파일 저장
   * @param {string} report - 보고서 내용
   * @param {string} outputPath - 출력 경로
   * @param {string} format - 형식
   * @returns {Promise<void>}
   */
  async saveReport(report, outputPath, format) {
    try {
      // 디렉토리 생성
      const dir = path.dirname(outputPath);
      await mkdir(dir, { recursive: true });

      // 파일 확장자 결정
      let filePath = outputPath;
      if (!path.extname(filePath)) {
        const extensions = {
          markdown: '.md',
          html: '.html',
          json: '.json'
        };
        filePath += extensions[format] || '.txt';
      }

      // 파일 저장
      await writeFile(filePath, report, 'utf8');
      log('info', `Report saved to: ${filePath}`);

    } catch (error) {
      log('error', `Failed to save report: ${error.message}`);
      throw error;
    }
  }

  /**
   * 사용 가능한 형식 조회
   * @returns {Array} 지원하는 형식 배열
   */
  getSupportedFormats() {
    return Object.keys(this.generators);
  }

  /**
   * 사용 가능한 템플릿 조회
   * @param {string} format - 형식
   * @returns {Array} 지원하는 템플릿 배열
   */
  getSupportedTemplates(format) {
    const generator = this.generators[format];
    if (!generator) {
      return [];
    }
    return Object.keys(generator.templates);
  }
}

/**
 * 스크립트 보고서 엔진 (기존 호환성)
 */
export class ScriptReportEngine extends ReportGenerator {
  constructor() {
    super();
  }

  /**
   * 보고서 생성
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {Object} analysisResult - 분석 결과
   * @param {ReportOptions} options - 보고서 옵션
   * @returns {Promise<string>} 생성된 보고서
   */
  async generateReport(scriptResult, analysisResult, options = {}) {
    const reportOptions = new ReportOptions(options);
    const generator = this.generators[reportOptions.format];
    
    if (!generator) {
      throw new Error(`Unsupported report format: ${reportOptions.format}`);
    }

    const report = generator.generateReport(scriptResult, analysisResult, reportOptions);

    // 파일로 저장
    if (reportOptions.outputPath) {
      await this.saveReport(report, reportOptions.outputPath, reportOptions.format);
    }

    return report;
  }

  /**
   * 보고서 파일 저장
   * @param {string} report - 보고서 내용
   * @param {string} outputPath - 출력 경로
   * @param {string} format - 형식
   * @returns {Promise<void>}
   */
  async saveReport(report, outputPath, format) {
    try {
      // 디렉토리 생성
      const dir = path.dirname(outputPath);
      await mkdir(dir, { recursive: true });

      // 파일 확장자 결정
      let filePath = outputPath;
      if (!path.extname(filePath)) {
        const extensions = {
          markdown: '.md',
          html: '.html',
          json: '.json'
        };
        filePath += extensions[format] || '.txt';
      }

      // 파일 저장
      await writeFile(filePath, report, 'utf8');
      log('info', `Report saved to: ${filePath}`);

    } catch (error) {
      log('error', `Failed to save report: ${error.message}`);
      throw error;
    }
  }

  /**
   * 사용 가능한 형식 조회
   * @returns {Array} 지원하는 형식 배열
   */
  getSupportedFormats() {
    return Object.keys(this.generators);
  }

  /**
   * 사용 가능한 템플릿 조회
   * @param {string} format - 형식
   * @returns {Array} 지원하는 템플릿 배열
   */
  getSupportedTemplates(format) {
    const generator = this.generators[format];
    if (!generator) {
      return [];
    }
    return Object.keys(generator.templates);
  }
}

// 전역 보고서 엔진 인스턴스
const reportEngine = new ScriptReportEngine();

// 편의 함수들
export async function generateScriptReport(scriptResult, analysisResult, options = {}) {
  return await reportEngine.generateReport(scriptResult, analysisResult, options);
}

export function getSupportedReportFormats() {
  return reportEngine.getSupportedFormats();
}

export function getSupportedReportTemplates(format) {
  return reportEngine.getSupportedTemplates(format);
}
