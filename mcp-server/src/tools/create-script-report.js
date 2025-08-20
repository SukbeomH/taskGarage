/**
 * create-script-report.js
 * 스크립트 실행 결과 보고서 생성 MCP 도구
 * MCP Filesystem 서버 패턴을 참고하여 구현
 */

import { z } from 'zod';
import { handleApiResult, withNormalizedProjectRoot } from './utils.js';
import { createScriptReportDirect } from '../core/direct-functions/create-script-report.js';

export function registerCreateScriptReportTool(server) {
  server.addTool({
    name: "create_script_report",
    description: "스크립트 실행 결과를 다양한 형식(마크다운, HTML, JSON)으로 보고서를 생성합니다. MCP Filesystem 서버 패턴을 참고하여 구현되었습니다.",
    parameters: z.object({
      scriptResultId: z.string().describe("보고서를 생성할 스크립트 실행 결과의 ID (예: 'script_001')"),
      analysisResultId: z.string().optional().describe("분석 결과 ID (선택사항, 분석 결과가 있는 경우)"),
      format: z.enum(['markdown', 'html', 'json']).optional().describe("보고서 형식 (기본값: 'markdown')"),
      template: z.string().optional().describe("보고서 템플릿 (기본값: 'default')"),
      outputPath: z.string().optional().describe("보고서 파일 저장 경로 (선택사항)"),
      includeDetails: z.boolean().optional().describe("상세 정보 포함 여부 (기본값: true)"),
      includeAnalysis: z.boolean().optional().describe("분석 결과 포함 여부 (기본값: true)"),
      includeRecommendations: z.boolean().optional().describe("권장사항 포함 여부 (기본값: true)"),
      includeNextSteps: z.boolean().optional().describe("다음 단계 포함 여부 (기본값: true)"),
      customStyles: z.object({}).optional().describe("사용자 정의 스타일 (HTML 형식에서만 사용)"),
      metadata: z.object({}).optional().describe("추가 메타데이터"),
      projectRoot: z.string().optional().describe("프로젝트 루트 디렉토리 (세션에서 자동으로 결정됨)")
    }),
    execute: withNormalizedProjectRoot(async (args, { log, session }) => {
      try {
        log.info(`Creating script report for: ${args.scriptResultId} in format: ${args.format || 'markdown'}`);
        
        const result = await createScriptReportDirect(args, log, { session });
        return handleApiResult(result, log);
      } catch (error) {
        log.error(`Error in create_script_report: ${error.message}`);
        return {
          success: false,
          error: {
            code: 'SCRIPT_REPORT_CREATION_ERROR',
            message: error.message
          }
        };
      }
    })
  });
}
