# Web service image — serves the SPA and OG HTML for social crawlers on /moments/:id.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
ARG VITE_API_URL=https://kult-browser-rust-l2lwg.ondigitalocean.app
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY scripts/production-server.mjs scripts/momentOgHtml.mjs ./scripts/
EXPOSE 8080
CMD ["node", "scripts/production-server.mjs"]
