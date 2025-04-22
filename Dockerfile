FROM node:alpine3.21

# Adding Labels to identify repository for github
LABEL org.opencontainers.image.source=""
LABEL org.opencontainers.image.description=""
LABEL org.opencontainers.image.licenses=MIT

# copy requirements, upgrade pip and install requirements.
RUN apk update
RUN apk upgrade --available && sync
RUN apk add --no-cache parallel python3 py3-pip
RUN apk cache clean

# Set work directory, copy source code to there
WORKDIR /app
COPY . .

# Install Node dependencies and python dependencies
RUN npm install
RUN npm run build-env
RUN npm install -g serve

#Can add MYSQL_PORT for the port number
ENV MYSQL_HOST="None"
ENV MYSQL_DATABASE="None"
ENV MYSQL_USER="None"
ENV MYSQL_PASSWORD="None"
ENV REACT_APP_BASEURL="None"

# Exposes the API and the Frontend ports respectively
EXPOSE 5000/tcp
EXPOSE 3000/tcp

# Runs both the API and Frontend and logs output for both to stdout
CMD [ "npm", "run", "start-all" ]