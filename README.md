# TaskGarage [![GitHub stars](https://img.shields.io/github/stars/SukbeomH/taskGarage)](https://github.com/SukbeomH/taskGarage/stargazers)

**TaskGarage**는 [Task Master](https://github.com/eyaltoledano/claude-task-master)의 포크 버전으로, **문서 동기화 통합**과 **셀프 리뷰 기능**을 추가하여 더욱 완성도 높은 개발 워크플로우를 제공합니다.

## 🎯 **TaskGarage의 핵심 개선사항**

### 📝 **문서 동기화 통합**
- **자동 문서 업데이트**: 코드 변경 시 관련 문서 자동 동기화
- **문서 검증 시스템**: 문서 완성도 및 정확성 자동 검증
- **워크플로우 통합**: 10단계 개발 프로세스에 문서 동기화 단계 포함
- **코드 변경 감지**: 구조체 필드, 함수 시그니처, 에러 코드, 설정, API 엔드포인트 변경 자동 감지

### 🔍 **셀프 리뷰 시스템**
- **품질 검토**: 구현 결과물의 품질 및 요구사항 충족도 검토
- **코드 품질 검증**: 스타일, 성능, 보안, 유지보수성 종합 검토
- **테스트 커버리지 확인**: 적절한 테스트 작성 여부 검증
- **문서화 완성도 검토**: 코드 주석, README, API 문서 등 검토

## 📦 **설치**

```bash
npm install -g taskgarage
```

## 🔧 **MCP 설정**

```json
{
  "mcpServers": {
    "taskgarage": {
      "command": "npx",
      "args": ["taskgarage-mcp"],
      "env": {
        "ANTHROPIC_API_KEY": "your-api-key"
      }
    }
  }
}
```

## 🎯 **원본 프로젝트와의 차이점**

| 기능 | 원본 Task Master | TaskGarage |
|------|------------------|------------|
| 문서 동기화 | ❌ 없음 | ✅ 자동 통합 |
| 셀프 리뷰 | ❌ 없음 | ✅ 10단계 워크플로우 |
| 개발 프로세스 | 8단계 | 10단계 (문서 동기화 + 셀프 리뷰) |
| 문서 검증 | ❌ 수동 | ✅ 자동화 |
| 코드 변경 감지 | ❌ 없음 | ✅ 패턴 기반 자동 감지 |

## 🚀 **새로운 10단계 워크플로우**

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

## 📚 **문서**

- [원본 Task Master 문서](https://github.com/eyaltoledano/claude-task-master#readme)
- [TaskGarage 추가 기능 가이드](./docs/documentation-integration/README.md)
- [셀프 리뷰 워크플로우](./.cursor/rules/dev_workflow.mdc)
- [문서 동기화 통합 규칙](./.cursor/rules/taskmaster/documentation_integration.mdc)

## 🛠️ **추가된 스크립트들**

- `scripts/test_documentation_integration.js` - 문서 동기화 통합 기능 테스트
- `scripts/sync_docs_for_task.sh` - 문서 동기화 스크립트
- `scripts/validate_task_docs.py` - 문서 검증 스크립트

## 🤝 **기여**

이 프로젝트는 [Task Master](https://github.com/eyaltoledano/claude-task-master)의 포크 버전입니다. 원본 프로젝트에 대한 기여는 [원본 저장소](https://github.com/eyaltoledano/claude-task-master)를 참조하세요.

## 📄 **라이선스**

원본 프로젝트와 동일한 MIT with Commons Clause 라이선스를 따릅니다.
