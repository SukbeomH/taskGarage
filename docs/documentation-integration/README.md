# 📝 TaskGarage 문서 동기화 통합 기능

## 🎯 개요

TaskGarage 문서 동기화 통합 기능은 코드 변경 시 자동으로 관련 문서를 업데이트하여 코드와 문서의 100% 동기화를 보장하는 시스템입니다.

## ✨ 주요 기능

- **🔍 코드 변경 감지**: 구조체 필드, 함수 시그니처, 에러 코드, 설정, API 엔드포인트 변경 자동 감지
- **📝 자동 문서 동기화**: 코드 변경 시 관련 문서 자동 업데이트
- **✅ 문서 검증**: 문서 동기화 완료 여부 자동 검증
- **🔄 워크플로우 통합**: 기존 TaskGarage 워크플로우에 완전 통합
- **🧪 자동화된 테스트**: 문서 동기화 기능의 안정성 보장

## 🔄 워크플로우 통합

TaskGarage의 기존 개발 워크플로우에 문서 동기화 및 Self Review 기능이 완전히 통합되었습니다.

### 10단계 확장된 워크플로우

기존 8단계 워크플로우에 **7단계: Update Documentation**과 **8단계: Self Review**가 추가되어 총 10단계로 확장되었습니다:

1. **이해 및 계획** (Preparation)
2. **초기 탐색 및 계획** (Iteration 1)
3. **계획 로깅** (Log the Plan)
4. **계획 검증** (Verify the Plan)
5. **구현 시작** (Begin Implementation)
6. **진행 상황 로깅** (Iteration 2+)
7. **📝 문서 업데이트** (Update Documentation) - **새로 추가**
8. **🔍 Self Review** (Self Review) - **새로 추가**
9. **규칙 검토 및 업데이트** (Review & Update Rules)
10. **작업 완료** (Mark Task Complete)
11. **변경사항 커밋** (Commit Changes)
12. **다음 서브태스크 진행** (Proceed to Next Subtask)

### Self Review 기능

- **결과물 품질 검토**: 구현된 결과물이 task/subtask의 생성 의도와 일치하는지 자체 검토
- **요구사항 충족도 확인**: 원래 요구사항과 기능적 완성도 검증
- **코드 품질 검토**: 코드 스타일, 성능, 보안, 유지보수성 측면 검토
- **테스트 커버리지 확인**: 적절한 테스트가 작성되었는지 검증
- **문서화 완성도 확인**: 코드 주석, README, API 문서 등이 충분한지 검토
- **검토 결과 기록**: `update_subtask`를 통해 검토 결과와 개선 사항 로깅

## 🚀 빠른 시작

1. **코드 변경 시**: `update_subtask` 명령어로 코드 변경 사항 기록
2. **자동 감지**: 시스템이 코드 변경을 자동으로 감지
3. **문서 동기화**: 관련 문서가 자동으로 업데이트됨
4. **Self Review**: 구현 완료 후 자체 검토 수행
5. **검증**: 문서 동기화 및 Self Review 완료 여부가 자동으로 검증됨
6. **상태 관리**: 검증 실패 시 task 상태가 'review'로 변경

## 📁 문서 구조

### 📋 [규칙](./rules/README.md)
- 문서 동기화 규칙 및 가이드라인
- 워크플로우 통합 방법
- 자동화 스크립트 통합 패턴

### 🛠️ [구현](./implementation/README.md)
- 코드 변경 감지 로직
- 문서 동기화 실행 메커니즘
- 수정된 파일들의 상세 설명

### 🧪 [테스트](./testing/README.md)
- 테스트 스크립트 및 실행 방법
- 테스트 결과 해석
- 문제 해결 가이드

### 📖 [예제](./examples/README.md)
- 실제 사용 시나리오
- 코드 변경 예제
- 문서 동기화 결과 예시

## 🔗 관련 파일들

### 규칙 파일
- [`.cursor/rules/taskmaster/documentation_integration.mdc`](../../.cursor/rules/taskmaster/documentation_integration.mdc)
- [`.cursor/rules/dev_workflow.mdc`](../../.cursor/rules/dev_workflow.mdc)

### 구현 파일
- [`scripts/modules/task-manager/update-subtask-by-id.js`](../../scripts/modules/task-manager/update-subtask-by-id.js)
- [`scripts/modules/task-manager/set-task-status.js`](../../scripts/modules/task-manager/set-task-status.js)

### 테스트 파일
- [`scripts/test_documentation_integration.js`](../../scripts/test_documentation_integration.js)

## 🎯 사용 시나리오

### 시나리오 1: 새로운 API 엔드포인트 추가
1. API 엔드포인트 코드 작성
2. `update_subtask`로 변경 사항 기록
3. 시스템이 API 변경을 감지
4. API 문서가 자동으로 업데이트됨
5. Self Review 수행 (코드 품질, 테스트 커버리지, 문서화 완성도 검토)
6. 문서 동기화 및 Self Review 완료 확인

### 시나리오 2: 설정 구조체 수정
1. 설정 구조체에 새 필드 추가
2. `update_subtask`로 변경 사항 기록
3. 시스템이 구조체 변경을 감지
4. 설정 문서가 자동으로 업데이트됨
5. Self Review 수행 (구조체 설계, 타입 안전성, 문서화 검토)
6. 문서 동기화 및 Self Review 완료 확인

## 🔧 기술적 특징

- **기존 패턴 준수**: `executeTaskMasterCommand` 패턴 사용
- **MCP 통합**: MCP 서버와 완전 통합
- **에러 처리**: 문서 동기화 및 Self Review 실패 시 적절한 에러 처리
- **상태 추적**: 문서 동기화 및 Self Review 상태를 task에 기록
- **자동화**: 수동 개입 없이 완전 자동화
- **품질 보장**: Self Review를 통한 코드 품질 및 완성도 검증

## 📊 성능 및 안정성

- **테스트 커버리지**: 모든 기능에 대한 자동화된 테스트
- **에러 복구**: 문서 동기화 실패 시 자동 복구 메커니즘
- **성능 최적화**: 효율적인 코드 변경 감지 알고리즘
- **메모리 효율성**: 최소한의 메모리 사용으로 동작

## 🤝 기여하기

문서 동기화 통합 기능에 기여하고 싶으시다면:

1. [구현 문서](./implementation/README.md)를 참고하여 코드 구조 파악
2. [테스트 문서](./testing/README.md)를 참고하여 테스트 실행
3. [예제 문서](./examples/README.md)를 참고하여 사용법 학습
4. [규칙 문서](./rules/README.md)를 참고하여 개발 가이드라인 준수

## 📞 지원

문제가 발생하거나 질문이 있으시면:

1. [테스트 문서](./testing/README.md)의 문제 해결 섹션 확인
2. [예제 문서](./examples/README.md)의 FAQ 섹션 확인
3. GitHub Issues를 통해 문제 보고

---

**📝 마지막 업데이트**: 2024년 12월
**🔄 버전**: 1.0.0
**👥 기여자**: TaskGarage 개발팀
