/**
 * analyze-script-result.js
 * 스크립트 실행 결과 분석 직접 함수 래퍼
 * MCP 도구와 핵심 로직을 연결
 */

import { 
  analyzeScriptResult, 
  getBasicAnalysis, 
  getDetailedAnalysis, 
  getAIAnalysis 
} from '../../../../scripts/modules/script-analysis-engine.js';
import { getScriptResult } from '../../../../scripts/modules/script-execution-engine.js';

/**
 * 스크립트 실행 결과 분석 직접 함수
 * @param {Object} args - 분석 인수
 * @param {Object} log - 로거 객체
 * @param {Object} context - 컨텍스트 객체
 * @returns {Promise<Object>} 분석 결과
 */
export async function analyzeScriptResultDirect(args, log, context = {}) {
  const { session } = context;
  
  try {
    // 인수 검증
    if (!args.scriptResultId) {
      throw new Error('Script result ID is required');
    }

    log.info(`Starting analysis for script result: ${args.scriptResultId}`);

    // 스크립트 결과 조회
    const scriptResult = getScriptResult(args.scriptResultId);
    if (!scriptResult) {
      throw new Error(`Script result not found: ${args.scriptResultId}`);
    }

    // 분석 타입 결정
    const analysisType = args.analysisType || 'comprehensive';
    const enableAI = args.enableAI !== false; // 기본값: true
    const analysisContext = {
      enableAI,
      context: args.context || '',
      session
    };

    let analysisResult;

    // 분석 타입별 처리
    switch (analysisType) {
      case 'basic':
        log.info('Performing basic analysis');
        const basicAnalysis = getBasicAnalysis(scriptResult);
        analysisResult = {
          id: `analysis_${args.scriptResultId}_basic_${Date.now()}`,
          scriptResultId: args.scriptResultId,
          analysisType: 'basic',
          timestamp: Date.now(),
          summary: `Basic analysis: ${basicAnalysis.success ? 'Success' : 'Failure'} (${basicAnalysis.executionTime}ms)`,
          details: { basic: basicAnalysis },
          recommendations: [],
          nextSteps: [],
          confidence: 1.0
        };
        break;

      case 'detailed':
        log.info('Performing detailed analysis');
        const detailedAnalysis = getDetailedAnalysis(scriptResult);
        analysisResult = {
          id: `analysis_${args.scriptResultId}_detailed_${Date.now()}`,
          scriptResultId: args.scriptResultId,
          analysisType: 'detailed',
          timestamp: Date.now(),
          summary: `Detailed analysis: ${detailedAnalysis.errorPatterns.length} errors, ${detailedAnalysis.warningPatterns.length} warnings`,
          details: { detailed: detailedAnalysis },
          recommendations: [],
          nextSteps: [],
          confidence: 0.9
        };
        break;

      case 'ai':
        log.info('Performing AI analysis');
        const aiAnalysis = await getAIAnalysis(scriptResult, analysisContext);
        analysisResult = {
          id: `analysis_${args.scriptResultId}_ai_${Date.now()}`,
          scriptResultId: args.scriptResultId,
          analysisType: 'ai',
          timestamp: Date.now(),
          summary: `AI analysis: ${aiAnalysis.insights.length} insights, confidence: ${aiAnalysis.confidence}`,
          details: { ai: aiAnalysis },
          recommendations: aiAnalysis.recommendations,
          nextSteps: aiAnalysis.nextSteps,
          confidence: aiAnalysis.confidence
        };
        break;

      case 'comprehensive':
      default:
        log.info('Performing comprehensive analysis');
        analysisResult = await analyzeScriptResult(scriptResult, analysisContext);
        break;
    }

    log.info(`Analysis completed: ${analysisResult.id}`);

    // 결과 반환
    return {
      success: true,
      data: {
        id: analysisResult.id,
        scriptResultId: analysisResult.scriptResultId,
        analysisType: analysisResult.analysisType,
        timestamp: analysisResult.timestamp,
        summary: analysisResult.summary,
        details: analysisResult.details,
        recommendations: analysisResult.recommendations,
        nextSteps: analysisResult.nextSteps,
        confidence: analysisResult.confidence,
        metadata: analysisResult.metadata
      },
      fromCache: false
    };

  } catch (error) {
    log.error(`Script analysis failed: ${error.message}`);
    
    return {
      success: false,
      error: {
        code: 'SCRIPT_ANALYSIS_ERROR',
        message: error.message,
        details: error.stack
      },
      fromCache: false
    };
  }
}
