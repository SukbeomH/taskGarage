/**
 * sample-reports.js
 * 보고서 생성 결과 테스트용 샘플 데이터
 * 마크다운, HTML, JSON 형식 포함
 */

/**
 * 마크다운 보고서 샘플 (성공한 스크립트)
 */
export const sampleMarkdownReportSuccess = `# 스크립트 실행 보고서

**생성 시간**: 2024-01-01 00:00:02
**보고서 ID**: analysis_001
**스크립트 ID**: script_001

## 실행 요약

| 항목 | 값 |
|------|----|
| 명령어 | \`ls -la\` |
| 작업 디렉토리 | \`/tmp\` |
| 시작 시간 | 2024-01-01 00:00:00 |
| 종료 시간 | 2024-01-01 00:00:01 |
| 실행 시간 | 1000ms |
| 종료 코드 | 0 |
| 상태 | ✅ 성공 |
| stdout 크기 | 150 문자 |
| stderr 크기 | 0 문자 |

## 분석 결과

### 요약
스크립트가 성공적으로 실행되었으며, 성능이 양호하고 에러가 없습니다.

### 기본 분석
- **성공 여부**: 성공
- **실행 시간**: 1000ms
- **성능**: good
- **에러 수**: 0
- **경고 수**: 0

## 권장사항

1. 현재 상태가 양호합니다.
2. 정기적인 모니터링을 권장합니다.
3. ls -1 사용을 고려해보세요.

## 다음 단계

1. 스크립트 실행 결과를 문서화하세요.
2. 정기적인 성능 모니터링을 설정하세요.
3. 유사한 스크립트에 동일한 패턴을 적용하세요.

## 상세 정보

### 표준 출력 (stdout)

\`\`\`
total 8
drwxr-xr-x  2 user  staff  64 Jan  1 00:00 .
drwxr-xr-x  3 user  staff  96 Jan  1 00:00 ..
-rw-r--r--  1 user  staff   0 Jan  1 00:00 test.txt
\`\`\`

---

*이 보고서는 Task Master CLI에 의해 자동 생성되었습니다.*
*생성 시간: 2024-01-01 00:00:02*`;

/**
 * 마크다운 보고서 샘플 (실패한 스크립트)
 */
export const sampleMarkdownReportFailure = `# 스크립트 실행 보고서

**생성 시간**: 2024-01-01 00:00:01
**보고서 ID**: analysis_002
**스크립트 ID**: script_002

## 실행 요약

| 항목 | 값 |
|------|----|
| 명령어 | \`invalid-command\` |
| 작업 디렉토리 | \`/tmp\` |
| 시작 시간 | 2024-01-01 00:00:00 |
| 종료 시간 | 2024-01-01 00:00:00 |
| 실행 시간 | 100ms |
| 종료 코드 | 127 |
| 상태 | ❌ 실패 |
| stdout 크기 | 0 문자 |
| stderr 크기 | 35 문자 |

## 분석 결과

### 요약
스크립트 실행에 실패했으며, 명령어 검증이 필요합니다.

### 기본 분석
- **성공 여부**: 실패
- **실행 시간**: 100ms
- **성능**: poor
- **에러 수**: 1
- **경고 수**: 0

## 권장사항

1. 명령어 검증 로직을 추가하세요.
2. 사용자에게 올바른 명령어 사용법을 안내하세요.
3. 자동 완성 기능을 고려해보세요.

## 다음 단계

1. 명령어 검증 시스템을 구현하세요.
2. 사용자 가이드 문서를 작성하세요.
3. 오류 처리 로직을 개선하세요.

## 상세 정보

### 표준 에러 (stderr)

\`\`\`
command not found: invalid-command
\`\`\`

---

*이 보고서는 Task Master CLI에 의해 자동 생성되었습니다.*
*생성 시간: 2024-01-01 00:00:01*`;

/**
 * HTML 보고서 샘플 (성공한 스크립트)
 */
export const sampleHTMLReportSuccess = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>스크립트 실행 보고서 - script_001</title>
    <style>
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
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>스크립트 실행 보고서</h1>
            <div class="metadata">
                <p><strong>생성 시간:</strong> 2024-01-01 00:00:02</p>
                <p><strong>스크립트 ID:</strong> script_001</p>
                <p><strong>상태:</strong> <span class="status success">성공</span></p>
            </div>
        </header>

        <main>
            <section class="execution-summary">
                <h2>실행 요약</h2>
                <table>
                    <tr><td>명령어</td><td><code>ls -la</code></td></tr>
                    <tr><td>작업 디렉토리</td><td><code>/tmp</code></td></tr>
                    <tr><td>실행 시간</td><td>1000ms</td></tr>
                    <tr><td>종료 코드</td><td>0</td></tr>
                </table>
            </section>

            <section class="analysis">
                <h2>분석 결과</h2>
                <p><strong>요약:</strong> 스크립트가 성공적으로 실행되었으며, 성능이 양호하고 에러가 없습니다.</p>
                <p><strong>신뢰도:</strong> 95.0%</p>

                <h3>기본 분석</h3>
                <table>
                    <tr><td>성공 여부</td><td>성공</td></tr>
                    <tr><td>실행 시간</td><td>1000ms</td></tr>
                    <tr><td>성능</td><td>good</td></tr>
                    <tr><td>에러 수</td><td>0</td></tr>
                    <tr><td>경고 수</td><td>0</td></tr>
                </table>
            </section>

            <section class="recommendations">
                <h2>권장사항</h2>
                <div class="recommendation">
                    <strong>1.</strong> 현재 상태가 양호합니다.
                </div>
                <div class="recommendation">
                    <strong>2.</strong> 정기적인 모니터링을 권장합니다.
                </div>
                <div class="recommendation">
                    <strong>3.</strong> ls -1 사용을 고려해보세요.
                </div>
            </section>

            <section class="next-steps">
                <h2>다음 단계</h2>
                <div class="next-step">
                    <strong>1.</strong> 스크립트 실행 결과를 문서화하세요.
                </div>
                <div class="next-step">
                    <strong>2.</strong> 정기적인 성능 모니터링을 설정하세요.
                </div>
                <div class="next-step">
                    <strong>3.</strong> 유사한 스크립트에 동일한 패턴을 적용하세요.
                </div>
            </section>

            <section class="details">
                <h2>상세 정보</h2>
                <h3>표준 출력 (stdout)</h3>
                <pre><code>total 8
drwxr-xr-x  2 user  staff  64 Jan  1 00:00 .
drwxr-xr-x  3 user  staff  96 Jan  1 00:00 ..
-rw-r--r--  1 user  staff   0 Jan  1 00:00 test.txt</code></pre>
            </section>
        </main>

        <footer>
            <p>이 보고서는 Task Master CLI에 의해 자동 생성되었습니다.</p>
            <p>생성 시간: 2024-01-01 00:00:02</p>
        </footer>
    </div>
</body>
</html>`;

/**
 * JSON 보고서 샘플 (성공한 스크립트)
 */
export const sampleJSONReportSuccess = {
  "metadata": {
    "generatedAt": "2024-01-01T00:00:02.000Z",
    "reportId": "analysis_001",
    "scriptId": "script_001",
    "format": "json",
    "version": "1.0"
  },
  "scriptResult": {
    "id": "script_001",
    "command": "ls -la",
    "workingDirectory": "/tmp",
    "startTime": 1704067200000,
    "endTime": 1704067201000,
    "duration": 1000,
    "exitCode": 0,
    "success": true,
    "stdout": "total 8\ndrwxr-xr-x  2 user  staff  64 Jan  1 00:00 .\ndrwxr-xr-x  3 user  staff  96 Jan  1 00:00 ..\n-rw-r--r--  1 user  staff   0 Jan  1 00:00 test.txt",
    "stderr": "",
    "error": null,
    "metadata": {
      "platform": "darwin",
      "nodeVersion": "18.0.0",
      "shell": "/bin/zsh"
    }
  },
  "analysis": {
    "id": "analysis_001",
    "scriptResultId": "script_001",
    "analysisType": "comprehensive",
    "timestamp": 1704067202000,
    "summary": "스크립트가 성공적으로 실행되었으며, 성능이 양호하고 에러가 없습니다.",
    "details": {
      "basic": {
        "success": true,
        "executionTime": 1000,
        "performance": "good",
        "errorCount": 0,
        "warningCount": 0,
        "outputSize": 150,
        "outputType": "text",
        "hasErrors": false,
        "hasWarnings": false,
        "isLargeOutput": false,
        "isFastExecution": true
      },
      "detailed": {
        "errorPatterns": [],
        "warningPatterns": [],
        "outputPatterns": [
          {
            "type": "file_listing",
            "pattern": "drwxr-xr-x",
            "count": 2,
            "lines": [2, 3]
          }
        ],
        "securityIssues": [],
        "optimizationOpportunities": [
          {
            "type": "performance",
            "description": "Consider using ls -1 for single column output",
            "impact": "low",
            "suggestion": "Use ls -1 instead of ls -la for better performance"
          }
        ],
        "outputMetrics": {
          "lineCount": 4,
          "wordCount": 15,
          "characterCount": 150,
          "uniqueWords": 8
        }
      },
      "ai": {
        "insights": [
          "스크립트가 성공적으로 실행되었습니다.",
          "출력이 깔끔하고 구조화되어 있습니다.",
          "실행 시간이 적절합니다."
        ],
        "bestPractices": [
          "ls 명령어 사용이 적절합니다.",
          "출력 형식이 일관성 있습니다.",
          "에러가 없어 안정적입니다."
        ],
        "relatedCommands": [
          "ls -1",
          "ls -lh",
          "ls -la | grep \"^d\""
        ],
        "confidence": 0.95,
        "riskAssessment": "low",
        "recommendations": [
          "현재 상태가 양호합니다.",
          "정기적인 모니터링을 권장합니다."
        ]
      }
    },
    "recommendations": [
      "현재 상태가 양호합니다.",
      "정기적인 모니터링을 권장합니다.",
      "ls -1 사용을 고려해보세요."
    ],
    "nextSteps": [
      "스크립트 실행 결과를 문서화하세요.",
      "정기적인 성능 모니터링을 설정하세요.",
      "유사한 스크립트에 동일한 패턴을 적용하세요."
    ],
    "confidence": 0.95,
    "metadata": {
      "analyzer": "task-master-cli",
      "version": "1.0.0"
    }
  },
  "recommendations": [
    "현재 상태가 양호합니다.",
    "정기적인 모니터링을 권장합니다.",
    "ls -1 사용을 고려해보세요."
  ],
  "nextSteps": [
    "스크립트 실행 결과를 문서화하세요.",
    "정기적인 성능 모니터링을 설정하세요.",
    "유사한 스크립트에 동일한 패턴을 적용하세요."
  ],
  "customMetadata": {
    "generatedBy": "task-master-cli",
    "tag": "master"
  }
};

/**
 * 모든 보고서 샘플 배열
 */
export const allReportSamples = [
  {
    id: 'report_001',
    scriptResultId: 'script_001',
    analysisResultId: 'analysis_001',
    format: 'markdown',
    content: sampleMarkdownReportSuccess,
    length: sampleMarkdownReportSuccess.length
  },
  {
    id: 'report_002',
    scriptResultId: 'script_002',
    analysisResultId: 'analysis_002',
    format: 'markdown',
    content: sampleMarkdownReportFailure,
    length: sampleMarkdownReportFailure.length
  },
  {
    id: 'report_003',
    scriptResultId: 'script_001',
    analysisResultId: 'analysis_001',
    format: 'html',
    content: sampleHTMLReportSuccess,
    length: sampleHTMLReportSuccess.length
  },
  {
    id: 'report_004',
    scriptResultId: 'script_001',
    analysisResultId: 'analysis_001',
    format: 'json',
    content: JSON.stringify(sampleJSONReportSuccess, null, 2),
    length: JSON.stringify(sampleJSONReportSuccess, null, 2).length
  }
];

/**
 * 특정 형식의 보고서 샘플을 찾는 헬퍼 함수
 */
export const findReportByFormat = (format) => {
  return allReportSamples.find(report => report.format === format);
};

/**
 * 특정 스크립트 결과 ID의 보고서를 찾는 헬퍼 함수
 */
export const findReportByScriptId = (scriptResultId) => {
  return allReportSamples.find(report => report.scriptResultId === scriptResultId);
};

/**
 * 보고서를 ID로 찾는 헬퍼 함수
 */
export const findReportById = (id) => {
  return allReportSamples.find(report => report.id === id);
};
