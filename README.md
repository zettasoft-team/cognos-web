# Zmeta

메타 문서 관리 웹 애플리케이션

## 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:5173 접속

## 프로젝트 구조

```
src/
├── App.jsx                   # 라우팅 (목록 ↔ 상세)
├── index.css                 # 전역 스타일
├── main.jsx                  # 진입점
├── data/
│   └── sampleData.js         # 탭 정의, 샘플 문서/테이블 데이터
├── components/
│   ├── EditableTable.jsx      # 인라인 편집 테이블
│   ├── ERDModal.jsx           # ERD 다이어그램 모달
│   └── Notification.jsx       # 토스트 알림
└── pages/
    ├── DocumentList.jsx       # 문서 목록 화면
    └── DocumentDetail.jsx     # 문서 상세/편집 화면
```

## 화면 구성

### 문서 목록
- XML 업로드 (헤더 우측 버튼)
- 파일명 / 업로드 일시 / 상태 / 열기·삭제 액션

### 문서 상세
- **탭 6개**: 테이블 목록 / 컬럼 매핑 상세 / 조인 관계 / DimensionalView / NL2SQL 의미사전 / Fact 산출식
- **인라인 편집**: 셀 클릭 → 편집, Enter 확정 / Esc 취소
- **Excel 다운로드 / 업로드**: 6개 시트 일괄 처리 (백엔드 연동 필요)
- **Zmeta XML 재생성**: 편집된 데이터 → XML 변환 (백엔드 연동 필요)
- **ERD 보기**: 테이블 관계 SVG 다이어그램
