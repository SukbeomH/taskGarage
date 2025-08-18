# TaskGarage 문서 동기화 통합 가이드

TaskGarage는 **문서 동기화 통합** 기능을 통해 코드와 문서의 100% 동기화를 보장합니다.

## 🎯 **개요**

TaskGarage는 기존 8단계 개발 워크플로우를 **10단계**로 확장하여 문서 동기화와 셀프 리뷰를 자동으로 통합합니다.

### **새로 추가된 단계**

- **7단계: Update Documentation** - 문서 업데이트
- **8단계: Self Review** - 셀프 리뷰

## 📝 **문서 동기화 기능**

### **자동 코드 변경 감지**

TaskGarage는 다음 패턴을 자동으로 감지하여 문서 업데이트 필요성을 판단합니다:

#### **1. 구조체 필드 변경**
```go
// 감지 패턴: 새로운 필드, 태그 변경, 타입 변경
type Config struct {
    NewField string `json:"newField" yaml:"newField"` // ← 문서 업데이트 필요
}
```

#### **2. 함수 시그니처 변경**
```go
// 감지 패턴: 매개변수 추가/제거, 반환값 변경
func ValidateGPUQuota(ctx context.Context, realm, project string) *ValidationError {
    // ← 문서 업데이트 필요
}
```

#### **3. 에러 코드/메시지 변경**
```go
// 감지 패턴: 새로운 에러 코드, 메시지 수정
const ErrCodeNewValidation = "NewValidation" // ← 문서 업데이트 필요
```

#### **4. 설정 변경**
```go
// 감지 패턴: 환경변수 추가, 설정 구조 변경
NewSetting: loadConfig("NEW_SETTING"), // ← 문서 업데이트 필요
```

#### **5. API 엔드포인트 변경**
```go
// 감지 패턴: 새로운 엔드포인트, 응답 형식 변경
func (s *Server) NewEndpoint(w http.ResponseWriter, r *http.Request) {
    // ← 문서 업데이트 필요
}
```

### **문서 동기화 프로세스**

1. **코드 변경 감지**: 패턴 기반 자동 감지
2. **문서 업데이트 필요성 평가**: 변경 유형별 문서 업데이트 필요성 판단
3. **자동화된 문서 생성**: 내장 로직을 통한 문서 동기화 실행
4. **문서 동기화 상태 검증**: 생성된 문서의 정확성 및 완성성 검증
5. **실패 시 처리**: 문서 동기화가 실패한 경우 task 상태를 'review'로 변경

## 🔍 **셀프 리뷰 시스템**

### **리뷰 항목**

- **결과물 품질 검토**: 구현된 결과물이 task/subtask의 생성 의도와 일치하는지 자체 검토
- **요구사항 충족도 확인**: 원래 요구사항과 기능적 완성도 검증
- **코드 품질 검토**: 코드 스타일, 성능, 보안, 유지보수성 측면 검토
- **테스트 커버리지 확인**: 적절한 테스트가 작성되었는지 검증
- **문서화 완성도 확인**: 코드 주석, README, API 문서 등이 충분한지 검토

### **리뷰 완료 조건**

- Self Review가 완료되지 않은 경우 task를 'done' 상태로 변경할 수 없음
- 모든 리뷰 항목이 통과되어야 task 완료 가능

## 🛠️ **구현된 스크립트들**

### **1. 문서 동기화 테스트 스크립트**
```bash
node scripts/test_documentation_integration.js
```

**기능:**
- 코드 변경 감지 패턴 테스트
- 문서 검증 로직 테스트
- 워크플로우 통합 테스트

### **2. 문서 동기화 스크립트**
```bash
./scripts/sync_docs_for_task.sh <task_id> <task_details> [project_root]
```

**기능:**
- 코드 변경 유형 분석
- 변경 유형별 문서 업데이트 실행
- 문서 동기화 상태 로깅

### **3. 문서 검증 스크립트**
```bash
python3 scripts/validate_task_docs.py <task_id> [project_root]
```

**기능:**
- 문서 완성도 검증
- 문서 정확성 검증
- 검증 결과 리포트 생성

## 📋 **워크플로우 통합**

### **기존 8단계 → 새로운 10단계**

1. **Understand the Goal** - 목표 이해
2. **Initial Exploration & Planning** - 초기 탐색 및 계획
3. **Log the Plan** - 계획 기록
4. **Verify the Plan** - 계획 검증
5. **Begin Implementation** - 구현 시작
6. **Refine and Log Progress** - 진행 상황 정리 및 기록
7. **📝 Update Documentation** - 문서 업데이트 (새로 추가)
8. **🔍 Self Review** - 셀프 리뷰 (새로 추가)
9. **Review & Update Rules** - 규칙 검토 및 업데이트
10. **Mark Task Complete** - 작업 완료 표시

### **문서 동기화 단계 상세**

**7단계: Update Documentation**
```bash
# 문서 업데이트 필요성 평가
taskgarage update-subtask --id=<subtaskId> --prompt="문서 업데이트 필요성 평가 중..."

# 자동화된 문서 생성
./scripts/sync_docs_for_task.sh <task_id> <task_details>

# 문서 동기화 상태 검증
python3 scripts/validate_task_docs.py <task_id>

# 문서 업데이트 상태 기록
taskgarage update-subtask --id=<subtaskId> --prompt="문서 동기화 완료"
```

### **셀프 리뷰 단계 상세**

**8단계: Self Review**
```bash
# 결과물 품질 검토
taskgarage update-subtask --id=<subtaskId> --prompt="결과물 품질 검토 중..."

# 요구사항 충족도 확인
taskgarage update-subtask --id=<subtaskId> --prompt="요구사항 충족도 확인 중..."

# 코드 품질 검토
taskgarage update-subtask --id=<subtaskId> --prompt="코드 품질 검토 중..."

# 테스트 커버리지 확인
taskgarage update-subtask --id=<subtaskId> --prompt="테스트 커버리지 확인 중..."

# 문서화 완성도 확인
taskgarage update-subtask --id=<subtaskId> --prompt="문서화 완성도 확인 중..."

# 검토 결과 기록
taskgarage update-subtask --id=<subtaskId> --prompt="셀프 리뷰 완료 - 모든 항목 통과"
```

## 🎯 **사용 예시**

### **새로운 기능 구현 시**

1. **코드 구현 완료**
2. **문서 동기화 자동 실행**
3. **셀프 리뷰 수행**
4. **모든 검증 통과 후 task 완료**

### **문서 동기화 실패 시**

1. **문서 동기화 실패 감지**
2. **Task 상태를 'review'로 변경**
3. **문서 동기화 문제 해결**
4. **재시도 후 성공 시 task 완료**

## 📚 **관련 문서**

- [문서 동기화 통합 규칙](../.cursor/rules/taskmaster/documentation_integration.mdc)
- [개발 워크플로우 가이드](../.cursor/rules/dev_workflow.mdc)
- [TaskGarage 메인 README](../README.md)
