/**
 * time-manager.js
 * MCP Time 서버 패턴 기반 타임스탬프 및 시간 관리 기능
 * ISO 8601 형식 처리, 타임존 변환, 실행 시간 측정 등
 */

import { mcpResource, mcpTool, registerResource, registerTool } from './decorators.js';

/**
 * 시간 관리 클래스
 */
export class TimeManager {
  constructor() {
    this.defaultTimezone = 'UTC';
    this.supportedTimezones = [
      'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London',
      'Europe/Paris', 'Asia/Tokyo', 'Asia/Seoul', 'Australia/Sydney'
    ];
  }

  /**
   * 현재 타임스탬프 조회 리소스
   */
  @mcpResource({
    name: 'get_current_timestamp',
    description: '현재 시간을 ISO 8601 형식의 타임스탬프로 조회합니다.',
    input: {
      timezone: 'string (타임존, 기본값: UTC)',
      format: 'string (출력 형식: iso, unix, human) (기본값: iso)'
    },
    output: {
      timestamp: 'string (타임스탬프)',
      timezone: 'string (사용된 타임존)',
      unix: 'number (Unix 타임스탬프)',
      human: 'string (사람이 읽기 쉬운 형식)'
    },
    category: 'time-management',
    tags: ['time', 'timestamp', 'current']
  })
  async getCurrentTimestamp(args = {}) {
    const { timezone = this.defaultTimezone, format = 'iso' } = args;
    
    try {
      const now = new Date();
      const unixTimestamp = Math.floor(now.getTime() / 1000);
      
      let timestamp;
      let humanReadable;
      
      if (timezone === 'UTC') {
        timestamp = now.toISOString();
        humanReadable = now.toUTCString();
      } else {
        // 타임존 변환 (실제 구현에서는 moment-timezone 또는 luxon 사용 권장)
        timestamp = now.toISOString(); // 기본적으로 UTC
        humanReadable = now.toLocaleString('en-US', { timeZone: timezone });
      }

      return {
        timestamp,
        timezone,
        unix: unixTimestamp,
        human: humanReadable
      };
    } catch (error) {
      throw new Error(`Failed to get current timestamp: ${error.message}`);
    }
  }

  /**
   * 타임스탬프 변환 도구
   */
  @mcpTool({
    name: 'convert_timestamp',
    description: '타임스탬프를 다른 형식이나 타임존으로 변환합니다.',
    input: {
      timestamp: 'string (변환할 타임스탬프)',
      fromTimezone: 'string (원본 타임존, 기본값: UTC)',
      toTimezone: 'string (대상 타임존, 기본값: UTC)',
      format: 'string (출력 형식: iso, unix, human) (기본값: iso)'
    },
    output: {
      originalTimestamp: 'string (원본 타임스탬프)',
      convertedTimestamp: 'string (변환된 타임스탬프)',
      fromTimezone: 'string (원본 타임존)',
      toTimezone: 'string (대상 타임존)',
      unix: 'number (Unix 타임스탬프)',
      human: 'string (사람이 읽기 쉬운 형식)'
    },
    category: 'time-management',
    tags: ['time', 'convert', 'timezone'],
    timeout: 5000,
    retry: {
      maxAttempts: 1,
      backoff: 'exponential'
    }
  })
  async convertTimestamp(args) {
    const {
      timestamp,
      fromTimezone = this.defaultTimezone,
      toTimezone = this.defaultTimezone,
      format = 'iso'
    } = args;

    if (!timestamp) {
      throw new Error('Timestamp is required');
    }

    try {
      // 타임스탬프 파싱
      let date;
      if (this._isUnixTimestamp(timestamp)) {
        date = new Date(parseInt(timestamp) * 1000);
      } else {
        date = new Date(timestamp);
      }

      if (isNaN(date.getTime())) {
        throw new Error('Invalid timestamp format');
      }

      const unixTimestamp = Math.floor(date.getTime() / 1000);
      
      let convertedTimestamp;
      let humanReadable;

      if (fromTimezone === toTimezone) {
        convertedTimestamp = date.toISOString();
        humanReadable = date.toLocaleString('en-US', { timeZone: toTimezone });
      } else {
        // 타임존 변환 (실제 구현에서는 moment-timezone 또는 luxon 사용 권장)
        convertedTimestamp = date.toISOString(); // 기본적으로 UTC
        humanReadable = date.toLocaleString('en-US', { timeZone: toTimezone });
      }

      return {
        originalTimestamp: timestamp,
        convertedTimestamp,
        fromTimezone,
        toTimezone,
        unix: unixTimestamp,
        human: humanReadable
      };
    } catch (error) {
      throw new Error(`Failed to convert timestamp: ${error.message}`);
    }
  }

  /**
   * 실행 시간 측정 도구
   */
  @mcpTool({
    name: 'measure_execution_time',
    description: '함수나 작업의 실행 시간을 측정합니다.',
    input: {
      operation: 'string (측정할 작업 설명)',
      timeout: 'number (최대 실행 시간, 밀리초, 기본값: 30000)',
      precision: 'string (정밀도: ms, us, ns) (기본값: ms)'
    },
    output: {
      operation: 'string (측정된 작업)',
      startTime: 'string (시작 시간)',
      endTime: 'string (종료 시간)',
      duration: 'number (실행 시간)',
      durationFormatted: 'string (포맷된 실행 시간)',
      success: 'boolean (성공 여부)'
    },
    category: 'time-management',
    tags: ['time', 'measure', 'performance'],
    timeout: 60000,
    retry: {
      maxAttempts: 1,
      backoff: 'exponential'
    }
  })
  async measureExecutionTime(args) {
    const {
      operation = 'Unknown operation',
      timeout = 30000,
      precision = 'ms'
    } = args;

    const startTime = Date.now();
    const startTimestamp = new Date().toISOString();

    try {
      // 타임아웃 처리
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout);
      });

      // 실제 작업은 호출자가 제공해야 함 (여기서는 예시)
      const operationPromise = this._performOperation(operation);
      
      await Promise.race([operationPromise, timeoutPromise]);

      const endTime = Date.now();
      const endTimestamp = new Date().toISOString();
      const duration = endTime - startTime;

      return {
        operation,
        startTime: startTimestamp,
        endTime: endTimestamp,
        duration,
        durationFormatted: this._formatDuration(duration, precision),
        success: true
      };
    } catch (error) {
      const endTime = Date.now();
      const endTimestamp = new Date().toISOString();
      const duration = endTime - startTime;

      return {
        operation,
        startTime: startTimestamp,
        endTime: endTimestamp,
        duration,
        durationFormatted: this._formatDuration(duration, precision),
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 시간 범위 계산 도구
   */
  @mcpTool({
    name: 'calculate_time_range',
    description: '시간 범위를 계산하고 관련 타임스탬프를 생성합니다.',
    input: {
      baseTime: 'string (기준 시간, 기본값: 현재 시간)',
      range: 'string (시간 범위: 1h, 24h, 7d, 30d, 1y)',
      direction: 'string (방향: past, future, both) (기본값: past)',
      timezone: 'string (타임존, 기본값: UTC)'
    },
    output: {
      baseTime: 'string (기준 시간)',
      range: 'string (시간 범위)',
      startTime: 'string (시작 시간)',
      endTime: 'string (종료 시간)',
      duration: 'number (지속 시간, 밀리초)',
      timezone: 'string (사용된 타임존)'
    },
    category: 'time-management',
    tags: ['time', 'range', 'calculate'],
    timeout: 5000,
    retry: {
      maxAttempts: 1,
      backoff: 'exponential'
    }
  })
  async calculateTimeRange(args = {}) {
    const {
      baseTime,
      range = '24h',
      direction = 'past',
      timezone = this.defaultTimezone
    } = args;

    try {
      const baseDate = baseTime ? new Date(baseTime) : new Date();
      const rangeMs = this._parseTimeRange(range);
      
      let startTime, endTime;
      
      if (direction === 'past') {
        startTime = new Date(baseDate.getTime() - rangeMs);
        endTime = baseDate;
      } else if (direction === 'future') {
        startTime = baseDate;
        endTime = new Date(baseDate.getTime() + rangeMs);
      } else { // both
        const halfRange = rangeMs / 2;
        startTime = new Date(baseDate.getTime() - halfRange);
        endTime = new Date(baseDate.getTime() + halfRange);
      }

      return {
        baseTime: baseDate.toISOString(),
        range,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: rangeMs,
        timezone
      };
    } catch (error) {
      throw new Error(`Failed to calculate time range: ${error.message}`);
    }
  }

  /**
   * 시간 유효성 검사 리소스
   */
  @mcpResource({
    name: 'validate_timestamp',
    description: '타임스탬프의 유효성을 검사합니다.',
    input: {
      timestamp: 'string (검사할 타임스탬프)',
      format: 'string (예상 형식: iso, unix, custom) (기본값: auto)'
    },
    output: {
      timestamp: 'string (검사한 타임스탬프)',
      isValid: 'boolean (유효성 여부)',
      format: 'string (감지된 형식)',
      parsedDate: 'string (파싱된 날짜)',
      error: 'string (에러 메시지, 있는 경우)'
    },
    category: 'time-management',
    tags: ['time', 'validate', 'timestamp']
  })
  async validateTimestamp(args) {
    const { timestamp, format = 'auto' } = args;

    if (!timestamp) {
      return {
        timestamp: null,
        isValid: false,
        format: 'unknown',
        parsedDate: null,
        error: 'Timestamp is required'
      };
    }

    try {
      let date;
      let detectedFormat = 'unknown';

      if (format === 'auto' || format === 'unix') {
        if (this._isUnixTimestamp(timestamp)) {
          date = new Date(parseInt(timestamp) * 1000);
          detectedFormat = 'unix';
        }
      }

      if (!date && (format === 'auto' || format === 'iso')) {
        date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          detectedFormat = 'iso';
        }
      }

      if (!date) {
        return {
          timestamp,
          isValid: false,
          format: detectedFormat,
          parsedDate: null,
          error: 'Invalid timestamp format'
        };
      }

      return {
        timestamp,
        isValid: true,
        format: detectedFormat,
        parsedDate: date.toISOString(),
        error: null
      };
    } catch (error) {
      return {
        timestamp,
        isValid: false,
        format: 'unknown',
        parsedDate: null,
        error: error.message
      };
    }
  }

  // 헬퍼 메서드들
  _isUnixTimestamp(timestamp) {
    const num = parseInt(timestamp);
    return !isNaN(num) && num > 0 && num < 2147483647; // Unix timestamp 범위
  }

  _parseTimeRange(range) {
    const ranges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000
    };
    
    if (ranges[range]) {
      return ranges[range];
    }
    
    // 커스텀 범위 파싱 (예: "2h30m")
    const match = range.match(/^(\d+)h(\d+)?m?$/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = match[2] ? parseInt(match[2]) : 0;
      return (hours * 60 + minutes) * 60 * 1000;
    }
    
    throw new Error(`Invalid time range format: ${range}`);
  }

  _formatDuration(duration, precision = 'ms') {
    if (precision === 'us') {
      return `${duration * 1000}μs`;
    } else if (precision === 'ns') {
      return `${duration * 1000000}ns`;
    } else {
      return `${duration}ms`;
    }
  }

  async _performOperation(operation) {
    // 실제 작업은 호출자가 제공해야 함
    // 여기서는 예시로 간단한 지연을 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 100));
    return `Operation completed: ${operation}`;
  }
}

// 함수형 등록 방식 (데코레이터를 사용하지 않는 경우)
export function registerTimeManagementResources() {
  const timeManager = new TimeManager();
  
  // 리소스들을 수동으로 등록
  registerResource('get_current_timestamp', {
    name: 'get_current_timestamp',
    description: '현재 시간을 ISO 8601 형식의 타임스탬프로 조회합니다.',
    input: {
      timezone: 'string (타임존, 기본값: UTC)',
      format: 'string (출력 형식: iso, unix, human) (기본값: iso)'
    },
    output: {
      timestamp: 'string (타임스탬프)',
      timezone: 'string (사용된 타임존)',
      unix: 'number (Unix 타임스탬프)',
      human: 'string (사람이 읽기 쉬운 형식)'
    },
    category: 'time-management',
    tags: ['time', 'timestamp', 'current']
  }, timeManager.getCurrentTimestamp.bind(timeManager));

  registerResource('validate_timestamp', {
    name: 'validate_timestamp',
    description: '타임스탬프의 유효성을 검사합니다.',
    input: {
      timestamp: 'string (검사할 타임스탬프)',
      format: 'string (예상 형식: iso, unix, custom) (기본값: auto)'
    },
    output: {
      timestamp: 'string (검사한 타임스탬프)',
      isValid: 'boolean (유효성 여부)',
      format: 'string (감지된 형식)',
      parsedDate: 'string (파싱된 날짜)',
      error: 'string (에러 메시지, 있는 경우)'
    },
    category: 'time-management',
    tags: ['time', 'validate', 'timestamp']
  }, timeManager.validateTimestamp.bind(timeManager));

  return timeManager;
}

export function registerTimeManagementTools() {
  const timeManager = new TimeManager();
  
  // 도구들을 수동으로 등록
  registerTool('convert_timestamp', {
    name: 'convert_timestamp',
    description: '타임스탬프를 다른 형식이나 타임존으로 변환합니다.',
    input: {
      timestamp: 'string (변환할 타임스탬프)',
      fromTimezone: 'string (원본 타임존, 기본값: UTC)',
      toTimezone: 'string (대상 타임존, 기본값: UTC)',
      format: 'string (출력 형식: iso, unix, human) (기본값: iso)'
    },
    output: {
      originalTimestamp: 'string (원본 타임스탬프)',
      convertedTimestamp: 'string (변환된 타임스탬프)',
      fromTimezone: 'string (원본 타임존)',
      toTimezone: 'string (대상 타임존)',
      unix: 'number (Unix 타임스탬프)',
      human: 'string (사람이 읽기 쉬운 형식)'
    },
    category: 'time-management',
    tags: ['time', 'convert', 'timezone'],
    timeout: 5000,
    retry: {
      maxAttempts: 1,
      backoff: 'exponential'
    }
  }, timeManager.convertTimestamp.bind(timeManager));

  registerTool('measure_execution_time', {
    name: 'measure_execution_time',
    description: '함수나 작업의 실행 시간을 측정합니다.',
    input: {
      operation: 'string (측정할 작업 설명)',
      timeout: 'number (최대 실행 시간, 밀리초, 기본값: 30000)',
      precision: 'string (정밀도: ms, us, ns) (기본값: ms)'
    },
    output: {
      operation: 'string (측정된 작업)',
      startTime: 'string (시작 시간)',
      endTime: 'string (종료 시간)',
      duration: 'number (실행 시간)',
      durationFormatted: 'string (포맷된 실행 시간)',
      success: 'boolean (성공 여부)'
    },
    category: 'time-management',
    tags: ['time', 'measure', 'performance'],
    timeout: 60000,
    retry: {
      maxAttempts: 1,
      backoff: 'exponential'
    }
  }, timeManager.measureExecutionTime.bind(timeManager));

  registerTool('calculate_time_range', {
    name: 'calculate_time_range',
    description: '시간 범위를 계산하고 관련 타임스탬프를 생성합니다.',
    input: {
      baseTime: 'string (기준 시간, 기본값: 현재 시간)',
      range: 'string (시간 범위: 1h, 24h, 7d, 30d, 1y)',
      direction: 'string (방향: past, future, both) (기본값: past)',
      timezone: 'string (타임존, 기본값: UTC)'
    },
    output: {
      baseTime: 'string (기준 시간)',
      range: 'string (시간 범위)',
      startTime: 'string (시작 시간)',
      endTime: 'string (종료 시간)',
      duration: 'number (지속 시간, 밀리초)',
      timezone: 'string (사용된 타임존)'
    },
    category: 'time-management',
    tags: ['time', 'range', 'calculate'],
    timeout: 5000,
    retry: {
      maxAttempts: 1,
      backoff: 'exponential'
    }
  }, timeManager.calculateTimeRange.bind(timeManager));

  return timeManager;
}
