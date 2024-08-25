function getConfigFileExtension(webserver) {
  switch (webserver) {
    case "apache":
      return "conf";
    case "nginx":
      return "conf";
    case "lighttpd":
      return "conf";
    case "caddy":
      return "caddyfile";
    default:
      return "txt";
  }
}

function calculateAndUpdateUI() {
  const webserver = document.getElementById("webserver").value;
  const domain = document.getElementById("domain").value || "example.com";
  const email = document.getElementById("email").value || "admin@example.com";
  const connections =
    parseInt(document.getElementById("connections").value) || 0;
  const workers = parseInt(document.getElementById("workers").value) || 0;
  const availableMemory =
    parseInt(document.getElementById("memory").value) || 0;
  const cpuCores = parseInt(document.getElementById("cpu_cores").value) || 1;
  const phpVersion = document.getElementById("php_version").value;

  let memoryPerWorker, memoryPerConnection, cpuPerConnection;
  let recommendations = [];
  let config = "";

  // Adjust resource requirements if PHP is enabled
  const phpEnabled = phpVersion !== "none";
  const phpMemoryOverhead = phpEnabled ? 20 : 0; // Additional 20MB per worker if PHP is enabled
  const phpCpuOverhead = phpEnabled ? 0.05 : 0; // Additional 5% CPU usage per connection if PHP is enabled

  switch (webserver) {
    case "apache":
      memoryPerWorker = 20 + phpMemoryOverhead;
      memoryPerConnection = 0.5;
      cpuPerConnection = 0.05 + phpCpuOverhead;
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
      if (phpEnabled) {
        recommendations.push(
          `With PHP enabled, monitor your memory usage closely and consider increasing available memory if needed.`
        );
      }

      const maxClients = Math.min(
        connections,
        Math.floor(availableMemory / memoryPerWorker)
      );
      config = `
# Apache configuration
ServerRoot "/etc/apache2"
ServerAdmin ${email}
ServerName ${domain}

# Performance settings
ServerLimit ${workers}
MaxRequestWorkers ${maxClients}
KeepAlive On
KeepAliveTimeout 5
MaxKeepAliveRequests 100

# MPM settings
<IfModule mpm_event_module>
    StartServers ${Math.min(2, workers)}
    MinSpareThreads 75
    MaxSpareThreads 250
    ThreadsPerChild 25
    MaxRequestWorkers ${maxClients}
    MaxConnectionsPerChild 0
</IfModule>

# PHP configuration
${
  phpEnabled
    ? `
<FilesMatch \\.php$>
    SetHandler application/x-httpd-php${phpVersion}
</FilesMatch>
`
    : "# PHP is not enabled"
}

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

# Security settings
ServerTokens Prod
ServerSignature Off
TraceEnable Off

# Virtual Host configuration
<VirtualHost *:80>
    ServerName ${domain}
    ServerAlias www.${domain}
    DocumentRoot /var/www/html
    <Directory /var/www/html>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    ErrorLog /var/log/apache2/error.log
    CustomLog /var/log/apache2/access.log combined
</VirtualHost>
      `;
      break;
    case "nginx":
      memoryPerWorker = 10 + phpMemoryOverhead;
      memoryPerConnection = 0.25;
      cpuPerConnection = 0.025 + phpCpuOverhead;
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
      if (phpEnabled) {
        recommendations.push(
          `With PHP-FPM enabled, monitor your PHP worker processes and adjust pm.max_children if needed.`
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

    # Logging settings
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip settings
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    server {
        listen 80;
        server_name ${domain} www.${domain};
        root /var/www/html;

        index index.html index.htm ${phpEnabled ? "index.php" : ""};

        location / {
            try_files $uri $uri/ =404;
        }

        ${
          phpEnabled
            ? `
        # PHP configuration
        location ~ \\.php$ {
            fastcgi_pass unix:/var/run/php/php${phpVersion}-fpm.sock;
            fastcgi_index index.php;
            include fastcgi_params;
        }
        `
            : "# PHP is not enabled"
        }

        # Deny access to .htaccess files
        location ~ /\\.ht {
            deny all;
        }
    }
}
      `;
      break;
    case "lighttpd":
      memoryPerWorker = 5 + phpMemoryOverhead;
      memoryPerConnection = 0.2;
      cpuPerConnection = 0.02 + phpCpuOverhead;
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
      if (phpEnabled) {
        recommendations.push(
          `With PHP enabled, monitor your FastCGI processes and adjust their number if needed.`
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
    ${phpEnabled ? '"mod_fastcgi",' : ""}
)

# Server settings
server.document-root        = "/var/www/html"
server.upload-dirs          = ( "/var/cache/lighttpd/uploads" )
server.errorlog             = "/var/log/lighttpd/error.log"
server.pid-file             = "/var/run/lighttpd.pid"
server.username             = "www-data"
server.groupname            = "www-data"
server.port                 = 80

# Performance settings
server.max-connections = ${connections}
server.max-fds = ${connections + 100}
server.workers = ${workers}

index-file.names            = ( "index.html", "index.htm", ${
        phpEnabled ? '"index.php",' : ""
      } )
url.access-deny             = ( "~", ".inc" )
static-file.exclude-extensions = ( ".php", ".pl", ".fcgi" )

# Compress files
compress.cache-dir          = "/var/cache/lighttpd/compress/"
compress.filetype           = ( "application/javascript", "text/css", "text/html", "text/plain" )

${
  phpEnabled
    ? `
# PHP configuration
fastcgi.server = ( ".php" =>
    ((
        "socket" => "/var/run/php/php${phpVersion}-fpm.sock",
        "broken-scriptfilename" => "enable"
    ))
)
`
    : "# PHP is not enabled"
}

# Custom error pages
server.errorfile-prefix = "/var/www/errors/status-"

# Disable directory listings
dir-listing.activate = "disable"

# Domain configuration
$HTTP["host"] =~ "^(www\\.)?${domain.replace(/\./g, "\\.")}$" {
    server.document-root = "/var/www/${domain}"
}
      `;
      break;
    case "caddy":
      memoryPerWorker = 15 + phpMemoryOverhead;
      memoryPerConnection = 0.3;
      cpuPerConnection = 0.03 + phpCpuOverhead;
      recommendations = [
        `Caddy is designed for ease of use and automatic HTTPS.`,
        `The file_server directive is efficient for serving static content.`,
        `Use reverse_proxy for load balancing and proxying to backend services.`,
        `Caddy's automatic HTTPS is a powerful feature for securing your site.`,
      ];
      if (workers !== cpuCores) {
        recommendations.push(
          `Caddy automatically adjusts to use available CPU cores, but you can fine-tune with the 'workers' global option if needed.`
        );
      }
      if (phpEnabled) {
        recommendations.push(
          `With PHP enabled, ensure your PHP-FPM pool is configured appropriately for your expected traffic.`
        );
      }

      config = `
# Caddy configuration

# Global options
{
    # Define the email address for ACME registration (for automatic HTTPS)
    email ${email}

    # Set the number of worker threads
    workers ${workers}

    # Enable HTTP/3
    servers {
        protocols h1 h2 h3
    }

    # Set up logging for errors
    log {
        output file /var/log/caddy/error.log {
            roll_keep 5
            roll_size 10mb
            roll_uncompressed
        }
        level ERROR
    }
}

# Site configuration
${domain} {
    # Serve files from the root directory
    root * /var/www/${domain}

    # Enable compression for better performance
    encode gzip zstd

    # Try to serve static files, fallback to index.html
    try_files {path} /index.html

    # Serve static files
    file_server

    ${
      phpEnabled
        ? `
    # PHP configuration
    php_fastcgi unix//var/run/php/php${phpVersion}-fpm.sock
    `
        : "# PHP is not enabled"
    }

    # Example reverse proxy to a backend service (uncomment if needed)
    # reverse_proxy /api/* 127.0.0.1:8080

    # Example redirection rule (uncomment if needed)
    # @old {
    #     path_regexp ^/old-path/(.*)
    # }
    # redir @old /new-path/{re.path.1} permanent

    # Custom error handling
    handle_errors {
        @404 {
            expression {http.error.status_code} == 404
        }
        respond @404 "Custom 404 Page" 404
    }

    # Logging configuration for access logs
    log {
        output file /var/log/caddy/access.log {
            roll_keep 7
            roll_size 10mb
            roll_uncompressed
        }
        format single_field common_log
    }
}

# Redirect www to non-www
www.${domain} {
    redir https://${domain}{uri} permanent
}
  `;
      break;
  }

  const totalMemory =
    workers * memoryPerWorker + connections * memoryPerConnection;
  const totalCpuPerCore = connections * cpuPerConnection * 100;
  const totalCpu = Math.min(100, totalCpuPerCore / cpuCores);

  document.getElementById("memory-usage").textContent = totalMemory.toFixed(2);
  document.getElementById("cpu-usage").textContent = totalCpu.toFixed(2);

  const recommendationsElement = document.getElementById("recommendations");
  recommendationsElement.innerHTML = recommendations
    .map((rec) => `<p>• ${rec}</p>`)
    .join("");

  document.getElementById("config").textContent = config.trim();

  document.getElementById("results").classList.remove("hidden");

  // Updated download functionality
  const fileExtension = getConfigFileExtension(webserver);
  const blob = new Blob([config], { type: "text/plain;charset=utf-8" });
  const downloadLink = document.createElement("a");
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = `${webserver}_config.${fileExtension}`;
  downloadLink.textContent = "Download";
  downloadLink.classList.add(
    "bg-blue-500",
    "hover:bg-blue-600",
    "text-white",
    "font-semibold",
    "py-1",
    "px-3",
    "rounded",
    "text-sm",
    "inline-block",
    "transition",
    "duration-300"
  );

  const downloadContainer = document.getElementById("download-container");
  downloadContainer.innerHTML = "";
  downloadContainer.appendChild(downloadLink);
}


// Add event listeners to all input fields
document
  .getElementById("webserver")
  .addEventListener("change", calculateAndUpdateUI);
document
  .getElementById("domain")
  .addEventListener("input", calculateAndUpdateUI);
document
  .getElementById("email")
  .addEventListener("input", calculateAndUpdateUI);
document
  .getElementById("connections")
  .addEventListener("input", calculateAndUpdateUI);
document
  .getElementById("workers")
  .addEventListener("input", calculateAndUpdateUI);
document
  .getElementById("memory")
  .addEventListener("input", calculateAndUpdateUI);
document
  .getElementById("cpu_cores")
  .addEventListener("input", calculateAndUpdateUI);
document
  .getElementById("php_version")
  .addEventListener("change", calculateAndUpdateUI);

// Initial calculation
calculateAndUpdateUI();