# 🛠️ Scripts 디렉토리

## 🎯 개요

이 디렉토리는 Taskmaster 프로젝트의 다양한 스크립트와 유틸리티를 포함합니다. 문서 동기화 통합 기능의 테스트 스크립트도 포함되어 있습니다.

## 📁 스크립트 파일들

### 문서 동기화 관련 스크립트
- [`test_documentation_integration.js`](./test_documentation_integration.js) - 문서 동기화 통합 기능 테스트 스크립트

### 기타 스크립트
- [`dev.js`](./dev.js) - 개발 환경 설정 스크립트
- [`init.js`](./init.js) - 프로젝트 초기화 스크립트

## 🧪 문서 동기화 테스트 스크립트

### 📝 `test_documentation_integration.js`

#### 🎯 목적
문서 동기화 통합 기능의 모든 구성 요소를 검증하는 통합 테스트 스크립트

#### 🔧 주요 기능
- **코드 변경 감지 테스트**: 정규식 패턴 검증
- **문서 검증 테스트**: 문서 동기화 완료 여부 확인
- **워크플로우 통합 테스트**: 구현 파일들의 통합 상태 확인
- **규칙 파일 존재 테스트**: 필요한 규칙 파일들의 존재 확인

#### 🚀 실행 방법
```bash
# 프로젝트 루트 디렉토리에서 실행
node scripts/test_documentation_integration.js

# 또는 scripts 디렉토리에서 직접 실행
cd scripts
node test_documentation_integration.js
```

#### 📊 테스트 결과 예시
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

#### 🔧 테스트 케이스 상세

##### 1. 코드 변경 감지 기능 테스트
```javascript
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
```

##### 2. 문서 검증 기능 테스트
```javascript
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
```

##### 3. 워크플로우 통합 테스트
```javascript
// update-subtask-by-id.js 확인
const updateSubtaskFile = fs.readFileSync(updateSubtaskPath, 'utf8');
const hasUpdateSubtaskIntegration = updateSubtaskFile.includes('checkForCodeChanges') && 
                                   updateSubtaskFile.includes('executeTaskMasterCommand');

// set-task-status.js 확인
const setStatusFile = fs.readFileSync(setStatusPath, 'utf8');
const hasSetStatusIntegration = setStatusFile.includes('checkDocumentationValidation') && 
                               setStatusFile.includes('review');
```

##### 4. 규칙 파일 존재 테스트
```javascript
const ruleFiles = [
    '.cursor/rules/taskmaster/documentation_integration.mdc',
    '.cursor/rules/dev_workflow.mdc'
];

return ruleFiles.every(file => {
    const filePath = path.join(__dirname, '..', file);
    return fs.existsSync(filePath);
});
```

## 🔗 관련 문서

### 구현 관련
- [구현 문서](../docs/documentation-integration/implementation/README.md) - 테스트 대상 구현 상세
- [테스트 문서](../docs/documentation-integration/testing/README.md) - 테스트 방법 및 결과 해석

### 규칙 관련
- [규칙 문서](../.cursor/rules/taskmaster/README.md) - 테스트가 검증하는 규칙들
- [메인 문서](../docs/documentation-integration/README.md) - 전체 개요

## 🚀 스크립트 사용 방법

### 1. 테스트 실행
```bash
# 전체 테스트 실행
node scripts/test_documentation_integration.js

# 실행 권한 확인 (필요한 경우)
chmod +x scripts/test_documentation_integration.js
```

### 2. 개별 테스트 실행
```bash
# scripts 디렉토리로 이동
cd scripts

# 테스트 스크립트 실행
node test_documentation_integration.js
```

### 3. CI/CD 통합
```bash
# CI/CD 파이프라인에 추가
npm test  # 기존 테스트와 함께 실행

# 또는 별도 스크립트로 실행
npm run test:documentation-integration
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

## 📈 성능 지표

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

## 🔧 스크립트 개발

### 새로운 테스트 추가
1. 테스트 요구사항 분석
2. 테스트 함수 작성
3. 기존 테스트 패턴 준수
4. 테스트 실행 및 검증
5. 문서 업데이트

### 스크립트 개선
1. 성능 최적화
2. 에러 처리 개선
3. 사용자 경험 향상
4. 문서 업데이트

---

**📝 마지막 업데이트**: 2024년 12월  
**🔄 버전**: 1.0.0  
**👥 기여자**: Taskmaster 개발팀
