# zmeta-web 화면 기능 및 API 정리

---

## 화면 목록

### 1. Login — 로그인

| 기능 | 설명 |
|------|------|
| 이메일/비밀번호 로그인 | 폼 제출 시 로그인 API 호출 후 사용자 세션 설정 |
| 에러 메시지 표시 | 로그인 실패 시 인라인 에러 |

**호출 API**

| 함수 | 메서드 | 엔드포인트 |
|------|--------|-----------|
| `login(email, password)` | POST | `/api/auth/login` |

---

### 2. Models — 메타 문서 관리 (DocumentList)

| 기능 | 설명 |
|------|------|
| 문서 목록 조회 | 페이징 (10개씩) |
| XML 업로드 | 다중 파일 선택 후 업로드 |
| 검색 | 파일명·프로젝트명·설명 클라이언트 사이드 필터 |
| 설명 인라인 편집 | 셀 클릭 → input 편집 → blur/Enter 저장 |
| 단건 삭제 | 행 우측 삭제 버튼 |
| 선택 삭제 | 체크박스 복수 선택 후 일괄 삭제 |
| 페이징 | 이전/다음 버튼 |

**호출 API**

| 함수 | 메서드 | 엔드포인트 |
|------|--------|-----------|
| `fetchDocuments(page, size)` | GET | `/api/documents?page=&size=` |
| `uploadDocuments(files)` | POST | `/api/documents` (multipart) |
| `patchDocument(docId, { description })` | PATCH | `/api/documents/{docId}` |
| `deleteDocuments(ids)` | DELETE | `/api/documents` (body: { ids }) |

---

### 3. Models — 메타 문서 상세 (DocumentDetail)

| 기능 | 설명 |
|------|------|
| 문서 메타 표시 | 파일명, 업로드일 |
| 트리 탐색기 | 좌측 패널 — 프로젝트 계층 구조 탐색 |
| 탐색기 탭 | 선택 노드의 컬럼 정보(논리/물리명, 타입, PK, NULL) |
| ERD 다이어그램 탭 | 탭 진입 시 ERD 데이터 로드 및 시각화 |
| 차원맵 탭 | 차원/계층/레벨 구조 카드 형태 표시 |
| Excel 다운로드 | 현재 문서 데이터 xlsx 다운로드 |
| Excel 업로드 | xlsx 업로드 후 시트·트리 갱신 |
| XML 다운로드 | 원본 XML 파일 다운로드 |
| 오브젝트 정보 패널 | 하단 고정 — 선택 노드 속성 표시 |
| 목록으로 돌아가기 | 좌상단 ← 목록 버튼 |

**호출 API**

| 함수 | 메서드 | 엔드포인트 |
|------|--------|-----------|
| `fetchDocument(docId)` | GET | `/api/documents/{docId}` |
| `fetchAllSheets(docId)` | GET | `/api/documents/{docId}/sheets` |
| `fetchTree(docId)` | GET | `/api/documents/{docId}/tree` |
| `fetchErd(docId)` | GET | `/api/documents/{docId}/erd` |
| `exportExcel(docId)` | GET | `/api/documents/{docId}/export/excel` |
| `importExcel(docId, file)` | POST | `/api/documents/{docId}/import/excel` |
| `exportOriginXml(docId)` | GET | `/api/documents/{docId}/export/origin` |

---

### 4. Reports — 보고서 관리

| 기능 | 설명 |
|------|------|
| 보고서 목록 조회 | 페이징 (10개씩) |
| 검색 | 제목·작성자 서버 사이드 검색 |
| 선택 삭제 | 체크박스 복수 선택 후 일괄 삭제 |
| 상태 뱃지 | 게시됨·임시저장·검토중 표시 |

**호출 API**

| 함수 | 메서드 | 엔드포인트 |
|------|--------|-----------|
| `fetchReports(page, size, q)` | GET | `/api/reports?page=&size=&q=&status=` |
| `deleteReports(ids)` | DELETE | `/api/reports` (body: { ids }) |

---

### 5. Requests — 요청 게시판

| 기능 | 설명 |
|------|------|
| 요청 목록 조회 | 페이징 (10개씩) |
| 카테고리 탭 필터 | 전체·아이디어·버그 |
| 상태 토글 필터 | 대기·진행중·완료·반려 (복수 선택) |
| 분야 드롭다운 필터 | 프로젝트·인력·보고·시스템·기타 |
| 우선순위 드롭다운 필터 | 높음·보통·낮음 |
| 댓글 수 표시 | 제목 옆 (count) 표시 |

**호출 API**

| 함수 | 메서드 | 엔드포인트 |
|------|--------|-----------|
| `fetchRequests(page, size, filters)` | GET | `/api/requests?page=&size=&category=&tag=&priority=&status=` |

---

### 6. Admin — 관리자

#### 6-1. 사용자 관리 탭

| 기능 | 설명 |
|------|------|
| 사용자 목록 조회 | 페이징 (10개씩) |
| 검색 | 이름·이메일 서버 사이드 검색 |
| 비밀번호 초기화 | 임시 비밀번호 발급 후 alert 표시 |
| 활성/비활성 상태 변경 | 토글 버튼 |
| 사용자 삭제 | 행 삭제 버튼 |

**호출 API**

| 함수 | 메서드 | 엔드포인트 |
|------|--------|-----------|
| `fetchUsers(page, size, q)` | GET | `/api/admin/users?page=&size=&q=` |
| `resetPassword(id)` | POST | `/api/admin/users/{id}/reset-password` |
| `changeUserStatus(id, status)` | PATCH | `/api/admin/users/{id}/status` |
| `deleteUser(id)` | DELETE | `/api/admin/users/{id}` |

#### 6-2. 권한 관리 탭

| 기능 | 설명 |
|------|------|
| 역할 목록 조회 | 역할명·설명·권한 목록 |
| 역할 삭제 | 행 삭제 버튼 |

**호출 API**

| 함수 | 메서드 | 엔드포인트 |
|------|--------|-----------|
| `fetchRoles()` | GET | `/api/admin/roles` |
| `deleteRole(id)` | DELETE | `/api/admin/roles/{id}` |

#### 6-3. 모델 지원 데이터 탭

| 기능 | 설명 |
|------|------|
| 데이터소스·카테고리·태그 목록 조회 | 서브탭 전환, 페이징 (20개씩) |
| 검색 | 이름·코드 서버 사이드 검색 |
| 항목 삭제 | 행 삭제 버튼 |

**호출 API**

| 함수 | 메서드 | 엔드포인트 |
|------|--------|-----------|
| `fetchMasterData(type, page, size, q)` | GET | `/api/admin/master/{type}?page=&size=&q=` |
| `deleteMasterData(type, id)` | DELETE | `/api/admin/master/{type}/{id}` |

---

## 미구현 기능 (UI는 있으나 동작 없음)

| 화면 | 위치 | 설명 |
|------|------|------|
| Login | "로그인 상태 유지" 체크박스 | `remember` 상태가 로그인 로직에 전달되지 않음 |
| Login | "비밀번호 찾기" 링크 | `<a>` 태그만 있고 핸들러 없음 |
| Reports | "내보내기" 버튼 | 클릭 핸들러 없음 |
| Reports | "새 보고서" 버튼 | 클릭 핸들러 없음 |
| Reports | 행 클릭 상세 | `cursor: pointer`만 있고 onClick 없음 |
| Requests | "글 작성" 버튼 | 클릭 핸들러 없음 |
| Requests | 행 클릭 상세 | `cursor: pointer`만 있고 onClick 없음 |
| Admin (권한 관리) | "역할 추가" 버튼 | 클릭 핸들러 없음 |
| Admin (모델 지원 데이터) | 항목 추가 | 추가 버튼 자체 없음 |

---

## API 오버헤드 (정의만 되고 미호출)

### auth.js

| 함수 | 메서드 | 엔드포인트 | 비고 |
|------|--------|-----------|------|
| `changePassword(currentPw, newPw)` | POST | `/api/auth/change-password` | 비밀번호 변경 UI 없음 |

### documents.js

| 함수 | 메서드 | 엔드포인트 | 비고 |
|------|--------|-----------|------|
| `uploadDocument(file)` | POST | `/api/documents` | `uploadDocuments` (다중)으로 대체됨 |

### export.js

| 함수 | 메서드 | 엔드포인트 | 비고 |
|------|--------|-----------|------|
| `exportXml(docId)` | GET | `/api/documents/{docId}/export/xml` | `exportOriginXml`로 대체됨. import만 되고 미사용 |

### sheets.js

| 함수 | 메서드 | 엔드포인트 | 비고 |
|------|--------|-----------|------|
| `fetchSheet(docId, sheetId)` | GET | `/api/documents/{docId}/sheets/{sheetId}` | 단건 조회 미사용 (`fetchAllSheets`만 사용) |
| `saveSheet(docId, sheetId, data)` | PUT | `/api/documents/{docId}/sheets/{sheetId}` | 시트 저장 UI 없음 |

### admin.js

| 함수 | 메서드 | 엔드포인트 | 비고 |
|------|--------|-----------|------|
| `fetchUser(id)` | GET | `/api/admin/users/{id}` | 사용자 상세 UI 없음 |
| `createUser(data)` | POST | `/api/admin/users` | 사용자 추가 UI 없음 |
| `updateUser(id, data)` | PATCH | `/api/admin/users/{id}` | 사용자 편집 UI 없음 |
| `assignUserRoles(id, roleIds)` | PATCH | `/api/admin/users/{id}/roles` | 역할 지정 UI 없음 |
| `fetchRole(id)` | GET | `/api/admin/roles/{id}` | 역할 상세 UI 없음 |
| `createRole(data)` | POST | `/api/admin/roles` | 역할 추가 버튼 미구현 |
| `updateRole(id, data)` | PATCH | `/api/admin/roles/{id}` | 역할 편집 UI 없음 |
| `fetchPermissions()` | GET | `/api/admin/permissions` | 권한 목록 조회 미사용 |
| `createMasterData(type, data)` | POST | `/api/admin/master/{type}` | 항목 추가 UI 없음 |
| `updateMasterData(type, id, data)` | PATCH | `/api/admin/master/{type}/{id}` | 항목 편집 UI 없음 |

### reports.js

| 함수 | 메서드 | 엔드포인트 | 비고 |
|------|--------|-----------|------|
| `fetchReport(id)` | GET | `/api/reports/{id}` | 보고서 상세 UI 없음 |
| `createReport(data)` | POST | `/api/reports` | "새 보고서" 버튼 미구현 |
| `updateReport(id, data)` | PATCH | `/api/reports/{id}` | 보고서 편집 UI 없음 |
| `publishReport(id)` | POST | `/api/reports/{id}/publish` | 발행 UI 없음 |
| `submitReview(id)` | POST | `/api/reports/{id}/submit-review` | 리뷰 제출 UI 없음 |

### requests.js

| 함수 | 메서드 | 엔드포인트 | 비고 |
|------|--------|-----------|------|
| `fetchRequest(id)` | GET | `/api/requests/{id}` | 요청 상세 UI 없음 |
| `createRequest(data)` | POST | `/api/requests` | "글 작성" 버튼 미구현 |
| `updateRequest(id, data)` | PATCH | `/api/requests/{id}` | 요청 편집 UI 없음 |
| `changeRequestStatus(id, status)` | PATCH | `/api/requests/{id}/status` | 상태 변경 UI 없음 |
| `deleteRequest(id)` | DELETE | `/api/requests/{id}` | 삭제 UI 없음 |
| `fetchComments(reqId)` | GET | `/api/requests/{reqId}/comments` | 댓글 목록 UI 없음 |
| `createComment(reqId, body)` | POST | `/api/requests/{reqId}/comments` | 댓글 작성 UI 없음 |
| `updateComment(reqId, commentId, body)` | PATCH | `/api/requests/{reqId}/comments/{commentId}` | 댓글 편집 UI 없음 |
| `deleteComment(reqId, commentId)` | DELETE | `/api/requests/{reqId}/comments/{commentId}` | 댓글 삭제 UI 없음 |
