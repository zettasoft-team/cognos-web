export const TABS = [
  { id: 'table_list',     label: '테이블 목록' },
  { id: 'column_mapping', label: '컬럼 매핑 상세' },
  { id: 'join_relation',  label: '조인 관계' },
  { id: 'dimension_view', label: 'DimensionalView' },
  { id: 'meaning_dict',   label: 'NL2SQL 의미사전' },
  { id: 'fact_calc',      label: 'Fact 산출식' },
]

export const SAMPLE_DOCS = [
  { id: 1, name: 'haksa_zmeta_meta_v1.0.xml', uploadDate: '2025-04-07', status: 'ok' },
  { id: 2, name: 'dw_meta_export_2025Q1.xml',  uploadDate: '2025-04-05', status: 'ok' },
  { id: 3, name: 'test_meta_draft.xml',         uploadDate: '2025-04-09', status: 'pending' },
]

export const INITIAL_TABLE_DATA = {
  table_list: {
    columns: ['테이블명(물리)', '테이블명(논리)', '스키마', '설명', '행수'],
    rows: [
      ['HAKSA_STUDENT', '학생 기본정보',  'HAKSA', '재학생 및 졸업생 기본정보 테이블', '128,432'],
      ['HAKSA_GRADE',   '성적 정보',      'HAKSA', '학기별 성적 및 평점 정보',         '1,024,810'],
      ['HAKSA_COURSE',  '강좌 정보',      'HAKSA', '개설 강좌 및 교과목 정보',         '32,114'],
      ['HAKSA_ENROLL',  '수강 신청',      'HAKSA', '학생별 수강신청 내역',             '3,210,044'],
      ['HAKSA_DEPT',    '학과 정보',      'HAKSA', '대학/학과/전공 계층 정보',         '1,204'],
    ],
  },
  column_mapping: {
    columns: ['테이블명', '컬럼명(물리)', '컬럼명(논리)', '데이터타입', 'PK', 'FK', 'NULL허용', '설명'],
    rows: [
      ['HAKSA_STUDENT', 'STD_NO',   '학번',   'VARCHAR2(10)', 'Y', 'N', 'N', '학생 고유번호'],
      ['HAKSA_STUDENT', 'STD_NM',   '학생명', 'VARCHAR2(50)', 'N', 'N', 'N', '학생 이름'],
      ['HAKSA_STUDENT', 'DEPT_CD',  '학과코드','VARCHAR2(10)', 'N', 'Y', 'N', '소속 학과 코드'],
      ['HAKSA_STUDENT', 'ENTR_YY',  '입학연도','NUMBER(4)',    'N', 'N', 'N', '입학 연도'],
      ['HAKSA_GRADE',   'STD_NO',   '학번',   'VARCHAR2(10)', 'Y', 'Y', 'N', '학번(FK→HAKSA_STUDENT)'],
      ['HAKSA_GRADE',   'SMSTR_CD', '학기코드','VARCHAR2(6)',  'Y', 'N', 'N', 'YYYYN 형식'],
      ['HAKSA_GRADE',   'GPA',      '평점',   'NUMBER(3,2)',  'N', 'N', 'Y', '학기 평점평균'],
    ],
  },
  join_relation: {
    columns: ['기준 테이블', '조인 테이블', '조인 유형', '조인 컬럼(기준)', '조인 컬럼(대상)', '설명'],
    rows: [
      ['HAKSA_STUDENT', 'HAKSA_DEPT',   'LEFT JOIN',  'DEPT_CD', 'DEPT_CD', '학생-학과 연결'],
      ['HAKSA_STUDENT', 'HAKSA_GRADE',  'LEFT JOIN',  'STD_NO',  'STD_NO',  '학생-성적 연결'],
      ['HAKSA_STUDENT', 'HAKSA_ENROLL', 'LEFT JOIN',  'STD_NO',  'STD_NO',  '학생-수강 연결'],
      ['HAKSA_ENROLL',  'HAKSA_COURSE', 'INNER JOIN', 'CORS_CD', 'CORS_CD', '수강신청-강좌 연결'],
    ],
  },
  dimension_view: {
    columns: ['차원명', '계층 레벨', '레벨명', '매핑 컬럼', '부모 레벨', '정렬 순서'],
    rows: [
      ['학과 차원', '1', '대학',    'COLL_CD',  '-',       '1'],
      ['학과 차원', '2', '학부/학과','DEPT_CD',  '대학',    '2'],
      ['학과 차원', '3', '전공',    'MAJOR_CD', '학부/학과','3'],
      ['시간 차원', '1', '연도',    'YY',       '-',       '1'],
      ['시간 차원', '2', '학기',    'SMSTR_CD', '연도',    '2'],
    ],
  },
  meaning_dict: {
    columns: ['용어(자연어)', '동의어/유사어', '매핑 테이블', '매핑 컬럼', '필터 조건', '비고'],
    rows: [
      ['재학생',   '재학, 재학중인 학생',  'HAKSA_STUDENT', 'STD_STAT_CD', "STD_STAT_CD='10'",    '상태코드 10=재학'],
      ['평점',     'GPA, 학점, 성적평균',  'HAKSA_GRADE',   'GPA',         '',                    ''],
      ['졸업생',   '졸업, 졸업한 학생',    'HAKSA_STUDENT', 'STD_STAT_CD', "STD_STAT_CD='30'",    '상태코드 30=졸업'],
      ['이번학기', '현재학기, 당학기',     'HAKSA_GRADE',   'SMSTR_CD',    'SMSTR_CD=현재학기',   '동적 조건'],
      ['수강신청', '수강, 신청',           'HAKSA_ENROLL',  'ENRL_YN',     "ENRL_YN='Y'",         ''],
    ],
  },
  fact_calc: {
    columns: ['Fact명', '논리명', '집계방식', '산출식', '단위', '비고'],
    rows: [
      ['GPA_AVG',     '평균 평점',    'AVG',   'AVG(HAKSA_GRADE.GPA)',                  '점', '학기별/학과별 평균'],
      ['ENROLL_CNT',  '수강신청 인원','COUNT', 'COUNT(DISTINCT STD_NO)',                '명', '강좌별 수강 인원'],
      ['GRAD_RATE',   '졸업률',       'RATIO', 'COUNT(졸업생)/COUNT(입학생)*100',       '%',  '연도별 졸업률'],
      ['ATTEND_RATE', '출석률',       'AVG',   'AVG(ATTEND_CNT/TOTAL_CNT*100)',         '%',  '강좌별 평균 출석률'],
    ],
  },
}
