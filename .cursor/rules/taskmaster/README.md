# 📋 Taskmaster 규칙

## 🎯 개요

이 디렉토리는 Taskmaster 프로젝트의 개발 규칙과 가이드라인을 담고 있습니다.

## 📁 규칙 파일들

### 핵심 규칙
- [`documentation_integration.mdc`](./documentation_integration.mdc) - 문서 동기화 통합 규칙
- [`dev_workflow.mdc`](../dev_workflow.mdc) - 개발 워크플로우 규칙

## 📖 규칙 상세 내용

### 1. 문서 동기화 통합 규칙 (`documentation_integration.mdc`)

#### 📝 주요 내용
- **문서 업데이트 트리거 감지**: 코드 변경 시 자동 문서 동기화
- **워크플로우 통합**: 기존 8단계 → 새로운 9단계 확장
- **자동화 스크립트 통합**: `executeTaskMasterCommand` 패턴 사용

#### 🔄 적용 범위
- 구조체 필드 변경
- 함수 시그니처 변경
- 에러 코드/메시지 변경
- 설정 변경
- API 엔드포인트 변경

### 2. 개발 워크플로우 규칙 (`dev_workflow.mdc`)

#### 📝 주요 내용
- **기본 워크플로우**: 8단계 개발 프로세스
- **확장 워크플로우**: 문서 동기화가 추가된 9단계 프로세스
- **태그 기반 작업**: 다중 컨텍스트 개발 지원

#### 🔄 워크플로우 단계
1. **Understand the Goal** - 목표 이해
2. **Initial Exploration & Planning** - 초기 탐색 및 계획
3. **Log the Plan** - 계획 기록
4. **Verify the Plan** - 계획 검증
5. **Begin Implementation** - 구현 시작
6. **Refine and Log Progress** - 진행 상황 정제 및 기록
7. **📝 Update Documentation** - 문서 업데이트 (새로 추가)
8. **Review & Update Rules** - 규칙 검토 및 업데이트
9. **Mark Task Complete** - 작업 완료 표시

## 🔗 관련 문서

### 구현 관련
- [구현 문서](../../docs/documentation-integration/implementation/README.md) - 규칙이 적용된 구현 상세
- [테스트 문서](../../docs/documentation-integration/testing/README.md) - 규칙 준수 여부 테스트

### 사용 가이드
- [예제 문서](../../docs/documentation-integration/examples/README.md) - 규칙 적용 예제
- [메인 문서](../../docs/documentation-integration/README.md) - 전체 개요

## 🚀 규칙 적용 방법

### 1. 개발 시작 시
```bash
# 규칙 파일 확인
cat .cursor/rules/taskmaster/documentation_integration.mdc
cat .cursor/rules/dev_workflow.mdc
```

### 2. 코드 변경 시
```javascript
// 규칙에 따라 update_subtask 사용
await update_subtask({
    id: '1.2',
    prompt: '새로운 기능 구현: 사용자 인증 시스템 추가'
});

// 시스템이 자동으로 문서 동기화 실행
```

### 3. 작업 완료 시
```javascript
// 규칙에 따라 상태 변경
await set_task_status({
    id: '1.2',
    status: 'done'
});

// 문서 동기화 완료 여부 자동 검증
```

## ⚠️ 규칙 준수 확인

### 필수 준수 사항
- **모든 코드 변경**: `update_subtask`를 통해 기록
- **문서 동기화**: 자동화된 시스템 사용
- **상태 관리**: 문서 동기화 완료 후 'done' 상태로 변경

### 규칙 위반 시나리오
- **외부 스크립트 직접 호출**: `execSync` 사용 금지
- **수동 문서 업데이트**: 자동화된 시스템 우회 금지
- **문서 동기화 무시**: 코드 변경 시 문서 업데이트 생략 금지

## 📊 규칙 효과 측정

### 성공 지표
- **문서 동기화 성공률**: 95% 이상
- **코드-문서 동기화율**: 100%
- **자동화 실행률**: 100%

### 모니터링 항목
- 문서 동기화 실패 횟수
- 수동 문서 업데이트 횟수
- 규칙 위반 발생 횟수

## 🔄 규칙 업데이트

### 규칙 변경 절차
1. 규칙 변경 제안
2. 팀 리뷰 및 승인
3. 규칙 파일 업데이트
4. 구현 코드 수정
5. 테스트 실행 및 검증
6. 문서 업데이트

### 버전 관리
- **규칙 버전**: 1.0.0
- **마지막 업데이트**: 2024년 12월
- **다음 검토 예정**: 2025년 3월

## 🤝 기여하기

### 규칙 개선 제안
1. 새로운 규칙 제안
2. 기존 규칙 수정 제안
3. 규칙 적용 사례 공유

### 규칙 검토
1. 정기적인 규칙 검토
2. 사용자 피드백 수집
3. 규칙 효과 측정

---

**📝 마지막 업데이트**: 2024년 12월  
**🔄 버전**: 1.0.0  
**👥 기여자**: Taskmaster 개발팀
