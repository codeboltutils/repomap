# Codebolt RepoMap

A powerful repository mapping and analysis tool that helps developers understand and visualize codebases through advanced parsing and graph-based analysis.

## Features

- Multi-language support (JavaScript, TypeScript, Python)
- Code structure analysis using tree-sitter
- Graph-based codebase visualization using graphology
- Dependency mapping and metrics calculation
- Repository structure analysis

## Installation

```bash
npm install codebolt-repomap
```

## Requirements

- Node.js (LTS version recommended)
- npm or yarn

## Dependencies

This project uses several powerful libraries:

- **Parsing**:
  - `tree-sitter`: For precise code parsing
  - Language support for JavaScript, TypeScript, and Python
  
- **Graph Analysis**:
  - `graphology`: Core graph data structures and algorithms
  - `graphology-metrics`: Advanced graph metrics and analysis

- **Utilities**:
  - `fs-extra`: Enhanced file system operations
  - `lodash`: Utility functions
  - `tmp`: Temporary file handling

## Development

### Setup

1. Clone the repository:
```bash
git clone https://github.com/codeboltutils/repomap.git
cd repomap
```

2. Install dependencies:
```bash
npm install
```

### Testing

The project uses both Jest and Mocha for testing:

```bash
npm test
```

## Project Structure

```
repomap/
├── src/
│   ├── queries/     # Query definitions and handlers
│   └── utils/
│       └── treeHelper/  # Tree parsing and manipulation utilities
├── test/           # Test files
└── package.json    # Project configuration and dependencies
```

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Repository

[GitHub Repository](https://github.com/codeboltutils/repomap)

## Version

Current version: 1.1.1 