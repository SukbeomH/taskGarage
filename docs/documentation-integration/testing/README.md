# 🧪 문서 동기화 테스트

## 🎯 개요

이 섹션은 Taskmaster 문서 동기화 통합 기능의 테스트 방법과 결과 해석을 다룹니다.

## 📁 관련 파일들

### 핵심 테스트 파일
- [`scripts/test_documentation_integration.js`](../../../scripts/test_documentation_integration.js) - 통합 테스트 스크립트

### 테스트 대상 파일
- [`scripts/modules/task-manager/update-subtask-by-id.js`](../../../scripts/modules/task-manager/update-subtask-by-id.js) - 테스트 대상 1
- [`scripts/modules/task-manager/set-task-status.js`](../../../scripts/modules/task-manager/set-task-status.js) - 테스트 대상 2

## 🧪 테스트 상세 내용

### 1. 테스트 스크립트 개요

#### 📝 `test_documentation_integration.js`
```javascript
#!/usr/bin/env node
// scripts/test_documentation_integration.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

#### 🎯 테스트 목적
- 문서 동기화 통합 기능의 모든 구성 요소 검증
- 코드 변경 감지 로직 테스트
- 문서 검증 메커니즘 테스트
- 워크플로우 통합 상태 확인
- 규칙 파일 존재 여부 확인

### 2. 테스트 케이스 상세

#### 📝 테스트 1: 코드 변경 감지 기능
```javascript
async function testCodeChangeDetection() {
    // 구조체 변경 감지
    const structChange = checkForCodeChanges('새로운 구조체 type User struct 추가');
    
    // 함수 변경 감지
    const funcChange = checkForCodeChanges('새로운 함수 func validateUser 추가');
    
    // 에러 코드 변경 감지
    const errorChange = checkForCodeChanges('새로운 에러 코드 ErrInvalidUser 추가');
    
    // 설정 변경 감지
    const configChange = checkForCodeChanges('설정 파일에 json: "database" 추가');
    
    // API 변경 감지
    const apiChange = checkForCodeChanges('새로운 API 엔드포인트 /api/users 추가');
    
    // 일반 텍스트 (변경 없음)
    const normalText = checkForCodeChanges('일반적인 텍스트 메시지');
    
    return structChange && funcChange && errorChange && configChange && apiChange && !normalText;
}
```

#### ✅ 테스트 시나리오
- **구조체 변경**: `type User struct`, `struct Config {` 등
- **함수 변경**: `func NewHandler`, `function validate` 등
- **에러 코드 변경**: `ErrCode`, `Error`, `const ErrorCode` 등
- **설정 변경**: `json:`, `yaml:`, `config` 등
- **API 변경**: `endpoint`, `route`, `handler`, `API` 등
- **일반 텍스트**: 코드 변경이 아닌 일반 메시지

#### 📝 테스트 2: 문서 검증 기능
```javascript
async function testDocumentationValidation() {
    // 검증된 task (문서 동기화 완료)
    const validatedTask = {
        id: '1',
        details: '코드 변경 완료\n\n--- 2024-12-01T10:00:00.000Z ---\n📝 문서 업데이트 상태: 완료'
    };
    
    // 미검증 task (문서 동기화 미완료)
    const unvalidatedTask = {
        id: '2',
        details: '코드 변경 완료\n\n--- 2024-12-01T10:00:00.000Z ---\n📝 문서 업데이트 상태: 실패'
    };
    
    const validated = checkDocumentationValidation('1', { tasks: [validatedTask] }, '/test');
    const unvalidated = checkDocumentationValidation('2', { tasks: [unvalidatedTask] }, '/test');
    
    return validated && !unvalidated;
}
```

#### ✅ 검증 시나리오
- **검증 완료**: "📝 문서 업데이트 상태: 완료" 메시지 포함
- **검증 실패**: "📝 문서 업데이트 상태: 실패" 또는 메시지 없음
- **코드 변경 없음**: 코드 변경 패턴이 없는 경우 자동 검증 완료

#### 📝 테스트 3: executeTaskMasterCommand 패턴
```javascript
function testExecuteTaskMasterCommand() {
    try {
        const mcpUtilsPath = path.join(__dirname, '../mcp-server/src/tools/utils.js');
        if (fs.existsSync(mcpUtilsPath)) {
            const utilsContent = fs.readFileSync(mcpUtilsPath, 'utf8');
            return utilsContent.includes('executeTaskMasterCommand');
        }
        return false;
    } catch (error) {
        return false;
    }
}
```

#### ✅ 패턴 확인
- **파일 존재**: `mcp-server/src/tools/utils.js` 파일 존재 확인
- **함수 포함**: `executeTaskMasterCommand` 함수 정의 확인
- **에러 처리**: 파일 접근 오류 시 적절한 처리

#### 📝 테스트 4: 워크플로우 통합
```javascript
function testWorkflowIntegration() {
    const updateSubtaskPath = path.join(__dirname, 'modules/task-manager/update-subtask-by-id.js');
    let hasUpdateSubtaskIntegration = false;
    if (fs.existsSync(updateSubtaskPath)) {
        const updateSubtaskFile = fs.readFileSync(updateSubtaskPath, 'utf8');
        hasUpdateSubtaskIntegration = updateSubtaskFile.includes('checkForCodeChanges') && 
                                       updateSubtaskFile.includes('executeTaskMasterCommand');
    }
    
    const setStatusPath = path.join(__dirname, 'modules/task-manager/set-task-status.js');
    let hasSetStatusIntegration = false;
    if (fs.existsSync(setStatusPath)) {
        const setStatusFile = fs.readFileSync(setStatusPath, 'utf8');
        hasSetStatusIntegration = setStatusFile.includes('checkDocumentationValidation') && 
                                   setStatusFile.includes('review');
    }
    
    const updateSubtaskExists = fs.existsSync(updateSubtaskPath);
    const setStatusExists = fs.existsSync(setStatusPath);
    
    return hasUpdateSubtaskIntegration && hasSetStatusIntegration && updateSubtaskExists && setStatusExists;
}
```

#### ✅ 통합 확인
- **update-subtask-by-id.js**: `checkForCodeChanges`, `executeTaskMasterCommand` 포함
- **set-task-status.js**: `checkDocumentationValidation`, `review` 상태 변경 포함
- **파일 존재**: 모든 필요한 파일이 존재하는지 확인

#### 📝 테스트 5: 규칙 파일 존재
```javascript
function testRuleFiles() {
    const ruleFiles = [
        '.cursor/rules/taskmaster/documentation_integration.mdc',
        '.cursor/rules/dev_workflow.mdc'
    ];
    return ruleFiles.every(file => {
        const filePath = path.join(__dirname, '..', file);
        return fs.existsSync(filePath);
    });
}
```

#### ✅ 규칙 파일 확인
- **documentation_integration.mdc**: 문서 동기화 통합 규칙
- **dev_workflow.mdc**: 개발 워크플로우 규칙
- **파일 존재**: 모든 규칙 파일이 존재하는지 확인

## 🚀 테스트 실행 방법

### 1. 전체 테스트 실행
```bash
# 프로젝트 루트 디렉토리에서 실행
node scripts/test_documentation_integration.js
```

### 2. 개별 테스트 실행
```bash
# 테스트 스크립트를 직접 실행
cd scripts
node test_documentation_integration.js
```

### 3. 실행 권한 확인
```bash
# 실행 권한 부여 (필요한 경우)
chmod +x scripts/test_documentation_integration.js
```

## 📊 테스트 결과 해석

### 성공적인 테스트 결과
```
🧪 Taskmaster 문서 동기화 통합 기능 테스트 시작...
==================================================

✅ 코드 변경 감지 기능: 통과
✅ 문서 검증 기능: 통과
✅ executeTaskMasterCommand 패턴: 통과
✅ 워크플로우 통합: 통과
✅ 규칙 파일 존재: 통과

==================================================
📊 테스트 결과 요약:
✅ 통과: 5
❌ 실패: 0
📈 성공률: 100.0%

🎉 모든 테스트가 통과했습니다!
```

### 실패한 테스트 결과
```
🧪 Taskmaster 문서 동기화 통합 기능 테스트 시작...
==================================================

✅ 코드 변경 감지 기능: 통과
✅ 문서 검증 기능: 통과
❌ executeTaskMasterCommand 패턴: 실패
❌ 워크플로우 통합: 실패
✅ 규칙 파일 존재: 통과

==================================================
📊 테스트 결과 요약:
✅ 통과: 3
❌ 실패: 2
📈 성공률: 60.0%

⚠️ 일부 테스트가 실패했습니다.
```

## 🔧 문제 해결 가이드

### 1. executeTaskMasterCommand 패턴 실패
**문제**: `executeTaskMasterCommand` 함수를 찾을 수 없음
**해결 방법**:
```bash
# 파일 경로 확인
ls -la mcp-server/src/tools/utils.js

# 함수 정의 확인
grep -n "executeTaskMasterCommand" mcp-server/src/tools/utils.js
```

### 2. 워크플로우 통합 실패
**문제**: 필요한 함수들이 구현 파일에 포함되지 않음
**해결 방법**:
```bash
# update-subtask-by-id.js 확인
grep -n "checkForCodeChanges" scripts/modules/task-manager/update-subtask-by-id.js

# set-task-status.js 확인
grep -n "checkDocumentationValidation" scripts/modules/task-manager/set-task-status.js
```

### 3. 규칙 파일 존재 실패
**문제**: 규칙 파일이 존재하지 않음
**해결 방법**:
```bash
# 규칙 파일 확인
ls -la .cursor/rules/taskmaster/documentation_integration.mdc
ls -la .cursor/rules/dev_workflow.mdc

# 파일 생성 (필요한 경우)
touch .cursor/rules/taskmaster/documentation_integration.mdc
touch .cursor/rules/dev_workflow.mdc
```

### 4. 코드 변경 감지 실패
**문제**: 정규식 패턴이 올바르게 작동하지 않음
**해결 방법**:
```javascript
// 테스트 패턴 확인
const testPatterns = [
    /type\s+\w+\s+struct|struct\s+\w+\s*{/i,
    /func\s+\w+\s*\(|function\s+\w+\s*\(/i,
    /ErrCode|Error|error|const\s+\w+\s*=/i
];

// 각 패턴 테스트
testPatterns.forEach((pattern, index) => {
    const test = pattern.test('새로운 구조체 type User struct 추가');
    console.log(`Pattern ${index}: ${test}`);
});
```

## 📈 테스트 성능 지표

### 실행 시간
- **전체 테스트 실행**: < 1초
- **개별 테스트**: < 100ms
- **파일 I/O 작업**: < 50ms

### 메모리 사용량
- **테스트 실행 중**: < 10MB
- **파일 읽기**: < 1MB

### 성공률 목표
- **전체 테스트 성공률**: 100%
- **개별 테스트 성공률**: 100%
- **지속적 통합**: 매 커밋마다 테스트 통과

## 🔄 지속적 테스트

### 자동화된 테스트
```bash
# CI/CD 파이프라인에 추가
npm test  # 기존 테스트와 함께 실행

# 또는 별도 스크립트로 실행
npm run test:documentation-integration
```

### 테스트 스케줄링
- **개발 중**: 매 코드 변경 시 테스트 실행
- **커밋 전**: pre-commit 훅으로 테스트 실행
- **배포 전**: 전체 테스트 스위트 실행

## 🔗 관련 문서

### 구현 관련
- [구현 문서](../implementation/README.md) - 테스트 대상 구현 상세
- [규칙 문서](../rules/README.md) - 테스트가 검증하는 규칙들

### 사용 가이드
- [예제 문서](../examples/README.md) - 테스트 시나리오 예제
- [메인 문서](../README.md) - 전체 개요

---

**📝 마지막 업데이트**: 2024년 12월  
**🔄 버전**: 1.0.0  
**👥 기여자**: Taskmaster 개발팀
