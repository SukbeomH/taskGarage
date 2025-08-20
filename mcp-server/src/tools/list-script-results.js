/**
 * list-script-results.js
 * 스크립트 실행 결과 목록 조회 MCP 도구
 * MCP Filesystem 서버 패턴을 참고하여 구현
 */

import { z } from 'zod';
import { handleApiResult, withNormalizedProjectRoot } from './utils.js';
import { listScriptResultsDirect } from '../core/direct-functions/list-script-results.js';

export function registerListScriptResultsTool(server) {
  server.addTool({
    name: "list_script_results",
    description: "모든 스크립트 실행 결과 목록을 조회합니다. MCP Filesystem 서버 패턴을 참고하여 구현되었습니다.",
    parameters: z.object({
      limit: z.number().optional().describe("조회할 결과 수 제한 (기본값: 50)"),
      offset: z.number().optional().describe("조회 시작 위치 (기본값: 0)"),
      status: z.enum(['success', 'failure', 'all']).optional().describe("필터링할 상태 (기본값: 'all')"),
      projectRoot: z.string().optional().describe("프로젝트 루트 디렉토리 (세션에서 자동으로 결정됨)")
    }),
    execute: withNormalizedProjectRoot(async (args, { log, session }) => {
      try {
        log.info(`Listing script results with filters: ${JSON.stringify(args)}`);
        
        const result = await listScriptResultsDirect(args, log, { session });
        return handleApiResult(result, log);
      } catch (error) {
        log.error(`Error in list_script_results: ${error.message}`);
        return {
          success: false,
          error: {
            code: 'SCRIPT_RESULTS_LIST_ERROR',
            message: error.message
          }
        };
      }
    })
  });
}
