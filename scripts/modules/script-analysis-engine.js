/**
 * script-analysis-engine.js
 * 스크립트 실행 결과 분석 엔진
 * 기본 분석, 상세 분석, AI 분석 기능 제공
 */

import { generateTextService } from './ai-services-unified.js';
import { log } from './utils.js';

/**
 * 스크립트 분석 결과 객체
 */
export class ScriptAnalysisResult {
  constructor(options = {}) {
    this.id = options.id || null;
    this.scriptResultId = options.scriptResultId || null;
    this.analysisType = options.analysisType || null; // 'basic', 'detailed', 'ai'
    this.timestamp = options.timestamp || null;
    this.summary = options.summary || '';
    this.details = options.details || {};
    this.recommendations = options.recommendations || [];
    this.nextSteps = options.nextSteps || [];
    this.confidence = options.confidence || 0.0; // 0.0 - 1.0
    this.metadata = options.metadata || {};
  }

  /**
   * JSON 객체로 변환
   * @returns {Object} JSON 객체
   */
  toJSON() {
    return {
      id: this.id,
      scriptResultId: this.scriptResultId,
      analysisType: this.analysisType,
      timestamp: this.timestamp instanceof Date ? this.timestamp.toISOString() : this.timestamp,
      summary: this.summary,
      details: this.details,
      recommendations: this.recommendations,
      nextSteps: this.nextSteps,
      confidence: this.confidence,
      metadata: this.metadata
    };
  }
}

/**
 * 기본 분석 결과
 */
export class BasicAnalysis {
  constructor() {
    this.success = false;
    this.executionTime = 0;
    this.exitCode = null;
    this.outputSize = 0;
    this.errorCount = 0;
    this.warningCount = 0;
    this.outputType = 'unknown'; // 'text', 'error', 'mixed', 'large', 'unknown'
    this.hasErrors = false;
    this.hasWarnings = false;
    this.performance = 'unknown'; // 'excellent', 'good', 'poor', 'unknown'
    this.isLargeOutput = false;
    this.isFastExecution = false;
  }

  /**
   * 스크립트 결과 분석
   * @param {Object} scriptResult - 스크립트 실행 결과
   */
  analyze(scriptResult) {
    this.success = scriptResult.success;
    this.executionTime = scriptResult.duration || 0;
    this.exitCode = scriptResult.exitCode;
    
    // 출력 크기 계산
    this.outputSize = (scriptResult.stdout?.length || 0) + (scriptResult.stderr?.length || 0);
    this.isLargeOutput = this.outputSize > 50000;
    
    // 출력 타입 결정
    if (this.isLargeOutput) {
      this.outputType = 'large';
    } else if (scriptResult.stderr && !scriptResult.stdout) {
      this.outputType = 'error';
    } else if (scriptResult.stderr && scriptResult.stdout) {
      this.outputType = 'mixed';
    } else {
      this.outputType = 'text';
    }
    
    // 성능 평가
    if (this.executionTime < 1000) {
      this.performance = 'excellent';
      this.isFastExecution = true;
    } else if (this.executionTime < 5000) {
      this.performance = 'good';
    } else {
      this.performance = 'poor';
    }
    
    // 에러 및 경고 수 계산
    if (scriptResult.stderr) {
      this.errorCount = (scriptResult.stderr.match(/error/gi) || []).length;
      this.warningCount = (scriptResult.stderr.match(/warning/gi) || []).length;
    }
    
    // 에러 및 경고 상태 설정
    this.hasErrors = this.errorCount > 0;
    this.hasWarnings = this.warningCount > 0;
  }

  /**
   * JSON 객체로 변환
   * @returns {Object} JSON 객체
   */
  toJSON() {
    return {
      success: this.success,
      executionTime: this.executionTime,
      exitCode: this.exitCode,
      outputSize: this.outputSize,
      errorCount: this.errorCount,
      warningCount: this.warningCount,
      outputType: this.outputType,
      hasErrors: this.hasErrors,
      hasWarnings: this.hasWarnings,
      performance: this.performance,
      isLargeOutput: this.isLargeOutput,
      isFastExecution: this.isFastExecution
    };
  }
}

/**
 * 상세 분석 결과
 */
export class DetailedAnalysis {
  constructor() {
    this.stdoutAnalysis = {};
    this.stderrAnalysis = {};
    this.performanceMetrics = {};
    this.errorPatterns = [];
    this.warningPatterns = [];
    this.outputTypes = [];
    this.securityIssues = [];
    this.optimizationOpportunities = [];
    this.executionMetrics = {};
  }

  /**
   * 스크립트 결과 분석
   * @param {Object} scriptResult - 스크립트 실행 결과
   */
  analyze(scriptResult) {
    // 에러 패턴 추출
    if (scriptResult.stderr) {
      this.errorPatterns = this.extractErrorPatterns(scriptResult.stderr);
    }
    
    // 경고 패턴 추출
    if (scriptResult.stderr) {
      this.warningPatterns = this.extractWarningPatterns(scriptResult.stderr);
    }
    
    // 출력 타입 분석
    if (scriptResult.stdout) {
      this.outputTypes = this.analyzeOutputTypes(scriptResult.stdout);
    }
    
    // 보안 이슈 감지
    this.securityIssues = this.detectSecurityIssues(scriptResult);
    
    // 최적화 기회 식별
    this.optimizationOpportunities = this.identifyOptimizationOpportunities(scriptResult);
    
    // 실행 메트릭 계산
    this.executionMetrics = this.calculateExecutionMetrics(scriptResult);
  }

  /**
   * 에러 패턴 추출
   * @param {string} stderr - 표준 에러 출력
   * @returns {Array} 에러 패턴 배열
   */
  extractErrorPatterns(stderr) {
    const patterns = [];
    const errorKeywords = ['error', 'failed', 'command not found', 'permission denied', 'file not found'];
    
    errorKeywords.forEach(keyword => {
      if (stderr.toLowerCase().includes(keyword)) {
        patterns.push(keyword);
      }
    });
    
    return patterns;
  }

  /**
   * 경고 패턴 추출
   * @param {string} stderr - 표준 에러 출력
   * @returns {Array} 경고 패턴 배열
   */
  extractWarningPatterns(stderr) {
    const patterns = [];
    const warningKeywords = ['warning', 'deprecated', 'deprecated feature'];
    
    warningKeywords.forEach(keyword => {
      if (stderr.toLowerCase().includes(keyword)) {
        patterns.push(keyword);
      }
    });
    
    return patterns;
  }

  /**
   * 출력 타입 분석
   * @param {string} stdout - 표준 출력
   * @returns {Array} 출력 타입 배열
   */
  analyzeOutputTypes(stdout) {
    const types = [];
    
    if (stdout.includes('{') && stdout.includes('}')) {
      types.push('json');
    }
    if (stdout.includes('\n')) {
      types.push('text');
    }
    
    return types;
  }

  /**
   * 보안 이슈 감지
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @returns {Array} 보안 이슈 배열
   */
  detectSecurityIssues(scriptResult) {
    const issues = [];
    const securityKeywords = ['password', 'api_key', 'private_key', 'secret'];
    
    const output = (scriptResult.stdout || '') + (scriptResult.stderr || '');
    securityKeywords.forEach(keyword => {
      if (output.toLowerCase().includes(keyword)) {
        issues.push(keyword);
      }
    });
    
    return issues;
  }

  /**
   * 최적화 기회 식별
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @returns {Array} 최적화 기회 배열
   */
  identifyOptimizationOpportunities(scriptResult) {
    const opportunities = [];
    
    const output = (scriptResult.stdout || '') + (scriptResult.stderr || '');
    
    if (output.toLowerCase().includes('pagination')) {
      opportunities.push('pagination');
    }
    if (output.toLowerCase().includes('caching')) {
      opportunities.push('caching');
    }
    
    return opportunities;
  }

  /**
   * 실행 메트릭 계산
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @returns {Object} 실행 메트릭
   */
  calculateExecutionMetrics(scriptResult) {
    const totalOutputSize = (scriptResult.stdout?.length || 0) + (scriptResult.stderr?.length || 0);
    const outputEfficiency = scriptResult.duration > 0 ? totalOutputSize / scriptResult.duration : 0;
    
    return {
      totalOutputSize: totalOutputSize,
      outputEfficiency: outputEfficiency
    };
  }

  /**
   * JSON 객체로 변환
   * @returns {Object} JSON 객체
   */
  toJSON() {
    return {
      errorPatterns: this.errorPatterns,
      warningPatterns: this.warningPatterns,
      outputTypes: this.outputTypes,
      securityIssues: this.securityIssues,
      optimizationOpportunities: this.optimizationOpportunities,
      executionMetrics: this.executionMetrics,
      stdoutAnalysis: this.stdoutAnalysis,
      stderrAnalysis: this.stderrAnalysis,
      performanceMetrics: this.performanceMetrics
    };
  }
}

/**
 * AI 분석 결과
 */
export class AIAnalysis {
  constructor() {
    this.insights = '';
    this.recommendations = [];
    this.nextSteps = [];
    this.riskAssessment = '';
    this.bestPractices = [];
    this.relatedCommands = [];
    this.confidence = 0.0;
    this.performanceAnalysis = '';
    this.securityAnalysis = '';
    this.timestamp = new Date();
  }

  /**
   * 프롬프트 생성
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {string} context - 분석 컨텍스트
   * @returns {string} 생성된 프롬프트
   */
  generatePrompt(scriptResult, context) {
    let prompt = `스크립트 실행 결과를 분석해주세요.\n\n`;
    prompt += `명령어: ${scriptResult.command}\n`;
    prompt += `상태: ${scriptResult.success ? '성공' : '실패'}\n`;
    prompt += `실행 시간: ${scriptResult.duration}ms\n`;
    prompt += `종료 코드: ${scriptResult.exitCode}\n\n`;
    
    if (scriptResult.stdout) {
      prompt += `표준 출력:\n${scriptResult.stdout}\n\n`;
    }
    
    if (scriptResult.stderr) {
      prompt += `표준 에러:\n${scriptResult.stderr}\n\n`;
    }
    
    prompt += `분석 컨텍스트: ${context}\n\n`;
    prompt += `다음 형식으로 분석 결과를 제공해주세요:\n`;
    prompt += `## 인사이트\n[분석 결과]\n\n`;
    prompt += `## 권장사항\n1. [권장사항 1]\n2. [권장사항 2]\n\n`;
    prompt += `## 다음 단계\n1. [다음 단계 1]\n2. [다음 단계 2]\n\n`;
    prompt += `## 위험도 평가\n[위험도 평가]\n\n`;
    prompt += `## 성능 분석\n[성능 분석]\n\n`;
    prompt += `## 보안 분석\n[보안 분석]`;
    
    return prompt;
  }

  /**
   * AI 응답 파싱
   * @param {string} aiResponse - AI 응답
   * @returns {Object} 파싱된 결과
   */
  parseAIResponse(aiResponse) {
    const result = {
      insights: '',
      recommendations: [],
      nextSteps: [],
      riskAssessment: '',
      performanceAnalysis: '',
      securityAnalysis: ''
    };
    
    try {
      // 인사이트 추출
      const insightsMatch = aiResponse.match(/## 인사이트\n([\s\S]*?)(?=\n## |$)/);
      if (insightsMatch) {
        result.insights = insightsMatch[1].trim();
      }
      
      // 권장사항 추출
      const recommendationsMatch = aiResponse.match(/## 권장사항\n([\s\S]*?)(?=\n## |$)/);
      if (recommendationsMatch) {
        const recommendationsText = recommendationsMatch[1];
        result.recommendations = recommendationsText
          .split('\n')
          .filter(line => line.trim().match(/^\d+\./))
          .map(line => line.replace(/^\d+\.\s*/, '').trim())
          .filter(line => line.length > 0);
      }
      
      // 다음 단계 추출
      const nextStepsMatch = aiResponse.match(/## 다음 단계\n([\s\S]*?)(?=\n## |$)/);
      if (nextStepsMatch) {
        const nextStepsText = nextStepsMatch[1];
        result.nextSteps = nextStepsText
          .split('\n')
          .filter(line => line.trim().match(/^\d+\./))
          .map(line => line.replace(/^\d+\.\s*/, '').trim())
          .filter(line => line.length > 0);
      }
      
      // 위험도 평가 추출
      const riskMatch = aiResponse.match(/## 위험도 평가\n([\s\S]*?)(?=\n## |$)/);
      if (riskMatch) {
        result.riskAssessment = riskMatch[1].trim();
      }
      
      // 성능 분석 추출
      const performanceMatch = aiResponse.match(/## 성능 분석\n([\s\S]*?)(?=\n## |$)/);
      if (performanceMatch) {
        result.performanceAnalysis = performanceMatch[1].trim();
      }
      
      // 보안 분석 추출
      const securityMatch = aiResponse.match(/## 보안 분석\n([\s\S]*?)(?=\n## |$)/);
      if (securityMatch) {
        result.securityAnalysis = securityMatch[1].trim();
      }
      
    } catch (error) {
      log('error', `AI 응답 파싱 실패: ${error.message}`);
    }
    
    return result;
  }

  /**
   * AI 분석 수행
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {string} context - 분석 컨텍스트
   * @returns {Promise<void>}
   */
  async analyze(scriptResult, context) {
    try {
      const prompt = this.generatePrompt(scriptResult, context);
      
      const response = await generateTextService(
        'analysis',
        null,
        '스크립트 분석 전문가',
        prompt
      );
      
      const parsedResult = this.parseAIResponse(response.mainResult);
      
      this.insights = parsedResult.insights;
      this.recommendations = parsedResult.recommendations;
      this.nextSteps = parsedResult.nextSteps;
      this.riskAssessment = parsedResult.riskAssessment;
      this.performanceAnalysis = parsedResult.performanceAnalysis;
      this.securityAnalysis = parsedResult.securityAnalysis;
      
    } catch (error) {
      log('error', `AI 분석 실패: ${error.message}`);
      this.insights = 'AI 분석 중 오류가 발생했습니다.';
      this.recommendations = [];
      this.nextSteps = [];
    }
  }

  /**
   * JSON 객체로 변환
   * @returns {Object} JSON 객체
   */
  toJSON() {
    return {
      insights: this.insights,
      recommendations: this.recommendations,
      nextSteps: this.nextSteps,
      riskAssessment: this.riskAssessment,
      bestPractices: this.bestPractices,
      relatedCommands: this.relatedCommands,
      confidence: this.confidence,
      performanceAnalysis: this.performanceAnalysis,
      securityAnalysis: this.securityAnalysis,
      timestamp: this.timestamp instanceof Date ? this.timestamp.toISOString() : this.timestamp
    };
  }
}

/**
 * 스크립트 분석 엔진
 */
export class ScriptAnalysisEngine {
  constructor() {
    this.analyses = new Map();
    this.nextId = 1;
  }

  /**
   * ID 생성
   * @returns {string} 생성된 ID
   */
  generateId() {
    const id = `analysis_${this.nextId.toString().padStart(3, '0')}`;
    this.nextId++;
    return id;
  }

  /**
   * 기본 분석 수행
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @returns {BasicAnalysis} 기본 분석 결과
   */
  performBasicAnalysis(scriptResult) {
    const analysis = new BasicAnalysis();
    
    try {
      // 성공/실패 판단
      analysis.success = scriptResult.success;
      analysis.exitCode = scriptResult.exitCode;
      
      // 실행 시간 분석
      analysis.executionTime = scriptResult.duration;
      
      // 성능 평가
      if (analysis.executionTime < 1000) {
        analysis.performance = 'excellent';
      } else if (analysis.executionTime < 5000) {
        analysis.performance = 'good';
      } else {
        analysis.performance = 'poor';
      }
      
      // 출력 크기 분석
      analysis.outputSize = (scriptResult.stdout || '').length + (scriptResult.stderr || '').length;
      
      // 에러 및 경고 카운트
      analysis.errorCount = this.countErrors(scriptResult.stderr);
      analysis.warningCount = this.countWarnings(scriptResult.stderr);
      
      log('info', `Basic analysis completed for script: ${scriptResult.id}`);
      
    } catch (error) {
      log('error', `Basic analysis failed: ${error.message}`);
    }
    
    return analysis;
  }

  /**
   * 상세 분석 수행
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @returns {DetailedAnalysis} 상세 분석 결과
   */
  performDetailedAnalysis(scriptResult) {
    const analysis = new DetailedAnalysis();
    
    try {
      // stdout 분석
      analysis.stdoutAnalysis = this.analyzeOutput(scriptResult.stdout, 'stdout');
      
      // stderr 분석
      analysis.stderrAnalysis = this.analyzeOutput(scriptResult.stderr, 'stderr');
      
      // 성능 메트릭
      analysis.performanceMetrics = this.calculatePerformanceMetrics(scriptResult);
      
      // 에러 패턴 분석
      analysis.errorPatterns = this.extractErrorPatterns(scriptResult.stderr);
      
      // 경고 패턴 분석
      analysis.warningPatterns = this.extractWarningPatterns(scriptResult.stderr);
      
      // 출력 패턴 분석
      analysis.outputPatterns = this.extractOutputPatterns(scriptResult.stdout);
      
      // 보안 이슈 검사
      analysis.securityIssues = this.detectSecurityIssues(scriptResult);
      
      // 최적화 기회 검사
      analysis.optimizationOpportunities = this.findOptimizationOpportunities(scriptResult);
      
      log('info', `Detailed analysis completed for script: ${scriptResult.id}`);
      
    } catch (error) {
      log('error', `Detailed analysis failed: ${error.message}`);
    }
    
    return analysis;
  }

  /**
   * AI 분석 수행
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {Object} context - 분석 컨텍스트
   * @returns {Promise<AIAnalysis>} AI 분석 결과
   */
  async performAIAnalysis(scriptResult, context = {}) {
    const analysis = new AIAnalysis();
    
    try {
      // AI 분석 프롬프트 생성
      const prompt = this.generateAIAnalysisPrompt(scriptResult, context);
      
      // AI 서비스 호출
      const aiResponse = await this.callAIService(prompt);

      // AI 응답 파싱
      const aiResult = this.parseAIResponse(aiResponse);
      
      // 분석 결과 설정
      analysis.insights = aiResult.insights || [];
      analysis.recommendations = aiResult.recommendations || [];
      analysis.nextSteps = aiResult.nextSteps || [];
      analysis.riskAssessment = aiResult.riskAssessment;
      analysis.bestPractices = aiResult.bestPractices || [];
      analysis.relatedCommands = aiResult.relatedCommands || [];
      analysis.confidence = aiResult.confidence || 0.0;
      
      log('info', `AI analysis completed for script: ${scriptResult.id}`);
      
    } catch (error) {
      log('error', `AI analysis failed: ${error.message}`);
      analysis.insights = `AI 분석 중 오류가 발생했습니다: ${error.message}`;
      analysis.confidence = 0.0;
    }
    
    return analysis;
  }

  /**
   * 통합 분석 수행
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {Object} context - 분석 컨텍스트
   * @returns {Promise<ScriptAnalysisResult>} 통합 분석 결과
   */
  async performComprehensiveAnalysis(scriptResult, context = {}) {
    const analysisResult = new ScriptAnalysisResult();
    
    try {
      analysisResult.id = `analysis_${scriptResult.id}_${Date.now()}`;
      analysisResult.scriptResultId = scriptResult.id;
      analysisResult.timestamp = Date.now();
      
      // 기본 분석
      const basicAnalysis = this.performBasicAnalysis(scriptResult);
      analysisResult.details.basic = basicAnalysis;
      
      // 상세 분석
      const detailedAnalysis = this.performDetailedAnalysis(scriptResult);
      analysisResult.details.detailed = detailedAnalysis;
      
      // AI 분석 (선택적)
      if (context.enableAI !== false) {
        const aiAnalysis = await this.performAIAnalysis(scriptResult, context);
        analysisResult.details.ai = aiAnalysis;
        analysisResult.confidence = aiAnalysis.confidence;
      }
      
      // 요약 생성
      analysisResult.summary = this.generateSummary(analysisResult);
      
      // 다음 단계 생성
      analysisResult.nextSteps = this.generateNextSteps(analysisResult);
      
      // 캐시에 저장
      this.analysisCache.set(analysisResult.id, analysisResult);
      
      log('info', `Comprehensive analysis completed: ${analysisResult.id}`);
      
    } catch (error) {
      log('error', `Comprehensive analysis failed: ${error.message}`);
      throw error;
    }
    
    return analysisResult;
  }

  /**
   * 에러 카운트
   * @param {string} stderr - stderr 출력
   * @returns {number} 에러 수
   */
  countErrors(stderr) {
    if (!stderr) return 0;
    
    const errorPatterns = [
      /error:/gi,
      /exception:/gi,
      /failed/gi,
      /fatal/gi,
      /critical/gi
    ];
    
    let count = 0;
    for (const pattern of errorPatterns) {
      const matches = stderr.match(pattern);
      if (matches) {
        count += matches.length;
      }
    }
    
    return count;
  }

  /**
   * 경고 카운트
   * @param {string} stderr - stderr 출력
   * @returns {number} 경고 수
   */
  countWarnings(stderr) {
    if (!stderr) return 0;
    
    const warningPatterns = [
      /warning:/gi,
      /warn/gi,
      /deprecated/gi
    ];
    
    let count = 0;
    for (const pattern of warningPatterns) {
      const matches = stderr.match(pattern);
      if (matches) {
        count += matches.length;
      }
    }
    
    return count;
  }

  /**
   * 출력 분석
   * @param {string} output - 출력 내용
   * @param {string} type - 출력 타입 ('stdout' 또는 'stderr')
   * @returns {Object} 분석 결과
   */
  analyzeOutput(output, type) {
    if (!output) {
      return {
        isEmpty: true,
        lineCount: 0,
        wordCount: 0,
        characterCount: 0
      };
    }
    
    const lines = output.split('\n');
    const words = output.split(/\s+/);
    
    return {
      isEmpty: false,
      lineCount: lines.length,
      wordCount: words.length,
      characterCount: output.length,
      type: type
    };
  }

  /**
   * 성능 메트릭 계산
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @returns {Object} 성능 메트릭
   */
  calculatePerformanceMetrics(scriptResult) {
    const duration = scriptResult.duration;
    const outputSize = (scriptResult.stdout || '').length + (scriptResult.stderr || '').length;
    
    return {
      executionTime: duration,
      outputPerSecond: duration > 0 ? outputSize / (duration / 1000) : 0,
      efficiency: duration > 0 ? 1000 / duration : 0
    };
  }

  /**
   * 에러 패턴 추출
   * @param {string} stderr - stderr 출력
   * @returns {Array} 에러 패턴 배열
   */
  extractErrorPatterns(stderr) {
    if (!stderr) return [];
    
    const patterns = [];
    const errorRegex = /(error|exception|failed|fatal|critical):?\s*([^\n]+)/gi;
    let match;
    
    while ((match = errorRegex.exec(stderr)) !== null) {
      patterns.push({
        type: match[1].toLowerCase(),
        message: match[2].trim(),
        line: stderr.substring(0, match.index).split('\n').length
      });
    }
    
    return patterns;
  }

  /**
   * 경고 패턴 추출
   * @param {string} stderr - stderr 출력
   * @returns {Array} 경고 패턴 배열
   */
  extractWarningPatterns(stderr) {
    if (!stderr) return [];
    
    const patterns = [];
    const warningRegex = /(warning|warn|deprecated):?\s*([^\n]+)/gi;
    let match;
    
    while ((match = warningRegex.exec(stderr)) !== null) {
      patterns.push({
        type: match[1].toLowerCase(),
        message: match[2].trim(),
        line: stderr.substring(0, match.index).split('\n').length
      });
    }
    
    return patterns;
  }

  /**
   * 출력 패턴 추출
   * @param {string} stdout - stdout 출력
   * @returns {Array} 출력 패턴 배열
   */
  extractOutputPatterns(stdout) {
    if (!stdout) return [];
    
    const patterns = [];
    
    // JSON 출력 패턴
    if (stdout.trim().startsWith('{') || stdout.trim().startsWith('[')) {
      patterns.push({ type: 'json', confidence: 0.9 });
    }
    
    // 테이블 출력 패턴
    if (stdout.includes('|') && stdout.includes('\n')) {
      patterns.push({ type: 'table', confidence: 0.8 });
    }
    
    // 로그 출력 패턴
    const logRegex = /\d{4}-\d{2}-\d{2}|\d{2}:\d{2}:\d{2}/g;
    if (logRegex.test(stdout)) {
      patterns.push({ type: 'log', confidence: 0.7 });
    }
    
    return patterns;
  }

  /**
   * 보안 이슈 검사
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @returns {Array} 보안 이슈 배열
   */
  detectSecurityIssues(scriptResult) {
    const issues = [];
    const output = (scriptResult.stdout || '') + (scriptResult.stderr || '');
    
    // 패스워드 노출 검사
    const passwordPatterns = [
      /password\s*[:=]\s*['"]?[^'"]+['"]?/gi,
      /passwd\s*[:=]\s*['"]?[^'"]+['"]?/gi,
      /pwd\s*[:=]\s*['"]?[^'"]+['"]?/gi
    ];
    
    for (const pattern of passwordPatterns) {
      if (pattern.test(output)) {
        issues.push({
          type: 'password_exposure',
          severity: 'high',
          description: 'Password or sensitive information detected in output'
        });
      }
    }
    
    // API 키 노출 검사
    const apiKeyPatterns = [
      /api[_-]?key\s*[:=]\s*['"]?[a-zA-Z0-9]{20,}['"]?/gi,
      /token\s*[:=]\s*['"]?[a-zA-Z0-9]{20,}['"]?/gi
    ];
    
    for (const pattern of apiKeyPatterns) {
      if (pattern.test(output)) {
        issues.push({
          type: 'api_key_exposure',
          severity: 'high',
          description: 'API key or token detected in output'
        });
      }
    }
    
    return issues;
  }

  /**
   * 최적화 기회 검사
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @returns {Array} 최적화 기회 배열
   */
  findOptimizationOpportunities(scriptResult) {
    const opportunities = [];
    
    // 실행 시간 최적화
    if (scriptResult.duration > 5000) {
      opportunities.push({
        type: 'execution_time',
        description: 'Script execution time is high (>5s)',
        suggestion: 'Consider optimizing the script or using caching'
      });
    }
    
    // 출력 크기 최적화
    const outputSize = (scriptResult.stdout || '').length + (scriptResult.stderr || '').length;
    if (outputSize > 10000) {
      opportunities.push({
        type: 'output_size',
        description: 'Large output size detected',
        suggestion: 'Consider filtering output or using pagination'
      });
    }
    
    return opportunities;
  }

  /**
   * AI 서비스 호출
   * @param {string} prompt - AI 분석 프롬프트
   * @returns {Promise<Object>} AI 응답
   */
  async callAIService(prompt) {
    return await generateTextService({
      prompt,
      maxTokens: 2000,
      temperature: 0.3,
      commandName: 'ai-script-analysis',
      outputType: 'json'
    });
  }

  /**
   * AI 분석 프롬프트 생성
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {Object} context - 분석 컨텍스트
   * @returns {string} AI 분석 프롬프트
   */
  generateAIAnalysisPrompt(scriptResult, context) {
    return `다음 스크립트 실행 결과를 분석하고 JSON 형태로 응답해주세요:

스크립트 정보:
- 명령어: ${scriptResult.command}
- 작업 디렉토리: ${scriptResult.workingDirectory}
- 실행 시간: ${scriptResult.duration}ms
- 종료 코드: ${scriptResult.exitCode}
- 성공 여부: ${scriptResult.success}

stdout:
${scriptResult.stdout || '(없음)'}

stderr:
${scriptResult.stderr || '(없음)'}

분석 요구사항:
1. 실행 결과에 대한 인사이트 제공
2. 개선 권장사항 제시
3. 다음 단계 가이드 제공
4. 위험도 평가
5. 모범 사례 제안
6. 관련 명령어 추천

다음 JSON 형식으로 응답해주세요:
{
  "insights": ["인사이트1", "인사이트2"],
  "recommendations": ["권장사항1", "권장사항2"],
  "nextSteps": ["다음단계1", "다음단계2"],
  "riskAssessment": "low|medium|high",
  "bestPractices": ["모범사례1", "모범사례2"],
  "relatedCommands": ["관련명령어1", "관련명령어2"],
  "confidence": 0.85
}`;
  }

  /**
   * AI 응답 파싱
   * @param {string} aiResponse - AI 응답
   * @returns {Object} 파싱된 결과
   */
  parseAIResponse(aiResponse) {
    try {
      // aiResponse가 객체인 경우 mainResult를 사용
      let responseText = aiResponse;
      if (typeof aiResponse === 'object' && aiResponse.mainResult) {
        responseText = aiResponse.mainResult;
      }
      
      // 문자열이 아닌 경우 문자열로 변환
      if (typeof responseText !== 'string') {
        responseText = String(responseText);
      }
      
      // JSON 추출 시도
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // 전체 응답을 JSON으로 파싱 시도
      return JSON.parse(responseText);
    } catch (error) {
      log('warn', `Failed to parse AI response as JSON: ${error.message}`);
      
      // 기본 응답 반환
      return {
        insights: [typeof aiResponse === 'string' ? aiResponse : 'AI analysis completed'],
        recommendations: [],
        nextSteps: [],
        riskAssessment: 'unknown',
        bestPractices: [],
        relatedCommands: [],
        confidence: 0.5
      };
    }
  }

  /**
   * 권장사항 생성
   * @param {ScriptAnalysisResult} analysisResult - 분석 결과
   * @returns {Array} 권장사항 배열
   */
  generateRecommendations(analysisResult) {
    const recommendations = [];
    const basic = analysisResult.details.basic;
    const detailed = analysisResult.details.detailed;
    
    if (!basic.success) {
      recommendations.push('스크립트 실행 실패를 해결하기 위해 에러 메시지를 확인하세요');
    }
    
    if (basic.performance === 'poor') {
      recommendations.push('스크립트 성능을 개선하기 위해 최적화를 고려하세요');
    }
    
    if (detailed && detailed.securityIssues.length > 0) {
      recommendations.push('보안 이슈를 해결하기 위해 민감한 정보를 제거하세요');
    }
    
    if (detailed && detailed.optimizationOpportunities.length > 0) {
      recommendations.push('성능 최적화 기회를 활용하세요');
    }
    
    if (analysisResult.details.ai && analysisResult.details.ai.recommendations) {
      recommendations.push(...analysisResult.details.ai.recommendations);
    }
    
    return recommendations;
  }

  /**
   * 요약 생성
   * @param {ScriptAnalysisResult} analysisResult - 분석 결과
   * @returns {string} 요약
   */
  generateSummary(analysisResult) {
    const basic = analysisResult.details.basic;
    const detailed = analysisResult.details.detailed;
    
    let summary = `스크립트 실행 ${basic.success ? '성공' : '실패'}`;
    summary += ` (${basic.executionTime}ms, 종료코드: ${basic.exitCode})`;
    
    if (detailed && detailed.errorPatterns && detailed.errorPatterns.length > 0) {
      summary += `. ${detailed.errorPatterns.length}개의 에러 발견`;
    }
    
    if (detailed && detailed.warningPatterns && detailed.warningPatterns.length > 0) {
      summary += `. ${detailed.warningPatterns.length}개의 경고 발견`;
    }
    
    if (detailed && detailed.securityIssues && detailed.securityIssues.length > 0) {
      summary += `. ${detailed.securityIssues.length}개의 보안 이슈 발견`;
    }
    
    return summary;
  }

  /**
   * 다음 단계 생성
   * @param {ScriptAnalysisResult} analysisResult - 분석 결과
   * @returns {Array} 다음 단계 배열
   */
  generateNextSteps(analysisResult) {
    const steps = [];
    const basic = analysisResult.details.basic;
    const detailed = analysisResult.details.detailed;
    
    if (!basic.success) {
      steps.push('에러 메시지를 확인하고 스크립트를 수정하세요');
    }
    
    if (detailed.securityIssues.length > 0) {
      steps.push('보안 이슈를 해결하고 민감한 정보를 제거하세요');
    }
    
    if (detailed.optimizationOpportunities.length > 0) {
      steps.push('성능 최적화를 고려해보세요');
    }
    
    if (analysisResult.details.ai && analysisResult.details.ai.nextSteps) {
      steps.push(...analysisResult.details.ai.nextSteps);
    }
    
    return steps;
  }

  /**
   * 스크립트 결과 분석
   * @param {Object} scriptResult - 스크립트 실행 결과
   * @param {Object} options - 분석 옵션
   * @returns {Promise<ScriptAnalysisResult>} 분석 결과
   */
  async analyzeScriptResult(scriptResult, options = {}) {
    const analysisId = this.generateId();
    const analysisType = options.analysisType || 'comprehensive';
    const analysis = new ScriptAnalysisResult({
      id: analysisId,
      scriptResultId: scriptResult.id,
      analysisType: analysisType,
      timestamp: new Date().toISOString()
    });

    // 기본 분석
    analysis.details.basic = this.performBasicAnalysis(scriptResult);

    // 상세 분석
    if (analysisType === 'detailed' || analysisType === 'comprehensive') {
      analysis.details.detailed = this.performDetailedAnalysis(scriptResult);
    }

    // AI 분석
    if (options.enableAI !== false && analysisType !== 'detailed') {
      analysis.details.ai = await this.performAIAnalysis(scriptResult, options.context);
    }

    // 요약 생성
    analysis.summary = this.generateSummary(analysis);
    analysis.recommendations = this.generateRecommendations(analysis);
    analysis.nextSteps = this.generateNextSteps(analysis);

    // 캐시에 저장
    this.analyses.set(analysisId, analysis);

    return analysis;
  }

  /**
   * 분석 결과 조회
   * @param {string} analysisId - 분석 ID
   * @returns {ScriptAnalysisResult|null} 분석 결과
   */
  getAnalysis(analysisId) {
    return this.analyses.get(analysisId) || null;
  }

  /**
   * 모든 분석 결과 조회
   * @returns {Array} 분석 결과 배열
   */
  getAllAnalyses() {
    return Array.from(this.analyses.values());
  }

  /**
   * 분석 결과 삭제
   * @param {string} analysisId - 분석 ID
   * @returns {boolean} 삭제 성공 여부
   */
  deleteAnalysis(analysisId) {
    return this.analyses.delete(analysisId);
  }

  /**
   * 모든 분석 결과 삭제
   */
  clearAnalyses() {
    this.analyses.clear();
  }

  /**
   * 분석 결과 저장
   * @param {ScriptAnalysisResult} analysis - 분석 결과
   * @returns {Promise<ScriptAnalysisResult>} 저장된 분석 결과
   */
  async saveAnalysis(analysis) {
    // 실제 구현에서는 파일 시스템에 저장
    this.analyses.set(analysis.id, analysis);
    return analysis;
  }
}

// 전역 분석 엔진 인스턴스
const analysisEngine = new ScriptAnalysisEngine();

// 편의 함수들
export async function analyzeScriptResult(scriptResult, context = {}) {
  return await analysisEngine.performComprehensiveAnalysis(scriptResult, context);
}

export function getBasicAnalysis(scriptResult) {
  return analysisEngine.performBasicAnalysis(scriptResult);
}

export function getDetailedAnalysis(scriptResult) {
  return analysisEngine.performDetailedAnalysis(scriptResult);
}

export async function getAIAnalysis(scriptResult, context = {}) {
  return await analysisEngine.performAIAnalysis(scriptResult, context);
}

export function getAnalysis(analysisId) {
  return analysisEngine.getAnalysis(analysisId);
}

export function getAllAnalyses() {
  return analysisEngine.getAllAnalyses();
}
