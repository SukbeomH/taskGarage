/**
 * sample-analysis-results.js
 * 스크립트 분석 결과 테스트용 샘플 데이터
 * 기본, 상세, AI 분석 결과 포함
 */

/**
 * 기본 분석 결과 샘플 (성공한 스크립트)
 */
export const sampleBasicAnalysisSuccess = {
  success: true,
  executionTime: 1000,
  performance: 'good',
  errorCount: 0,
  warningCount: 0,
  outputSize: 150,
  outputType: 'text',
  hasErrors: false,
  hasWarnings: false,
  isLargeOutput: false,
  isFastExecution: true
};

/**
 * 기본 분석 결과 샘플 (실패한 스크립트)
 */
export const sampleBasicAnalysisFailure = {
  success: false,
  executionTime: 100,
  performance: 'poor',
  errorCount: 1,
  warningCount: 0,
  outputSize: 0,
  outputType: 'error',
  hasErrors: true,
  hasWarnings: false,
  isLargeOutput: false,
  isFastExecution: true
};

/**
 * 기본 분석 결과 샘플 (경고가 있는 스크립트)
 */
export const sampleBasicAnalysisWarning = {
  success: true,
  executionTime: 5000,
  performance: 'good',
  errorCount: 0,
  warningCount: 3,
  outputSize: 300,
  outputType: 'mixed',
  hasErrors: false,
  hasWarnings: true,
  isLargeOutput: false,
  isFastExecution: false
};

/**
 * 상세 분석 결과 샘플 (성공한 스크립트)
 */
export const sampleDetailedAnalysisSuccess = {
  errorPatterns: [],
  warningPatterns: [],
  outputPatterns: [
    {
      type: 'file_listing',
      pattern: 'drwxr-xr-x',
      count: 2,
      lines: [2, 3]
    }
  ],
  securityIssues: [],
  optimizationOpportunities: [
    {
      type: 'performance',
      description: 'Consider using ls -1 for single column output',
      impact: 'low',
      suggestion: 'Use ls -1 instead of ls -la for better performance'
    }
  ],
  outputMetrics: {
    lineCount: 4,
    wordCount: 15,
    characterCount: 150,
    uniqueWords: 8
  }
};

/**
 * 상세 분석 결과 샘플 (실패한 스크립트)
 */
export const sampleDetailedAnalysisFailure = {
  errorPatterns: [
    {
      type: 'command_not_found',
      message: 'command not found: invalid-command',
      count: 1,
      lines: [1],
      severity: 'high'
    }
  ],
  warningPatterns: [],
  outputPatterns: [],
  securityIssues: [],
  optimizationOpportunities: [
    {
      type: 'command_validation',
      description: 'Command validation failed',
      impact: 'high',
      suggestion: 'Validate command before execution'
    }
  ],
  outputMetrics: {
    lineCount: 0,
    wordCount: 0,
    characterCount: 0,
    uniqueWords: 0
  }
};

/**
 * 상세 분석 결과 샘플 (경고가 있는 스크립트)
 */
export const sampleDetailedAnalysisWarning = {
  errorPatterns: [],
  warningPatterns: [
    {
      type: 'npm_warning',
      message: 'npm WARN package.json No description field',
      count: 1,
      lines: [2],
      severity: 'low'
    },
    {
      type: 'npm_warning',
      message: 'npm WARN package.json No repository field.',
      count: 1,
      lines: [3],
      severity: 'low'
    },
    {
      type: 'npm_warning',
      message: 'npm WARN package.json No license field.',
      count: 1,
      lines: [4],
      severity: 'low'
    }
  ],
  outputPatterns: [
    {
      type: 'npm_install',
      pattern: 'added \\d+ packages',
      count: 1,
      lines: [5]
    }
  ],
  securityIssues: [],
  optimizationOpportunities: [
    {
      type: 'package_json',
      description: 'Add missing package.json fields',
      impact: 'medium',
      suggestion: 'Add description, repository, and license fields to package.json'
    }
  ],
  outputMetrics: {
    lineCount: 6,
    wordCount: 25,
    characterCount: 300,
    uniqueWords: 18
  }
};

/**
 * AI 분석 결과 샘플 (성공한 스크립트)
 */
export const sampleAIAnalysisSuccess = {
  insights: [
    '스크립트가 성공적으로 실행되었습니다.',
    '출력이 깔끔하고 구조화되어 있습니다.',
    '실행 시간이 적절합니다.'
  ],
  bestPractices: [
    'ls 명령어 사용이 적절합니다.',
    '출력 형식이 일관성 있습니다.',
    '에러가 없어 안정적입니다.'
  ],
  relatedCommands: [
    'ls -1',
    'ls -lh',
    'ls -la | grep "^d"'
  ],
  confidence: 0.95,
  riskAssessment: 'low',
  recommendations: [
    '현재 상태가 양호합니다.',
    '정기적인 모니터링을 권장합니다.'
  ]
};

/**
 * AI 분석 결과 샘플 (실패한 스크립트)
 */
export const sampleAIAnalysisFailure = {
  insights: [
    '명령어가 존재하지 않아 실행에 실패했습니다.',
    '입력 검증이 필요합니다.',
    '사용자 오류로 판단됩니다.'
  ],
  bestPractices: [
    '명령어 실행 전 검증이 필요합니다.',
    '사용자에게 명확한 피드백을 제공해야 합니다.',
    '대안 명령어를 제시하는 것이 좋습니다.'
  ],
  relatedCommands: [
    'which invalid-command',
    'command -v invalid-command',
    'type invalid-command'
  ],
  confidence: 0.90,
  riskAssessment: 'medium',
  recommendations: [
    '명령어 검증 로직을 추가하세요.',
    '사용자에게 올바른 명령어 사용법을 안내하세요.',
    '자동 완성 기능을 고려해보세요.'
  ]
};

/**
 * AI 분석 결과 샘플 (경고가 있는 스크립트)
 */
export const sampleAIAnalysisWarning = {
  insights: [
    'npm 설치가 성공했지만 경고가 발생했습니다.',
    'package.json 파일에 일부 필드가 누락되어 있습니다.',
    '기능적으로는 문제없지만 개선의 여지가 있습니다.'
  ],
  bestPractices: [
    'package.json에 필수 필드를 추가하세요.',
    'npm 경고를 해결하여 깔끔한 출력을 유지하세요.',
    '정기적으로 package.json을 검토하세요.'
  ],
  relatedCommands: [
    'npm init',
    'npm pkg set description="..."',
    'npm pkg set repository="..."'
  ],
  confidence: 0.85,
  riskAssessment: 'low',
  recommendations: [
    'package.json에 description, repository, license 필드를 추가하세요.',
    'npm 경고를 해결하여 더 깔끔한 출력을 얻으세요.',
    '정기적인 package.json 검토를 권장합니다.'
  ]
};

/**
 * 통합 분석 결과 샘플 (성공한 스크립트)
 */
export const sampleComprehensiveAnalysisSuccess = {
  id: 'analysis_001',
  scriptResultId: 'script_001',
  analysisType: 'comprehensive',
  timestamp: new Date('2024-01-01T00:00:02Z').getTime(),
  summary: '스크립트가 성공적으로 실행되었으며, 성능이 양호하고 에러가 없습니다.',
  details: {
    basic: sampleBasicAnalysisSuccess,
    detailed: sampleDetailedAnalysisSuccess,
    ai: sampleAIAnalysisSuccess
  },
  recommendations: [
    '현재 상태가 양호합니다.',
    '정기적인 모니터링을 권장합니다.',
    'ls -1 사용을 고려해보세요.'
  ],
  nextSteps: [
    '스크립트 실행 결과를 문서화하세요.',
    '정기적인 성능 모니터링을 설정하세요.',
    '유사한 스크립트에 동일한 패턴을 적용하세요.'
  ],
  confidence: 0.95,
  metadata: {
    analyzer: 'task-master-cli',
    version: '1.0.0'
  }
};

/**
 * 통합 분석 결과 샘플 (실패한 스크립트)
 */
export const sampleComprehensiveAnalysisFailure = {
  id: 'analysis_002',
  scriptResultId: 'script_002',
  analysisType: 'comprehensive',
  timestamp: new Date('2024-01-01T00:00:01Z').getTime(),
  summary: '스크립트 실행에 실패했으며, 명령어 검증이 필요합니다.',
  details: {
    basic: sampleBasicAnalysisFailure,
    detailed: sampleDetailedAnalysisFailure,
    ai: sampleAIAnalysisFailure
  },
  recommendations: [
    '명령어 검증 로직을 추가하세요.',
    '사용자에게 올바른 명령어 사용법을 안내하세요.',
    '자동 완성 기능을 고려해보세요.'
  ],
  nextSteps: [
    '명령어 검증 시스템을 구현하세요.',
    '사용자 가이드 문서를 작성하세요.',
    '오류 처리 로직을 개선하세요.'
  ],
  confidence: 0.90,
  metadata: {
    analyzer: 'task-master-cli',
    version: '1.0.0'
  }
};

/**
 * 통합 분석 결과 샘플 (경고가 있는 스크립트)
 */
export const sampleComprehensiveAnalysisWarning = {
  id: 'analysis_003',
  scriptResultId: 'script_006',
  analysisType: 'comprehensive',
  timestamp: new Date('2024-01-01T00:00:06Z').getTime(),
  summary: '스크립트는 성공했지만 npm 경고가 발생했으며, package.json 개선이 필요합니다.',
  details: {
    basic: sampleBasicAnalysisWarning,
    detailed: sampleDetailedAnalysisWarning,
    ai: sampleAIAnalysisWarning
  },
  recommendations: [
    'package.json에 description, repository, license 필드를 추가하세요.',
    'npm 경고를 해결하여 더 깔끔한 출력을 얻으세요.',
    '정기적인 package.json 검토를 권장합니다.'
  ],
  nextSteps: [
    'package.json 파일을 업데이트하세요.',
    'npm 경고 해결을 위한 가이드를 작성하세요.',
    '정기적인 package.json 검토 프로세스를 설정하세요.'
  ],
  confidence: 0.85,
  metadata: {
    analyzer: 'task-master-cli',
    version: '1.0.0'
  }
};

/**
 * 모든 분석 결과 샘플 배열
 */
export const allAnalysisResultSamples = [
  sampleComprehensiveAnalysisSuccess,
  sampleComprehensiveAnalysisFailure,
  sampleComprehensiveAnalysisWarning
];

/**
 * 성공한 분석 결과만 필터링
 */
export const successfulAnalysisResults = allAnalysisResultSamples.filter(result => 
  result.details.basic.success
);

/**
 * 실패한 분석 결과만 필터링
 */
export const failedAnalysisResults = allAnalysisResultSamples.filter(result => 
  !result.details.basic.success
);

/**
 * 특정 조건에 맞는 분석 결과를 찾는 헬퍼 함수
 */
export const findAnalysisResultByCondition = (condition) => {
  return allAnalysisResultSamples.find(condition);
};

/**
 * 분석 결과를 ID로 찾는 헬퍼 함수
 */
export const findAnalysisResultById = (id) => {
  return allAnalysisResultSamples.find(result => result.id === id);
};

/**
 * 스크립트 결과 ID로 분석 결과를 찾는 헬퍼 함수
 */
export const findAnalysisResultByScriptId = (scriptResultId) => {
  return allAnalysisResultSamples.find(result => result.scriptResultId === scriptResultId);
};
