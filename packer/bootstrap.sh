# Become root user to perform installation and configuration
sudo su <<R_USER
#!/bin/bash

# Install New Relic Infrastructure Monitor
echo "license_key: $NEW_RELIC_LICENSE" | tee -a /etc/newrelic-infra.yml
curl -o /etc/yum.repos.d/newrelic-infra.repo https://download.newrelic.com/infrastructure_agent/linux/yum/el/7/x86_64/newrelic-infra.repo
yum -q makecache -y --disablerepo='*' --enablerepo='newrelic-infra'
yum install newrelic-infra -y
systemctl enable newrelic-infra
systemctl start newrelic-infra

# Add a user group for the default user, and make it the owner of the /app
# directory.  Unzip stuff there and then set permissions.
groupadd eapd
gpasswd -a ec2-user eapd
mkdir /app
mkdir /app/api
mkdir /app/web

chown -R :eapd /app
chmod -R g+w /app

mkdir /app/tls

# Install git, nginx, postgres
yum -y install git 
yum -y install nginx
yum -y install postgresql-server 

# Install CloudWatch Agent
curl -O https://s3.amazonaws.com/amazoncloudwatch-agent/redhat/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm
rm ./amazon-cloudwatch-agent.rpm

# Setup postgres
postgresql-setup initdb
echo "
# TYPE    DATABASE    USER    ADDRESS         METHODS
local     all         all                     peer
host      all         all     127.0.0.1/32    password
host      all         all     ::1/128         password
" > /var/lib/pgsql/data/pg_hba.conf
systemctl start postgresql
systemctl enable postgresql

# Create self-signed certificates
openssl genrsa -des3 -passout pass:x -out /app/tls/server.pass.key 2048
openssl rsa -passin pass:x -in /app/tls/server.pass.key -out /app/tls/server.key
rm -f /app/tls/server.pass.key
# Use the instance metadata service to get public hostname
openssl req -new -key /app/tls/server.key -out /app/tls/server.csr -subj "/CN=$(curl http://169.254.169.254/latest/meta-data/public-hostname)"
openssl x509 -req -sha256 -days 365 -in /app/tls/server.csr -signkey /app/tls/server.key -out /app/tls/server.crt
rm -f /app/tls/server.csr

# Set SELinux context so Nginx can read the cert files
semanage fcontext -a -t httpd_sys_content_t "/app/tls(/.*)?"
restorecon -Rv /app/tls

# Configure CloudWatch Agent
mkdir -p /opt/aws/amazon-cloudwatch-agent/doc/
touch /opt/aws/amazon-cloudwatch-agent/doc/cwagent.json
cat <<CWAGENTCONFIG > /opt/aws/amazon-cloudwatch-agent/doc/cwagent.json

{
        "agent": {
                "metrics_collection_interval": 60,
                "run_as_user": "cwagent"
        },
        "metrics": {
                "append_dimensions": {
                        "AutoScalingGroupName": "${aws:AutoScalingGroupName}",
                        "ImageId": "${aws:ImageId}",
                        "InstanceId": "${aws:InstanceId}",
                        "InstanceType": "${aws:InstanceType}"
                },
                "metrics_collected": {
                        "collectd": {
                                "metrics_aggregation_interval": 60
                        },
                        "cpu": {
                                "measurement": [
                                        "cpu_usage_idle",
                                        "cpu_usage_iowait",
                                        "cpu_usage_user",
                                        "cpu_usage_system"
                                ],
                                "metrics_collection_interval": 60,
                                "totalcpu": false
                        },
                        "disk": {
                                "measurement": [
                                        "used_percent",
                                        "inodes_free"
                                ],
                                "metrics_collection_interval": 60,
                                "resources": [
                                        "*"
                                ]
                        },
                        "diskio": {
                                "measurement": [
                                        "io_time"
                                ],
                                "metrics_collection_interval": 60,
                                "resources": [
                                        "*"
                                ]
                        },
                        "mem": {
                                "measurement": [
                                        "mem_used_percent"
                                ],
                                "metrics_collection_interval": 60
                        },
                        "statsd": {
                                "metrics_aggregation_interval": 60,
                                "metrics_collection_interval": 60,
                                "service_address": ":8125"
                        },
                        "swap": {
                                "measurement": [
                                        "swap_used_percent"
                                ],
                                "metrics_collection_interval": 60
                        }
                }
        }
}

CWAGENTCONFIG

# Nginx is test/preview only
touch /opt/aws/amazon-cloudwatch-agent/doc/var-log.json
cat <<CWVARLOGCONFIG > /opt/aws/amazon-cloudwatch-agent/doc/var-log.json
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/aide/aide.log*",
            "log_group_name": "test/var/log/aide/aide.log"
          },
          {
            "file_path": "/var/log/audit/audit.log*",
            "log_group_name": "test/var/log/audit/audit.log"
          },
          {
            "file_path": "/var/log/awslogs.log*",
            "log_group_name": "test/var/log/awslogs.log"
          },
          {
            "file_path": "/var/log/cloud-init.log*",
            "log_group_name": "test/var/log/cloud-init.log"
          },
          {
            "file_path": "/var/log/cloud-init-output.log*",
            "log_group_name": "test/var/log/cloud-init-output.log"
          },
          {
            "file_path": "/var/log/cron*",
            "log_group_name": "test/var/log/cron"
          },
          {
            "file_path": "/var/log/dmesg*",
            "log_group_name": "test/var/log/dmesg"
          },
          {
            "file_path": "/var/log/maillog*",
            "log_group_name": "test/var/log/maillog"
          },
          {
            "file_path": "/var/log/messages*",
            "log_group_name": "test/var/log/messages"
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
            "file_path": "/var/log/secure*",
            "log_group_name": "test/var/log/secure"
          }
        ]
      }
    }
  }
}

CWVARLOGCONFIG

touch /opt/aws/amazon-cloudwatch-agent/doc/var-opt.json
cat <<CWVAROPTCONFIG > /opt/aws/amazon-cloudwatch-agent/doc/var-opt.json
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/opt/ds_agent/diag/ds_agent.log*",
            "log_group_name": "test/var/opt/ds_agent/diag/ds_agent.log"
          },
          {
            "file_path": "/var/opt/ds_agent/diag/ds_agent-err.log*",
            "log_group_name": "test/var/opt/ds_agent/diag/ds_agent-err.log"
          },
          {
            "file_path": "/var/opt/ds_agent/diag/ds_am.log*",
            "log_group_name": "test/var/opt/ds_agent/diag/ds_am.log"
          }
        ]
      }
    }
  }
}

CWVAROPTCONFIG

touch /opt/aws/amazon-cloudwatch-agent/doc/app-logs.json
cat <<CWAPPLOGCONFIG > /opt/aws/amazon-cloudwatch-agent/doc/app-logs.json

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
            "file_path": "/app/api/logs/eAPD-API-out-0.log*",
            "log_group_name": "test/app/api/logs/eAPD-API-out-0.log"
          },
          {
            "file_path": "/app/api/logs/eAPD-API-*",
            "log_group_name": "test/app/api/logs/eAPD-API-combined-0.log"
          },          
          {
            "file_path": "/app/api/logs/Database-migration-error.log*",
            "log_group_name": "test/app/api/logs/Database-migration-error.log"
          },
          {
            "file_path": "/app/api/logs/Database-migration-out.log*",
            "log_group_name": "test/app/api/logs/Database-migration-out.log"
          },
          {
            "file_path": "/app/api/logs/Database-migration-*",
            "log_group_name": "test/app/api/logs/Database-migration-combined.log"
          },          
          {
            "file_path": "/app/api/logs/Database-seeding-error.log*",
            "log_group_name": "test/app/api/logs/Database-seeding-error.log"
          },
          {
            "file_path": "/app/api/logs/Database-seeding-out.log*",
            "log_group_name": "test/app/api/logs/Database-seeding-out.log"
          },
          {
            "file_path": "/app/api/logs/Database-seeding-*",
            "log_group_name": "test/app/api/logs/Database-seeding-combined.log"
          },                                           
          {
            "file_path": "/app/api/logs/cms-hitech-apd-api.logs*",
            "log_group_name": "test/app/api/logs/cms-hitech-apd-api.logs"              
          }    
        ]
      }
    }
  }
}

CWAPPLOGCONFIG

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/doc/cwagent.json

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a append-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/doc/var-log.json

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a append-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/doc/var-opt.json

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a append-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/doc/app-logs.json
R_USER
