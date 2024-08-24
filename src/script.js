document.getElementById("calculate").addEventListener("click", function () {
  const webserver = document.getElementById("webserver").value;
  const connections = parseInt(document.getElementById("connections").value);
  const workers = parseInt(document.getElementById("workers").value);
  const availableMemory = parseInt(document.getElementById("memory").value);
  const cpuCores = parseInt(document.getElementById("cpu_cores").value);

  let memoryPerWorker, memoryPerConnection, cpuPerConnection;
  let recommendations = [];
  let config = "";

  switch (webserver) {
    case "apache":
      memoryPerWorker = 20;
      memoryPerConnection = 0.5;
      cpuPerConnection = 0.05;
      recommendations = [
        `For Apache, consider using the event MPM for better scalability.`,
        `Optimize your Apache configuration by disabling unnecessary modules.`,
        `If you're serving static content, consider using a reverse proxy like Nginx in front of Apache.`,
      ];
      if (workers < cpuCores) {
        recommendations.push(
          `Consider increasing the number of workers to match your CPU cores (${cpuCores}) for better performance.`
        );
      }
      if (connections > 1000) {
        recommendations.push(
          `For high traffic, consider tuning your kernel parameters, especially the max open files limit.`
        );
      }

      const maxClients = Math.min(
        connections,
        Math.floor(availableMemory / memoryPerWorker)
      );
      config = `
# Apache configuration
ServerLimit ${workers}
MaxRequestWorkers ${maxClients}
KeepAlive On
KeepAliveTimeout 5
MaxKeepAliveRequests 100

<IfModule mpm_event_module>
    StartServers ${Math.min(2, workers)}
    MinSpareThreads 75
    MaxSpareThreads 250
    ThreadsPerChild 25
    MaxRequestWorkers ${maxClients}
    MaxConnectionsPerChild 0
</IfModule>

# Enable/Disable modules
LoadModule deflate_module modules/mod_deflate.so
LoadModule expires_module modules/mod_expires.so
LoadModule headers_module modules/mod_headers.so
#LoadModule status_module modules/mod_status.so
#LoadModule autoindex_module modules/mod_autoindex.so

# Enable Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain text/html text/xml text/css application/javascript application/json
</IfModule>

# Set expires headers
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/pdf "access plus 1 month"
    ExpiresByType text/javascript "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType application/x-shockwave-flash "access plus 1 month"
    ExpiresByType image/x-icon "access plus 1 year"
    ExpiresDefault "access plus 2 days"
</IfModule>
      `;
      break;
    case "nginx":
      memoryPerWorker = 10;
      memoryPerConnection = 0.25;
      cpuPerConnection = 0.025;
      recommendations = [
        `Nginx is efficient for serving static content and as a reverse proxy.`,
        `Consider enabling Gzip compression for better performance.`,
        `Use the 'worker_connections' directive to fine-tune the number of connections each worker can handle.`,
      ];
      if (workers !== cpuCores) {
        recommendations.push(
          `For Nginx, it's often recommended to set the number of workers to match the number of CPU cores (${cpuCores}).`
        );
      }
      if (connections > 10000) {
        recommendations.push(
          `For very high traffic, consider using the 'reuseport' option to distribute incoming connections.`
        );
      }

      const workerConnections = Math.floor(connections / workers);
      config = `
# Nginx configuration
user nginx;
worker_processes ${workers};
pid /var/run/nginx.pid;

events {
    worker_connections ${workerConnections};
    use epoll;
    multi_accept on;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Enable Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Logging settings
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # Load balancing example (uncomment and modify as needed)
    # upstream backend {
    #     server backend1.example.com;
    #     server backend2.example.com;
    # }

    server {
        listen 80;
        server_name example.com;
        root /var/www/html;
        index index.html index.htm;

        location / {
            try_files $uri $uri/ =404;
        }

        # Example of reverse proxy (uncomment and modify as needed)
        # location /api/ {
        #     proxy_pass http://backend;
        #     proxy_set_header Host $host;
        #     proxy_set_header X-Real-IP $remote_addr;
        # }

        # Enable caching for static files
        location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
            expires 30d;
            add_header Cache-Control "public, no-transform";
        }
    }
}
      `;
      break;
    case "lighttpd":
      memoryPerWorker = 5;
      memoryPerConnection = 0.2;
      cpuPerConnection = 0.02;
      recommendations = [
        `Lighttpd is great for serving static content on low-resource systems.`,
        `Consider using mod_magnet for more advanced request handling if needed.`,
        `Ensure you've enabled the appropriate modules for your use case.`,
      ];
      if (connections > 500) {
        recommendations.push(
          `For higher traffic, consider increasing the 'max-fds' and 'server.max-connections' settings.`
        );
      }

      config = `
# Lighttpd configuration
server.modules = (
    "mod_access",
    "mod_alias",
    "mod_compress",
    "mod_redirect",
    "mod_rewrite",
)

server.document-root        = "/var/www/html"
server.upload-dirs          = ( "/var/cache/lighttpd/uploads" )
server.errorlog             = "/var/log/lighttpd/error.log"
server.pid-file             = "/var/run/lighttpd.pid"
server.username             = "www-data"
server.groupname            = "www-data"
server.port                 = 80

# Configure max connections and file descriptors
server.max-connections = ${connections}
server.max-fds = ${connections + 100}

# Configure worker processes (if using lighttpd 1.4.46+)
server.workers = ${workers}

index-file.names            = ( "index.php", "index.html", "index.lighttpd.html" )
url.access-deny             = ( "~", ".inc" )
static-file.exclude-extensions = ( ".php", ".pl", ".fcgi" )

# Compress files
compress.cache-dir          = "/var/cache/lighttpd/compress/"
compress.filetype           = ( "application/javascript", "text/css", "text/html", "text/plain" )

# Enable mod_rewrite
url.rewrite-once = (
    "^/(css|js|images)/(.*)" => "$0",
    "^/(favicon\\.ico|robots\\.txt|sitemap\\.xml)$" => "$0",
    "^/([^\\?]*)(\\?(.+))?$" => "/index.php?page=$1&$3"
)

# Expire headers for static content
$HTTP["url"] =~ "\\.(jpg|jpeg|gif|png|css|js)$" {
    expire.url = ( "" => "access plus 1 months" )
}

# Enable PHP (if needed)
# fastcgi.server = ( ".php" =>
#     ((
#         "socket" => "/var/run/php/php7.4-fpm.sock",
#         "broken-scriptfilename" => "enable"
#     ))
# )

# SSL Configuration (if needed)
# $SERVER["socket"] == ":443" {
#     ssl.engine = "enable"
#     ssl.pemfile = "/etc/lighttpd/certs/example.com.pem"
#     ssl.ca-file = "/etc/lighttpd/certs/ca.crt"
# }

# Enable mod_status
status.status-url = "/server-status"
status.config-url = "/server-config"

# Custom error pages
server.errorfile-prefix = "/var/www/errors/status-"

# Disable directory listings
dir-listing.activate = "disable"
      `;
      break;
  }

  const totalMemory =
    workers * memoryPerWorker + connections * memoryPerConnection;
  const totalCpu = Math.min(100, connections * cpuPerConnection * 100);

  document.getElementById("memory-usage").textContent = totalMemory.toFixed(2);
  document.getElementById("cpu-usage").textContent = totalCpu.toFixed(2);

  const recommendationsElement = document.getElementById("recommendations");
  recommendationsElement.innerHTML = recommendations
    .map((rec) => `<p>• ${rec}</p>`)
    .join("");

  document.getElementById("config").textContent = config.trim();

  document.getElementById("results").classList.remove("hidden");
});