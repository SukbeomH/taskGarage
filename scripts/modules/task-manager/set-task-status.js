import path from 'path';
import chalk from 'chalk';
import boxen from 'boxen';

import {
	log,
	readJSON,
	writeJSON,
	findTaskById,
	ensureTagMetadata
} from '../utils.js';
import { displayBanner } from '../ui.js';
import { validateTaskDependencies } from '../dependency-manager.js';
import { getDebugFlag } from '../config-manager.js';
import updateSingleTaskStatus from './update-single-task-status.js';
import generateTaskFiles from './generate-task-files.js';
import {
	isValidTaskStatus,
	TASK_STATUS_OPTIONS
} from '../../../src/constants/task-status.js';

/**
 * Check if documentation is validated for a task
 * @param {string} taskId - The task ID to check
 * @param {Object} data - The tasks data
 * @param {string} projectRoot - The project root directory
 * @returns {Promise<boolean>} - True if documentation is validated
 */
async function checkDocumentationValidation(taskId, data, projectRoot) {
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
		
		// 코드 변경 패턴 확인
		const codeChangePatterns = [
			/type\s+\w+\s+struct|struct\s+\w+\s*{/i,
			/json:|yaml:/i,
			/func\s+\w+\s*\(|function\s+\w+\s*\(/i,
			/ErrCode|Error|error|const\s+\w+\s*=/i,
			/config|Config|ENV|environment|loadConfig|NewConfig/i,
			/endpoint|route|handler|API/i,
			/implement|add|create|modify|update|change|refactor|fix/i
		];
		
		const hasCodeChanges = codeChangePatterns.some(pattern => pattern.test(taskDetails));
		if (!hasCodeChanges) return true; // 코드 변경이 없으면 검증 완료로 간주
		
		// 문서 동기화 완료 메시지 확인
		const docSyncPattern = /📝 문서 업데이트 상태: 완료/;
		return docSyncPattern.test(taskDetails);
	} catch (error) {
		return false; // 검증 중 오류 발생 시 검증 실패로 간주
	}
}

/**
 * Check if self review is completed for a task
 * @param {string} taskId - The task ID to check
 * @param {Object} data - The tasks data
 * @param {string} projectRoot - The project root directory
 * @returns {Promise<boolean>} - True if self review is completed
 */
async function checkSelfReviewValidation(taskId, data, projectRoot) {
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

/**
 * Set the status of a task
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {string} taskIdInput - Task ID(s) to update
 * @param {string} newStatus - New status
 * @param {Object} options - Additional options (mcpLog for MCP mode, projectRoot for tag resolution)
 * @param {string} [options.projectRoot] - Project root path
 * @param {string} [options.tag] - Optional tag to override current tag resolution
 * @param {string} [options.mcpLog] - MCP logger object
 * @returns {Object|undefined} Result object in MCP mode, undefined in CLI mode
 */
async function setTaskStatus(tasksPath, taskIdInput, newStatus, options = {}) {
	const { projectRoot, tag } = options;
	try {
		if (!isValidTaskStatus(newStatus)) {
			throw new Error(
				`Error: Invalid status value: ${newStatus}. Use one of: ${TASK_STATUS_OPTIONS.join(', ')}`
			);
		}
		// Determine if we're in MCP mode by checking for mcpLog
		const isMcpMode = !!options?.mcpLog;

		// Only display UI elements if not in MCP mode
		if (!isMcpMode) {
			console.log(
				boxen(chalk.white.bold(`Updating Task Status to: ${newStatus}`), {
					padding: 1,
					borderColor: 'blue',
					borderStyle: 'round'
				})
			);
		}

		log('info', `Reading tasks from ${tasksPath}...`);

		// Read the raw data without tag resolution to preserve tagged structure
		let rawData = readJSON(tasksPath, projectRoot, tag); // No tag parameter

		// Handle the case where readJSON returns resolved data with _rawTaggedData
		if (rawData && rawData._rawTaggedData) {
			// Use the raw tagged data and discard the resolved view
			rawData = rawData._rawTaggedData;
		}

		// Ensure the tag exists in the raw data
		if (!rawData || !rawData[tag] || !Array.isArray(rawData[tag].tasks)) {
			throw new Error(
				`Invalid tasks file or tag "${tag}" not found at ${tasksPath}`
			);
		}

		// Get the tasks for the current tag
		const data = {
			tasks: rawData[tag].tasks,
			tag,
			_rawTaggedData: rawData
		};

		if (!data || !data.tasks) {
			throw new Error(`No valid tasks found in ${tasksPath}`);
		}

		// Handle multiple task IDs (comma-separated)
		const taskIds = taskIdInput.split(',').map((id) => id.trim());
		const updatedTasks = [];

		// Update each task and capture old status for display
		for (const id of taskIds) {
			// Capture old status before updating
			let oldStatus = 'unknown';

			if (id.includes('.')) {
				// Handle subtask
				const [parentId, subtaskId] = id
					.split('.')
					.map((id) => parseInt(id, 10));
				const parentTask = data.tasks.find((t) => t.id === parentId);
				if (parentTask?.subtasks) {
					const subtask = parentTask.subtasks.find((st) => st.id === subtaskId);
					oldStatus = subtask?.status || 'pending';
				}
			} else {
				// Handle regular task
				const taskId = parseInt(id, 10);
				const task = data.tasks.find((t) => t.id === taskId);
				oldStatus = task?.status || 'pending';
			}

			await updateSingleTaskStatus(tasksPath, id, newStatus, data, !isMcpMode);
			updatedTasks.push({ id, oldStatus, newStatus });
		}

		// Update the raw data structure with the modified tasks
		rawData[tag].tasks = data.tasks;

		// Ensure the tag has proper metadata
		ensureTagMetadata(rawData[tag], {
			description: `Tasks for ${tag} context`
		});

		// Write the updated raw data back to the file
		// The writeJSON function will automatically filter out _rawTaggedData
		writeJSON(tasksPath, rawData, projectRoot, tag);

		// Validate dependencies after status update
		log('info', 'Validating dependencies after status update...');
		validateTaskDependencies(data.tasks);

		// --- 문서 동기화 및 Self Review 완료 확인 (done 상태로 변경 시) ---
		if (newStatus.toLowerCase() === 'done') {
			for (const id of taskIds) {
				const isDocumentationValidated = await checkDocumentationValidation(id, data, projectRoot);
				const isSelfReviewCompleted = await checkSelfReviewValidation(id, data, projectRoot);
				
				if (!isDocumentationValidated) {
					log('warning', `Task ${id}의 문서 동기화가 완료되지 않았습니다. 상태를 'review'로 변경합니다.`);
					
					// 상태를 'review'로 변경
					await updateSingleTaskStatus(tasksPath, id, 'review', data, !isMcpMode);
					
					// updatedTasks 배열에서 해당 항목 업데이트
					const taskIndex = updatedTasks.findIndex(task => task.id === id);
					if (taskIndex !== -1) {
						updatedTasks[taskIndex].newStatus = 'review';
					}
				} else if (!isSelfReviewCompleted) {
					log('warning', `Task ${id}의 Self Review가 완료되지 않았습니다. 상태를 'review'로 변경합니다.`);
					
					// 상태를 'review'로 변경
					await updateSingleTaskStatus(tasksPath, id, 'review', data, !isMcpMode);
					
					// updatedTasks 배열에서 해당 항목 업데이트
					const taskIndex = updatedTasks.findIndex(task => task.id === id);
					if (taskIndex !== -1) {
						updatedTasks[taskIndex].newStatus = 'review';
					}
				}
			}
		}

		// Generate individual task files
		// log('info', 'Regenerating task files...');
		// await generateTaskFiles(tasksPath, path.dirname(tasksPath), {
		// 	mcpLog: options.mcpLog
		// });

		// Display success message - only in CLI mode
		if (!isMcpMode) {
			for (const updateInfo of updatedTasks) {
				const { id, oldStatus, newStatus: updatedStatus } = updateInfo;

				console.log(
					boxen(
						chalk.white.bold(`Successfully updated task ${id} status:`) +
							'\n' +
							`From: ${chalk.yellow(oldStatus)}\n` +
							`To:   ${chalk.green(updatedStatus)}`,
						{ padding: 1, borderColor: 'green', borderStyle: 'round' }
					)
				);
			}
		}

		// Return success value for programmatic use
		return {
			success: true,
			updatedTasks: updatedTasks.map(({ id, oldStatus, newStatus }) => ({
				id,
				oldStatus,
				newStatus
			}))
		};
	} catch (error) {
		log('error', `Error setting task status: ${error.message}`);

		// Only show error UI in CLI mode
		if (!options?.mcpLog) {
			console.error(chalk.red(`Error: ${error.message}`));

			// Pass session to getDebugFlag
			if (getDebugFlag(options?.session)) {
				// Use getter
				console.error(error);
			}

			process.exit(1);
		} else {
			// In MCP mode, throw the error for the caller to handle
			throw error;
		}
	}
}

export default setTaskStatus;
