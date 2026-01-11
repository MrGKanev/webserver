/**
 * Web Server Resource Calculator
 * Constants and configuration for server resource calculations
 */

// Server resource constants (memory in MB, CPU as decimal percentage)
const SERVER_CONFIGS = {
  apache: {
    memoryPerWorker: 20,
    memoryPerConnection: 0.5,
    cpuPerConnection: 0.05,
    fileExtension: "conf",
    displayName: "Apache HTTP Server"
  },
  nginx: {
    memoryPerWorker: 10,
    memoryPerConnection: 0.25,
    cpuPerConnection: 0.025,
    fileExtension: "conf",
    displayName: "Nginx"
  },
  lighttpd: {
    memoryPerWorker: 5,
    memoryPerConnection: 0.2,
    cpuPerConnection: 0.02,
    fileExtension: "conf",
    displayName: "Lighttpd"
  },
  caddy: {
    memoryPerWorker: 15,
    memoryPerConnection: 0.3,
    cpuPerConnection: 0.03,
    fileExtension: "caddyfile",
    displayName: "Caddy"
  }
};

// PHP overhead constants
const PHP_CONFIG = {
  memoryOverhead: 20,  // Additional MB per worker when PHP is enabled
  cpuOverhead: 0.05    // Additional CPU percentage per connection
};

// Input validation limits
const INPUT_LIMITS = {
  connections: { min: 1, max: 100000 },
  workers: { min: 1, max: 256 },
  memory: { min: 128, max: 1048576 },
  cpuCores: { min: 1, max: 256 }
};

// Server presets for common configurations
const SERVER_PRESETS = {
  small: {
    name: "Small VPS",
    connections: 100,
    workers: 1,
    memory: 1024,
    cpuCores: 1,
    description: "1 CPU, 1GB RAM - Entry level VPS"
  },
  medium: {
    name: "Medium Server",
    connections: 500,
    workers: 4,
    memory: 4096,
    cpuCores: 4,
    description: "4 CPU, 4GB RAM - Standard web server"
  },
  large: {
    name: "Large Server",
    connections: 2000,
    workers: 8,
    memory: 16384,
    cpuCores: 8,
    description: "8 CPU, 16GB RAM - High traffic site"
  },
  dedicated: {
    name: "Dedicated",
    connections: 10000,
    workers: 16,
    memory: 65536,
    cpuCores: 16,
    description: "16 CPU, 64GB RAM - Dedicated server"
  }
};

// Store current blob URL for cleanup
let currentBlobUrl = null;

function getConfigFileExtension(webserver) {
  return SERVER_CONFIGS[webserver]?.fileExtension || "txt";
}

function isValidDomain(domain) {
  if (!domain || typeof domain !== "string") return false;
  // Improved regex for domain validation
  const domainRegex =
    /^(?!:\/\/)(?=.{1,255}$)((.{1,63}\.){1,127}(?![0-9]*$)[a-z0-9-]+\.?)$/i;
  return domainRegex.test(domain);
}

function sanitizeInput(value, limits) {
  const num = parseInt(value) || 0;
  return Math.max(limits.min, Math.min(limits.max, num));
}

function cleanupBlobUrl() {
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = null;
  }
}

// Apply a server preset
function applyPreset(presetName) {
  const preset = SERVER_PRESETS[presetName];
  if (!preset) return;

  document.getElementById("connections").value = preset.connections;
  document.getElementById("workers").value = preset.workers;
  document.getElementById("memory").value = preset.memory;
  document.getElementById("cpu_cores").value = preset.cpuCores;

  // Update preset button styles
  document.querySelectorAll(".preset-btn").forEach(btn => {
    btn.classList.remove("bg-blue-500", "text-white", "border-blue-500");
    btn.classList.add("bg-gray-100", "border-gray-300");
  });
  const activeBtn = document.getElementById(`preset-${presetName}`);
  if (activeBtn) {
    activeBtn.classList.remove("bg-gray-100", "border-gray-300");
    activeBtn.classList.add("bg-blue-500", "text-white", "border-blue-500");
  }

  calculateAndUpdateUI();
}

// Copy configuration to clipboard
function copyConfigToClipboard() {
  const config = document.getElementById("config").textContent;
  const copyBtn = document.getElementById("copy-config");

  navigator.clipboard.writeText(config).then(() => {
    const originalText = copyBtn.textContent;
    copyBtn.textContent = "Copied!";
    copyBtn.classList.remove("bg-gray-500");
    copyBtn.classList.add("bg-green-500");

    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.classList.remove("bg-green-500");
      copyBtn.classList.add("bg-gray-500");
    }, 2000);
  }).catch(() => {
    copyBtn.textContent = "Failed";
    setTimeout(() => {
      copyBtn.textContent = "Copy";
    }, 2000);
  });
}

// Generate shareable URL with current settings
function generateShareUrl() {
  const params = new URLSearchParams();
  params.set("server", document.getElementById("webserver").value);
  params.set("domain", document.getElementById("domain").value);
  params.set("email", document.getElementById("email").value);
  params.set("connections", document.getElementById("connections").value);
  params.set("workers", document.getElementById("workers").value);
  params.set("memory", document.getElementById("memory").value);
  params.set("cpu", document.getElementById("cpu_cores").value);
  params.set("php", document.getElementById("php_version").value);

  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

// Share configuration link
function shareConfig() {
  const shareUrl = generateShareUrl();
  const notification = document.getElementById("share-notification");
  const notificationText = notification.querySelector("span");

  navigator.clipboard.writeText(shareUrl).then(() => {
    if (notificationText) {
      notificationText.textContent = "Share link copied to clipboard!";
    } else {
      notification.textContent = "Share link copied to clipboard!";
    }
    notification.classList.remove("hidden");

    setTimeout(() => {
      notification.classList.add("hidden");
    }, 3000);
  }).catch(() => {
    // Fallback: show the URL for manual copy
    if (notificationText) {
      notificationText.textContent = `Share URL: ${shareUrl}`;
    } else {
      notification.textContent = `Share URL: ${shareUrl}`;
    }
    notification.classList.remove("hidden");
  });
}

// Load settings from URL parameters
function loadFromUrl() {
  const params = new URLSearchParams(window.location.search);

  if (params.has("server")) {
    document.getElementById("webserver").value = params.get("server");
  }
  if (params.has("domain")) {
    document.getElementById("domain").value = params.get("domain");
  }
  if (params.has("email")) {
    document.getElementById("email").value = params.get("email");
  }
  if (params.has("connections")) {
    document.getElementById("connections").value = params.get("connections");
  }
  if (params.has("workers")) {
    document.getElementById("workers").value = params.get("workers");
  }
  if (params.has("memory")) {
    document.getElementById("memory").value = params.get("memory");
  }
  if (params.has("cpu")) {
    document.getElementById("cpu_cores").value = params.get("cpu");
  }
  if (params.has("php")) {
    document.getElementById("php_version").value = params.get("php");
  }
}

function autoCompleteEmail() {
  const domainInput = document.getElementById("domain");
  const emailInput = document.getElementById("email");

  const domain = domainInput.value.trim();
  if (domain) {
    // Remove 'http://', 'https://', and 'www.' if present
    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "");
    if (isValidDomain(cleanDomain)) {
      emailInput.value = `admin@${cleanDomain}`;
      domainInput.classList.remove("border-red-500");
    } else {
      emailInput.value = "";
      domainInput.classList.add("border-red-500");
    }
  } else {
    emailInput.value = "";
    domainInput.classList.remove("border-red-500");
  }
}

function calculateAndUpdateUI() {
  const webserver = document.getElementById("webserver").value;
  const domain = document.getElementById("domain").value.trim();
  const email = document.getElementById("email").value || "admin@example.com";

  // Sanitize and validate numeric inputs
  const connections = sanitizeInput(
    document.getElementById("connections").value,
    INPUT_LIMITS.connections
  );
  const workers = sanitizeInput(
    document.getElementById("workers").value,
    INPUT_LIMITS.workers
  );
  const availableMemory = sanitizeInput(
    document.getElementById("memory").value,
    INPUT_LIMITS.memory
  );
  const cpuCores = sanitizeInput(
    document.getElementById("cpu_cores").value,
    INPUT_LIMITS.cpuCores
  );
  const phpVersion = document.getElementById("php_version").value;

  if (!isValidDomain(domain)) {
    document.getElementById("results").classList.add("hidden");
    return;
  }

  // Get server configuration from constants
  const serverConfig = SERVER_CONFIGS[webserver];
  if (!serverConfig) {
    console.error(`Unknown webserver: ${webserver}`);
    return;
  }

  let recommendations = [];
  let config = "";

  // Adjust resource requirements if PHP is enabled
  const phpEnabled = phpVersion !== "none";
  const phpMemoryOverhead = phpEnabled ? PHP_CONFIG.memoryOverhead : 0;
  const phpCpuOverhead = phpEnabled ? PHP_CONFIG.cpuOverhead : 0;

  // Calculate base resource usage from constants
  const memoryPerWorker = serverConfig.memoryPerWorker + phpMemoryOverhead;
  const memoryPerConnection = serverConfig.memoryPerConnection;
  const cpuPerConnection = serverConfig.cpuPerConnection + phpCpuOverhead;

  switch (webserver) {
    case "apache":
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

  // Update progress bars
  const memoryPercent = Math.min(100, (totalMemory / availableMemory) * 100);
  const memoryFill = document.getElementById("memory-fill");
  if (memoryFill) {
    memoryFill.style.width = `${memoryPercent}%`;
    // Change color based on usage
    memoryFill.className = `h-full rounded-full transition-all duration-500 ${
      memoryPercent > 80 ? 'bg-red-500' : memoryPercent > 60 ? 'bg-yellow-500' : 'bg-blue-500'
    }`;
  }

  const cpuFill = document.getElementById("cpu-fill");
  if (cpuFill) {
    cpuFill.style.width = `${totalCpu}%`;
    cpuFill.className = `h-full rounded-full transition-all duration-500 ${
      totalCpu > 80 ? 'bg-red-500' : totalCpu > 60 ? 'bg-yellow-500' : 'bg-green-500'
    }`;
  }

  const recommendationsElement = document.getElementById("recommendations");
  recommendationsElement.innerHTML = recommendations
    .map((rec) => `<p>• ${rec}</p>`)
    .join("");

  document.getElementById("config").textContent = config.trim();

  document.getElementById("results").classList.remove("hidden");

  // Updated download functionality with memory leak prevention
  cleanupBlobUrl(); // Clean up previous blob URL

  const fileExtension = getConfigFileExtension(webserver);
  const blob = new Blob([config], { type: "text/plain;charset=utf-8" });
  currentBlobUrl = URL.createObjectURL(blob);

  const downloadLink = document.createElement("a");
  downloadLink.href = currentBlobUrl;
  downloadLink.download = `${webserver}_config.${fileExtension}`;
  downloadLink.setAttribute("aria-label", `Download ${serverConfig.displayName} configuration file`);
  downloadLink.classList.add(
    "inline-flex",
    "items-center",
    "gap-1.5",
    "bg-blue-600",
    "hover:bg-blue-700",
    "text-white",
    "font-semibold",
    "py-2",
    "px-4",
    "rounded-lg",
    "text-sm",
    "transition-all",
    "duration-200",
    "shadow-sm",
    "hover:shadow-md"
  );
  // Add download icon
  downloadLink.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>Download`;

  const downloadContainer = document.getElementById("download-container");
  // Safe DOM manipulation - remove all children before adding new link
  while (downloadContainer.firstChild) {
    downloadContainer.removeChild(downloadContainer.firstChild);
  }
  downloadContainer.appendChild(downloadLink);
}

// Cleanup blob URL when page is unloaded
window.addEventListener("beforeunload", cleanupBlobUrl);

// Add event listeners to all input fields
document
  .getElementById("webserver")
  .addEventListener("change", calculateAndUpdateUI);
document.getElementById("domain").addEventListener("input", function () {
  autoCompleteEmail();
  calculateAndUpdateUI();
});
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

// Preset button event listeners
document.getElementById("preset-small")?.addEventListener("click", () => applyPreset("small"));
document.getElementById("preset-medium")?.addEventListener("click", () => applyPreset("medium"));
document.getElementById("preset-large")?.addEventListener("click", () => applyPreset("large"));
document.getElementById("preset-dedicated")?.addEventListener("click", () => applyPreset("dedicated"));

// Copy and Share button event listeners
document.getElementById("copy-config")?.addEventListener("click", copyConfigToClipboard);
document.getElementById("share-config")?.addEventListener("click", shareConfig);

// Load settings from URL on page load
loadFromUrl();

// Initial calculation
calculateAndUpdateUI();
