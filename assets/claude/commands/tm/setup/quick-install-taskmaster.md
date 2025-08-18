Quick install Task Master globally if not already installed.

Execute this streamlined installation:

```bash
# Check and install in one command
taskgarage --version 2>/dev/null || npm install -g taskgarage

# Verify installation
taskgarage --version

# Quick setup check
taskgarage models --status || echo "Note: You'll need to set up an AI provider API key"
```

If you see "command not found" after installation, you may need to:
1. Restart your terminal
2. Or add npm global bin to PATH: `export PATH=$(npm bin -g):$PATH`

Once installed, you can use all the Task Master commands!

Quick test: Run `/project:help` to see all available commands.