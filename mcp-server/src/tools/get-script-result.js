/**
 * get-script-result.js
 * 스크립트 실행 결과 조회 MCP 도구
 * MCP Filesystem 서버 패턴을 참고하여 구현
 */

import { z } from 'zod';
import { handleApiResult, withNormalizedProjectRoot } from './utils.js';
import { getScriptResultDirect } from '../core/direct-functions/get-script-result.js';

export function registerGetScriptResultTool(server) {
  server.addTool({
    name: "get_script_result",
    description: "특정 스크립트 실행 결과를 조회합니다. MCP Filesystem 서버 패턴을 참고하여 구현되었습니다.",
    parameters: z.object({
      id: z.string().describe("조회할 스크립트 실행 결과의 ID (예: 'script_001')"),
      projectRoot: z.string().optional().describe("프로젝트 루트 디렉토리 (세션에서 자동으로 결정됨)")
    }),
    execute: withNormalizedProjectRoot(async (args, { log, session }) => {
      try {
        log.info(`Retrieving script result: ${args.id}`);
        
        const result = await getScriptResultDirect(args, log, { session });
        return handleApiResult(result, log);
      } catch (error) {
        log.error(`Error in get_script_result: ${error.message}`);
        return {
          success: false,
          error: {
            code: 'SCRIPT_RESULT_NOT_FOUND',
            message: error.message
          }
        };
      }
    })
  });
}
