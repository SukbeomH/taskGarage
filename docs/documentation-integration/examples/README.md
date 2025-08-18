# 📖 문서 동기화 사용 예제

## 🎯 개요

이 섹션은 Taskmaster 문서 동기화 통합 기능의 실제 사용 예제와 시나리오를 다룹니다.

## 📁 관련 파일들

### 예제 시나리오 파일
- [구조체 변경 예제](#시나리오-1-구조체-필드-추가)
- [API 엔드포인트 추가 예제](#시나리오-2-api-엔드포인트-추가)
- [설정 변경 예제](#시나리오-3-설정-구조체-수정)
- [에러 코드 추가 예제](#시나리오-4-에러-코드-추가)

## 🚀 실제 사용 시나리오

### 시나리오 1: 구조체 필드 추가

#### 📝 상황 설명
사용자 인증 시스템에 새로운 필드를 추가하여 사용자 프로필 정보를 확장하는 경우

#### 🔧 코드 변경
```go
// 기존 구조체
type User struct {
    ID       string `json:"id"`
    Email    string `json:"email"`
    Password string `json:"password"`
}

// 변경된 구조체
type User struct {
    ID       string `json:"id"`
    Email    string `json:"email"`
    Password string `json:"password"`
    Name     string `json:"name"`     // 새로 추가된 필드
    Phone    string `json:"phone"`    // 새로 추가된 필드
    Address  string `json:"address"`  // 새로 추가된 필드
}
```

#### 📝 Taskmaster 사용
```javascript
// update_subtask로 코드 변경 기록
await update_subtask({
    id: '1.2',
    prompt: '사용자 구조체에 새로운 필드 추가: Name, Phone, Address 필드를 User struct에 추가하여 사용자 프로필 정보를 확장'
});

// 시스템이 자동으로 다음을 수행:
// 1. 구조체 변경 감지 (type User struct 패턴)
// 2. 문서 동기화 실행
// 3. 상태 업데이트
```

#### ✅ 결과 확인
```javascript
// task 상태 확인
const task = await get_task('1.2');
console.log(task.details);

// 출력 예시:
// 사용자 구조체에 새로운 필드 추가: Name, Phone, Address 필드를 User struct에 추가하여 사용자 프로필 정보를 확장
//
// --- 2024-12-01T10:30:00.000Z ---
// 📝 문서 업데이트 상태: 완료
```

### 시나리오 2: API 엔드포인트 추가

#### 📝 상황 설명
새로운 사용자 관리 API 엔드포인트를 추가하는 경우

#### 🔧 코드 변경
```javascript
// 기존 라우터
app.get('/api/users', getAllUsers);
app.post('/api/users', createUser);

// 변경된 라우터
app.get('/api/users', getAllUsers);
app.post('/api/users', createUser);
app.get('/api/users/:id', getUserById);        // 새로 추가된 엔드포인트
app.put('/api/users/:id', updateUser);         // 새로 추가된 엔드포인트
app.delete('/api/users/:id', deleteUser);      // 새로 추가된 엔드포인트
```

#### 📝 Taskmaster 사용
```javascript
// update_subtask로 코드 변경 기록
await update_subtask({
    id: '2.1',
    prompt: '새로운 사용자 관리 API 엔드포인트 추가: GET /api/users/:id, PUT /api/users/:id, DELETE /api/users/:id 엔드포인트 구현'
});

// 시스템이 자동으로 다음을 수행:
// 1. API 변경 감지 (endpoint, route, API 패턴)
// 2. 문서 동기화 실행
// 3. 상태 업데이트
```

#### ✅ 결과 확인
```javascript
// task 상태 확인
const task = await get_task('2.1');
console.log(task.details);

// 출력 예시:
// 새로운 사용자 관리 API 엔드포인트 추가: GET /api/users/:id, PUT /api/users/:id, DELETE /api/users/:id 엔드포인트 구현
//
// --- 2024-12-01T11:15:00.000Z ---
// 📝 문서 업데이트 상태: 완료
```

### 시나리오 3: 설정 구조체 수정

#### 📝 상황 설명
데이터베이스 설정에 새로운 옵션을 추가하는 경우

#### 🔧 코드 변경
```yaml
# 기존 설정 파일
database:
  host: localhost
  port: 5432
  name: myapp

# 변경된 설정 파일
database:
  host: localhost
  port: 5432
  name: myapp
  ssl: true              # 새로 추가된 옵션
  max_connections: 100   # 새로 추가된 옵션
  timeout: 30s           # 새로 추가된 옵션
```

#### 📝 Taskmaster 사용
```javascript
// update_subtask로 코드 변경 기록
await update_subtask({
    id: '3.1',
    prompt: '데이터베이스 설정에 새로운 옵션 추가: SSL 설정, 최대 연결 수, 타임아웃 옵션을 config 파일에 추가'
});

// 시스템이 자동으로 다음을 수행:
// 1. 설정 변경 감지 (config, Config, yaml 패턴)
// 2. 문서 동기화 실행
// 3. 상태 업데이트
```

#### ✅ 결과 확인
```javascript
// task 상태 확인
const task = await get_task('3.1');
console.log(task.details);

// 출력 예시:
// 데이터베이스 설정에 새로운 옵션 추가: SSL 설정, 최대 연결 수, 타임아웃 옵션을 config 파일에 추가
//
// --- 2024-12-01T12:00:00.000Z ---
// 📝 문서 업데이트 상태: 완료
```

### 시나리오 4: 에러 코드 추가

#### 📝 상황 설명
새로운 에러 코드를 정의하여 더 세밀한 에러 처리를 구현하는 경우

#### 🔧 코드 변경
```go
// 기존 에러 코드
const (
    ErrInvalidInput = "invalid_input"
    ErrNotFound     = "not_found"
)

// 변경된 에러 코드
const (
    ErrInvalidInput    = "invalid_input"
    ErrNotFound        = "not_found"
    ErrUnauthorized    = "unauthorized"    // 새로 추가된 에러 코드
    ErrForbidden       = "forbidden"       // 새로 추가된 에러 코드
    ErrRateLimited     = "rate_limited"    // 새로 추가된 에러 코드
    ErrServerError     = "server_error"    // 새로 추가된 에러 코드
)
```

#### 📝 Taskmaster 사용
```javascript
// update_subtask로 코드 변경 기록
await update_subtask({
    id: '4.1',
    prompt: '새로운 에러 코드 추가: Unauthorized, Forbidden, RateLimited, ServerError 에러 코드를 정의하여 세밀한 에러 처리 구현'
});

// 시스템이 자동으로 다음을 수행:
// 1. 에러 코드 변경 감지 (ErrCode, Error, const 패턴)
// 2. 문서 동기화 실행
// 3. 상태 업데이트
```

#### ✅ 결과 확인
```javascript
// task 상태 확인
const task = await get_task('4.1');
console.log(task.details);

// 출력 예시:
// 새로운 에러 코드 추가: Unauthorized, Forbidden, RateLimited, ServerError 에러 코드를 정의하여 세밀한 에러 처리 구현
//
// --- 2024-12-01T13:45:00.000Z ---
// 📝 문서 업데이트 상태: 완료
```

## 🔄 문서 동기화 실패 시나리오

### 시나리오 5: 문서 동기화 실패 처리

#### 📝 상황 설명
문서 동기화가 실패한 경우의 처리 과정

#### 🔧 실패 시나리오
```javascript
// update_subtask 실행
await update_subtask({
    id: '5.1',
    prompt: '새로운 기능 추가: 사용자 대시보드 구현'
});

// 문서 동기화 실패 시 결과
const task = await get_task('5.1');
console.log(task.details);

// 출력 예시:
// 새로운 기능 추가: 사용자 대시보드 구현
//
// --- 2024-12-01T14:30:00.000Z ---
// 📝 문서 업데이트 상태: 실패 - 검토 필요
```

#### ✅ 상태 확인
```javascript
// task 상태 확인
console.log(task.status); // 'review'

// 문서 동기화 실패로 인해 자동으로 'review' 상태로 변경됨
```

#### 🔧 문제 해결
```javascript
// 1. 문서 동기화 문제 확인
// 2. 수동으로 문서 업데이트
// 3. 다시 update_subtask 실행
await update_subtask({
    id: '5.1',
    prompt: '문서 동기화 문제 해결 후 다시 시도: 사용자 대시보드 구현 완료'
});

// 4. 상태를 done으로 변경 시도
await set_task_status({
    id: '5.1',
    status: 'done'
});

// 문서 동기화가 완료되면 정상적으로 'done' 상태로 변경됨
```

## 📊 문서 동기화 결과 예시

### 성공적인 문서 동기화
```javascript
// 성공적인 문서 동기화 결과
const successTask = {
    id: '1.2',
    status: 'done',
    details: `사용자 구조체에 새로운 필드 추가: Name, Phone, Address 필드를 User struct에 추가하여 사용자 프로필 정보를 확장

--- 2024-12-01T10:30:00.000Z ---
📝 문서 업데이트 상태: 완료

구현 완료:
- User 구조체에 Name, Phone, Address 필드 추가
- JSON 태그 설정 완료
- 데이터베이스 스키마 업데이트 완료
- API 문서 자동 업데이트 완료`
};
```

### 실패한 문서 동기화
```javascript
// 실패한 문서 동기화 결과
const failedTask = {
    id: '2.1',
    status: 'review',
    details: `새로운 API 엔드포인트 추가: 사용자 관리 API 구현

--- 2024-12-01T11:15:00.000Z ---
📝 문서 업데이트 상태: 실패 - 검토 필요

구현 완료:
- GET /api/users/:id 엔드포인트 구현
- PUT /api/users/:id 엔드포인트 구현
- DELETE /api/users/:id 엔드포인트 구현

문서 동기화 실패:
- API 문서 생성 중 오류 발생
- 네트워크 연결 문제로 인한 실패`
};
```

## 🔧 문제 해결 가이드

### FAQ

#### Q1: 문서 동기화가 계속 실패하는 경우
**A**: 다음 단계를 확인하세요:
1. `executeTaskMasterCommand` 함수가 올바르게 정의되어 있는지 확인
2. `generate` 명령어가 정상적으로 작동하는지 확인
3. 네트워크 연결 상태 확인
4. 파일 권한 문제 확인

#### Q2: 코드 변경이 감지되지 않는 경우
**A**: 다음을 확인하세요:
1. prompt에 코드 변경 관련 키워드가 포함되어 있는지 확인
2. 정규식 패턴이 올바르게 작동하는지 확인
3. 테스트 스크립트로 패턴 검증

#### Q3: task 상태가 'review'로 변경되는 경우
**A**: 다음을 확인하세요:
1. 문서 동기화가 성공적으로 완료되었는지 확인
2. task details에 "📝 문서 업데이트 상태: 완료" 메시지가 있는지 확인
3. 수동으로 문서 동기화를 다시 실행

#### Q4: 문서 동기화 성능이 느린 경우
**A**: 다음을 확인하세요:
1. 대용량 파일 처리 시 메모리 사용량 확인
2. 네트워크 대역폭 확인
3. 시스템 리소스 사용량 확인

## 📈 성능 최적화 팁

### 1. 효율적인 코드 변경 감지
```javascript
// ✅ DO: 구체적인 키워드 사용
await update_subtask({
    id: '1.1',
    prompt: '새로운 구조체 type Config struct 추가' // 명확한 키워드
});

// ❌ DON'T: 모호한 표현 사용
await update_subtask({
    id: '1.1',
    prompt: '설정 관련 코드 수정' // 모호한 표현
});
```

### 2. 배치 처리 활용
```javascript
// ✅ DO: 관련 변경사항을 하나의 update_subtask로 처리
await update_subtask({
    id: '1.2',
    prompt: '사용자 인증 시스템 구현: User struct, AuthHandler, Error codes 모두 추가'
});

// ❌ DON'T: 각각 따로 처리
await update_subtask({ id: '1.2', prompt: 'User struct 추가' });
await update_subtask({ id: '1.3', prompt: 'AuthHandler 추가' });
await update_subtask({ id: '1.4', prompt: 'Error codes 추가' });
```

### 3. 문서 동기화 상태 모니터링
```javascript
// ✅ DO: 정기적인 상태 확인
const tasks = await get_tasks({ status: 'review' });
for (const task of tasks) {
    if (task.details.includes('📝 문서 업데이트 상태: 실패')) {
        console.log(`Task ${task.id}의 문서 동기화가 실패했습니다.`);
    }
}
```

## 🔗 관련 문서

### 구현 관련
- [구현 문서](../implementation/README.md) - 예제에서 사용하는 구현 상세
- [테스트 문서](../testing/README.md) - 예제 시나리오 테스트

### 규칙 관련
- [규칙 문서](../rules/README.md) - 예제가 따르는 규칙들
- [메인 문서](../README.md) - 전체 개요

---

**📝 마지막 업데이트**: 2024년 12월  
**🔄 버전**: 1.0.0  
**👥 기여자**: Taskmaster 개발팀
