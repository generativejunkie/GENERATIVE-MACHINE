#!/bin/bash

# Load user environment to ensure node/npm are found in SSH sessions
source ~/.zshrc
source ~/.bashrc

# Set absolute path to project
PROJECT_DIR="/Users/takayukimatsushima/Documents/GitHub/GENERATIVE-MACHINE"

# Navigate
cd "$PROJECT_DIR"

# Start the server (Using absolute path for robustness)
echo "Starting Antigravity System..."
/Users/takayukimatsushima/.nvm/versions/node/v24.11.0/bin/npm start
