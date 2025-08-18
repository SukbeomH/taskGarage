#!/bin/bash
# scripts/sync_docs_for_task.sh
# Taskmaster 문서 동기화 스크립트

set -e  # 에러 발생 시 스크립트 중단

TASK_ID=$1
TASK_DETAILS=$2
PROJECT_ROOT=${3:-$(pwd)}

echo "Task $TASK_ID 문서 동기화 시작..."
echo "프로젝트 루트: $PROJECT_ROOT"

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

# 코드 변경 유형 분석 함수
analyze_code_changes() {
    local task_details="$1"
    
    # 구조체 필드 변경 감지
    if echo "$task_details" | grep -q "type.*struct\|struct.*{" || echo "$task_details" | grep -q "json:\|yaml:"; then
        echo "struct_field"
        return 0
    fi
    
    # 함수 시그니처 변경 감지
    if echo "$task_details" | grep -q "func.*(" || echo "$task_details" | grep -q "function.*("; then
        echo "function_signature"
        return 0
    fi
    
    # 에러 코드/메시지 변경 감지
    if echo "$task_details" | grep -q "ErrCode\|Error\|error" || echo "$task_details" | grep -q "const.*="; then
        echo "error_codes"
        return 0
    fi
    
    # 설정 변경 감지
    if echo "$task_details" | grep -q "config\|Config\|ENV\|environment" || echo "$task_details" | grep -q "loadConfig\|NewConfig"; then
        echo "config"
        return 0
    fi
    
    # 기본값: 일반적인 코드 변경
    echo "general"
}

# 문서 업데이트 실행 함수
run_documentation_update() {
    local change_type="$1"
    local project_root="$2"
    
    log_info "변경 유형: $change_type"
    
    case $change_type in
        "struct_field")
            log_info "구조체 필드 변경 감지 - 스키마 문서 업데이트"
            if [ -f "$project_root/scripts/generate_schemas.py" ]; then
                python3 "$project_root/scripts/generate_schemas.py"
                log_success "스키마 문서 업데이트 완료"
            else
                log_warning "스키마 생성 스크립트를 찾을 수 없습니다: scripts/generate_schemas.py"
            fi
            ;;
        "function_signature")
            log_info "함수 시그니처 변경 감지 - API 문서 업데이트"
            if [ -f "$project_root/scripts/generate_api_docs.py" ]; then
                python3 "$project_root/scripts/generate_api_docs.py"
                log_success "API 문서 업데이트 완료"
            else
                log_warning "API 문서 생성 스크립트를 찾을 수 없습니다: scripts/generate_api_docs.py"
            fi
            ;;
        "error_codes")
            log_info "에러 코드 변경 감지 - 에러 문서 업데이트"
            if [ -f "$project_root/scripts/generate_error_docs.py" ]; then
                python3 "$project_root/scripts/generate_error_docs.py"
                log_success "에러 문서 업데이트 완료"
            else
                log_warning "에러 문서 생성 스크립트를 찾을 수 없습니다: scripts/generate_error_docs.py"
            fi
            ;;
        "config")
            log_info "설정 변경 감지 - 설정 문서 업데이트"
            if [ -f "$project_root/scripts/generate_config_docs.py" ]; then
                python3 "$project_root/scripts/generate_config_docs.py"
                log_success "설정 문서 업데이트 완료"
            else
                log_warning "설정 문서 생성 스크립트를 찾을 수 없습니다: scripts/generate_config_docs.py"
            fi
            ;;
        "general")
            log_info "일반적인 코드 변경 감지 - 전체 문서 업데이트"
            # 모든 문서 업데이트 스크립트 실행
            for script in "generate_api_docs.py" "generate_schemas.py" "generate_error_docs.py" "generate_config_docs.py"; do
                if [ -f "$project_root/scripts/$script" ]; then
                    log_info "실행 중: $script"
                    python3 "$project_root/scripts/$script"
                    log_success "$script 완료"
                fi
            done
            ;;
        *)
            log_warning "알 수 없는 변경 유형: $change_type"
            ;;
    esac
}

# 문서 검증 함수
validate_documentation() {
    local project_root="$1"
    
    log_info "문서 검증 시작..."
    
    if [ -f "$project_root/scripts/validate_docs.py" ]; then
        python3 "$project_root/scripts/validate_docs.py"
        if [ $? -eq 0 ]; then
            log_success "문서 검증 완료"
            return 0
        else
            log_error "문서 검증 실패"
            return 1
        fi
    else
        log_warning "문서 검증 스크립트를 찾을 수 없습니다: scripts/validate_docs.py"
        # 기본 검증: 주요 문서 파일 존재 확인
        local docs_to_check=("README.md" "docs/api-documentation.md" "docs/gpu-api-analysis.md")
        local all_exist=true
        
        for doc in "${docs_to_check[@]}"; do
            if [ ! -f "$project_root/$doc" ]; then
                log_warning "문서 파일이 없습니다: $doc"
                all_exist=false
            fi
        done
        
        if [ "$all_exist" = true ]; then
            log_success "기본 문서 검증 완료"
            return 0
        else
            log_warning "일부 문서 파일이 누락되었습니다"
            return 1
        fi
    fi
}

# 메인 실행 로직
main() {
    if [ -z "$TASK_ID" ]; then
        log_error "사용법: $0 <task_id> <task_details> [project_root]"
        exit 1
    fi
    
    if [ -z "$TASK_DETAILS" ]; then
        log_error "Task 세부사항이 필요합니다"
        exit 1
    fi
    
    log_info "Task ID: $TASK_ID"
    log_info "프로젝트 루트: $PROJECT_ROOT"
    
    # 1. 코드 변경 유형 분석
    log_info "코드 변경 유형 분석 중..."
    CHANGE_TYPE=$(analyze_code_changes "$TASK_DETAILS")
    
    # 2. 필요한 문서 업데이트 실행
    log_info "문서 업데이트 실행 중..."
    run_documentation_update "$CHANGE_TYPE" "$PROJECT_ROOT"
    
    # 3. 문서 검증
    log_info "문서 검증 중..."
    if validate_documentation "$PROJECT_ROOT"; then
        log_success "Task $TASK_ID 문서 동기화 완료"
        echo "SUCCESS"
        exit 0
    else
        log_error "Task $TASK_ID 문서 동기화 실패"
        echo "FAILED"
        exit 1
    fi
}

# 스크립트 실행
main "$@"
