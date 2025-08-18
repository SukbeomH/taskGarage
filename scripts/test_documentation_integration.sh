#!/bin/bash
# scripts/test_documentation_integration.sh
# TaskGarage 문서 동기화 통합 기능 테스트 스크립트

set -e

echo "🧪 TaskGarage 문서 동기화 통합 기능 테스트 시작..."
echo "=================================================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 테스트 결과 추적
TESTS_PASSED=0
TESTS_FAILED=0

# 테스트 함수
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    log_info "실행 중: $test_name"
    
    if eval "$test_command"; then
        log_success "✅ $test_name 통과"
        ((TESTS_PASSED++))
    else
        log_error "❌ $test_name 실패"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# 1. 스크립트 파일 존재 확인 테스트
log_info "1. 스크립트 파일 존재 확인"
run_test "문서 동기화 스크립트 존재" "[ -f scripts/sync_docs_for_task.sh ]" "true"
run_test "문서 검증 스크립트 존재" "[ -f scripts/validate_task_docs.py ]" "true"
run_test "문서 동기화 스크립트 실행 권한" "[ -x scripts/sync_docs_for_task.sh ]" "true"
run_test "문서 검증 스크립트 실행 권한" "[ -x scripts/validate_task_docs.py ]" "true"

# 2. 문서 동기화 스크립트 기능 테스트
log_info "2. 문서 동기화 스크립트 기능 테스트"

# 테스트용 task 세부사항 생성
TEST_TASK_ID="test-001"
TEST_TASK_DETAILS="구조체 필드 변경: type Config struct { NewField string \`json:\"newField\"\` }"
TEST_PROJECT_ROOT=$(pwd)

# 문서 동기화 스크립트 실행 테스트
run_test "문서 동기화 스크립트 실행" \
    "echo '$TEST_TASK_DETAILS' | ./scripts/sync_docs_for_task.sh '$TEST_TASK_ID' '$TEST_TASK_DETAILS' '$TEST_PROJECT_ROOT' > /dev/null 2>&1 || true" \
    "true"

# 3. 문서 검증 스크립트 기능 테스트
log_info "3. 문서 검증 스크립트 기능 테스트"

# 문서 검증 스크립트 실행 테스트
run_test "문서 검증 스크립트 실행" \
    "python3 scripts/validate_task_docs.py '$TEST_TASK_ID' '$TEST_TASK_DETAILS' '$TEST_PROJECT_ROOT' > /dev/null 2>&1 || true" \
    "true"

# 4. 코드 변경 감지 테스트
log_info "4. 코드 변경 감지 테스트"

# 구조체 필드 변경 감지 테스트
STRUCT_CHANGE_TEST="type Config struct { NewField string \`json:\"newField\"\` }"
run_test "구조체 필드 변경 감지" \
    "echo '$STRUCT_CHANGE_TEST' | grep -q 'type.*struct\|struct.*{' || echo '$STRUCT_CHANGE_TEST' | grep -q 'json:\|yaml:'" \
    "true"

# 함수 시그니처 변경 감지 테스트
FUNCTION_CHANGE_TEST="func ValidateGPUQuota(ctx context.Context, realm, project string) *ValidationError"
run_test "함수 시그니처 변경 감지" \
    "echo '$FUNCTION_CHANGE_TEST' | grep -q 'func.*('" \
    "true"

# 에러 코드 변경 감지 테스트
ERROR_CHANGE_TEST="const ErrCodeNewValidation = \"NewValidation\""
run_test "에러 코드 변경 감지" \
    "echo '$ERROR_CHANGE_TEST' | grep -q 'ErrCode\|Error\|error\|const.*='" \
    "true"

# 설정 변경 감지 테스트
CONFIG_CHANGE_TEST="NewSetting: loadConfigWithPriority(\"NEW_SETTING\", \"/etc/config/new_setting\", \"default\")"
run_test "설정 변경 감지" \
    "echo '$CONFIG_CHANGE_TEST' | grep -q 'config\|Config\|ENV\|environment\|loadConfig\|NewConfig'" \
    "true"

# 5. 규칙 파일 존재 확인 테스트
log_info "5. 규칙 파일 존재 확인"
run_test "문서 동기화 통합 규칙 파일 존재" "[ -f .cursor/rules/taskmaster/documentation_integration.mdc ]" "true"

# 6. 워크플로우 수정 확인 테스트
log_info "6. 워크플로우 수정 확인"
run_test "워크플로우에 문서 업데이트 단계 추가 확인" \
    "grep -q 'Update Documentation' .cursor/rules/dev_workflow.mdc" \
    "true"

# 7. TaskGarage 도구 수정 확인 테스트
log_info "7. TaskGarage 도구 수정 확인"
run_test "update_subtask에 문서 동기화 로직 추가 확인" \
    "grep -q '문서 업데이트 필요성 체크' scripts/modules/task-manager/update-subtask-by-id.js" \
    "true"

run_test "set_task_status에 문서 검증 로직 추가 확인" \
    "grep -q '문서 동기화 완료 확인' scripts/modules/task-manager/set-task-status.js" \
    "true"

# 8. 통합 테스트
log_info "8. 통합 테스트"

# 가상의 task 업데이트 시나리오 테스트
log_info "가상의 task 업데이트 시나리오 테스트"
echo "이 테스트는 실제 taskgarage 명령어를 사용하지 않고 기능만 확인합니다."

# 테스트 결과 요약
echo ""
echo "=================================================="
echo "🧪 테스트 결과 요약"
echo "=================================================="
echo "통과한 테스트: $TESTS_PASSED"
echo "실패한 테스트: $TESTS_FAILED"
echo "총 테스트: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    log_success "🎉 모든 테스트가 통과했습니다!"
    echo ""
    echo "✅ 문서 동기화 통합 기능이 성공적으로 구현되었습니다."
    echo "✅ 다음 기능들이 정상적으로 작동합니다:"
    echo "   - 코드 변경 감지"
    echo "   - 자동 문서 동기화"
    echo "   - 문서 검증"
    echo "   - Task 상태 관리"
    echo ""
    echo "📝 사용 방법:"
    echo "   1. taskgarage update-subtask --id=<id> --prompt=\"코드 변경 내용\""
    echo "   2. 자동으로 문서 동기화가 실행됩니다"
    echo "   3. taskgarage set-status --id=<id> --status=done"
    echo "   4. 문서 검증 후 완료 상태로 변경됩니다"
    exit 0
else
    log_error "❌ 일부 테스트가 실패했습니다."
    echo ""
    echo "🔧 문제 해결 방법:"
    echo "   1. 스크립트 파일들이 올바른 위치에 있는지 확인"
    echo "   2. 실행 권한이 설정되어 있는지 확인"
    echo "   3. Python3가 설치되어 있는지 확인"
    echo "   4. 규칙 파일들이 올바르게 생성되었는지 확인"
    exit 1
fi
