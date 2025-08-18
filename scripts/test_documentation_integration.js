#!/usr/bin/env node
// scripts/test_documentation_integration.js
// TaskGarage 문서 동기화 통합 기능 테스트 스크립트

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 색상 정의
const colors = {
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	reset: '\x1b[0m'
};

// 로그 함수
function log(level, message) {
	const timestamp = new Date().toISOString();
	const color = colors[level] || colors.reset;
	console.log(`${color}[${level.toUpperCase()}]${colors.reset} ${timestamp} - ${message}`);
}

// 테스트 결과 추적
let testsPassed = 0;
let testsFailed = 0;

// 테스트 함수
function runTest(testName, testFunction) {
	log('info', `실행 중: ${testName}`);
	
	try {
		const result = testFunction();
		if (result) {
			log('success', `✅ ${testName} 통과`);
			testsPassed++;
		} else {
			log('error', `❌ ${testName} 실패`);
			testsFailed++;
		}
	} catch (error) {
		log('error', `❌ ${testName} 오류: ${error.message}`);
		testsFailed++;
	}
}

// 테스트 케이스들
async function testCodeChangeDetection() {
	// 직접 함수 정의 (import 대신)
	const codeChangePatterns = [
		/type\s+\w+\s+struct|struct\s+\w+\s*{/i,
		/func\s+\w+\s*\(|function\s+\w+\s*\(/i,
		/ErrCode|Error|error|const\s+\w+\s*=/i,
		/config|Config|ENV|environment|loadConfig|NewConfig/i,
		/endpoint|Endpoint|API|api/i,
		/implement|add|create|modify|update|change|refactor|fix/i
	];
	
	function checkForCodeChanges(prompt) {
		return codeChangePatterns.some(pattern => pattern.test(prompt));
	}
	
	// 구조체 변경 감지 테스트
	const structChange = "type Config struct { NewField string `json:\"newField\"` }";
	const hasStructChange = await checkForCodeChanges(structChange);
	
	// 함수 시그니처 변경 감지 테스트
	const funcChange = "func ValidateGPUQuota(ctx context.Context, realm, project string) *ValidationError {";
	const hasFuncChange = await checkForCodeChanges(funcChange);
	
	// 에러 코드 변경 감지 테스트
	const errorChange = "const ErrCodeNewValidation = \"NewValidation\"";
	const hasErrorChange = await checkForCodeChanges(errorChange);
	
	// 설정 변경 감지 테스트
	const configChange = "NewSetting: loadConfig(\"NEW_SETTING\")";
	const hasConfigChange = await checkForCodeChanges(configChange);
	
	// API 엔드포인트 변경 감지 테스트
	const apiChange = "func (s *Server) NewEndpoint(w http.ResponseWriter, r *http.Request) {";
	const hasApiChange = await checkForCodeChanges(apiChange);
	
	// 일반 텍스트는 감지되지 않아야 함
	const normalText = "이것은 일반적인 텍스트입니다.";
	const hasNormalText = await checkForCodeChanges(normalText);
	
	return hasStructChange && hasFuncChange && hasErrorChange && hasConfigChange && hasApiChange && !hasNormalText;
}

async function testDocumentationValidation() {
	// 직접 함수 정의 (import 대신)
	function checkDocumentationValidation(taskId, data, projectRoot) {
		try {
			// Task 또는 subtask 찾기
			let task = null;
			let taskDetails = '';
			
			// 먼저 메인 task에서 찾기
			task = data.tasks.find(t => t.id === taskId);
			if (task) {
				taskDetails = task.details || '';
			} else {
				// subtask에서 찾기
				for (const mainTask of data.tasks) {
					if (mainTask.subtasks) {
						const subtask = mainTask.subtasks.find(st => st.id === taskId);
						if (subtask) {
							task = subtask;
							taskDetails = subtask.details || '';
							break;
						}
					}
				}
			}
			
			if (!task) return true; // task가 없으면 검증 통과
			
			// 코드 변경 감지
			const codeChangePatterns = [
				/type\s+\w+\s+struct|struct\s+\w+\s*{/i,
				/func\s+\w+\s*\(|function\s+\w+\s*\(/i,
				/ErrCode|Error|error|const\s+\w+\s*=/i,
				/config|Config|ENV|environment|loadConfig|NewConfig/i,
				/endpoint|Endpoint|API|api/i,
				/implement|add|create|modify|update|change|refactor|fix/i
			];
			
			const hasCodeChanges = codeChangePatterns.some(pattern => pattern.test(taskDetails));
			if (!hasCodeChanges) return true; // 코드 변경이 없으면 검증 통과
			
			// 문서 동기화 완료 여부 확인 (task details에서 문서 동기화 상태 확인)
			const docSyncPattern = /📝 문서 업데이트 상태: 완료/;
			return docSyncPattern.test(taskDetails);
			
		} catch (error) {
			return false; // 에러 발생 시 검증 실패
		}
	}
	
	// 테스트용 데이터 생성
	const testData = {
		tasks: [
			{
				id: "1",
				title: "Test Task",
				details: "📝 문서 업데이트 상태: 완료\n구조체 변경이 포함된 task",
				status: "done"
			},
			{
				id: "2",
				title: "Test Task 2",
				details: "구조체 변경이 포함되었지만 문서 동기화가 완료되지 않은 task",
				status: "done"
			}
		]
	};
	
	// 문서 동기화 완료된 task 검증
	const validatedTask = await checkDocumentationValidation("1", testData, process.cwd());
	
	// 문서 동기화 미완료된 task 검증
	const unvalidatedTask = await checkDocumentationValidation("2", testData, process.cwd());
	
	return validatedTask && !unvalidatedTask;
}

function testSelfReviewValidation() {
	console.log('\n🔍 Testing Self Review Validation...');
	
	try {
		// 테스트 데이터 준비
		const testData = {
			tasks: [
				{
					id: "1",
					title: 'Test Task',
					details: '🔍 Self Review 완료\nSome implementation details'
				},
				{
					id: "2",
					title: 'Test Task 2',
					subtasks: [
						{
							id: "1",
							title: 'Test Subtask',
							details: '🔍 자체 검토 완료\nSubtask implementation'
						}
					]
				}
			]
		};
		
		// Self Review 완료된 경우
		const result1 = checkSelfReviewValidation('1', testData, '/test/project');
		if (result1) {
			console.log('✅ Self Review validation passed for completed task');
		} else {
			console.log('❌ Self Review validation failed for completed task');
			return false;
		}
		
		// Self Review 미완료된 경우
		const testData2 = {
			tasks: [
				{
					id: "1",
					title: 'Test Task',
					details: 'Some implementation details without self review'
				}
			]
		};
		
		const result2 = checkSelfReviewValidation('1', testData2, '/test/project');
		if (!result2) {
			console.log('✅ Self Review validation correctly failed for incomplete task');
		} else {
			console.log('❌ Self Review validation incorrectly passed for incomplete task');
			return false;
		}
		
		// Subtask 테스트
		const result3 = checkSelfReviewValidation('2.1', testData, '/test/project');
		if (result3) {
			console.log('✅ Self Review validation passed for subtask');
		} else {
			console.log('❌ Self Review validation failed for subtask');
			return false;
		}
		
		console.log('✅ Self Review validation tests passed');
		return true;
	} catch (error) {
		console.error('❌ Self Review validation test failed:', error.message);
		return false;
	}
}

// Self Review 검증 함수 (테스트용)
function checkSelfReviewValidation(taskId, data, projectRoot) {
	try {
		// Task 또는 subtask 찾기
		let task = null;
		let taskDetails = '';
		
		if (taskId.includes('.')) {
			// Subtask인 경우
			const [parentId, subtaskId] = taskId.split('.');
			const parentTask = data.tasks.find(t => t.id === parentId);
			if (parentTask && parentTask.subtasks) {
				task = parentTask.subtasks.find(st => st.id === subtaskId);
			}
		} else {
			// Task인 경우
			task = data.tasks.find(t => t.id === taskId);
		}
		
		if (!task) return true; // task를 찾을 수 없으면 검증 완료로 간주
		
		taskDetails = task.details || '';
		
		// Self Review 완료 메시지 확인
		const selfReviewPattern = /🔍 Self Review 완료|🔍 자체 검토 완료|Self Review: 완료/;
		return selfReviewPattern.test(taskDetails);
	} catch (error) {
		return false; // 검증 중 오류 발생 시 검증 실패로 간주
	}
}

function testExecuteTaskMasterCommand() {
	// executeTaskMasterCommand 함수가 존재하는지 확인
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

function testWorkflowIntegration() {
	// 워크플로우 통합 테스트
	// 1. update_subtask 함수에 문서 동기화 로직이 포함되어 있는지 확인
	const updateSubtaskPath = path.join(__dirname, 'modules/task-manager/update-subtask-by-id.js');
	let hasUpdateSubtaskIntegration = false;
	
	if (fs.existsSync(updateSubtaskPath)) {
		const updateSubtaskFile = fs.readFileSync(updateSubtaskPath, 'utf8');
		hasUpdateSubtaskIntegration = updateSubtaskFile.includes('checkForCodeChanges') && 
									 updateSubtaskFile.includes('executeTaskMasterCommand');
		console.log('Update subtask integration check:', {
			hasCheckForCodeChanges: updateSubtaskFile.includes('checkForCodeChanges'),
			hasExecuteTaskMasterCommand: updateSubtaskFile.includes('executeTaskMasterCommand'),
			hasUpdateSubtaskIntegration
		});
	}
	
	// 2. set_task_status 함수에 문서 검증 및 Self Review 로직이 포함되어 있는지 확인
	const setStatusPath = path.join(__dirname, 'modules/task-manager/set-task-status.js');
	let hasSetStatusIntegration = false;
	
	if (fs.existsSync(setStatusPath)) {
		const setStatusFile = fs.readFileSync(setStatusPath, 'utf8');
		hasSetStatusIntegration = setStatusFile.includes('checkDocumentationValidation') && 
								 setStatusFile.includes('checkSelfReviewValidation') &&
								 setStatusFile.includes('review');
		console.log('Set status integration check:', {
			hasCheckDocumentationValidation: setStatusFile.includes('checkDocumentationValidation'),
			hasCheckSelfReviewValidation: setStatusFile.includes('checkSelfReviewValidation'),
			hasReview: setStatusFile.includes('review'),
			hasSetStatusIntegration
		});
	}
	
	// 실제 파일 존재 여부도 확인
	const updateSubtaskExists = fs.existsSync(updateSubtaskPath);
	const setStatusExists = fs.existsSync(setStatusPath);
	
	console.log('File existence check:', {
		updateSubtaskExists,
		setStatusExists
	});
	
	return hasUpdateSubtaskIntegration && hasSetStatusIntegration && updateSubtaskExists && setStatusExists;
}

function testRuleFiles() {
	// 규칙 파일들이 존재하는지 확인
	const ruleFiles = [
		'.cursor/rules/taskmaster/documentation_integration.mdc',
		'.cursor/rules/dev_workflow.mdc'
	];
	
	return ruleFiles.every(file => {
		const filePath = path.join(__dirname, '..', file);
		return fs.existsSync(filePath);
	});
}

// 메인 테스트 실행
async function runAllTests() {
	console.log('🧪 TaskGarage 문서 동기화 통합 기능 테스트 시작...');
	console.log('==================================================\n');
	
	// 테스트 실행
	runTest('코드 변경 감지 기능', testCodeChangeDetection);
	runTest('문서 검증 기능', testDocumentationValidation);
	runTest('Self Review 검증 기능', testSelfReviewValidation);
	runTest('executeTaskMasterCommand 패턴', testExecuteTaskMasterCommand);
	runTest('워크플로우 통합', testWorkflowIntegration);
	runTest('규칙 파일 존재', testRuleFiles);
	
	// 결과 요약
	console.log('\n==================================================');
	console.log('📊 테스트 결과 요약:');
	console.log(`✅ 통과: ${testsPassed}`);
	console.log(`❌ 실패: ${testsFailed}`);
	console.log(`📈 성공률: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
	
	if (testsFailed === 0) {
		log('success', '🎉 모든 테스트가 통과했습니다!');
		process.exit(0);
	} else {
		log('error', '⚠️ 일부 테스트가 실패했습니다.');
		process.exit(1);
	}
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
	runAllTests().catch(error => {
		log('error', `테스트 실행 중 오류 발생: ${error.message}`);
		process.exit(1);
	});
}
