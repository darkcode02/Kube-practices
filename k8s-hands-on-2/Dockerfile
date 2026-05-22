# Imagen de la tienda Vanta Wear: Express sirve API y archivos estáticos.
FROM node:20-alpine

WORKDIR /app

# Instala dependencias antes de copiar el código para aprovechar cache de Docker.
COPY package*.json ./
RUN npm install --omit=dev

# server.js contiene la API; public contiene HTML, CSS y JS del navegador.
COPY server.js ./
COPY public ./public

# Puerto usado por Express y por las probes del manifiesto Kubernetes.
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
