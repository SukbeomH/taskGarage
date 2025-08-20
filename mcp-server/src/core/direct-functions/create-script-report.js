/**
 * create-script-report.js
 * 스크립트 실행 결과 보고서 생성 직접 함수 래퍼
 * MCP 도구와 핵심 로직을 연결
 */

import { 
  generateScriptReport,
  getSupportedReportFormats,
  getSupportedReportTemplates
} from '../../../../scripts/modules/script-report-engine.js';
import { getScriptResult } from '../../../../scripts/modules/script-execution-engine.js';
import { getAnalysis } from '../../../../scripts/modules/script-analysis-engine.js';

/**
 * 스크립트 실행 결과 보고서 생성 직접 함수
 * @param {Object} args - 보고서 생성 인수
 * @param {Object} log - 로거 객체
 * @param {Object} context - 컨텍스트 객체
 * @returns {Promise<Object>} 보고서 생성 결과
 */
export async function createScriptReportDirect(args, log, context = {}) {
  const { session } = context;
  
  try {
    // 인수 검증
    if (!args.scriptResultId) {
      throw new Error('Script result ID is required');
    }

    log.info(`Starting report creation for script result: ${args.scriptResultId}`);

    // 스크립트 결과 조회
    const scriptResult = getScriptResult(args.scriptResultId);
    if (!scriptResult) {
      throw new Error(`Script result not found: ${args.scriptResultId}`);
    }

    // 분석 결과 조회 (선택적)
    let analysisResult = null;
    if (args.analysisResultId) {
      analysisResult = getAnalysis(args.analysisResultId);
      if (!analysisResult) {
        log.warn(`Analysis result not found: ${args.analysisResultId}, proceeding without analysis`);
      }
    }

    // 보고서 옵션 구성
    const reportOptions = {
      format: args.format || 'markdown',
      template: args.template || 'default',
      outputPath: args.outputPath || null,
      includeDetails: args.includeDetails !== false,
      includeAnalysis: args.includeAnalysis !== false,
      includeRecommendations: args.includeRecommendations !== false,
      includeNextSteps: args.includeNextSteps !== false,
      customStyles: args.customStyles || {},
      metadata: {
        ...args.metadata,
        sessionId: session ? session.id : null,
        generatedBy: 'task-master-cli'
      }
    };

    // 지원하는 형식 검증
    const supportedFormats = getSupportedReportFormats();
    if (!supportedFormats.includes(reportOptions.format)) {
      throw new Error(`Unsupported report format: ${reportOptions.format}. Supported formats: ${supportedFormats.join(', ')}`);
    }

    // 지원하는 템플릿 검증
    const supportedTemplates = getSupportedReportTemplates(reportOptions.format);
    if (!supportedTemplates.includes(reportOptions.template)) {
      log.warn(`Template '${reportOptions.template}' not found for format '${reportOptions.format}', using 'default'`);
      reportOptions.template = 'default';
    }

    log.info(`Generating report with options: ${JSON.stringify(reportOptions)}`);

    // 보고서 생성
    const report = await generateScriptReport(scriptResult, analysisResult, reportOptions);

    // 결과 반환
    const result = {
      success: true,
      data: {
        scriptResultId: args.scriptResultId,
        analysisResultId: args.analysisResultId || null,
        format: reportOptions.format,
        template: reportOptions.template,
        outputPath: reportOptions.outputPath,
        reportLength: report.length,
        generatedAt: new Date().toISOString(),
        metadata: reportOptions.metadata
      },
      report: report
    };

    // 파일로 저장된 경우 파일 경로 추가
    if (reportOptions.outputPath) {
      result.data.savedToFile = true;
      result.data.filePath = reportOptions.outputPath;
    }

    log.info(`Report creation completed successfully`);

    return result;

  } catch (error) {
    log.error(`Script report creation failed: ${error.message}`);
    
    return {
      success: false,
      error: {
        code: 'SCRIPT_REPORT_CREATION_ERROR',
        message: error.message,
        details: error.stack
      }
    };
  }
}
