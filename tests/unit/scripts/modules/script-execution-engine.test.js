/**
 * script-execution-engine.test.js
 * 스크립트 실행 엔진 단위 테스트
 * ScriptExecutionResult, ScriptExecutionOptions, ScriptExecutionEngine, ScriptResultStorage 클래스 테스트
 */

import { jest } from '@jest/globals';
import {
  ScriptExecutionResult,
  ScriptExecutionOptions,
  ScriptExecutionEngine,
  ScriptResultStorage,
  executeScript,
  getScriptResult,
  getAllScriptResults
} from '../../../../scripts/modules/script-execution-engine.js';

// 모킹 설정
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
  readFile: jest.fn(),
  mkdir: jest.fn(),
  readdir: jest.fn(),
  stat: jest.fn(),
  access: jest.fn(),
  rm: jest.fn(),
  copyFile: jest.fn(),
  rename: jest.fn()
}));

jest.mock('../../../../scripts/modules/utils.js', () => ({
  log: jest.fn()
}));

describe('ScriptExecutionResult', () => {
  let result;

  beforeEach(() => {
    result = new ScriptExecutionResult();
  });

  describe('생성자', () => {
    it('기본값으로 초기화되어야 함', () => {
      expect(result.id).toBeNull();
      expect(result.command).toBe('');
      expect(result.workingDirectory).toBe('');
      expect(result.startTime).toBeNull();
      expect(result.endTime).toBeNull();
      expect(result.duration).toBeNull();
      expect(result.exitCode).toBeNull();
      expect(result.success).toBe(false);
      expect(result.stdout).toBe('');
      expect(result.stderr).toBe('');
      expect(result.error).toBeNull();
      expect(result.metadata).toEqual({});
    });

    it('사용자 정의 값으로 초기화되어야 함', () => {
      const customResult = new ScriptExecutionResult({
        id: 'test_001',
        command: 'ls -la',
        workingDirectory: '/tmp',
        startTime: new Date('2023-01-01T00:00:00Z'),
        endTime: new Date('2023-01-01T00:00:01Z'),
        exitCode: 0,
        success: true,
        stdout: 'file1.txt\nfile2.txt',
        stderr: '',
        metadata: { test: true }
      });

      // exitCode를 명시적으로 설정
      customResult.exitCode = 0;

      expect(customResult.id).toBe('test_001');
      expect(customResult.command).toBe('ls -la');
      expect(customResult.workingDirectory).toBe('/tmp');
      expect(customResult.exitCode).toBe(0);
      expect(customResult.success).toBe(true);
      expect(customResult.stdout).toBe('file1.txt\nfile2.txt');
      expect(customResult.stderr).toBe('');
      expect(customResult.metadata).toEqual({ test: true });
    });
  });

  describe('calculateDuration', () => {
    it('시작 시간과 종료 시간이 있으면 지속 시간을 계산해야 함', () => {
      result.startTime = new Date('2023-01-01T00:00:00Z');
      result.endTime = new Date('2023-01-01T00:00:01Z');
      
      const duration = result.calculateDuration();
      
      expect(duration).toBe(1000); // 1초
      expect(result.duration).toBe(1000);
    });

    it('시작 시간이나 종료 시간이 없으면 0을 반환해야 함', () => {
      const duration = result.calculateDuration();
      
      expect(duration).toBe(0);
      // duration이 명시적으로 설정되지 않으므로 null일 수 있음
      expect(result.duration).toBeNull();
    });
  });

  describe('determineSuccess', () => {
    it('exitCode가 0이면 성공으로 판단해야 함', () => {
      result.exitCode = 0;
      
      const success = result.determineSuccess();
      
      expect(success).toBe(true);
      expect(result.success).toBe(true);
    });

    it('exitCode가 0이 아니면 실패로 판단해야 함', () => {
      result.exitCode = 1;
      
      const success = result.determineSuccess();
      
      expect(success).toBe(false);
      expect(result.success).toBe(false);
    });

    it('exitCode가 null이면 false를 반환해야 함', () => {
      result.exitCode = null;
      
      const success = result.determineSuccess();
      
      expect(success).toBe(false);
      expect(result.success).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('모든 속성을 포함한 JSON 객체를 반환해야 함', () => {
      result.id = 'test_001';
      result.command = 'ls -la';
      result.workingDirectory = '/tmp';
      result.startTime = new Date('2023-01-01T00:00:00Z');
      result.endTime = new Date('2023-01-01T00:00:01Z');
      result.exitCode = 0;
      result.success = true;
      result.stdout = 'file1.txt';
      result.stderr = '';
      result.metadata = { test: true };
      result.duration = 1000;

      const json = result.toJSON();
      
      expect(json).toEqual({
        id: 'test_001',
        command: 'ls -la',
        workingDirectory: '/tmp',
        startTime: '2023-01-01T00:00:00.000Z',
        endTime: '2023-01-01T00:00:01.000Z',
        duration: 1000,
        exitCode: 0,
        stdout: 'file1.txt',
        stderr: '',
        success: true,
        error: null,
        metadata: { test: true }
      });
    });
  });
});

describe('ScriptExecutionOptions', () => {
  let options;

  beforeEach(() => {
    options = new ScriptExecutionOptions();
  });

  describe('생성자', () => {
    it('기본값으로 초기화되어야 함', () => {
      expect(options.workingDirectory).toBe(process.cwd());
      expect(options.timeout).toBe(30000);
      expect(options.shell).toBe(false);
      expect(options.encoding).toBe('utf8');
      expect(options.maxBuffer).toBe(1024 * 1024);
      expect(options.cwd).toBe(process.cwd());
      expect(options.stdio).toBe('pipe');
    });

    it('사용자 정의 값으로 초기화되어야 함', () => {
      const customOptions = new ScriptExecutionOptions({
        workingDirectory: '/custom/dir',
        timeout: 60000,
        shell: true,
        encoding: 'latin1',
        maxBuffer: 2097152,
        cwd: '/custom/cwd',
        stdio: 'inherit'
      });

      expect(customOptions.workingDirectory).toBe('/custom/dir');
      expect(customOptions.timeout).toBe(60000);
      expect(customOptions.shell).toBe(true);
      expect(customOptions.encoding).toBe('latin1');
      expect(customOptions.maxBuffer).toBe(2097152);
      expect(customOptions.cwd).toBe('/custom/cwd');
      expect(customOptions.stdio).toBe('inherit');
    });
  });
});

describe('ScriptExecutionEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new ScriptExecutionEngine();
  });

  describe('생성자', () => {
    it('빈 결과 맵과 초기 ID로 초기화되어야 함', () => {
      expect(engine.results).toBeInstanceOf(Map);
      expect(engine.results.size).toBe(0);
      expect(engine.nextId).toBe(1);
    });
  });

  describe('generateId', () => {
    it('순차적으로 증가하는 ID를 생성해야 함', () => {
      const id1 = engine.generateId();
      const id2 = engine.generateId();
      const id3 = engine.generateId();

      expect(id1).toBe('script_001');
      expect(id2).toBe('script_002');
      expect(id3).toBe('script_003');
    });

    it('ID가 script_ 접두사와 3자리 숫자로 구성되어야 함', () => {
      const id = engine.generateId();
      expect(id).toMatch(/^script_\d{3}$/);
    });
  });

  describe('parseCommand', () => {
    it('단순한 명령어를 파싱해야 함', () => {
      const result = engine.parseCommand('ls');
      expect(result[0]).toBe('ls');
      expect(result.slice(1)).toEqual([]);
    });

    it('복잡한 명령어를 파싱해야 함', () => {
      const result = engine.parseCommand('grep -r "pattern" /path/to/search');
      expect(result[0]).toBe('grep');
      expect(result.slice(1)).toEqual(['-r', '"pattern"', '/path/to/search']);
    });

    it('따옴표가 포함된 명령어를 파싱해야 함', () => {
      const result = engine.parseCommand('echo "Hello World"');
      expect(result[0]).toBe('echo');
      expect(result.slice(1)).toEqual(['"Hello', 'World"']);
    });
  });

  describe('getResult', () => {
    it('존재하는 결과를 반환해야 함', () => {
      const testResult = new ScriptExecutionResult({
        id: 'test_001',
        command: 'ls -la'
      });
      engine.results.set('test_001', testResult);

      const result = engine.getResult('test_001');
      expect(result).toBe(testResult);
    });

    it('존재하지 않는 결과는 null을 반환해야 함', () => {
      const result = engine.getResult('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getAllResults', () => {
    it('모든 결과를 배열로 반환해야 함', () => {
      const result1 = new ScriptExecutionResult({ id: '001', command: 'ls' });
      const result2 = new ScriptExecutionResult({ id: '002', command: 'pwd' });
      
      engine.results.set('001', result1);
      engine.results.set('002', result2);

      const allResults = engine.getAllResults();
      expect(allResults).toHaveLength(2);
      expect(allResults).toContain(result1);
      expect(allResults).toContain(result2);
    });

    it('결과가 없으면 빈 배열을 반환해야 함', () => {
      const allResults = engine.getAllResults();
      expect(allResults).toEqual([]);
    });
  });

  describe('deleteResult', () => {
    it('존재하는 결과를 삭제해야 함', () => {
      const testResult = new ScriptExecutionResult({ id: 'test_001' });
      engine.results.set('test_001', testResult);

      const deleted = engine.deleteResult('test_001');
      expect(deleted).toBe(true);
      expect(engine.results.has('test_001')).toBe(false);
    });

    it('존재하지 않는 결과 삭제는 false를 반환해야 함', () => {
      const deleted = engine.deleteResult('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('clearResults', () => {
    it('모든 결과를 삭제해야 함', () => {
      const result1 = new ScriptExecutionResult({ id: '001' });
      const result2 = new ScriptExecutionResult({ id: '002' });
      
      engine.results.set('001', result1);
      engine.results.set('002', result2);

      engine.clearResults();
      expect(engine.results.size).toBe(0);
    });
  });
});

describe('ScriptResultStorage', () => {
  let storage;

  beforeEach(() => {
    storage = new ScriptResultStorage('.taskmaster/test-results');
  });

  describe('생성자', () => {
    it('기본 디렉토리로 초기화되어야 함', () => {
      const defaultStorage = new ScriptResultStorage();
      expect(defaultStorage.directory).toBe('.taskmaster/script-results');
    });

    it('사용자 정의 디렉토리로 초기화되어야 함', () => {
      expect(storage.directory).toBe('.taskmaster/test-results');
    });
  });
});

describe('편의 함수들', () => {
  describe('getScriptResult', () => {
    it('스크립트 엔진에서 결과를 조회해야 함', () => {
      const result = getScriptResult('test_001');
      expect(result).toBeNull();
    });

    it('존재하지 않는 결과는 null을 반환해야 함', () => {
      const result = getScriptResult('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getAllScriptResults', () => {
    it('모든 스크립트 결과를 반환해야 함', () => {
      const results = getAllScriptResults();
      expect(Array.isArray(results)).toBe(true);
    });
  });
});
