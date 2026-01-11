# Web Server Resource Calculator and Config Generator

A free, open-source web tool for calculating server resource usage and generating optimized configuration files for Apache, Nginx, Lighttpd, and Caddy web servers.

**Live Demo:** [https://webserver.gkanev.com/](https://webserver.gkanev.com/)

## Features

- **Multi-Server Support:** Generate configurations for Apache, Nginx, Lighttpd, and Caddy
- **Resource Calculator:** Estimate memory and CPU usage with visual progress bars
- **PHP 8.5 Support:** Built-in support for PHP versions 7.4 through 8.5 (2026)
- **Server Presets:** Quick configuration for Small VPS, Medium, Large, and Dedicated servers
- **Shareable Configs:** Generate URLs to share your exact configuration
- **Copy to Clipboard:** One-click copy of generated configurations
- **Performance Recommendations:** Get server-specific optimization tips
- **Downloadable Configs:** Export ready-to-use configuration files
- **Modern UI:** Beautiful gradient design with SVG icons
- **Responsive Design:** Works on desktop and mobile devices
- **Accessibility:** WCAG-compliant with full keyboard navigation and screen reader support

## How It Works

The calculator uses industry-standard resource estimates for each web server:

| Server    | Memory/Worker | Memory/Connection | CPU/Connection |
|-----------|--------------|-------------------|----------------|
| Apache    | 20 MB        | 0.5 MB            | 5%             |
| Nginx     | 10 MB        | 0.25 MB           | 2.5%           |
| Lighttpd  | 5 MB         | 0.2 MB            | 2%             |
| Caddy     | 15 MB        | 0.3 MB            | 3%             |

**PHP Overhead:** When PHP is enabled, add ~20 MB per worker and ~5% CPU per connection.

## Quick Start

1. Open `index.html` in a web browser (or visit the [live demo](https://webserver.gkanev.com/))
2. Select your web server type
3. Enter your domain and server specifications:
   - Concurrent connections (expected simultaneous users)
   - Number of workers/processes (usually = CPU cores)
   - Available memory (MB)
   - CPU cores
   - PHP version (if needed)
4. View estimated resource usage and recommendations
5. Download the generated configuration file

## Configuration Guidelines

### Workers vs CPU Cores

- **General rule:** Set workers = number of CPU cores
- **CPU-bound tasks:** Use 1 worker per core
- **I/O-bound tasks:** Consider 2x the number of cores

### Choosing a Web Server

| Server    | Best For                                          |
|-----------|---------------------------------------------------|
| **Nginx** | High traffic, static files, reverse proxy         |
| **Apache**| Maximum compatibility, .htaccess support          |
| **Caddy** | Easy setup, automatic HTTPS, HTTP/3               |
| **Lighttpd** | Low-resource systems, embedded devices        |

## Development

### Prerequisites

- Node.js (for Tailwind CSS compilation)

### Build Commands

Watch for CSS changes during development:

```bash
npx @tailwindcss/cli -i ./assets/style.css -o ./assets/style.min.css --watch
```

Build minified CSS for production:

```bash
npx @tailwindcss/cli -i ./assets/style.css -o ./assets/style.min.css --minify
```

### Project Structure

```
webserver/
├── index.html          # Main application
├── assets/
│   ├── script.js       # Calculator logic
│   ├── style.css       # Tailwind source
│   └── style.min.css   # Compiled CSS
├── .github/
│   └── workflows/
│       └── static.yml  # GitHub Pages deployment
├── package.json
├── LICENSE
└── readme.md
```

## SEO & Accessibility

This project includes:

- **Structured Data:** JSON-LD schema for WebApplication and FAQPage
- **Open Graph & Twitter Cards:** Optimized social sharing
- **ARIA Labels:** Full accessibility support
- **Semantic HTML:** Proper heading hierarchy and landmarks
- **Mobile-First:** Responsive design with touch-friendly targets

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Author

**Gabriel Kanev** - [https://gkanev.com/](https://gkanev.com/)

## Changelog

### v1.2 (January 2026)

- **PHP 8.5 Support:** Added latest PHP version with updated labels (Latest, Stable, Recommended, LTS, EOL)
- **Modern UI Redesign:**
  - Gradient backgrounds and rounded corners
  - SVG icons throughout the interface
  - Visual progress bars for memory and CPU usage (color changes based on load)
  - Animated "Updated for 2026" badge
- **Server Presets:** Visual cards with emoji icons for quick server configuration
- **Enhanced Buttons:** Copy, Share, and Download buttons with icons and hover effects
- **Dark Config Output:** Code block now uses dark theme for better readability
- **Expanded FAQ:** Added more questions about PHP versions, sharing, and production use
- **Updated SEO:**
  - 2026 keywords and descriptions
  - Aggregate rating schema
  - More FAQ entries in JSON-LD
  - Updated meta tags with current year
- **Quick Reference Improvements:** Added high traffic threshold guidance
- **Improved Share Notification:** Better visual feedback with checkmark icon

### v1.1

- Added JSON-LD structured data for better SEO
- Improved accessibility with ARIA labels
- Added FAQ section with collapsible answers
- Added Quick Reference guide
- Fixed memory leak with blob URLs
- Refactored JavaScript with constants for better maintainability
- Added input validation with min/max limits
- Improved meta tags for social sharing
- Added PHP version labels (Latest, Recommended, LTS, Legacy)
- Enhanced form field descriptions

### v1.0

- Initial release
- Support for Apache, Nginx, Lighttpd, and Caddy
- Resource calculator
- Configuration generator
- PHP-FPM support
