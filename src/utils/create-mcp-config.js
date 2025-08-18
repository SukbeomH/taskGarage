import fs from 'fs';
import path from 'path';
import { log } from '../../scripts/modules/utils.js';

// Return JSON with existing mcp.json formatting style
function formatJSONWithTabs(obj) {
	let json = JSON.stringify(obj, null, '\t');

	json = json.replace(
		/(\[\n\t+)([^[\]]+?)(\n\t+\])/g,
		(match, openBracket, content, closeBracket) => {
			// Only convert to single line if content doesn't contain nested objects/arrays
			if (!content.includes('{') && !content.includes('[')) {
				const singleLineContent = content
					.replace(/\n\t+/g, ' ')
					.replace(/\s+/g, ' ')
					.trim();
				return `[${singleLineContent}]`;
			}
			return match;
		}
	);

	return json;
}

// Structure matches project conventions (see scripts/init.js)
export function setupMCPConfiguration(projectRoot, mcpConfigPath) {
	// Handle null mcpConfigPath (e.g., for Claude/Codex profiles)
	if (!mcpConfigPath) {
		log(
			'debug',
			'[MCP Config] No mcpConfigPath provided, skipping MCP configuration setup'
		);
		return;
	}

	// Build the full path to the MCP config file
	const mcpPath = path.join(projectRoot, mcpConfigPath);
	const configDir = path.dirname(mcpPath);

	log('info', `Setting up MCP configuration at ${mcpPath}...`);

	// New MCP config to be added - references the installed package
	const newMCPServer = {
		'taskgarage-ai': {
			command: 'npx',
			args: ['-y', '--package=taskgarage-ai', 'taskgarage-ai'],
			env: {
				ANTHROPIC_API_KEY: 'YOUR_ANTHROPIC_API_KEY_HERE',
				PERPLEXITY_API_KEY: 'YOUR_PERPLEXITY_API_KEY_HERE',
				OPENAI_API_KEY: 'YOUR_OPENAI_KEY_HERE',
				GOOGLE_API_KEY: 'YOUR_GOOGLE_KEY_HERE',
				XAI_API_KEY: 'YOUR_XAI_KEY_HERE',
				OPENROUTER_API_KEY: 'YOUR_OPENROUTER_KEY_HERE',
				MISTRAL_API_KEY: 'YOUR_MISTRAL_KEY_HERE',
				AZURE_OPENAI_API_KEY: 'YOUR_AZURE_KEY_HERE',
				OLLAMA_API_KEY: 'YOUR_OLLAMA_API_KEY_HERE'
			}
		}
	};

	// Create config directory if it doesn't exist
	if (!fs.existsSync(configDir)) {
		fs.mkdirSync(configDir, { recursive: true });
	}

	if (fs.existsSync(mcpPath)) {
		log(
			'info',
			'MCP configuration file already exists, checking for existing taskgarage-ai...'
		);
		try {
			// Read existing config
			const mcpConfig = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
			// Initialize mcpServers if it doesn't exist
			if (!mcpConfig.mcpServers) {
				mcpConfig.mcpServers = {};
			}
			// Check if any existing server configuration already has taskgarage-ai in its args
			const hasMCPString = Object.values(mcpConfig.mcpServers).some(
				(server) =>
					server.args &&
					Array.isArray(server.args) &&
					server.args.some(
						(arg) => typeof arg === 'string' && arg.includes('taskgarage-ai')
					)
			);
			if (hasMCPString) {
				log(
					'info',
					'Found existing taskgarage-ai MCP configuration in mcp.json, leaving untouched'
				);
				return; // Exit early, don't modify the existing configuration
			}
			// Add the taskgarage-ai server if it doesn't exist
			if (!mcpConfig.mcpServers['taskgarage-ai']) {
				mcpConfig.mcpServers['taskgarage-ai'] = newMCPServer['taskgarage-ai'];
				log(
					'info',
					'Added taskgarage-ai server to existing MCP configuration'
				);
			} else {
				log('info', 'taskgarage-ai server already configured in mcp.json');
			}
			// Write the updated configuration
			fs.writeFileSync(mcpPath, formatJSONWithTabs(mcpConfig) + '\n');
			log('success', 'Updated MCP configuration file');
		} catch (error) {
			log('error', `Failed to update MCP configuration: ${error.message}`);
			// Create a backup before potentially modifying
			const backupPath = `${mcpPath}.backup-${Date.now()}`;
			if (fs.existsSync(mcpPath)) {
				fs.copyFileSync(mcpPath, backupPath);
				log('info', `Created backup of existing mcp.json at ${backupPath}`);
			}
			// Create new configuration
			const newMCPConfig = {
				mcpServers: newMCPServer
			};
			fs.writeFileSync(mcpPath, formatJSONWithTabs(newMCPConfig) + '\n');
			log(
				'warn',
				'Created new MCP configuration file (backup of original file was created if it existed)'
			);
		}
	} else {
		// If mcp.json doesn't exist, create it
		const newMCPConfig = {
			mcpServers: newMCPServer
		};
		fs.writeFileSync(mcpPath, formatJSONWithTabs(newMCPConfig) + '\n');
		log('success', `Created MCP configuration file at ${mcpPath}`);
	}

	// Add note to console about MCP integration
	log('info', 'MCP server will use the installed taskgarage-ai package');
}

/**
 * Remove Task Master MCP server configuration from an existing mcp.json file
 * Only removes Task Master entries, preserving other MCP servers
 * @param {string} projectRoot - Target project directory
 * @param {string} mcpConfigPath - Relative path to MCP config file (e.g., '.cursor/mcp.json')
 * @returns {Object} Result object with success status and details
 */
export function removeTaskMasterMCPConfiguration(projectRoot, mcpConfigPath) {
	// Handle null mcpConfigPath (e.g., for Claude/Codex profiles)
	if (!mcpConfigPath) {
		return {
			success: true,
			removed: false,
			deleted: false,
			error: null,
			hasOtherServers: false
		};
	}

	const mcpPath = path.join(projectRoot, mcpConfigPath);

	let result = {
		success: false,
		removed: false,
		deleted: false,
		error: null,
		hasOtherServers: false
	};

	if (!fs.existsSync(mcpPath)) {
		result.success = true;
		result.removed = false;
		log('debug', `[MCP Config] MCP config file does not exist: ${mcpPath}`);
		return result;
	}

	try {
		// Read existing config
		const mcpConfig = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));

		if (!mcpConfig.mcpServers) {
			result.success = true;
			result.removed = false;
			log('debug', `[MCP Config] No mcpServers section found in: ${mcpPath}`);
			return result;
		}

		// Check if Task Master is configured
		const hasTaskMaster =
			mcpConfig.mcpServers['taskgarage-ai'] ||
			Object.values(mcpConfig.mcpServers).some(
				(server) =>
					server.args &&
					Array.isArray(server.args) &&
					server.args.some(
						(arg) => typeof arg === 'string' && arg.includes('taskgarage-ai')
					)
			);

		if (!hasTaskMaster) {
			result.success = true;
			result.removed = false;
			log(
				'debug',
				`[MCP Config] Task Master not found in MCP config: ${mcpPath}`
			);
			return result;
		}

		// Remove taskgarage-ai server
		delete mcpConfig.mcpServers['taskgarage-ai'];

		// Also remove any servers that have taskgarage-ai in their args
		Object.keys(mcpConfig.mcpServers).forEach((serverName) => {
			const server = mcpConfig.mcpServers[serverName];
			if (
				server.args &&
				Array.isArray(server.args) &&
				server.args.some(
					(arg) => typeof arg === 'string' && arg.includes('taskgarage-ai')
				)
			) {
				delete mcpConfig.mcpServers[serverName];
				log(
					'debug',
					`[MCP Config] Removed server '${serverName}' containing taskgarage-ai`
				);
			}
		});

		// Check if there are other MCP servers remaining
		const remainingServers = Object.keys(mcpConfig.mcpServers);
		result.hasOtherServers = remainingServers.length > 0;

		if (result.hasOtherServers) {
			// Write back the modified config with remaining servers
			fs.writeFileSync(mcpPath, formatJSONWithTabs(mcpConfig) + '\n');
			result.success = true;
			result.removed = true;
			result.deleted = false;
			log(
				'info',
				`[MCP Config] Removed Task Master from MCP config, preserving other servers: ${remainingServers.join(', ')}`
			);
		} else {
			// No other servers, delete the entire file
			fs.rmSync(mcpPath, { force: true });
			result.success = true;
			result.removed = true;
			result.deleted = true;
			log(
				'info',
				`[MCP Config] Removed MCP config file (no other servers remaining): ${mcpPath}`
			);
		}
	} catch (error) {
		result.error = error.message;
		log(
			'error',
			`[MCP Config] Failed to remove Task Master from MCP config: ${error.message}`
		);
	}

	return result;
}
