/**
 * run-script.js
 * 스크립트 실행 MCP 도구
 * MCP Filesystem 서버 패턴을 참고하여 구현
 */

import { z } from 'zod';
import { handleApiResult, withNormalizedProjectRoot } from './utils.js';
import { runScriptDirect } from '../core/direct-functions/run-script.js';

export function registerRunScriptTool(server) {
  server.addTool({
    name: "run_script",
    description: "터미널 스크립트를 실행하고 결과를 캡처하여 저장합니다. MCP Filesystem 서버 패턴을 참고하여 구현되었습니다.",
    parameters: z.object({
      command: z.string().describe("실행할 명령어 (예: 'ls -la', 'npm test')"),
      workingDirectory: z.string().optional().describe("작업 디렉토리 (기본값: 현재 디렉토리)"),
      timeout: z.number().optional().describe("실행 타임아웃 (밀리초, 기본값: 300000)"),
      shell: z.boolean().optional().describe("쉘을 통해 실행할지 여부 (기본값: false)"),
      encoding: z.string().optional().describe("출력 인코딩 (기본값: 'utf8')"),
      maxBuffer: z.number().optional().describe("최대 버퍼 크기 (바이트, 기본값: 1048576)"),
      projectRoot: z.string().optional().describe("프로젝트 루트 디렉토리 (세션에서 자동으로 결정됨)")
    }),
    execute: withNormalizedProjectRoot(async (args, { log, session }) => {
      try {
        log.info(`Executing script: ${args.command}`);
        
        const result = await runScriptDirect(args, log, { session });
        return handleApiResult(result, log);
      } catch (error) {
        log.error(`Error in run_script: ${error.message}`);
        return {
          success: false,
          error: {
            code: 'SCRIPT_EXECUTION_ERROR',
            message: error.message
          }
        };
      }
    })
  });
}
