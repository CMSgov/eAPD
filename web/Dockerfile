FROM cypress/base:14

RUN npm i -g npm@^7

RUN mkdir /app
WORKDIR /app
RUN echo "deb-src http://deb.debian.org/debian stretch main" >> /etc/apt/sources.list
RUN apt-get update -y
RUN apt-get install -y libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb

ADD ./package.json .
ADD ./package-lock.json .

RUN npm ci

CMD npm run start -- --public=0.0.0.0:8080
