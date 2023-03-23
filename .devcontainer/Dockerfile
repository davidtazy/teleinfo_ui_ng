FROM mcr.microsoft.com/devcontainers/typescript-node:0-18


# install chrome for protractor tests
RUN apt update && apt install -y chromium
ENV CHROME_BIN='/usr/bin/chromium'