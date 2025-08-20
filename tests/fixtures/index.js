/**
 * index.js
 * 모든 테스트 픽스처를 한 곳에서 export
 */

// 스크립트 실행 결과 샘플
export * from './sample-script-results.js';

// 분석 결과 샘플
export * from './sample-analysis-results.js';

// 보고서 샘플
export * from './sample-reports.js';

// 모든 샘플 데이터를 한 번에 가져오는 편의 함수들
export const getAllTestData = () => {
  return {
    scriptResults: {
      successful: [
        'sampleSuccessfulScriptResult',
        'sampleWarningScriptResult',
        'sampleEmptyOutputScriptResult',
        'sampleSpecialCharsScriptResult',
        'sampleLargeOutputScriptResult'
      ],
      failed: [
        'sampleFailedScriptResult',
        'sampleTimeoutScriptResult',
        'sampleErrorOutputScriptResult',
        'samplePermissionErrorScriptResult'
      ],
      all: 'allScriptResultSamples'
    },
    analysisResults: {
      successful: [
        'sampleComprehensiveAnalysisSuccess',
        'sampleComprehensiveAnalysisWarning'
      ],
      failed: [
        'sampleComprehensiveAnalysisFailure'
      ],
      all: 'allAnalysisResultSamples'
    },
    reports: {
      markdown: [
        'sampleMarkdownReportSuccess',
        'sampleMarkdownReportFailure'
      ],
      html: [
        'sampleHTMLReportSuccess'
      ],
      json: [
        'sampleJSONReportSuccess'
      ],
      all: 'allReportSamples'
    }
  };
};

// 특정 시나리오별 테스트 데이터 조합
export const getTestScenarios = () => {
  return {
    successScenario: {
      scriptResult: 'sampleSuccessfulScriptResult',
      analysisResult: 'sampleComprehensiveAnalysisSuccess',
      report: 'sampleMarkdownReportSuccess'
    },
    failureScenario: {
      scriptResult: 'sampleFailedScriptResult',
      analysisResult: 'sampleComprehensiveAnalysisFailure',
      report: 'sampleMarkdownReportFailure'
    },
    warningScenario: {
      scriptResult: 'sampleWarningScriptResult',
      analysisResult: 'sampleComprehensiveAnalysisWarning',
      report: 'sampleMarkdownReportSuccess'
    },
    timeoutScenario: {
      scriptResult: 'sampleTimeoutScriptResult',
      analysisResult: null, // 타임아웃은 분석하지 않음
      report: null
    },
    largeOutputScenario: {
      scriptResult: 'sampleLargeOutputScriptResult',
      analysisResult: null, // 대용량 출력은 별도 분석 필요
      report: null
    }
  };
};
