# Runs the server over stdio, for MCP hosts that start it in a container.
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY src ./src
USER node
CMD ["node", "src/stdio.mjs"]
