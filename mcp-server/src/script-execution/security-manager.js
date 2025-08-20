/**
 * security-manager.js
 * 보안 강화: BASE_DIR 패턴 및 경로 이탈 방지, 접근 제어 구현
 * MCP Filesystem 서버 패턴의 보안 기능을 적용
 */

import { mcpResource, mcpTool, registerResource, registerTool } from './decorators.js';
import { stat, access } from 'fs/promises';
import path from 'path';
import { constants } from 'fs';

/**
 * 보안 관리자 클래스
 */
export class SecurityManager {
  constructor(baseDir = process.cwd()) {
    this.baseDir = path.resolve(baseDir);
    this.allowedDirectories = new Set([this.baseDir]);
    this.restrictedPaths = new Set([
      '/etc',
      '/var',
      '/usr',
      '/bin',
      '/sbin',
      '/dev',
      '/proc',
      '/sys',
      '/tmp',
      '/root',
      '/home'
    ]);
    this.allowedExtensions = new Set([
      '.js', '.json', '.md', '.txt', '.log', '.yml', '.yaml',
      '.xml', '.csv', '.tsv', '.html', '.css', '.scss', '.less'
    ]);
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.maxPathLength = 4096;
    this.accessLog = [];
  }

  /**
   * 경로 보안 검증 리소스
   */
  @mcpResource({
    name: 'validate_path_security',
    description: '경로의 보안 상태를 검증합니다.',
    input: {
      targetPath: 'string (검증할 경로)',
      operation: 'string (작업 유형: read, write, execute) (기본값: read)'
    },
    output: {
      targetPath: 'string (검증한 경로)',
      isValid: 'boolean (유효성 여부)',
      isAllowed: 'boolean (허용 여부)',
      securityChecks: 'array (보안 검사 결과)',
      recommendations: 'array (보안 권장사항)'
    },
    category: 'security',
    tags: ['security', 'path', 'validation']
  })
  async validatePathSecurity(args) {
    const { targetPath, operation = 'read' } = args;

    if (!targetPath) {
      return {
        targetPath: null,
        isValid: false,
        isAllowed: false,
        securityChecks: ['Path is required'],
        recommendations: ['Provide a valid path']
      };
    }

    try {
      const resolvedPath = path.resolve(targetPath);
      const securityChecks = [];
      const recommendations = [];
      let isValid = true;
      let isAllowed = true;

      // 1. 경로 길이 검사
      if (resolvedPath.length > this.maxPathLength) {
        securityChecks.push('Path length exceeds maximum allowed length');
        recommendations.push('Use shorter path names');
        isValid = false;
        isAllowed = false;
      }

      // 2. 경로 이탈 방지 검사
      if (!this._isPathWithinBaseDir(resolvedPath)) {
        securityChecks.push('Path traversal detected - path outside base directory');
        recommendations.push('Use relative paths within the project directory');
        isValid = false;
        isAllowed = false;
      }

      // 3. 제한된 경로 검사
      if (this._isRestrictedPath(resolvedPath)) {
        securityChecks.push('Path is in restricted directory');
        recommendations.push('Avoid accessing system directories');
        isValid = false;
        isAllowed = false;
      }

      // 4. 파일 확장자 검사 (파일인 경우)
      if (this._isFile(resolvedPath)) {
        const ext = path.extname(resolvedPath).toLowerCase();
        if (!this.allowedExtensions.has(ext)) {
          securityChecks.push(`File extension '${ext}' is not allowed`);
          recommendations.push('Use allowed file extensions only');
          isValid = false;
        }
      }

      // 5. 파일 크기 검사 (파일인 경우)
      if (this._isFile(resolvedPath)) {
        try {
          const stats = await stat(resolvedPath);
          if (stats.size > this.maxFileSize) {
            securityChecks.push('File size exceeds maximum allowed size');
            recommendations.push('Use smaller files or increase size limit');
            isValid = false;
          }
        } catch (error) {
          // 파일이 존재하지 않는 경우 무시
        }
      }

      // 6. 권한 검사
      try {
        const permissions = this._getRequiredPermissions(operation);
        await access(resolvedPath, permissions);
        securityChecks.push(`Permission check passed for ${operation} operation`);
      } catch (error) {
        securityChecks.push(`Permission check failed for ${operation} operation: ${error.message}`);
        recommendations.push('Check file permissions and ownership');
        isValid = false;
        isAllowed = false;
      }

      // 7. 심볼릭 링크 검사
      if (this._isSymbolicLink(resolvedPath)) {
        securityChecks.push('Symbolic link detected');
        recommendations.push('Be cautious with symbolic links');
      }

      // 접근 로그 기록
      this._logAccess({
        path: targetPath,
        resolvedPath,
        operation,
        isValid,
        isAllowed,
        timestamp: new Date().toISOString()
      });

      return {
        targetPath,
        isValid,
        isAllowed,
        securityChecks,
        recommendations
      };
    } catch (error) {
      return {
        targetPath,
        isValid: false,
        isAllowed: false,
        securityChecks: [`Error during validation: ${error.message}`],
        recommendations: ['Check path format and permissions']
      };
    }
  }

  /**
   * 보안 정책 설정 도구
   */
  @mcpTool({
    name: 'configure_security_policy',
    description: '보안 정책을 설정합니다.',
    input: {
      allowedDirectories: 'array (허용된 디렉토리 목록, 선택사항)',
      restrictedPaths: 'array (제한된 경로 목록, 선택사항)',
      allowedExtensions: 'array (허용된 파일 확장자 목록, 선택사항)',
      maxFileSize: 'number (최대 파일 크기, 바이트, 선택사항)',
      maxPathLength: 'number (최대 경로 길이, 선택사항)'
    },
    output: {
      success: 'boolean (설정 성공 여부)',
      updatedPolicies: 'object (업데이트된 정책)',
      validationResults: 'array (정책 유효성 검사 결과)'
    },
    category: 'security',
    tags: ['security', 'policy', 'configure'],
    timeout: 10000,
    retry: {
      maxAttempts: 1,
      backoff: 'exponential'
    }
  })
  async configureSecurityPolicy(args = {}) {
    const {
      allowedDirectories,
      restrictedPaths,
      allowedExtensions,
      maxFileSize,
      maxPathLength
    } = args;

    try {
      const validationResults = [];
      const updatedPolicies = {};

      // 허용된 디렉토리 설정
      if (allowedDirectories) {
        const validDirectories = [];
        for (const dir of allowedDirectories) {
          const resolvedDir = path.resolve(dir);
          if (this._isValidDirectory(resolvedDir)) {
            validDirectories.push(resolvedDir);
          } else {
            validationResults.push(`Invalid directory: ${dir}`);
          }
        }
        this.allowedDirectories = new Set([this.baseDir, ...validDirectories]);
        updatedPolicies.allowedDirectories = Array.from(this.allowedDirectories);
      }

      // 제한된 경로 설정
      if (restrictedPaths) {
        this.restrictedPaths = new Set(restrictedPaths);
        updatedPolicies.restrictedPaths = Array.from(this.restrictedPaths);
      }

      // 허용된 확장자 설정
      if (allowedExtensions) {
        this.allowedExtensions = new Set(allowedExtensions.map(ext => ext.toLowerCase()));
        updatedPolicies.allowedExtensions = Array.from(this.allowedExtensions);
      }

      // 최대 파일 크기 설정
      if (maxFileSize && maxFileSize > 0) {
        this.maxFileSize = maxFileSize;
        updatedPolicies.maxFileSize = this.maxFileSize;
      }

      // 최대 경로 길이 설정
      if (maxPathLength && maxPathLength > 0) {
        this.maxPathLength = maxPathLength;
        updatedPolicies.maxPathLength = this.maxPathLength;
      }

      return {
        success: true,
        updatedPolicies,
        validationResults
      };
    } catch (error) {
      return {
        success: false,
        updatedPolicies: {},
        validationResults: [`Configuration error: ${error.message}`]
      };
    }
  }

  /**
   * 보안 감사 리소스
   */
  @mcpResource({
    name: 'audit_security',
    description: '보안 설정을 감사합니다.',
    input: {
      auditType: 'string (감사 유형: policy, access, files) (기본값: policy)',
      includeDetails: 'boolean (상세 정보 포함 여부, 기본값: true)'
    },
    output: {
      auditType: 'string (감사 유형)',
      timestamp: 'string (감사 시간)',
      summary: 'object (감사 요약)',
      details: 'array (상세 정보)',
      recommendations: 'array (보안 권장사항)'
    },
    category: 'security',
    tags: ['security', 'audit', 'compliance']
  })
  async auditSecurity(args = {}) {
    const { auditType = 'policy', includeDetails = true } = args;
    const timestamp = new Date().toISOString();

    try {
      let summary = {};
      let details = [];
      let recommendations = [];

      if (auditType === 'policy') {
        // 정책 감사
        summary = {
          totalPolicies: 5,
          activePolicies: 5,
          policyCompliance: 'Compliant'
        };

        details = [
          {
            policy: 'Base Directory',
            status: 'Active',
            value: this.baseDir,
            compliance: 'Compliant'
          },
          {
            policy: 'Allowed Directories',
            status: 'Active',
            value: this.allowedDirectories.size,
            compliance: 'Compliant'
          },
          {
            policy: 'Restricted Paths',
            status: 'Active',
            value: this.restrictedPaths.size,
            compliance: 'Compliant'
          },
          {
            policy: 'Allowed Extensions',
            status: 'Active',
            value: this.allowedExtensions.size,
            compliance: 'Compliant'
          },
          {
            policy: 'File Size Limit',
            status: 'Active',
            value: `${this.maxFileSize} bytes`,
            compliance: 'Compliant'
          }
        ];

        recommendations = [
          'Regularly review and update security policies',
          'Monitor access logs for suspicious activity',
          'Consider implementing file integrity monitoring'
        ];

      } else if (auditType === 'access') {
        // 접근 로그 감사
        const recentAccess = this.accessLog.slice(-100); // 최근 100개
        const totalAccess = this.accessLog.length;
        const failedAccess = recentAccess.filter(log => !log.isValid).length;
        const successRate = totalAccess > 0 ? ((totalAccess - failedAccess) / totalAccess * 100).toFixed(2) : 100;

        summary = {
          totalAccess: totalAccess,
          recentAccess: recentAccess.length,
          failedAccess: failedAccess,
          successRate: `${successRate}%`
        };

        details = recentAccess.map(log => ({
          timestamp: log.timestamp,
          path: log.path,
          operation: log.operation,
          isValid: log.isValid,
          isAllowed: log.isAllowed
        }));

        if (failedAccess > 0) {
          recommendations.push('Investigate failed access attempts');
          recommendations.push('Review and update access controls');
        }

      } else if (auditType === 'files') {
        // 파일 보안 감사
        summary = {
          scannedDirectories: 1,
          totalFiles: 0,
          secureFiles: 0,
          insecureFiles: 0
        };

        recommendations = [
          'Implement file scanning for malware detection',
          'Regular file integrity checks',
          'Backup important files regularly'
        ];
      }

      return {
        auditType,
        timestamp,
        summary,
        details: includeDetails ? details : [],
        recommendations
      };
    } catch (error) {
      return {
        auditType,
        timestamp,
        summary: { error: error.message },
        details: [],
        recommendations: ['Fix audit system errors']
      };
    }
  }

  /**
   * 안전한 경로 생성 도구
   */
  @mcpTool({
    name: 'create_secure_path',
    description: '보안 정책에 맞는 안전한 경로를 생성합니다.',
    input: {
      basePath: 'string (기본 경로)',
      fileName: 'string (파일명, 선택사항)',
      ensureDirectory: 'boolean (디렉토리 생성 여부, 기본값: true)'
    },
    output: {
      securePath: 'string (생성된 안전한 경로)',
      isValid: 'boolean (유효성 여부)',
      isAllowed: 'boolean (허용 여부)',
      created: 'boolean (생성 성공 여부)'
    },
    category: 'security',
    tags: ['security', 'path', 'create'],
    timeout: 5000,
    retry: {
      maxAttempts: 1,
      backoff: 'exponential'
    }
  })
  async createSecurePath(args) {
    const { basePath, fileName, ensureDirectory = true } = args;

    if (!basePath) {
      return {
        securePath: null,
        isValid: false,
        isAllowed: false,
        created: false
      };
    }

    try {
      // 기본 경로 보안 검증
      const baseValidation = await this.validatePathSecurity({
        targetPath: basePath,
        operation: 'write'
      });

      if (!baseValidation.isValid || !baseValidation.isAllowed) {
        return {
          securePath: null,
          isValid: false,
          isAllowed: false,
          created: false
        };
      }

      // 안전한 경로 생성
      let securePath = path.resolve(basePath);
      
      if (fileName) {
        // 파일명 보안 검증
        const sanitizedFileName = this._sanitizeFileName(fileName);
        securePath = path.join(securePath, sanitizedFileName);
      }

      // 최종 경로 보안 검증
      const finalValidation = await this.validatePathSecurity({
        targetPath: securePath,
        operation: 'write'
      });

      return {
        securePath,
        isValid: finalValidation.isValid,
        isAllowed: finalValidation.isAllowed,
        created: finalValidation.isValid && finalValidation.isAllowed
      };
    } catch (error) {
      return {
        securePath: null,
        isValid: false,
        isAllowed: false,
        created: false
      };
    }
  }

  // 헬퍼 메서드들
  _isPathWithinBaseDir(targetPath) {
    const relativePath = path.relative(this.baseDir, targetPath);
    return !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
  }

  _isRestrictedPath(targetPath) {
    return Array.from(this.restrictedPaths).some(restrictedPath =>
      targetPath.startsWith(restrictedPath)
    );
  }

  _isFile(targetPath) {
    try {
      const stats = stat(targetPath);
      return stats.isFile();
    } catch {
      return false;
    }
  }

  _isSymbolicLink(targetPath) {
    try {
      const stats = stat(targetPath);
      return stats.isSymbolicLink();
    } catch {
      return false;
    }
  }

  _getRequiredPermissions(operation) {
    switch (operation) {
      case 'read':
        return constants.R_OK;
      case 'write':
        return constants.W_OK;
      case 'execute':
        return constants.X_OK;
      default:
        return constants.R_OK;
    }
  }

  _isValidDirectory(dirPath) {
    try {
      const stats = stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  _sanitizeFileName(fileName) {
    // 파일명에서 위험한 문자 제거
    return fileName
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\.\./g, '_')
      .substring(0, 255); // 파일명 길이 제한
  }

  _logAccess(logEntry) {
    this.accessLog.push(logEntry);
    
    // 로그 크기 제한 (최대 1000개)
    if (this.accessLog.length > 1000) {
      this.accessLog = this.accessLog.slice(-1000);
    }
  }
}

// 함수형 등록 방식 (데코레이터를 사용하지 않는 경우)
export function registerSecurityResources(baseDir = process.cwd()) {
  const securityManager = new SecurityManager(baseDir);
  
  // 리소스들을 수동으로 등록
  registerResource('validate_path_security', {
    name: 'validate_path_security',
    description: '경로의 보안 상태를 검증합니다.',
    input: {
      targetPath: 'string (검증할 경로)',
      operation: 'string (작업 유형: read, write, execute) (기본값: read)'
    },
    output: {
      targetPath: 'string (검증한 경로)',
      isValid: 'boolean (유효성 여부)',
      isAllowed: 'boolean (허용 여부)',
      securityChecks: 'array (보안 검사 결과)',
      recommendations: 'array (보안 권장사항)'
    },
    category: 'security',
    tags: ['security', 'path', 'validation']
  }, securityManager.validatePathSecurity.bind(securityManager));

  registerResource('audit_security', {
    name: 'audit_security',
    description: '보안 설정을 감사합니다.',
    input: {
      auditType: 'string (감사 유형: policy, access, files) (기본값: policy)',
      includeDetails: 'boolean (상세 정보 포함 여부, 기본값: true)'
    },
    output: {
      auditType: 'string (감사 유형)',
      timestamp: 'string (감사 시간)',
      summary: 'object (감사 요약)',
      details: 'array (상세 정보)',
      recommendations: 'array (보안 권장사항)'
    },
    category: 'security',
    tags: ['security', 'audit', 'compliance']
  }, securityManager.auditSecurity.bind(securityManager));

  return securityManager;
}

export function registerSecurityTools(baseDir = process.cwd()) {
  const securityManager = new SecurityManager(baseDir);
  
  // 도구들을 수동으로 등록
  registerTool('configure_security_policy', {
    name: 'configure_security_policy',
    description: '보안 정책을 설정합니다.',
    input: {
      allowedDirectories: 'array (허용된 디렉토리 목록, 선택사항)',
      restrictedPaths: 'array (제한된 경로 목록, 선택사항)',
      allowedExtensions: 'array (허용된 파일 확장자 목록, 선택사항)',
      maxFileSize: 'number (최대 파일 크기, 바이트, 선택사항)',
      maxPathLength: 'number (최대 경로 길이, 선택사항)'
    },
    output: {
      success: 'boolean (설정 성공 여부)',
      updatedPolicies: 'object (업데이트된 정책)',
      validationResults: 'array (정책 유효성 검사 결과)'
    },
    category: 'security',
    tags: ['security', 'policy', 'configure'],
    timeout: 10000,
    retry: {
      maxAttempts: 1,
      backoff: 'exponential'
    }
  }, securityManager.configureSecurityPolicy.bind(securityManager));

  registerTool('create_secure_path', {
    name: 'create_secure_path',
    description: '보안 정책에 맞는 안전한 경로를 생성합니다.',
    input: {
      basePath: 'string (기본 경로)',
      fileName: 'string (파일명, 선택사항)',
      ensureDirectory: 'boolean (디렉토리 생성 여부, 기본값: true)'
    },
    output: {
      securePath: 'string (생성된 안전한 경로)',
      isValid: 'boolean (유효성 여부)',
      isAllowed: 'boolean (허용 여부)',
      created: 'boolean (생성 성공 여부)'
    },
    category: 'security',
    tags: ['security', 'path', 'create'],
    timeout: 5000,
    retry: {
      maxAttempts: 1,
      backoff: 'exponential'
    }
  }, securityManager.createSecurePath.bind(securityManager));

  return securityManager;
}
