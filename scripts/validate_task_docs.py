#!/usr/bin/env python3
# scripts/validate_task_docs.py
# TaskGarage 문서 검증 스크립트

import os
import sys
import json
import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple

class DocumentationValidator:
    """문서 동기화 상태를 검증하는 클래스"""
    
    def __init__(self, project_root: str):
        self.project_root = project_root
        self.validation_results = {}
        
    def analyze_code_changes(self, task_details: str) -> Dict[str, any]:
        """코드 변경 사항을 분석하여 문서 업데이트 필요성을 판단합니다."""
        
        changes = {
            'struct_fields': False,
            'function_signatures': False,
            'error_codes': False,
            'config_changes': False,
            'api_endpoints': False,
            'general_changes': False
        }
        
        # 구조체 필드 변경 감지
        if re.search(r'type\s+\w+\s+struct|struct\s+\w+\s*{', task_details, re.IGNORECASE):
            changes['struct_fields'] = True
            
        if re.search(r'json:|yaml:', task_details, re.IGNORECASE):
            changes['struct_fields'] = True
            
        # 함수 시그니처 변경 감지
        if re.search(r'func\s+\w+\s*\(|function\s+\w+\s*\(', task_details, re.IGNORECASE):
            changes['function_signatures'] = True
            
        # 에러 코드/메시지 변경 감지
        if re.search(r'ErrCode|Error|error|const\s+\w+\s*=', task_details, re.IGNORECASE):
            changes['error_codes'] = True
            
        # 설정 변경 감지
        if re.search(r'config|Config|ENV|environment|loadConfig|NewConfig', task_details, re.IGNORECASE):
            changes['config_changes'] = True
            
        # API 엔드포인트 변경 감지
        if re.search(r'endpoint|route|handler|API', task_details, re.IGNORECASE):
            changes['api_endpoints'] = True
            
        # 일반적인 코드 변경
        if any(changes.values()):
            changes['general_changes'] = True
            
        return changes
    
    def determine_required_updates(self, changes: Dict[str, any]) -> List[str]:
        """변경 사항에 따라 필요한 문서 업데이트를 결정합니다."""
        
        required_updates = []
        
        if changes['struct_fields']:
            required_updates.extend([
                'docs/schemas/',
                'README.md (설정 섹션)',
                'docs/api-documentation.md (데이터 구조 섹션)'
            ])
            
        if changes['function_signatures']:
            required_updates.extend([
                'docs/api-documentation.md (함수 섹션)',
                'README.md (API 섹션)'
            ])
            
        if changes['error_codes']:
            required_updates.extend([
                'docs/api-documentation.md (에러 섹션)',
                'docs/error-codes.md'
            ])
            
        if changes['config_changes']:
            required_updates.extend([
                'README.md (환경변수 섹션)',
                'docs/configuration.md',
                'deploy/helm/gpu-webhook/values.yaml'
            ])
            
        if changes['api_endpoints']:
            required_updates.extend([
                'docs/api-documentation.md (엔드포인트 섹션)',
                'docs/gpu-api-analysis.md'
            ])
            
        # 중복 제거
        return list(set(required_updates))
    
    def check_documentation_sync(self, required_updates: List[str]) -> Dict[str, any]:
        """문서 동기화 상태를 확인합니다."""
        
        sync_status = {
            'status': 'pending',
            'last_updated': None,
            'missing_files': [],
            'outdated_files': [],
            'valid_files': []
        }
        
        for update in required_updates:
            file_path = os.path.join(self.project_root, update)
            
            if os.path.isfile(file_path):
                # 파일 수정 시간 확인
                mtime = os.path.getmtime(file_path)
                last_modified = datetime.fromtimestamp(mtime)
                
                # 24시간 이내 수정된 파일은 최신으로 간주
                if (datetime.now() - last_modified).days < 1:
                    sync_status['valid_files'].append(update)
                    if not sync_status['last_updated'] or last_modified > sync_status['last_updated']:
                        sync_status['last_updated'] = last_modified
                else:
                    sync_status['outdated_files'].append(update)
            else:
                sync_status['missing_files'].append(update)
        
        # 전체 상태 결정
        if sync_status['missing_files']:
            sync_status['status'] = 'failed'
        elif sync_status['outdated_files']:
            sync_status['status'] = 'outdated'
        elif sync_status['valid_files']:
            sync_status['status'] = 'completed'
        else:
            sync_status['status'] = 'pending'
            
        return sync_status
    
    def validate_task_documentation(self, task_id: str, task_details: str) -> Dict[str, any]:
        """특정 task의 문서 동기화 상태를 검증합니다."""
        
        print(f"Task {task_id} 문서 검증 시작...")
        
        # 1. 코드 변경 사항 분석
        changes = self.analyze_code_changes(task_details)
        print(f"변경 사항 분석 완료: {changes}")
        
        # 2. 필요한 문서 업데이트 확인
        required_updates = self.determine_required_updates(changes)
        print(f"필요한 문서 업데이트: {required_updates}")
        
        # 3. 문서 동기화 상태 확인
        sync_status = self.check_documentation_sync(required_updates)
        print(f"동기화 상태: {sync_status['status']}")
        
        # 4. 결과 반환
        result = {
            'task_id': task_id,
            'changes_detected': changes,
            'required_updates': required_updates,
            'sync_status': sync_status,
            'validation_passed': sync_status['status'] == 'completed',
            'timestamp': datetime.now().isoformat()
        }
        
        return result
    
    def generate_validation_report(self, results: List[Dict[str, any]]) -> str:
        """검증 결과를 보고서 형태로 생성합니다."""
        
        report = []
        report.append("# 문서 동기화 검증 보고서")
        report.append(f"생성 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("")
        
        for result in results:
            report.append(f"## Task {result['task_id']}")
            report.append(f"**상태**: {result['sync_status']['status']}")
            report.append(f"**검증 통과**: {'✅' if result['validation_passed'] else '❌'}")
            report.append("")
            
            if result['required_updates']:
                report.append("### 필요한 문서 업데이트:")
                for update in result['required_updates']:
                    report.append(f"- {update}")
                report.append("")
            
            if result['sync_status']['missing_files']:
                report.append("### 누락된 파일:")
                for file in result['sync_status']['missing_files']:
                    report.append(f"- ❌ {file}")
                report.append("")
                
            if result['sync_status']['outdated_files']:
                report.append("### 오래된 파일:")
                for file in result['sync_status']['outdated_files']:
                    report.append(f"- ⚠️ {file}")
                report.append("")
                
            if result['sync_status']['valid_files']:
                report.append("### 유효한 파일:")
                for file in result['sync_status']['valid_files']:
                    report.append(f"- ✅ {file}")
                report.append("")
        
        return "\n".join(report)

def main():
    """메인 실행 함수"""
    
    if len(sys.argv) < 3:
        print("사용법: python3 validate_task_docs.py <task_id> <task_details> [project_root]")
        sys.exit(1)
    
    task_id = sys.argv[1]
    task_details = sys.argv[2]
    project_root = sys.argv[3] if len(sys.argv) > 3 else os.getcwd()
    
    # 검증기 초기화
    validator = DocumentationValidator(project_root)
    
    try:
        # 문서 검증 실행
        result = validator.validate_task_documentation(task_id, task_details)
        
        # 결과 출력
        print(json.dumps(result, indent=2, default=str))
        
        # 검증 통과 여부에 따라 종료 코드 설정
        if result['validation_passed']:
            print("✅ 문서 검증 통과")
            sys.exit(0)
        else:
            print("❌ 문서 검증 실패")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ 검증 중 오류 발생: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
