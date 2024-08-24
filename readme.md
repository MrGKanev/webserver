# Webserver Resource Calculator and Config Generator

This project provides a web-based tool for calculating resource usage and generating configuration files for various web servers. It helps system administrators and developers optimize their web server setups based on their specific requirements.

## Features

- Supports multiple web servers: Apache, Nginx, Lighttpd, and Caddy
- Calculates estimated resource usage (memory and CPU) based on input parameters
- Generates sample configuration files tailored to the input
- Provides recommendations for optimizing web server performance
- Offers downloadable configuration files

## Usage

1. Open `index.html` in a web browser.
2. Select your web server from the dropdown menu.
3. Enter the required parameters:
   - Concurrent Connections
   - Number of Workers/Processes
   - Available Memory (MB)
   - Number of CPU Cores
   - PHP Version (if applicable)
4. View the estimated resource usage, recommendations, and sample configuration.
5. Download the generated configuration file if desired.

## Development

### Setup

1. Clone the repository:

   ```
   git clone https://github.com/MrGKanev/webserver.git
   cd webserver
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Run Tailwind CSS in watch mode:

   ```
   npx tailwindcss -i ./src/input.css -o ./src/output.css --watch
   ```

4. Open `index.html` in your browser to view the application.

### Building for Production

To generate a minified version of the CSS for production:

```
npx tailwindcss -o ./src/output.css --minify
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Created by

Gabriel Kanev - [https://gkanev.com/](https://gkanev.com/)
