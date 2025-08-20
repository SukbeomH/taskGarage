/**
 * sample-script-results.js
 * 스크립트 실행 결과 테스트용 샘플 데이터
 * 성공, 실패, 경계값 시나리오 포함
 */

/**
 * 성공적인 스크립트 실행 결과 샘플
 */
export const sampleSuccessfulScriptResult = {
  id: 'script_001',
  command: 'ls -la',
  workingDirectory: '/tmp',
  startTime: new Date('2024-01-01T00:00:00Z').getTime(),
  endTime: new Date('2024-01-01T00:00:01Z').getTime(),
  duration: 1000,
  exitCode: 0,
  success: true,
  stdout: `total 8
drwxr-xr-x  2 user  staff  64 Jan  1 00:00 .
drwxr-xr-x  3 user  staff  96 Jan  1 00:00 ..
-rw-r--r--  1 user  staff   0 Jan  1 00:00 test.txt`,
  stderr: '',
  error: null,
  metadata: {
    platform: 'darwin',
    nodeVersion: '18.0.0',
    shell: '/bin/zsh'
  }
};

/**
 * 실패한 스크립트 실행 결과 샘플
 */
export const sampleFailedScriptResult = {
  id: 'script_002',
  command: 'invalid-command',
  workingDirectory: '/tmp',
  startTime: new Date('2024-01-01T00:00:00Z').getTime(),
  endTime: new Date('2024-01-01T00:00:00Z').getTime(),
  duration: 100,
  exitCode: 127,
  success: false,
  stdout: '',
  stderr: 'command not found: invalid-command',
  error: new Error('command not found: invalid-command'),
  metadata: {
    platform: 'darwin',
    nodeVersion: '18.0.0',
    shell: '/bin/zsh'
  }
};

/**
 * 타임아웃으로 실패한 스크립트 실행 결과 샘플
 */
export const sampleTimeoutScriptResult = {
  id: 'script_003',
  command: 'sleep 10',
  workingDirectory: '/tmp',
  startTime: new Date('2024-01-01T00:00:00Z').getTime(),
  endTime: new Date('2024-01-01T00:00:05Z').getTime(),
  duration: 5000,
  exitCode: null,
  success: false,
  stdout: '',
  stderr: 'Process terminated due to timeout',
  error: new Error('Process terminated due to timeout'),
  metadata: {
    platform: 'darwin',
    nodeVersion: '18.0.0',
    shell: '/bin/zsh',
    timeout: 5000
  }
};

/**
 * 대용량 출력을 가진 스크립트 실행 결과 샘플
 */
export const sampleLargeOutputScriptResult = {
  id: 'script_004',
  command: 'find /usr -name "*.txt" 2>/dev/null | head -1000',
  workingDirectory: '/tmp',
  startTime: new Date('2024-01-01T00:00:00Z').getTime(),
  endTime: new Date('2024-01-01T00:00:30Z').getTime(),
  duration: 30000,
  exitCode: 0,
  success: true,
  stdout: Array(1000).fill('/usr/share/doc/example.txt').join('\n'),
  stderr: '',
  error: null,
  metadata: {
    platform: 'darwin',
    nodeVersion: '18.0.0',
    shell: '/bin/zsh'
  }
};

/**
 * 에러 출력이 많은 스크립트 실행 결과 샘플
 */
export const sampleErrorOutputScriptResult = {
  id: 'script_005',
  command: 'find /nonexistent -name "*.txt"',
  workingDirectory: '/tmp',
  startTime: new Date('2024-01-01T00:00:00Z').getTime(),
  endTime: new Date('2024-01-01T00:00:01Z').getTime(),
  duration: 1000,
  exitCode: 1,
  success: false,
  stdout: '',
  stderr: `find: /nonexistent: No such file or directory
find: /nonexistent: No such file or directory
find: /nonexistent: No such file or directory`,
  error: new Error('find: /nonexistent: No such file or directory'),
  metadata: {
    platform: 'darwin',
    nodeVersion: '18.0.0',
    shell: '/bin/zsh'
  }
};

/**
 * 경고 메시지가 포함된 스크립트 실행 결과 샘플
 */
export const sampleWarningScriptResult = {
  id: 'script_006',
  command: 'npm install --dry-run',
  workingDirectory: '/tmp/project',
  startTime: new Date('2024-01-01T00:00:00Z').getTime(),
  endTime: new Date('2024-01-01T00:00:05Z').getTime(),
  duration: 5000,
  exitCode: 0,
  success: true,
  stdout: `npm notice created a lockfile as package-lock.json. You should commit this file.
npm WARN package.json No description field
npm WARN package.json No repository field.
npm WARN package.json No license field.
added 15 packages, and audited 15 packages in 1s
found 0 vulnerabilities`,
  stderr: '',
  error: null,
  metadata: {
    platform: 'darwin',
    nodeVersion: '18.0.0',
    shell: '/bin/zsh'
  }
};

/**
 * 빈 출력을 가진 스크립트 실행 결과 샘플
 */
export const sampleEmptyOutputScriptResult = {
  id: 'script_007',
  command: 'echo ""',
  workingDirectory: '/tmp',
  startTime: new Date('2024-01-01T00:00:00Z').getTime(),
  endTime: new Date('2024-01-01T00:00:00Z').getTime(),
  duration: 50,
  exitCode: 0,
  success: true,
  stdout: '',
  stderr: '',
  error: null,
  metadata: {
    platform: 'darwin',
    nodeVersion: '18.0.0',
    shell: '/bin/zsh'
  }
};

/**
 * 특수 문자가 포함된 스크립트 실행 결과 샘플
 */
export const sampleSpecialCharsScriptResult = {
  id: 'script_008',
  command: 'echo "Hello\nWorld\n\tTabbed\n\nMultiple\n\n\nLines"',
  workingDirectory: '/tmp',
  startTime: new Date('2024-01-01T00:00:00Z').getTime(),
  endTime: new Date('2024-01-01T00:00:00Z').getTime(),
  duration: 50,
  exitCode: 0,
  success: true,
  stdout: `Hello
World
	Tabbed

Multiple


Lines`,
  stderr: '',
  error: null,
  metadata: {
    platform: 'darwin',
    nodeVersion: '18.0.0',
    shell: '/bin/zsh'
  }
};

/**
 * 권한 오류가 발생한 스크립트 실행 결과 샘플
 */
export const samplePermissionErrorScriptResult = {
  id: 'script_009',
  command: 'touch /root/test.txt',
  workingDirectory: '/tmp',
  startTime: new Date('2024-01-01T00:00:00Z').getTime(),
  endTime: new Date('2024-01-01T00:00:00Z').getTime(),
  duration: 50,
  exitCode: 1,
  success: false,
  stdout: '',
  stderr: 'touch: /root/test.txt: Permission denied',
  error: new Error('touch: /root/test.txt: Permission denied'),
  metadata: {
    platform: 'darwin',
    nodeVersion: '18.0.0',
    shell: '/bin/zsh'
  }
};

/**
 * 모든 스크립트 결과 샘플 배열
 */
export const allScriptResultSamples = [
  sampleSuccessfulScriptResult,
  sampleFailedScriptResult,
  sampleTimeoutScriptResult,
  sampleLargeOutputScriptResult,
  sampleErrorOutputScriptResult,
  sampleWarningScriptResult,
  sampleEmptyOutputScriptResult,
  sampleSpecialCharsScriptResult,
  samplePermissionErrorScriptResult
];

/**
 * 성공한 스크립트 결과만 필터링
 */
export const successfulScriptResults = allScriptResultSamples.filter(result => result.success);

/**
 * 실패한 스크립트 결과만 필터링
 */
export const failedScriptResults = allScriptResultSamples.filter(result => !result.success);

/**
 * 특정 조건에 맞는 스크립트 결과를 찾는 헬퍼 함수
 */
export const findScriptResultByCondition = (condition) => {
  return allScriptResultSamples.find(condition);
};

/**
 * 스크립트 결과를 ID로 찾는 헬퍼 함수
 */
export const findScriptResultById = (id) => {
  return allScriptResultSamples.find(result => result.id === id);
};
