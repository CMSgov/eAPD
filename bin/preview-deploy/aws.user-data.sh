#!/bin/bash
# Prepare test database
sudo -u postgres psql -c "CREATE DATABASE hitech_apd;"
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'cms';"

sudo yum install -y gcc-c++

# Test to see the command that is getting built for pulling the Git Branch
su ec2-user <<E_USER
# The su block begins inside the root user's home directory.  Switch to the
# ec2-user home directory.
export OKTA_DOMAIN="__OKTA_DOMAIN__"
export OKTA_SERVER_ID="__OKTA_SERVER_ID__"
export OKTA_CLIENT_ID="__OKTA_CLIENT_ID__"
export OKTA_API_KEY="__OKTA_API_KEY__"
export JWT_SECRET="__JWT_SECRET__"
export MONGO_DATABASE="__MONGO_DATABASE__"
export MONGO_URL="__MONGO_URL__"
cd ~
mkdir -p /app/api/logs
touch /app/api/logs/eAPD-API-error-0.log
touch /app/api/logs/eAPD-API-out-0.log
touch /app/api/logs/Database-migration-error.log
touch /app/api/logs/Database-migration-out.log
touch /app/api/logs/Database-seeding-error.log
touch /app/api/logs/Database-seeding-out.log
touch /app/api/logs/cms-hitech-apd-api.logs
# Install nvm.  Do it inside the ec2-user home directory so that user will have
# access to it forever, just in case we need to get into the machine and
# manually do some stuff to it.
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
source ~/.bashrc

# We're using Node 14, and we don't care about minor/patch versions, so always
# get the latest.
nvm install 14
nvm alias default 14

# Install pm2: https://www.npmjs.com/package/pm2
# This is what'll manage running the API Node app. It'll keep it alive and make
# sure it's running when the EC2 instance restarts.
npm i -g pm2
# Clone from Github
git clone --single-branch -b __GIT_BRANCH__ https://github.com/CMSgov/eAPD.git
# Build the web app and move it into place
cd eAPD/web
npm ci
API_URL=/api OKTA_DOMAIN="__OKTA_DOMAIN__" npm run build
mv dist/* /app/web
cd ~
# Move the API code into place, then go set it up
mv eAPD/api/* /app/api
cd /app/api
npm ci --only=production
# Build and seed the database
NODE_ENV=development DEV_DB_HOST=localhost npm run migrate
NODE_ENV=development DEV_DB_HOST=localhost npm run seed
# pm2 wants an ecosystem file that describes the apps to run and sets any
# environment variables they need.  The environment variables are sensitive,
# so we won't put them here.  Instead, the CI/CD process should replace
# "__ECOSYSTEM__" with a base64-encoded JSON string of an ecosystem file.
echo "module.exports = {
  apps : [{
    name: 'eAPD API',
    script: 'main.js',
    instances: 1,
    autorestart: true,
    error_file: '/app/api/logs/eAPD-API-error-0.log',
    out_file: '/app/api/logs/eAPD-API-out-0.log',
    env: {
      AUTH_LOCK_FAILED_ATTEMPTS_COUNT: 15,
      AUTH_LOCK_FAILED_ATTEMPTS_WINDOW_TIME_MINUTES: 1,
      AUTH_LOCK_FAILED_ATTEMPTS_DURATION_MINUTES: 10,
      FILE_PATH: '__files',
      FILE_STORE: 'local',
      NODE_ENV: 'development',
      PBKDF2_ITERATIONS: '__PBKDF2_ITERATIONS__',
      PORT: '8000',
      DEV_DB_HOST: 'localhost',
      DISABLE_SAME_SITE: 'yes',
      OKTA_DOMAIN: '__OKTA_DOMAIN__',
      OKTA_SERVER_ID: '__OKTA_SERVER_ID__',
      OKTA_CLIENT_ID: '__OKTA_CLIENT_ID__',
      OKTA_API_KEY: '__OKTA_API_KEY__',
      JWT_SECRET: '__JWT_SECRET__',
      MONGO_DATABASE: '__MONGO_DATABASE__',
      MONGO_URL: '__MONGO_URL__'
    },
  }]
};" > ecosystem.config.js
# Start it up
pm2 start ecosystem.config.js
E_USER

sudo yum remove -y gcc-c++

# SELinux context so Nginx can READ the files in /app/web
mv home/ec2-user/nginx.conf.tpl /etc/nginx/nginx.conf
chown -R nginx /app/web
semanage fcontext -a -t httpd_sys_content_t /etc/nginx/nginx.conf
restorecon -Rv /etc/nginx/nginx.conf
semanage fcontext -a -t httpd_sys_content_t "/app/web(/.*)?"
restorecon -Rv /app/web
setsebool -P httpd_can_network_connect 1

# Restart Nginx
systemctl enable nginx
systemctl restart nginx

# Start/Enable Mongo
systemctl daemon-reload
systemctl enable mongod
systemctl start mongod

# Setup pm2 to start itself at machine launch, and save its current
# configuration to be restored when it starts
su - ec2-user -c '~/.bash_profile; sudo env PATH=$PATH:/home/ec2-user/.nvm/versions/node/v14.16.0/bin /home/ec2-user/.nvm/versions/node/v14.16.0/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user'
su - ec2-user -c 'pm2 save'
su - ec2-user -c 'pm2 restart'

# These logs aren't created until after the Instance is provisioned and need to be added to CloudWatch as a last step
touch /opt/aws/amazon-cloudwatch-agent/doc/launch-logs.json
cat <<CWLAUNCHLOGCONFIG > /opt/aws/amazon-cloudwatch-agent/doc/launch-logs.json

{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/app/api/logs/eAPD-API-error-0.log*",
            "log_group_name": "test/app/api/logs/eAPD-API-error-0.log"
          },
          {
            "file_path": "/var/log/nginx/access.log*",
            "log_group_name": "test/var/log/nginx/access.log"
          },
          {
            "file_path": "/var/log/nginx/error.log*",
            "log_group_name": "test/var/log/nginx/error.log"
          },
          {
            "file_path": "/var/log/awslogs.log*",
            "log_group_name": "test/var/log/awslogs.log"
          }
        ]
      }
    }
  }
}

CWLAUNCHLOGCONFIG

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a append-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/doc/launch-log.json

