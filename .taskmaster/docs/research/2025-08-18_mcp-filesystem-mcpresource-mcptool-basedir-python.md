---
title: Research Session
query: "MCP Filesystem 서버의 구체적인 코드 구현 패턴. @mcp.resource()와 @mcp.tool() 데코레이터 사용법, 파일 시스템 접근 제어(BASE_DIR), 에러 처리 방식, 비동기 처리 구현, 파일 읽기/쓰기/검색 기능의 실제 코드 예시를 찾아보세요. 특히 Python 기반 MCP 서버 구현에서 TypeScript/JavaScript로 변환할 때 고려해야 할 패턴들을 조사해주세요."
date: 8/19/2025
time: 8:44:04 AM
timestamp: 2025-08-18T23:44:04.562Z
exchanges: 1
---

# Research Session

## Initial Query

**Question:** MCP Filesystem 서버의 구체적인 코드 구현 패턴. @mcp.resource()와 @mcp.tool() 데코레이터 사용법, 파일 시스템 접근 제어(BASE_DIR), 에러 처리 방식, 비동기 처리 구현, 파일 읽기/쓰기/검색 기능의 실제 코드 예시를 찾아보세요. 특히 Python 기반 MCP 서버 구현에서 TypeScript/JavaScript로 변환할 때 고려해야 할 패턴들을 조사해주세요.

**Response:**

MCP Filesystem 서버의 Python 기반 코드 구현 패턴, 데코레이터 사용법, 파일 시스템 접근 제어, 에러 처리, 비동기 처리, 파일 입출력 기능, 그리고 TypeScript/JavaScript로의 변환 시 고려사항을 아래와 같이 상세히 정리합니다.  
특히 Task 106(스크립트 실행 결과 저장 및 분석 기능)과의 연계, 표준화된 MCP 패턴 적용, 확장성 및 보안성까지 모두 고려합니다.

---

## 1. MCP 서버 구조와 핵심 패턴

### FastMCP 기반 MCP 서버 구조

- **FastMCP**는 Python에서 MCP 서버를 빠르고 직관적으로 구축할 수 있게 해주는 프레임워크입니다[5].
- 서버 인스턴스 생성:  
  ```python
  from fastmcp import FastMCP
  mcp = FastMCP(name="FileServer")
  ```
- **Tools**: LLM이 호출할 수 있는 액션(POST/PUT 등, 함수 기반)[5].
- **Resources**: 읽기 전용 데이터 소스(GET 등, 함수 기반)[5].
- **Templates**: URI에 파라미터를 넣어 동적 리소스 제공[5].

---

## 2. @mcp.resource()와 @mcp.tool() 데코레이터 사용법

### @mcp.resource()

- **읽기 전용 데이터 제공** (GET 요청에 해당)
- URI 패턴에 파라미터 사용 가능  
  ```python
  BASE_DIR = "/my/project"

  @mcp.resource("file://{path}")
  def read_file(path: str) -> str:
      """주어진 경로의 파일 내용을 반환 (읽기 전용)"""
      full_path = os.path.join(BASE_DIR, path)
      if not full_path.startswith(BASE_DIR) or not os.path.exists(full_path):
          raise FileNotFoundError("파일을 찾을 수 없거나 접근 불가")
      with open(full_path, 'r', encoding='utf-8') as f:
          return f.read()
  ```
- **보안**: BASE_DIR 경로 이탈 방지, 존재하지 않는 파일 접근 차단[2].

### @mcp.tool()

- **액션/명령 실행** (POST/PUT 등)
- 동기/비동기 함수 모두 지원  
  ```python
  @mcp.tool()
  def search(keyword: str) -> list[str]:
      """베이스 디렉토리 내에서 키워드가 포함된 파일 목록 반환"""
      result_files = []
      for root, dirs, files in os.walk(BASE_DIR):
          for fname in files:
              fpath = os.path.join(root, fname)
              # .gitignore 등 무시해야 할 파일 처리 (생략)
              with open(fpath, 'r', errors='ignore') as f:
                  text = f.read()
              if keyword in text:
                  result_files.append(fpath)
      return result_files
  ```
- **도구 함수**는 파일 검색, 실행 결과 저장, 분석 등 다양한 작업에 활용 가능[2][5].

---

## 3. 파일 시스템 접근 제어 (BASE_DIR)

- **BASE_DIR**: MCP 서버가 접근 가능한 루트 디렉토리로, 경로 이탈(Directory Traversal) 공격을 방지[2].
- 모든 파일 접근 시 `os.path.join(BASE_DIR, path)`로 절대 경로 생성 후,  
  `full_path.startswith(BASE_DIR)`로 경로 이탈 여부 검증[2].
- 예시:
  ```python
  full_path = os.path.join(BASE_DIR, path)
  if not full_path.startswith(BASE_DIR):
      raise PermissionError("허용되지 않은 경로 접근")
  ```

---

## 4. 에러 처리 방식

- **존재하지 않는 파일**: `FileNotFoundError` 발생[2].
- **권한 없는 경로**: `PermissionError` 발생.
- **일반 예외**: try-except로 감싸서 JSON 형태로 에러 메시지 반환(권장).
- 예시:
  ```python
  try:
      # 파일 접근 코드
  except FileNotFoundError:
      return {"error": "파일을 찾을 수 없음"}
  except PermissionError:
      return {"error": "접근 권한 없음"}
  except Exception as e:
      return {"error": str(e)}
  ```

---

## 5. 비동기 처리 구현

- **FastMCP**는 동기/비동기 함수 모두 지원[5].
- 비동기 함수 예시:
  ```python
  @mcp.tool()
  async def async_search(keyword: str) -> list[str]:
      # 비동기 파일 검색 로직
      ...
  ```
- **OpenAI Agents SDK**와 연동 시, MCP 서버를 비동기 컨텍스트로 실행[3]:
  ```python
  async with MCPServerStdio(params={...}) as server:
      tools = await server.list_tools()
      ...
  ```
- **도구 목록 캐싱**: `cache_tools_list=True`로 성능 최적화, 변경 시 `invalidate_tools_cache()` 호출[3].

---

## 6. 파일 읽기/쓰기/검색 기능 실제 코드 예시

### 파일 읽기 (Resource)

```python
@mcp.resource("file://{path}")
def read_file(path: str) -> str:
    full_path = os.path.join(BASE_DIR, path)
    if not full_path.startswith(BASE_DIR) or not os.path.exists(full_path):
        raise FileNotFoundError("파일을 찾을 수 없거나 접근 불가")
    with open(full_path, 'r', encoding='utf-8') as f:
        return f.read()
```

### 파일 쓰기 (Tool)

```python
@mcp.tool()
def write_file(path: str, content: str) -> str:
    full_path = os.path.join(BASE_DIR, path)
    if not full_path.startswith(BASE_DIR):
        raise PermissionError("허용되지 않은 경로 접근")
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
    return "저장 완료"
```

### 파일 검색 (Tool)

```python
@mcp.tool()
def search_files(keyword: str) -> list[str]:
    result_files = []
    for root, dirs, files in os.walk(BASE_DIR):
        for fname in files:
            fpath = os.path.join(root, fname)
            # .gitignore 등 무시 파일 처리 필요
            with open(fpath, 'r', errors='ignore') as f:
                text = f.read()
            if keyword in text:
                result_files.append(fpath)
    return result_files
```
- **.gitignore 등 무시 파일 처리**는 별도 로직 필요[2].

---

## 7. TypeScript/JavaScript로 변환 시 고려사항

### 주요 변환 포인트

| Python 패턴                  | TypeScript/JavaScript 변환 시 고려사항 |
|------------------------------|----------------------------------------|
| 데코레이터(@mcp.resource 등) | TypeScript 5.x 이상에서 실험적 지원, Babel/ts-node 설정 필요. 일반적으로 함수 등록 방식으로 대체 |
| 동기/비동기 함수              | JS는 기본적으로 비동기(Promise/async/await) 패턴 사용 권장 |
| 파일 시스템 접근              | Node.js의 `fs/promises` 모듈 활용, 경로 조작은 `path` 모듈 사용 |
| BASE_DIR 경로 이탈 방지       | `path.resolve(BASE_DIR, path)`로 절대 경로 생성 후, `startsWith(BASE_DIR)`로 검증 |
| 에러 처리                    | try-catch, 커스텀 에러 객체(JSON 반환) 패턴 적용 |
| 함수 타입 힌트                | TypeScript의 타입 시스템 적극 활용 (예: `(path: string) => Promise<string>`) |
| 데코레이터 기반 등록         | 일반적으로 `registerResource('file://{path}', handler)` 등 함수 기반 등록 방식 사용 |

### 예시: TypeScript로 변환

```typescript
import { promises as fs } from 'fs';
import path from 'path';

const BASE_DIR = '/my/project';

async function readFileHandler(params: { path: string }): Promise<string> {
  const fullPath = path.resolve(BASE_DIR, params.path);
  if (!fullPath.startsWith(BASE_DIR)) {
    throw new Error('허용되지 않은 경로 접근');
  }
  try {
    return await fs.readFile(fullPath, 'utf-8');
  } catch (e) {
    throw new Error('파일을 찾을 수 없거나 접근 불가');
  }
}

// 리소스 등록 예시
registerResource('file://{path}', readFileHandler);
```

- **데코레이터 미지원 환경**: 함수 등록 방식으로 대체.
- **비동기 처리**: 모든 파일 입출력은 async/await 패턴으로 구현.
- **에러 처리**: 커스텀 에러 메시지(JSON) 반환.

---

## 8. MCP Filesystem 서버 패턴의 Task 106 적용 방안

- **스크립트 실행 결과 저장**:  
  - 실행 결과(메타데이터, stdout, stderr, exit code 등)를 `.taskmaster/script-results/` 하위에 파일로 저장.
  - 파일명 규칙: `script-{timestamp}-{uuid}.json`, 결과 파일과 메타데이터 분리.
- **분석 엔진**:  
  - MCP Tool로 분석 함수 등록(예: `@mcp.tool() def analyze_result(path: str) -> dict`)
  - 분석 결과도 파일로 저장, 필요시 리소스로 노출.
- **보고서 생성**:  
  - 마크다운/HTML/JSON 변환 함수도 MCP Tool로 등록.
- **확장성**:  
  - MCP Tool/Resource로 기능 추가 시, TypeScript/JavaScript에서도 동일한 패턴 적용 가능.
- **실시간 모니터링**:  
  - 실행 상태를 MCP Resource로 노출(예: `@mcp.resource("status://{task_id}")`).

---

## 9. 추가 고려사항 및 확장 패턴

- **.gitignore 등 무시 파일 처리**:  
  - ignore 패턴 파싱 라이브러리 활용(예: Python의 `pathspec`, Node.js의 `ignore`).
- **보안**:  
  - 경로 이탈, 심볼릭 링크, 파일 권한 등 추가 검증 필요.
- **테스트**:  
  - MCP Tool/Resource 함수별 단위 테스트, 경계값/에러 상황 테스트 필수.
- **도구 캐싱**:  
  - 도구 목록이 자주 변하지 않는다면 캐싱 적용, 변경 시 캐시 무효화[3].

---

이상의 패턴과 예시는 MCP Filesystem 서버를 Python에서 구현할 때의 표준적 접근법을 보여주며, TypeScript/JavaScript로의 이식 시에도 구조적 일관성을 유지할 수 있습니다.  
Task 106의 요구사항(스크립트 실행 결과 저장, 분석, 보고서 생성, 실시간 모니터링 등)에 모두 적용 가능하며, 확장성과 보안성까지 확보할 수 있습니다.


---

*Generated by Task Master Research Command*  
*Timestamp: 2025-08-18T23:44:04.562Z*
