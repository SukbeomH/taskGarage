# TaskGarage - Task Master 포크 버전

**TaskGarage**는 [Task Master](https://github.com/eyaltoledano/claude-task-master)의 포크 버전으로, **문서 동기화 통합**과 **셀프 리뷰 기능**을 추가하여 더욱 완성도 높은 개발 워크플로우를 제공합니다.

## 🎯 **원본 프로젝트와의 차이점**

### **추가된 기능들**

#### 📝 **문서 동기화 통합**
- **자동 코드 변경 감지**: 구조체 필드, 함수 시그니처, 에러 코드, 설정, API 엔드포인트 변경 자동 감지
- **문서 동기화 워크플로우**: 10단계 개발 프로세스에 문서 동기화 단계 통합
- **문서 검증 시스템**: 문서 완성도 및 정확성 자동 검증
- **실패 시 처리**: 문서 동기화 실패 시 task 상태를 'review'로 변경

#### 🔍 **셀프 리뷰 시스템**
- **품질 검토**: 구현 결과물의 품질 및 요구사항 충족도 검토
- **코드 품질 검증**: 스타일, 성능, 보안, 유지보수성 종합 검토
- **테스트 커버리지 확인**: 적절한 테스트 작성 여부 검증
- **문서화 완성도 검토**: 코드 주석, README, API 문서 등 검토
- **완료 조건 강화**: Self Review 완료 확인 후 task 완료 허용

### **워크플로우 확장**

| 단계 | 원본 Task Master | TaskGarage |
|------|------------------|------------|
| 1-6 | 기존 6단계 | 동일 |
| 7 | 없음 | **📝 Update Documentation** (새로 추가) |
| 8 | 없음 | **🔍 Self Review** (새로 추가) |
| 9-10 | 기존 2단계 | 동일 |

## 📚 **원본 프로젝트 정보**

### **Task Master**
- **원본 저장소**: [https://github.com/eyaltoledano/claude-task-master](https://github.com/eyaltoledano/claude-task-master)
- **개발자**: [@eyaltoledano](https://x.com/eyaltoledano), [@RalphEcom](https://x.com/RalphEcom), [@jasonzhou1993](https://x.com/jasonzhou1993)
- **설명**: AI 기반 태스크 관리 시스템으로 Cursor, Lovable, Windsurf, Roo 등과 함께 사용할 수 있습니다.

### **주요 원본 기능들**
- AI 기반 태스크 관리 시스템
- MCP (Model Control Protocol) 지원
- 다중 AI 제공자 지원 (Claude, OpenAI, Google, Perplexity 등)
- 태그 기반 태스크 관리
- 복잡도 분석 및 태스크 확장
- 연구 기능 통합
- 확장 프로그램 지원

## 🛠️ **TaskGarage 추가 스크립트들**

### **문서 동기화 관련**
- `scripts/test_documentation_integration.js` - 문서 동기화 통합 기능 테스트
- `scripts/sync_docs_for_task.sh` - 문서 동기화 스크립트
- `scripts/validate_task_docs.py` - 문서 검증 스크립트

### **규칙 파일들**
- `.cursor/rules/taskmaster/documentation_integration.mdc` - 문서 동기화 통합 규칙
- `.cursor/rules/dev_workflow.mdc` - 10단계 워크플로우 업데이트

## 📖 **문서**

- [원본 Task Master 문서](https://github.com/eyaltoledano/claude-task-master#readme)
- [TaskGarage 메인 README](./README.md)
- [문서 동기화 통합 가이드](./docs/documentation-integration/README.md)
- [개발 워크플로우 가이드](./.cursor/rules/dev_workflow.mdc)

## 🤝 **기여**

이 프로젝트는 [Task Master](https://github.com/eyaltoledano/claude-task-master)의 포크 버전입니다. 원본 프로젝트에 대한 기여는 [원본 저장소](https://github.com/eyaltoledano/claude-task-master)를 참조하세요.

## 📄 **라이선스**

원본 프로젝트와 동일한 MIT with Commons Clause 라이선스를 따릅니다.
