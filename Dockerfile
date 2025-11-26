# Node.js 기반 이미지 사용
FROM node:20.14

# 작업 디렉토리 설정
WORKDIR /app
COPY . .

# 의존성 설치를 위해 package.json과 package-lock.json 복사
COPY package*.json ./

# npm 의존성 설치 (강제 설치 대신 peerDependency 무시로 변경)
RUN npm install --force


# `.env` 파일 생성
RUN echo "\
VITE_AUTH_URL=http://148.247.246.203:4000\n\
VITE_DATA_URL=http://148.247.246.203:4001\n" > /app/.env

# 빌드 실행
RUN npm run build-only

# 애플리케이션 실행
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8108"]