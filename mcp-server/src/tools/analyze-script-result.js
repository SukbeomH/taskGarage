/**
 * analyze-script-result.js
 * 스크립트 실행 결과 분석 MCP 도구
 * MCP Filesystem 서버 패턴을 참고하여 구현
 */

import { z } from 'zod';
import { handleApiResult, withNormalizedProjectRoot } from './utils.js';
import { analyzeScriptResultDirect } from '../core/direct-functions/analyze-script-result.js';

export function registerAnalyzeScriptResultTool(server) {
  server.addTool({
    name: "analyze_script_result",
    description: "스크립트 실행 결과를 분석하고 인사이트를 제공합니다. MCP Filesystem 서버 패턴을 참고하여 구현되었습니다.",
    parameters: z.object({
      scriptResultId: z.string().describe("분석할 스크립트 실행 결과의 ID (예: 'script_001')"),
      analysisType: z.enum(['basic', 'detailed', 'ai', 'comprehensive']).optional().describe("분석 타입 (기본값: 'comprehensive')"),
      enableAI: z.boolean().optional().describe("AI 분석 활성화 여부 (기본값: true)"),
      context: z.string().optional().describe("분석 컨텍스트 정보"),
      projectRoot: z.string().optional().describe("프로젝트 루트 디렉토리 (세션에서 자동으로 결정됨)")
    }),
    execute: withNormalizedProjectRoot(async (args, { log, session }) => {
      try {
        log.info(`Analyzing script result: ${args.scriptResultId} with type: ${args.analysisType || 'comprehensive'}`);
        
        const result = await analyzeScriptResultDirect(args, log, { session });
        return handleApiResult(result, log);
      } catch (error) {
        log.error(`Error in analyze_script_result: ${error.message}`);
        return {
          success: false,
          error: {
            code: 'SCRIPT_ANALYSIS_ERROR',
            message: error.message
          }
        };
      }
    })
  });
}
