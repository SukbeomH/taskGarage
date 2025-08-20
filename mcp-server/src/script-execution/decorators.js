/**
 * decorators.js
 * MCP 패턴 기반 데코레이터 시스템
 * @mcp.resource()와 @mcp.tool() 데코레이터를 JavaScript로 구현
 */

import { z } from 'zod';

/**
 * MCP 리소스 메타데이터 스키마
 */
const ResourceMetadataSchema = z.object({
  name: z.string(),
  description: z.string(),
  input: z.object({}).optional(),
  output: z.object({}).optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional()
});

/**
 * MCP 도구 메타데이터 스키마
 */
const ToolMetadataSchema = z.object({
  name: z.string(),
  description: z.string(),
  input: z.object({}),
  output: z.object({}),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  timeout: z.number().optional(),
  retry: z.object({
    maxAttempts: z.number().optional(),
    backoff: z.string().optional()
  }).optional()
});

/**
 * 메타데이터 저장소
 */
class MetadataRegistry {
  constructor() {
    this.resources = new Map();
    this.tools = new Map();
  }

  /**
   * 리소스 등록
   */
  registerResource(name, metadata, handler) {
    const validatedMetadata = ResourceMetadataSchema.parse(metadata);
    this.resources.set(name, {
      metadata: validatedMetadata,
      handler: handler
    });
  }

  /**
   * 도구 등록
   */
  registerTool(name, metadata, handler) {
    const validatedMetadata = ToolMetadataSchema.parse(metadata);
    this.tools.set(name, {
      metadata: validatedMetadata,
      handler: handler
    });
  }

  /**
   * 리소스 조회
   */
  getResource(name) {
    return this.resources.get(name);
  }

  /**
   * 도구 조회
   */
  getTool(name) {
    return this.tools.get(name);
  }

  /**
   * 모든 리소스 조회
   */
  getAllResources() {
    return Array.from(this.resources.entries()).map(([name, resource]) => ({
      name,
      ...resource.metadata
    }));
  }

  /**
   * 모든 도구 조회
   */
  getAllTools() {
    return Array.from(this.tools.entries()).map(([name, tool]) => ({
      name,
      ...tool.metadata
    }));
  }

  /**
   * 카테고리별 리소스 조회
   */
  getResourcesByCategory(category) {
    return this.getAllResources().filter(resource => resource.category === category);
  }

  /**
   * 카테고리별 도구 조회
   */
  getToolsByCategory(category) {
    return this.getAllTools().filter(tool => tool.category === category);
  }
}

// 전역 메타데이터 레지스트리 인스턴스
export const metadataRegistry = new MetadataRegistry();

/**
 * @mcp.resource() 데코레이터
 * 읽기 전용 리소스를 등록합니다
 */
export function mcpResource(metadata) {
  return function(target, propertyKey, descriptor) {
    const handler = descriptor.value;
    const name = metadata.name || propertyKey;
    
    // 메타데이터 검증 및 등록
    metadataRegistry.registerResource(name, metadata, handler);
    
    // 원본 함수를 래핑하여 에러 처리 및 로깅 추가
    descriptor.value = async function(...args) {
      try {
        const startTime = Date.now();
        const result = await handler.apply(this, args);
        const duration = Date.now() - startTime;
        
        // 로깅 (개발 모드에서만)
        if (process.env.NODE_ENV === 'development') {
          console.log(`[MCP Resource] ${name} executed in ${duration}ms`);
        }
        
        return result;
      } catch (error) {
        console.error(`[MCP Resource] ${name} failed:`, error);
        throw error;
      }
    };
    
    return descriptor;
  };
}

/**
 * @mcp.tool() 데코레이터
 * 액션 실행 도구를 등록합니다
 */
export function mcpTool(metadata) {
  return function(target, propertyKey, descriptor) {
    const handler = descriptor.value;
    const name = metadata.name || propertyKey;
    
    // 메타데이터 검증 및 등록
    metadataRegistry.registerTool(name, metadata, handler);
    
    // 원본 함수를 래핑하여 타임아웃, 재시도, 에러 처리 추가
    descriptor.value = async function(...args) {
      const timeout = metadata.timeout || 30000; // 기본 30초
      const maxAttempts = metadata.retry?.maxAttempts || 1;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const startTime = Date.now();
          
          // 타임아웃 처리
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Tool ${name} timed out after ${timeout}ms`)), timeout);
          });
          
          const resultPromise = handler.apply(this, args);
          const result = await Promise.race([resultPromise, timeoutPromise]);
          
          const duration = Date.now() - startTime;
          
          // 로깅 (개발 모드에서만)
          if (process.env.NODE_ENV === 'development') {
            console.log(`[MCP Tool] ${name} executed in ${duration}ms (attempt ${attempt})`);
          }
          
          return result;
        } catch (error) {
          console.error(`[MCP Tool] ${name} failed (attempt ${attempt}):`, error);
          
          // 마지막 시도가 아니면 재시도
          if (attempt < maxAttempts) {
            const backoff = metadata.retry?.backoff || 'exponential';
            const delay = backoff === 'exponential' ? Math.pow(2, attempt - 1) * 1000 : 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          throw error;
        }
      }
    };
    
    return descriptor;
  };
}

/**
 * 데코레이터를 사용하지 않는 함수형 등록 방식
 */
export function registerResource(name, metadata, handler) {
  metadataRegistry.registerResource(name, metadata, handler);
}

export function registerTool(name, metadata, handler) {
  metadataRegistry.registerTool(name, metadata, handler);
}

/**
 * 메타데이터 레지스트리 조회 함수들
 */
export function getResource(name) {
  return metadataRegistry.getResource(name);
}

export function getTool(name) {
  return metadataRegistry.getTool(name);
}

export function getAllResources() {
  return metadataRegistry.getAllResources();
}

export function getAllTools() {
  return metadataRegistry.getAllTools();
}

export function getResourcesByCategory(category) {
  return metadataRegistry.getResourcesByCategory(category);
}

export function getToolsByCategory(category) {
  return metadataRegistry.getToolsByCategory(category);
}

/**
 * MCP 서버에 등록된 리소스와 도구를 서버에 바인딩
 */
export function bindToServer(server) {
  // 리소스 등록
  getAllResources().forEach(resource => {
    server.addResource({
      name: resource.name,
      description: resource.description,
      input: resource.input || {},
      output: resource.output || {},
      execute: async (args, context) => {
        const resourceData = getResource(resource.name);
        if (!resourceData) {
          throw new Error(`Resource ${resource.name} not found`);
        }
        return await resourceData.handler(args, context);
      }
    });
  });

  // 도구 등록
  getAllTools().forEach(tool => {
    server.addTool({
      name: tool.name,
      description: tool.description,
      input: tool.input,
      output: tool.output,
      execute: async (args, context) => {
        const toolData = getTool(tool.name);
        if (!toolData) {
          throw new Error(`Tool ${tool.name} not found`);
        }
        return await toolData.handler(args, context);
      }
    });
  });
}
